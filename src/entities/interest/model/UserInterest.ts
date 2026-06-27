import mongoose, {Schema, Document, Model} from 'mongoose'

export interface IUserInterest extends Document {
	userId: mongoose.Types.ObjectId
	interestId: mongoose.Types.ObjectId
	weight: number
	createdAt: Date
}

/**
 * Форма UserInterest, как её ОТДАЁТ API (/api/users, /api/users/me):
 * interestId популирован до {_id, name} через .populate('interestId', 'name').
 * Это клиентский DTO — единый источник правды для всех, кто читает userInterests.
 */
export type PopulatedUserInterest = {
	_id?: string
	userId?: string
	interestId: string | {_id: string; name: string} | null
	weight: number
	createdAt?: string
}

const UserInterestSchema = new Schema<IUserInterest>(
	{
		userId: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		interestId: {
			type: Schema.Types.ObjectId,
			ref: 'Interest',
			required: true,
		},
		weight: {
			type: Number,
			required: true,
			default: 1,
		},
	},
	{
		timestamps: {createdAt: true, updatedAt: false},
	},
)

// Составной уникальный индекс для предотвращения дубликатов
UserInterestSchema.index({userId: 1, interestId: 1}, {unique: true})

const UserInterest: Model<IUserInterest> =
	mongoose.models.UserInterest ||
	mongoose.model<IUserInterest>('UserInterest', UserInterestSchema)

export default UserInterest
