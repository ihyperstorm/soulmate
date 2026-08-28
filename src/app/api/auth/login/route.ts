import connectDB from '@/shared/lib/mongodb/db'
import { User } from '@/entities/user/server'
import { NextResponse } from 'next/server'
import bcrypt from 'bcrypt'
import { getTranslations } from 'next-intl/server'
import { signToken } from '@/entities/session/server'

export async function POST(request: Request) {
	// Локаль берётся из cookie NEXT_LOCALE — та же, что и в UI.
	const t = await getTranslations('api')

	try {
		await connectDB()

		const { email, password } = await request.json()

		if (!email || !password) {
			return NextResponse.json({ error: t('credentialsRequired') }, { status: 400 })
		}

		const user = await User.findOne({ email })

		if (!user) {
			return NextResponse.json({ error: t('userNotFound') }, { status: 404 })
		}

		const isPasswordValid = await bcrypt.compare(password, user.password)

		if (!isPasswordValid) {
			return NextResponse.json({ error: t('invalidPassword') }, { status: 401 })
		}

		const token = await signToken({ userId: user._id.toString() })

		const res = NextResponse.json({ message: 'Login successful', user: user.toObject() }, { status: 200 })

		res.cookies.set('accessToken', token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax',
			maxAge: 60 * 30,
			path: '/',
		})

		return res

	} catch (error) {
		console.error('Login error:', error)
		return NextResponse.json({ error: t('serverError') }, { status: 500 })
	}
}