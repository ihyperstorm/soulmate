import {
	clearAuthCookies,
	getAuthUserId,
	REFRESH_COOKIE,
	revokeAllSessions,
	revokeSession,
} from '@/entities/session/server'
import connectDB from '@/shared/lib/mongodb/db'
import {cookies} from 'next/headers'
import {NextResponse} from 'next/server'

/**
 * POST /api/auth/logout — выйти. С телом `{all: true}` — со всех устройств.
 *
 * Раньше роут только гасил cookie: refresh-токена не было, отзывать было нечего.
 * Теперь запись сессии удаляется из БД, поэтому украденный токен перестаёт
 * работать сразу, а не когда истечёт.
 */
export async function POST(request: Request) {
	// Ответ формируем в любом случае: даже если отзыв не удался, cookie гасим —
	// оставить пользователя «в системе» после нажатия «Выйти» нельзя.
	const res = NextResponse.json({message: 'Logged out successfully'})
	clearAuthCookies(res)

	try {
		const cookieStore = await cookies()
		const refreshToken = cookieStore.get(REFRESH_COOKIE)?.value

		let all = false
		try {
			const body = await request.json()
			all = body?.all === true
		} catch {
			// Пустое тело — обычный logout с одного устройства.
		}

		await connectDB()

		if (all) {
			const userId = await getAuthUserId()
			if (userId) await revokeAllSessions(userId)
			// Access мог уже истечь — тогда «все устройства» не определить,
			// но текущую сессию отозвать всё равно нужно.
			else await revokeSession(refreshToken)
		} else {
			await revokeSession(refreshToken)
		}
	} catch (error) {
		console.error('Logout error:', error)
	}

	return res
}
