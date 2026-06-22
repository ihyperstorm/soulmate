import {User} from '@/entities/user/server'
import Interest from '../model/Interest'

export type IdfMap = Record<string, number>

const CACHE_TTL_MS = 5 * 60 * 1000

let cache: {map: IdfMap; expiresAt: number} | null = null

const compute = async (): Promise<IdfMap> => {
	const [totalUsers, interests] = await Promise.all([
		User.countDocuments(),
		Interest.find().select({_id: 1, userCount: 1}).lean(),
	])

	const map: IdfMap = {}
	const N = totalUsers + 1
	for (const i of interests) {
		const count = (i.userCount ?? 0) + 1
		map[String(i._id)] = Math.log(N / count)
	}
	return map
}

export const getIdfMap = async (): Promise<IdfMap> => {
	const now = Date.now()
	if (cache && cache.expiresAt > now) return cache.map

	const map = await compute()
	cache = {map, expiresAt: now + CACHE_TTL_MS}
	return map
}

export const invalidateIdfCache = () => {
	cache = null
}
