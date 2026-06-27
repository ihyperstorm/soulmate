import connectDB from '@/shared/lib/mongodb/db'
import {User} from '@/entities/user/server'
import {getAuthUserId} from '@/entities/session/server'
import {NextResponse} from 'next/server'

// POST /api/users/me/premium — grant premium to the current user.
//
// DEMO endpoint: called from the client right after the TipTopPay widget reports
// success. In PRODUCTION the source of truth must be the verified `pay` webhook
// (/api/payments/webhook/pay) — set isPremium there by AccountId, never trust
// the browser to confirm a payment.
export async function POST() {
	const authUserId = await getAuthUserId()
	if (!authUserId) {
		return NextResponse.json({error: 'Unauthorized'}, {status: 401})
	}

	await connectDB()

	const user = await User.findByIdAndUpdate(
		authUserId,
		{isPremium: true},
		{new: true},
	)
		.select('-password')
		.lean()

	if (!user) {
		return NextResponse.json({error: 'User not found'}, {status: 404})
	}

	return NextResponse.json(user)
}
