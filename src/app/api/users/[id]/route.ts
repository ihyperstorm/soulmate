import connectDB from '@/shared/lib/mongodb/db'
import {User} from '@/entities/user/server'
import {UserInterest} from '@/entities/interest/server'
import {Types} from 'mongoose'
import {NextResponse} from 'next/server'
import {mkdir, writeFile} from 'node:fs/promises'
import path from 'node:path'

export async function GET(
	request: Request,
	{params}: {params: Promise<{id: string}>},
) {
	try {
		await connectDB()

		const {id} = await params

		if (!Types.ObjectId.isValid(id)) {
			return NextResponse.json({error: 'Invalid user ID'}, {status: 400})
		}

		const user = await User.findById(id).select('-password').lean()

		if (!user) {
			return NextResponse.json({error: 'User not found'}, {status: 404})
		}

		const userInterests = await UserInterest.find({userId: user._id})
			.populate('interestId', 'name')
			.lean()

		return NextResponse.json({
			...user,
			userInterests,
		})
	} catch (error) {
		console.error('Error fetching user:', error)
		return NextResponse.json({error: 'Internal server error'}, {status: 500})
	}
}

export async function PATCH(
	request: Request,
	{params}: {params: Promise<{id: string}>},
) {
	try {
		await connectDB()

		const {id} = await params

		if (!Types.ObjectId.isValid(id)) {
			return NextResponse.json({error: 'Invalid user ID'}, {status: 400})
		}

		const formData = await request.formData()
		const username = formData.get('username')
		const avatarFile = formData.get('avatar')

		const updateData: {username?: string; avatarUrl?: string} = {}

		if (typeof username === 'string' && username.trim()) {
			updateData.username = username.trim()
		}

		const isUpload =
			avatarFile !== null &&
			typeof avatarFile === 'object' &&
			'arrayBuffer' in avatarFile &&
			'size' in avatarFile

		if (isUpload && Number(avatarFile.size) > 0) {
			const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'avatars')
			await mkdir(uploadDir, {recursive: true})

			const uploadFile = avatarFile as Blob & {name?: string; type?: string}
			const fromName = uploadFile.name?.split('.').pop()?.toLowerCase()
			const fromType = uploadFile.type?.split('/').pop()?.toLowerCase()
			const fileExt = fromName || fromType || 'bin'
			const safeExt = fileExt.replace(/[^a-z0-9]/g, '') || 'bin'
			const fileName = `avatar-${id}-${Date.now()}.${safeExt}`
			const filePath = path.join(uploadDir, fileName)
			const fileBuffer = Buffer.from(await uploadFile.arrayBuffer())

			await writeFile(filePath, fileBuffer)
			updateData.avatarUrl = `/uploads/avatars/${fileName}`
		}

		if (!updateData.username && !updateData.avatarUrl) {
			return NextResponse.json(
				{error: 'No valid fields to update'},
				{status: 400},
			)
		}

		const updateResult = await User.collection.updateOne(
			{_id: new Types.ObjectId(id)},
			{$set: updateData},
		)

		if (updateResult.matchedCount === 0) {
			return NextResponse.json({error: 'User not found'}, {status: 404})
		}

		const user = await User.findById(id).select('-password').lean()

		if (!user) {
			return NextResponse.json({error: 'User not found'}, {status: 404})
		}

		return NextResponse.json({
			...user,
			userInterests: await UserInterest.find({userId: user._id})
				.populate('interestId', 'name')
				.lean(),
		})
	} catch (error) {
		console.error('Error updating user:', error)
		return NextResponse.json({error: 'Internal server error'}, {status: 500})
	}
}
