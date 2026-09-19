import {
	clearAuthCookies,
	consumePasswordResetToken,
	invalidatePasswordResetTokens,
	revokeAllSessions,
} from '@/entities/session/server'
import {User} from '@/entities/user/server'
import connectDB from '@/shared/lib/mongodb/db'
import bcrypt from 'bcrypt'
import {getTranslations} from 'next-intl/server'
import {NextResponse} from 'next/server'

const MIN_PASSWORD_LENGTH = 8

/**
 * POST /api/auth/reset-password — установить новый пароль по токену из письма.
 *
 * Автологина намеренно нет: после сброса человек идёт на /signin и вводит
 * новый пароль. Так он сразу убеждается, что пароль записан верно, а мы не
 * выдаём сессию тому, кто просто где-то раздобыл ссылку.
 */
export async function POST(request: Request) {
	const t = await getTranslations('api')

	try {
		let body: unknown
		try {
			body = await request.json()
		} catch {
			return NextResponse.json({error: t('invalidPayload')}, {status: 400})
		}

		const {token, password} = (body ?? {}) as {
			token?: unknown
			password?: unknown
		}

		if (typeof token !== 'string' || typeof password !== 'string') {
			return NextResponse.json({error: t('invalidPayload')}, {status: 400})
		}

		if (password.length < MIN_PASSWORD_LENGTH) {
			return NextResponse.json(
				{error: t('passwordTooShort', {min: MIN_PASSWORD_LENGTH})},
				{status: 400},
			)
		}

		await connectDB()

		const consumed = await consumePasswordResetToken(token)
		if (!consumed.ok) {
			// Истёкший и несуществующий токен для пользователя — одно и то же:
			// «ссылка больше не действует, запросите новую».
			return NextResponse.json({error: t('resetLinkInvalid')}, {status: 400})
		}

		const user = await User.findById(consumed.userId)
		if (!user) {
			return NextResponse.json({error: t('userNotFound')}, {status: 404})
		}

		user.password = await bcrypt.hash(password, 10)
		await user.save()

		// Сброс запрашивают при подозрении на угон — чужая сессия не должна
		// его пережить. Заодно гасим остальные выпущенные ссылки.
		await revokeAllSessions(user._id)
		await invalidatePasswordResetTokens(user._id)

		const res = NextResponse.json({message: 'Password reset'})
		// Если в этом браузере была живая сессия, она уже отозвана в БД —
		// гасим и cookie, чтобы интерфейс не притворялся залогиненным.
		clearAuthCookies(res)
		return res
	} catch (error) {
		console.error('Reset password error:', error)
		return NextResponse.json({error: t('serverError')}, {status: 500})
	}
}
