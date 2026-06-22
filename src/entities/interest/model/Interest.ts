import mongoose, {Document, Model, Schema} from 'mongoose'

export interface IInterest extends Document {
	name: string
	createdAt: Date
	updatedAt: Date
	weight: number
	userCount: number
}

const InterestSchema = new Schema<IInterest>(
	{
		name: {
			type: String,
			required: true,
			unique: true,
			trim: true,
		},
		weight: {
			type: Number,
			required: true,
			default: 1,
		},
		userCount: {
			type: Number,
			default: 0,
			index: true,
		},
	},
	{
		timestamps: true,
	},
)

const Interest: Model<IInterest> =
	mongoose.models.Interest ||
	mongoose.model<IInterest>('Interest', InterestSchema)

export default Interest
