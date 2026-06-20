
import connectDB from '@/shared/lib/mongodb/db'
import { NextResponse } from 'next/server'

export async function POST() {
	try {
		await connectDB()
		const res =  NextResponse.json({ message: 'Logged out successfully' }, { status: 200 })
		res.cookies.set('accessToken', '', {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax',
			maxAge: 0,
			path: '/',
		})
		return res
	} catch (error) {
		console.error('Logout error:', error)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}