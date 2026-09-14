import {ACCESS_COOKIE} from '../model/cookieNames'
import {verifyToken} from '../model/jwt'
import {cookies} from 'next/headers'

/**
 * userId из access-токена. Единственный источник авторизации в API-роутах:
 * доверять userId из тела запроса нельзя.
 *
 * Возвращает null, если access истёк — это нормальная ситуация (токен живёт
 * 15 минут). Роут отдаёт 401, дальше клиентский интерцептор молча обновит
 * токен через /api/auth/refresh и повторит запрос.
 */
export const getAuthUserId = async (): Promise<string | null> => {
	const cookieStore = await cookies()
	const token = cookieStore.get(ACCESS_COOKIE)?.value
	if (!token) return null

	const payload = await verifyToken(token)
	return payload?.userId ?? null
}
