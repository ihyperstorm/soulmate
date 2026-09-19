import {getAuthUserId} from '@/entities/session/server'
import {User} from '@/entities/user/server'
import {sendMail} from '@/shared/lib/mailer'
import connectDB from '@/shared/lib/mongodb/db'
import bcrypt from 'bcrypt'
import {getTranslations} from 'next-intl/server'
import {NextResponse} from 'next/server'

// Не «правильная» RFC-проверка, а отсев очевидного мусора: настоящая
// валидность адреса проверяется только доставкой письма.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * PATCH /api/auth/email — сменить почту.
 *
 * Отдельно от PATCH /api/users/me намеренно: почта — это учётные данные и
 * канал восстановления, а не поле профиля вроде города. Поэтому требуется
 * текущий пароль: с угнанной сессией иначе можно переписать адрес на свой
 * и увести аккаунт насовсем — владелец даже сбросить пароль не сможет.
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

		const {email, currentPassword} = (body ?? {}) as {
			email?: unknown
			currentPassword?: unknown
		}

		if (typeof email !== 'string' || typeof currentPassword !== 'string') {
			return NextResponse.json({error: t('invalidPayload')}, {status: 400})
		}

		const nextEmail = email.trim().toLowerCase()
		if (!EMAIL_RE.test(nextEmail)) {
			return NextResponse.json({error: t('emailInvalid')}, {status: 400})
		}

		await connectDB()

		const user = await User.findById(authUserId)
		if (!user) {
			return NextResponse.json({error: t('userNotFound')}, {status: 404})
		}

		const isPasswordValid = await bcrypt.compare(currentPassword, user.password)
		if (!isPasswordValid) {
			return NextResponse.json({error: t('invalidPassword')}, {status: 401})
		}

		const previousEmail = user.email
		if (previousEmail === nextEmail) {
			return NextResponse.json({email: previousEmail})
		}

		const taken = await User.findOne({email: nextEmail}).select('_id').lean()
		if (taken) {
			return NextResponse.json({error: t('emailTaken')}, {status: 409})
		}

		user.email = nextEmail
		try {
			await user.save()
		} catch (error) {
			// Гонка между проверкой выше и сохранением: уникальный индекс ловит
			// то, что findOne пропустил.
			if ((error as {code?: number})?.code === 11000) {
				return NextResponse.json({error: t('emailTaken')}, {status: 409})
			}
			throw error
		}

		// Уведомляем СТАРЫЙ адрес: если смену инициировал не владелец, это
		// единственный сигнал, который до него дойдёт. Best-effort — провал
		// отправки не должен откатывать уже сохранённую смену.
		try {
			await sendMail({
				to: previousEmail,
				subject: t('emailChangedSubject'),
				text: t('emailChangedBody', {email: nextEmail}),
			})
		} catch (error) {
			console.error(
				'[change-email] уведомление на старый адрес НЕ отправлено:',
				error instanceof Error ? error.message : error,
			)
		}

		return NextResponse.json({email: nextEmail})
	} catch (error) {
		console.error('Change email error:', error)
		return NextResponse.json({error: t('serverError')}, {status: 500})
	}
}
