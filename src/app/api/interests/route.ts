import { NextResponse } from 'next/server'
import connectDB from '@/shared/lib/mongodb/db'
import {Interest, UserInterest} from '@/entities/interest/server'
import mongoose from 'mongoose'

// GET - получить все доступные интересы
export async function GET() {
	try {
		await connectDB()

		const interests = await Interest.find().sort({ name: 1 })

		return NextResponse.json(interests)
	} catch (error) {
		console.error('Error fetching interests:', error)
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : 'Internal server error' },
			{ status: 500 }
		)
	}
}

// POST - сохранить интересы пользователя
export async function POST(request: Request) {
	try {
		await connectDB()

		const { ratings, userId } = await request.json()

		if (!userId) {
			return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
		}

		if (!mongoose.Types.ObjectId.isValid(userId)) {
			return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 })
		}

		const safeRatings =
			ratings && typeof ratings === 'object' && !Array.isArray(ratings)
				? (ratings as Record<string, unknown>)
				: {}

		type Candidate = { interestIdStr: string; weight: number }
		const candidates: Candidate[] = []

		for (const [key, rawWeight] of Object.entries(safeRatings)) {
			if (!mongoose.Types.ObjectId.isValid(key)) continue
			const parsedWeight =
				typeof rawWeight === 'number' ? rawWeight : Number(rawWeight)
			if (
				!Number.isFinite(parsedWeight) ||
				parsedWeight < 1 ||
				parsedWeight > 5
			) {
				continue
			}
			candidates.push({ interestIdStr: key, weight: parsedWeight })
		}

		if (candidates.length === 0) {
			return NextResponse.json(
				{ error: 'At least one rated interest (1–5) is required' },
				{ status: 400 },
			)
		}

		const userIdObj = new mongoose.Types.ObjectId(userId)
		const objectIds = candidates.map(
			(c) => new mongoose.Types.ObjectId(c.interestIdStr),
		)
		const interestDocs = await Interest.find({ _id: { $in: objectIds } })
		const found = new Set(interestDocs.map((d) => String(d._id)))

		const userInterests = candidates
			.filter((c) => found.has(c.interestIdStr))
			.map((c) => ({
				userId: userIdObj,
				interestId: new mongoose.Types.ObjectId(c.interestIdStr),
				weight: c.weight,
			}))

		if (userInterests.length === 0) {
			return NextResponse.json(
				{ error: 'No valid interests found for given ratings' },
				{ status: 400 },
			)
		}

		const oldDocs = await UserInterest.find({ userId: userIdObj })
			.select({ interestId: 1, _id: 0 })
			.lean()
		const oldInterestIds = oldDocs.map((d) => d.interestId)

		await UserInterest.deleteMany({ userId: userIdObj })
		if (oldInterestIds.length > 0) {
			await Interest.updateMany(
				{ _id: { $in: oldInterestIds } },
				{ $inc: { userCount: -1 } },
			)
		}

		await UserInterest.insertMany(userInterests)
		const newInterestIds = userInterests.map((ui) => ui.interestId)
		await Interest.updateMany(
			{ _id: { $in: newInterestIds } },
			{ $inc: { userCount: 1 } },
		)

		return NextResponse.json({ message: 'Interests saved successfully' }, { status: 200 })
	} catch (error) {
		console.error('Error saving interests:', error)
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : 'Internal server error' },
			{ status: 500 }
		)
	}
}
