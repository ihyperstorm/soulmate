import { NextResponse } from 'next/server'
import connectDB from '@/shared/lib/mongodb/db'
import { User } from '@/entities/user/server'
import bcrypt from 'bcrypt'
import { signToken } from '@/entities/session/server'

export async function POST(request: Request) {
	try {
		await connectDB()

		const { username, email, password } = await request.json()

		if (!username || !email || !password) {
			return NextResponse.json({ error: 'Name, email and password are required' }, { status: 400 })
		}

		const user = await User.findOne({ email })

		if (user) {
			return NextResponse.json({ error: 'User already exists' }, { status: 400 })
		}

		const hashedPassword = await bcrypt.hash(password, 10)

		const newUser = await User.create({ username, email, password: hashedPassword })

		const token = signToken({ userId: newUser._id.toString() })

		const res = NextResponse.json(
			{ message: 'User created successfully', user: newUser.toObject() },
			{ status: 201 }
		)

		res.cookies.set('accessToken', token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax',
			maxAge: 60 * 30,
			path: '/',
		})

		return res

	} catch (error) {
		console.error('Registration error:', error)
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : 'Internal server error' },
			{ status: 500 }
		)
	}
}