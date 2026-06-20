import mongoose, {Model, Schema, Document} from 'mongoose'

export interface IChatReadState extends Document {
	chatId: string
	userId: string
	lastReadAt: Date
	createdAt: Date
	updatedAt: Date
}

const ChatReadStateSchema = new Schema<IChatReadState>(
	{
		chatId: {type: String, required: true},
		userId: {type: String, required: true},
		lastReadAt: {type: Date, required: true}
	},
	{timestamps: true}
)

ChatReadStateSchema.index({chatId: 1, userId: 1}, {unique: true})

const ChatReadState: Model<IChatReadState> =
	mongoose.models.ChatReadState ||
	mongoose.model<IChatReadState>('ChatReadState', ChatReadStateSchema)

export default ChatReadState
