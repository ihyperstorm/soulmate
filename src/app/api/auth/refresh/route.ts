import {
	clearAuthCookies,
	REFRESH_COOKIE,
	rotateSession,
	setAuthCookies,
} from '@/entities/session/server'
import connectDB from '@/shared/lib/mongodb/db'
import {getTranslations} from 'next-intl/server'
import {cookies} from 'next/headers'
import {NextResponse} from 'next/server'

/**
 * POST /api/auth/refresh — обменять refresh-токен на новую пару.
 *
 * Вызывается только axios-интерцептором при 401 (см. shared/api/authRefresh).
 * В ответе на неудачу отдаём `reason`: клиенту важно отличать «сессии не было
 * вовсе» (анонимный посетитель — редиректить не надо) от «сессия умерла»
 * (нужно уводить на /signin).
 */
export async function POST(request: Request) {
	const t = await getTranslations('api')

	try {
		const cookieStore = await cookies()
		const refreshToken = cookieStore.get(REFRESH_COOKIE)?.value

		await connectDB()

		const result = await rotateSession(
			refreshToken,
			request.headers.get('user-agent') ?? '',
		)

		if (!result.ok) {
			const res = NextResponse.json(
				{error: t('sessionExpired'), reason: result.reason},
				{status: 401},
			)
			// Чистим cookie при любой неудаче: держать мёртвый refresh смысла нет,
			// иначе proxy будет и дальше пускать на защищённые страницы.
			clearAuthCookies(res)
			return res
		}

		const res = NextResponse.json({message: 'Refreshed'})
		setAuthCookies(res, result)
		return res
	} catch (error) {
		console.error('Refresh error:', error)
		return NextResponse.json({error: t('serverError')}, {status: 500})
	}
}
