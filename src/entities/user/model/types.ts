import type {IInterest} from '@/entities/interest'
import type {IUserInterest} from '@/entities/interest'

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
	userInterests: IUserInterest[]
}
