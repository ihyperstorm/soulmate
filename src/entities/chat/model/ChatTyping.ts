import mongoose, {Model, Schema, Document} from 'mongoose'

export interface IChatTyping extends Document {
	chatId: string
	userId: string
	expiresAt: Date
	createdAt: Date
	updatedAt: Date
}

const ChatTypingSchema = new Schema<IChatTyping>(
	{
		chatId: {type: String, required: true},
		userId: {type: String, required: true},
		expiresAt: {type: Date, required: true}
	},
	{timestamps: true}
)

// Один typing-док на пользователя в чате
ChatTypingSchema.index({chatId: 1, userId: 1}, {unique: true})
// TTL: документ удаляется в момент expiresAt
ChatTypingSchema.index({expiresAt: 1}, {expireAfterSeconds: 0})

const ChatTyping: Model<IChatTyping> =
	mongoose.models.ChatTyping ||
	mongoose.model<IChatTyping>('ChatTyping', ChatTypingSchema)

export default ChatTyping
