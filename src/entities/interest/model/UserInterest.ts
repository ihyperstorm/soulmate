import mongoose, {Schema, Document, Model} from 'mongoose'

export interface IUserInterest extends Document {
	userId: mongoose.Types.ObjectId
	interestId: mongoose.Types.ObjectId
	weight: number
	createdAt: Date
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
