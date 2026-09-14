import {issueSession, setAuthCookies} from '@/entities/session/server'
import {User} from '@/entities/user/server'
import connectDB from '@/shared/lib/mongodb/db'
import bcrypt from 'bcrypt'
import {getTranslations} from 'next-intl/server'
import {NextResponse} from 'next/server'

export async function POST(request: Request) {
	// Локаль берётся из cookie NEXT_LOCALE — та же, что и в UI.
	const t = await getTranslations('api')

	try {
		await connectDB()

		const {email, password} = await request.json()

		if (!email || !password) {
			return NextResponse.json(
				{error: t('credentialsRequired')},
				{status: 400},
			)
		}

		const user = await User.findOne({email})

		if (!user) {
			return NextResponse.json({error: t('userNotFound')}, {status: 404})
		}

		const isPasswordValid = await bcrypt.compare(password, user.password)

		if (!isPasswordValid) {
			return NextResponse.json({error: t('invalidPassword')}, {status: 401})
		}

		const tokens = await issueSession(
			user._id,
			request.headers.get('user-agent') ?? '',
		)

		// bcrypt-хэш не должен покидать сервер: клиент его залогирует или отправит
		// в Sentry, и хэш засветится. Отдаём профиль без пароля.
		const {password: _password, ...safeUser} = user.toObject()

		const res = NextResponse.json(
			{message: 'Login successful', user: safeUser},
			{status: 200},
		)
		setAuthCookies(res, tokens)
		return res
	} catch (error) {
		console.error('Login error:', error)
		return NextResponse.json({error: t('serverError')}, {status: 500})
	}
}
