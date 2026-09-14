import {jwtVerify, SignJWT, type JWTPayload} from 'jose'

/**
 * TTL access-токена. Короткий намеренно: он stateless и до истечения неотзываем,
 * поэтому украденный токен должен жить как можно меньше. Продление больше не
 * происходит в proxy — этим занимается refresh-flow (/api/auth/refresh).
 */
export const ACCESS_TOKEN_TTL_SECONDS = 60 * 15

/** TTL refresh-сессии: столько пользователь может не заходить и не разлогиниться. */
export const REFRESH_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30

const secretKey = (secret: string) => new TextEncoder().encode(secret)

/**
 * Подпись JWT (HS256). `jose` работает и в Node (API-роуты), и в Edge (proxy.ts),
 * поэтому один модуль на оба рантайма. Бросает, если JWT_SECRET не задан —
 * выпускать токен без секрета нельзя (конфигурационная ошибка).
 */
export async function signToken(payload: {userId: string}): Promise<string> {
	const secret = process.env.JWT_SECRET
	if (!secret) throw new Error('JWT_SECRET is not set')
	return new SignJWT({userId: payload.userId})
		.setProtectedHeader({alg: 'HS256'})
		.setIssuedAt()
		.setExpirationTime(`${ACCESS_TOKEN_TTL_SECONDS}s`)
		.sign(secretKey(secret))
}

/**
 * Проверка JWT (подпись + срок). Возвращает payload либо null при невалидном/
 * просроченном токене или отсутствии секрета (fail-closed — трактуем как «не авторизован»).
 */
export async function verifyToken(
	token: string,
): Promise<(JWTPayload & {userId?: string}) | null> {
	const secret = process.env.JWT_SECRET
	if (!secret) return null
	try {
		const {payload} = await jwtVerify(token, secretKey(secret), {
			algorithms: ['HS256'],
		})
		return payload as JWTPayload & {userId?: string}
	} catch {
		return null
	}
}
