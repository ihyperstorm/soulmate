import {createHash, randomBytes} from 'node:crypto'
import type mongoose from 'mongoose'
import {Types} from 'mongoose'
import Session from '../model/Session'
import {REFRESH_TOKEN_TTL_SECONDS, signToken} from '../model/jwt'

// ВНИМАНИЕ: модуль работает только в Node-рантайме (node:crypto + mongoose).
// В proxy.ts (Edge) его импортировать нельзя — там доступен лишь verifyToken.

/**
 * Окно, в которое уже провёрнутый токен всё ещё принимается.
 *
 * Зачем: два таба (или запрос + его повтор) могут получить 401 одновременно и
 * оба пойти обновляться со ОДНИМ и тем же refresh-токеном. Первый провернёт
 * его, второй придёт с уже недействительным — и без этого окна пользователя
 * выкинуло бы из-за безобидной гонки.
 */
const ROTATION_GRACE_MS = 30_000

/** Непрозрачный refresh-токен. Не JWT: он всё равно проверяется по БД. */
const createRefreshToken = (): string => randomBytes(32).toString('base64url')

const hashToken = (token: string): string =>
	createHash('sha256').update(token).digest('hex')

const expiryFromNow = (): Date =>
	new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000)

export type IssuedTokens = {accessToken: string; refreshToken: string}

/** Новая сессия: при логине и регистрации. */
export const issueSession = async (
	userId: string | mongoose.Types.ObjectId,
	userAgent: string,
): Promise<IssuedTokens> => {
	const refreshToken = createRefreshToken()

	await Session.create({
		userId: typeof userId === 'string' ? new Types.ObjectId(userId) : userId,
		tokenHash: hashToken(refreshToken),
		expiresAt: expiryFromNow(),
		userAgent,
	})

	return {
		accessToken: await signToken({userId: String(userId)}),
		refreshToken,
	}
}

export type RotateFailure = 'missing' | 'unknown' | 'expired' | 'reuse'

export type RotateResult =
	| ({ok: true} & IssuedTokens)
	| {ok: false; reason: RotateFailure}

/**
 * Обмен refresh-токена на новую пару.
 *
 * Ротация: старая запись помечается `rotatedAt` и создаётся новая. Не удаляем
 * старую сразу, потому что её наличие — единственный способ отличить гонку
 * (см. ROTATION_GRACE_MS) от повторного использования украденного токена.
 *
 * Повторное использование за пределами окна трактуется как компрометация:
 * cookie в браузере после ротации перезаписывается, поэтому предъявить старый
 * токен спустя минуты может только тот, кто скопировал его наружу. Реакция —
 * снести все сессии пользователя, то есть разлогинить и вора, и владельца.
 */
export const rotateSession = async (
	refreshToken: string | undefined,
	userAgent: string,
): Promise<RotateResult> => {
	if (!refreshToken) return {ok: false, reason: 'missing'}

	const session = await Session.findOne({tokenHash: hashToken(refreshToken)})
	if (!session) return {ok: false, reason: 'unknown'}

	if (session.expiresAt.getTime() <= Date.now()) {
		await Session.deleteOne({_id: session._id})
		return {ok: false, reason: 'expired'}
	}

	if (session.rotatedAt) {
		const sinceRotation = Date.now() - session.rotatedAt.getTime()
		if (sinceRotation > ROTATION_GRACE_MS) {
			await Session.deleteMany({userId: session.userId})
			return {ok: false, reason: 'reuse'}
		}
		// Внутри окна — это гонка. Выдаём этому запросу собственную новую сессию:
		// оба таба останутся с валидными (разными) токенами. Лишняя запись
		// подчистится TTL-индексом.
	} else {
		session.rotatedAt = new Date()
		await session.save()
	}

	return {ok: true, ...(await issueSession(session.userId, userAgent))}
}

/** Logout с текущего устройства. */
export const revokeSession = async (
	refreshToken: string | undefined,
): Promise<void> => {
	if (!refreshToken) return
	await Session.deleteOne({tokenHash: hashToken(refreshToken)})
}

/** «Выйти со всех устройств», а также реакция на смену пароля/компрометацию. */
export const revokeAllSessions = async (
	userId: string | mongoose.Types.ObjectId,
): Promise<void> => {
	await Session.deleteMany({
		userId: typeof userId === 'string' ? new Types.ObjectId(userId) : userId,
	})
}
