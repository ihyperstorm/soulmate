import {
	ACCESS_TOKEN_TTL_SECONDS,
	REFRESH_TOKEN_TTL_SECONDS,
} from '../model/jwt'
import {ACCESS_COOKIE, REFRESH_COOKIE} from '../model/cookieNames'
// Только тип — импорт стирается при компиляции, модуль остаётся Edge-safe.
import type {NextResponse} from 'next/server'

const baseOptions = {
	httpOnly: true,
	secure: process.env.NODE_ENV === 'production',
	sameSite: 'lax' as const,
	path: '/',
}

/**
 * Ставит оба токена одним вызовом. Раньше опции cookie были продублированы
 * в login, register и logout — расхождение в одном месте (например забытый
 * httpOnly) было бы тихой дыркой.
 */
export const setAuthCookies = (
	res: NextResponse,
	tokens: {accessToken: string; refreshToken?: string},
): void => {
	res.cookies.set(ACCESS_COOKIE, tokens.accessToken, {
		...baseOptions,
		maxAge: ACCESS_TOKEN_TTL_SECONDS,
	})

	// refreshToken опционален: при обычном обновлении access-токена без ротации
	// перезаписывать refresh-cookie не нужно.
	if (tokens.refreshToken) {
		res.cookies.set(REFRESH_COOKIE, tokens.refreshToken, {
			...baseOptions,
			maxAge: REFRESH_TOKEN_TTL_SECONDS,
		})
	}
}

export const clearAuthCookies = (res: NextResponse): void => {
	for (const name of [ACCESS_COOKIE, REFRESH_COOKIE]) {
		res.cookies.set(name, '', {...baseOptions, maxAge: 0})
	}
}
