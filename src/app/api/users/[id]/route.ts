import connectDB from '@/shared/lib/mongodb/db'
import {getAuthUserId} from '@/entities/session/server'
import {User} from '@/entities/user/server'
import {UserInterest} from '@/entities/interest/server'
import {
	isUploadedFile,
	MAX_AVATAR_MB,
	saveAvatar,
} from '@/shared/lib/avatarUpload'
import {Types} from 'mongoose'
import {getTranslations} from 'next-intl/server'
import {NextResponse} from 'next/server'

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
	const t = await getTranslations('api')

	try {
		await connectDB()

		const {id} = await params

		if (!Types.ObjectId.isValid(id)) {
			return NextResponse.json({error: 'Invalid user ID'}, {status: 400})
		}

		// Без этой проверки любой залогиненный мог PATCH'ить чужой профиль —
		// подменить чужие имя и аватар. Сравниваем с id из access-токена,
		// а не с тем, что пришло в запросе.
		const authUserId = await getAuthUserId()
		if (!authUserId) {
			return NextResponse.json({error: 'Unauthorized'}, {status: 401})
		}
		if (authUserId !== id) {
			return NextResponse.json({error: 'Forbidden'}, {status: 403})
		}

		const formData = await request.formData()
		const username = formData.get('username')
		const avatarFile = formData.get('avatar')

		const updateData: {username?: string; avatarUrl?: string} = {}

		if (typeof username === 'string' && username.trim()) {
			updateData.username = username.trim()
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
