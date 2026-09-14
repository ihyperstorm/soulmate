// Dev-скрипт: проставляет случайные настроения тестовым аккаунтам.
//
// Зачем: буст за совпавший настрой требует совпадения с ОБЕИХ сторон
// (sharedMoods(мои, чужие)). Пока настроение задал один человек, moodBoost
// тождественно нулевой и проверить фичу в одиночку невозможно.
//
//   node --env-file=.env scripts/seed-moods.mjs --dry     посмотреть, что будет
//   node --env-file=.env scripts/seed-moods.mjs           применить
//   node --env-file=.env scripts/seed-moods.mjs --clear   снять у всех
//
// По умолчанию НЕ трогает тех, у кого настроение уже задано — иначе скрипт
// затёр бы выбор живого пользователя. Снять этот запрет: --force.
//
// --dns=8.8.8.8 — запасной резолвер. Строка mongodb+srv:// требует SRV-запроса,
// а некоторые системные резолверы (корпоративные сети, песочницы, часть VPN)
// на SRV отвечают отказом, хотя обычные A-записи отдают. Симптом —
// `querySrv ECONNREFUSED` при живом кластере.

import dns from 'node:dns'
import mongoose from 'mongoose'

// Держать синхронно с src/entities/mood/model/moods.ts
const MOOD_IDS = [
	'deep-talks',
	'casual-chat',
	'exchange-ideas',
	'hobbies',
	'personal',
	'fun',
]
const MAX_MOODS = 2

const argv = process.argv.slice(2)
const args = new Set(argv)
const isDry = args.has('--dry')
const isClear = args.has('--clear')
const isForce = args.has('--force')

const dnsArg = argv.find(a => a.startsWith('--dns='))
if (dnsArg) {
	const servers = dnsArg.slice('--dns='.length).split(',').filter(Boolean)
	dns.setServers(servers)
	console.log(`DNS-резолвер переопределён: ${servers.join(', ')}\n`)
}

const uri = process.env.DATABASE_URL ?? process.env.MONGODB_URI
if (!uri) {
	console.error('Нет DATABASE_URL / MONGODB_URI. Запускай с --env-file=.env')
	process.exit(1)
}

const pickMoods = () => {
	const pool = [...MOOD_IDS]
	// Фишер–Йетс, чтобы не было перекоса к началу списка.
	for (let i = pool.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1))
		;[pool[i], pool[j]] = [pool[j], pool[i]]
	}
	const count = 1 + Math.floor(Math.random() * MAX_MOODS)
	return pool.slice(0, count)
}

await mongoose.connect(uri)
const users = mongoose.connection.collection('users')

if (isClear) {
	const targets = await users
		.find({moods: {$exists: true, $ne: []}}, {projection: {username: 1, moods: 1}})
		.toArray()

	console.log(`Снять настроение у ${targets.length} чел.:`)
	for (const u of targets) console.log(`  ${u.username} ← ${JSON.stringify(u.moods)}`)

	if (!isDry) {
		const res = await users.updateMany({}, {$set: {moods: [], moodUpdatedAt: null}})
		console.log(`\nОбновлено документов: ${res.modifiedCount}`)
	} else {
		console.log('\n--dry: ничего не записано')
	}

	await mongoose.disconnect()
	process.exit(0)
}

const filter = isForce
	? {}
	: {$or: [{moods: {$exists: false}}, {moods: {$size: 0}}]}

const targets = await users
	.find(filter, {projection: {username: 1, moods: 1}})
	.toArray()

const skipped = await users.countDocuments({moods: {$exists: true, $ne: []}})

console.log(`Кандидатов: ${targets.length}` + (isForce ? ' (--force)' : `, пропущено с готовым настроением: ${skipped}`))
console.log()

const plan = targets.map(u => ({_id: u._id, username: u.username, moods: pickMoods()}))
for (const p of plan) console.log(`  ${p.username.padEnd(16)} → ${p.moods.join(', ')}`)

if (isDry) {
	console.log('\n--dry: ничего не записано')
} else {
	const now = new Date()
	const ops = plan.map(p => ({
		updateOne: {
			filter: {_id: p._id},
			update: {$set: {moods: p.moods, moodUpdatedAt: now}},
		},
	}))
	if (ops.length) {
		const res = await users.bulkWrite(ops)
		console.log(`\nОбновлено документов: ${res.modifiedCount}`)
		console.log('Настроения протухнут через 24 часа (MOOD_TTL_MS) — перезапусти скрипт, если понадобится снова.')
	} else {
		console.log('\nНечего обновлять.')
	}
}

await mongoose.disconnect()
