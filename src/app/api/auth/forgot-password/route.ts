import {issuePasswordResetToken} from '@/entities/session/server'
import {User} from '@/entities/user/server'
import {getAppUrl, sendMail} from '@/shared/lib/mailer'
import connectDB from '@/shared/lib/mongodb/db'
import {getTranslations} from 'next-intl/server'
import {NextResponse} from 'next/server'

/**
 * POST /api/auth/forgot-password — выслать ссылку для сброса.
 *
 * ВСЕГДА отвечает 200, даже если такого адреса нет. Иначе эндпоинт становится
 * оракулом: перебором узнаётся, кто у нас зарегистрирован. По этой же причине
 * ответ не зависит от того, отправилось письмо или нет.
 */
export async function POST(request: Request) {
	const t = await getTranslations('api')
	const ok = NextResponse.json({message: 'If the address exists, a link was sent'})

	try {
		let body: unknown
		try {
			body = await request.json()
		} catch {
			return NextResponse.json({error: t('invalidPayload')}, {status: 400})
		}

		const email = (body as {email?: unknown} | null)?.email
		if (typeof email !== 'string' || !email.includes('@')) {
			return NextResponse.json({error: t('invalidPayload')}, {status: 400})
		}

		await connectDB()

		const user = await User.findOne({email: email.trim().toLowerCase()})
		if (!user) return ok

		const token = await issuePasswordResetToken(user._id)
		const link = `${getAppUrl()}/reset-password?token=${encodeURIComponent(token)}`

		await sendMail({
			to: user.email,
			subject: t('resetMailSubject'),
			text: t('resetMailBody', {link}),
		})

		return ok
	} catch (error) {
		// Даже упавшая отправка не должна выдавать существование адреса,
		// поэтому наружу — тот же 200, детали только в лог. Пользователь при
		// этом увидит «проверьте почту» и ничего не получит, так что лог здесь
		// единственный способ узнать о проблеме — пишем его заметно.
		console.error(
			'[forgot-password] письмо НЕ отправлено, пользователь об этом не узнает:',
			error instanceof Error ? error.message : error,
		)
		return ok
	}
}
