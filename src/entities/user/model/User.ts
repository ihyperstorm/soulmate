import mongoose, {Document, Model, Schema} from 'mongoose'
import {IInterest} from '@/entities/interest/model/Interest'
import {IUserInterest} from '@/entities/interest/model/UserInterest'

export interface IUser extends Document {
	username: string
	email: string
	password: string
	avatarUrl: string
	bio: string
	location: string
	birthday: Date
	gender: string
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

const UserSchema = new Schema<IUser>(
	{
		username: {
			type: String,
			required: true,
			trim: true,
		},
		email: {
			type: String,
			required: true,
			unique: true,
			lowercase: true,
			trim: true,
		},
		password: {
			type: String,
			required: true,
		},
		avatarUrl: {
			type: String,
			default: '',
		},
		bio: {
			type: String,
			default: '',
		},
		location: {
			type: String,
			default: '',
		},
		birthday: {
			type: Date,
			default: null,
		},
		gender: {
			type: String,
			default: '',
		},
	},
	{
		timestamps: true,
	},
)

// Next.js dev / HMR: переиспользуется закэшированная модель со старой схемой,
// тогда новые поля (например avatarUrl) не попадают в Mongo через update.
if (process.env.NODE_ENV !== 'production' && mongoose.models.User) {
	delete mongoose.models.User
}

const User: Model<IUser> =
	mongoose.models.User ?? mongoose.model<IUser>('User', UserSchema)

export default User
