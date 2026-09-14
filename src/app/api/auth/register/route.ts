import {issueSession, setAuthCookies} from '@/entities/session/server'
import {User} from '@/entities/user/server'
import connectDB from '@/shared/lib/mongodb/db'
import bcrypt from 'bcrypt'
import {getTranslations} from 'next-intl/server'
import {NextResponse} from 'next/server'

export async function POST(request: Request) {
	const t = await getTranslations('api')

	try {
		await connectDB()

		const {username, email, password} = await request.json()

		if (!username || !email || !password) {
			return NextResponse.json(
				{error: 'Name, email and password are required'},
				{status: 400},
			)
		}

		const existing = await User.findOne({email})

		if (existing) {
			return NextResponse.json({error: 'User already exists'}, {status: 400})
		}

		const hashedPassword = await bcrypt.hash(password, 10)

		const newUser = await User.create({
			username,
			email,
			password: hashedPassword,
		})

		const tokens = await issueSession(
			newUser._id,
			request.headers.get('user-agent') ?? '',
		)

		// Как и в login: хэш пароля наружу не отдаём.
		const {password: _password, ...safeUser} = newUser.toObject()

		const res = NextResponse.json(
			{message: 'User created successfully', user: safeUser},
			{status: 201},
		)
		setAuthCookies(res, tokens)
		return res
	} catch (error) {
		console.error('Registration error:', error)
		return NextResponse.json({error: t('serverError')}, {status: 500})
	}
}
