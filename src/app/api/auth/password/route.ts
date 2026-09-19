import {
	getAuthUserId,
	issueSession,
	revokeAllSessions,
	setAuthCookies,
} from '@/entities/session/server'
import {User} from '@/entities/user/server'
import connectDB from '@/shared/lib/mongodb/db'
import bcrypt from 'bcrypt'
import {getTranslations} from 'next-intl/server'
import {NextResponse} from 'next/server'

const MIN_PASSWORD_LENGTH = 8

/**
 * PATCH /api/auth/password — сменить пароль.
 *
 * Все сессии отзываются: смена пароля должна выкидывать того, кто уже внутри,
 * иначе она не защищает от угона — украденный refresh продолжал бы работать
 * все 30 дней. Текущему устройству сразу выдаётся новая пара, чтобы человек
 * не разлогинивался сам у себя.
 */
export async function PATCH(request: Request) {
	const t = await getTranslations('api')

	try {
		const authUserId = await getAuthUserId()
		if (!authUserId) {
			return NextResponse.json({error: 'Unauthorized'}, {status: 401})
		}

		let body: unknown
		try {
			body = await request.json()
		} catch {
			return NextResponse.json({error: t('invalidPayload')}, {status: 400})
		}

		const {currentPassword, newPassword} = (body ?? {}) as {
			currentPassword?: unknown
			newPassword?: unknown
		}

		if (typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
			return NextResponse.json({error: t('invalidPayload')}, {status: 400})
		}

		if (newPassword.length < MIN_PASSWORD_LENGTH) {
			return NextResponse.json(
				{error: t('passwordTooShort', {min: MIN_PASSWORD_LENGTH})},
				{status: 400},
			)
		}

		await connectDB()

		const user = await User.findById(authUserId)
		if (!user) {
			return NextResponse.json({error: t('userNotFound')}, {status: 404})
		}

		const isCurrentValid = await bcrypt.compare(currentPassword, user.password)
		if (!isCurrentValid) {
			return NextResponse.json({error: t('invalidPassword')}, {status: 401})
		}

		user.password = await bcrypt.hash(newPassword, 10)
		await user.save()

		// Порядок важен: сначала снести всё, потом выдать новую сессию —
		// иначе revokeAllSessions удалил бы и свежевыданную.
		await revokeAllSessions(user._id)
		const tokens = await issueSession(
			user._id,
			request.headers.get('user-agent') ?? '',
		)

		const res = NextResponse.json({message: 'Password updated'})
		setAuthCookies(res, tokens)
		return res
	} catch (error) {
		console.error('Password change error:', error)
		return NextResponse.json({error: t('serverError')}, {status: 500})
	}
}
