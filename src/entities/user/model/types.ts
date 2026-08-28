import type {IInterest, PopulatedUserInterest} from '@/entities/interest'
import type {ConversationMood} from '@/entities/mood'

export interface IUser {
	_id: string
	username: string
	email: string
	avatarUrl: string
	bio: string
	location: string
	birthday: Date
	gender: string
	sexualOrientation: string
	relationshipStatus: string
	password: string
	createdAt: Date
	updatedAt: Date
	isAdmin: boolean
	isActive: boolean
	isVerified: boolean
	isPremium: boolean
	balance: number
	interests: IInterest[]
	userInterests: PopulatedUserInterest[]
	/** Сырые значения из базы — в UI читать только через getActiveMoods(). */
	moods?: ConversationMood[]
	moodUpdatedAt?: string | null
}
