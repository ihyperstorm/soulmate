import {jwtVerify, SignJWT, type JWTPayload} from 'jose'

// TTL access-токена (совпадает с maxAge cookie в /api/auth/login).
export const ACCESS_TOKEN_TTL_SECONDS = 60 * 30
// Sliding session: перевыпускаем токен, если до истечения осталось меньше порога.
export const REFRESH_THRESHOLD_SECONDS = 60 * 15

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
