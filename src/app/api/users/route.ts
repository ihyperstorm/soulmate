import connectDB from '@/shared/lib/mongodb/db'
import { User } from '@/entities/user/server'
import { UserInterest } from '@/entities/interest/server'
import { NextResponse } from 'next/server'

export async function GET() {
	try {
		await connectDB()

		const users = await User.find().select('-password').lean()
		const userIds = users.map(user => user._id)

		const userInterests = await UserInterest.find({ userId: { $in: userIds } })
			.populate('interestId', 'name')
			.lean()

		const interestsByUser = new Map<string, typeof userInterests>()
		for (const userInterest of userInterests) {
			const key = String(userInterest.userId)
			const existing = interestsByUser.get(key) ?? []
			existing.push(userInterest)
			interestsByUser.set(key, existing)
		}

		const usersWithInterests = users.map(user => ({
			...user,
			userInterests: interestsByUser.get(String(user._id)) ?? [],
		}))

		return NextResponse.json(usersWithInterests)

	} catch (error) {
		console.error('Error fetching users:', error)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}