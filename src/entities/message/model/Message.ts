import mongoose, {Model, Schema, Document} from 'mongoose'

export interface IMessage extends Document {
	chatId: string
	text: string
	senderId: string
	receiverId: string
	createdAt: Date
	updatedAt: Date
}

const MessageSchema = new Schema<IMessage>(
	{
		chatId: {type: String, required: true},
		text: {type: String, required: true},
		senderId: {type: String, required: true},
		receiverId: {type: String, required: true}
	},
	{timestamps: true}
)

// Для истории конкретного чата (GET /api/messages?chatId=... sort by createdAt)
MessageSchema.index({chatId: 1, createdAt: -1})
// Для списка диалогов пользователя (когда фильтруешь по senderId/receiverId)
MessageSchema.index({senderId: 1, createdAt: -1})
MessageSchema.index({receiverId: 1, createdAt: -1})

const Message: Model<IMessage> =
	mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema)

export default Message
