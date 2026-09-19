import {getAuthUserId} from '@/entities/session/server'
import connectDB from '@/shared/lib/mongodb/db'
import {UserInterest} from '@/entities/interest/server'
import {User} from '@/entities/user/server'
import {
	isUploadedFile,
	MAX_AVATAR_MB,
	saveAvatar,
} from '@/shared/lib/avatarUpload'
import {Types} from 'mongoose'
import {getTranslations} from 'next-intl/server'
import {NextResponse} from 'next/server'

export async function GET() {
	try {
		const authUserId = await getAuthUserId()
		if (!authUserId) {
			return NextResponse.json({error: 'Unauthorized'}, {status: 401})
		}

		await connectDB()

		const user = await User.findById(authUserId).select('-password').lean()

		if (!user) {
			return NextResponse.json({error: 'User not found'}, {status: 404})
		}

		const userInterests = await UserInterest.find({userId: user._id})
			.populate('interestId', 'name')
			.lean()

		return NextResponse.json({...user, userInterests})
	} catch (error) {
		console.error('Error fetching user:', error)
		return NextResponse.json({error: 'Internal server error'}, {status: 500})
	}
}

export async function PATCH(request: Request) {
	const t = await getTranslations('api')

	try {
		const id = await getAuthUserId()
		if (!id) {
			return NextResponse.json({error: 'Unauthorized'}, {status: 401})
		}

		if (!Types.ObjectId.isValid(id)) {
			return NextResponse.json({error: 'Invalid user ID'}, {status: 400})
		}

		await connectDB()

		const formData = await request.formData()
		const username = formData.get('username')
		const bio = formData.get('bio')
		const location = formData.get('location')
		const birthday = formData.get('birthday')
		const gender = formData.get('gender')
		const avatarFile = formData.get('avatar')

		const updateData: {username?: string; avatarUrl?: string; bio?: string; location?: string; birthday?: Date; gender?: string} = {}

		if (typeof username === 'string' && username.trim()) {
			updateData.username = username.trim()
		}

		if (typeof bio === 'string' && bio.trim()) {
			updateData.bio = bio.trim()
		}
		if (typeof location === 'string' && location.trim()) {
			updateData.location = location.trim()
		}
		if (typeof birthday === 'string' && birthday.trim()) {
			updateData.birthday = new Date(birthday)
		}
		if (typeof gender === 'string' && gender.trim()) {
			updateData.gender = gender.trim()
		}

		if (isUploadedFile(avatarFile) && avatarFile.size > 0) {
			const upload = await saveAvatar(avatarFile, id)

			if (!upload.ok) {
				const tooLarge = upload.reason === 'too-large'
				return NextResponse.json(
					{
						error: tooLarge
							? t('avatarTooLarge', {max: MAX_AVATAR_MB})
							: t('avatarUnsupportedType'),
					},
					{status: tooLarge ? 413 : 415},
				)
			}

			updateData.avatarUrl = upload.url
		}

		if (!updateData.username && !updateData.avatarUrl && !updateData.bio && !updateData.location && !updateData.birthday && !updateData.gender) {
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
			bio: user.bio,
			location: user.location,
			birthday: user.birthday,
			gender: user.gender,
			userInterests: await UserInterest.find({userId: user._id})
				.populate('interestId', 'name')
				.lean(),
		})
	} catch (error) {
		console.error('Error updating user:', error)
		return NextResponse.json({error: 'Internal server error'}, {status: 500})
	}
}
