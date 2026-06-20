import connectDB from '@/shared/lib/mongodb/db'
import {Message} from '@/entities/message/server'
import {NextResponse} from 'next/server'
import {publishChatEvent} from '@/entities/chat/server'
import {getAuthUserId} from '@/entities/session/server'
import {getChatParticipantIds, isUserInChat} from '@/entities/chat'

export async function POST(request: Request) {
	const authUserId = await getAuthUserId()
	if (!authUserId) {
		return NextResponse.json({error: 'Unauthorized'}, {status: 401})
	}

	const {chatId, text} = await request.json()

	if (!chatId || !text || !text.trim()) {
		return NextResponse.json(
			{error: 'Chat ID and text are required'},
			{status: 400}
		)
	}

	if (!isUserInChat(chatId, authUserId)) {
		return NextResponse.json({error: 'Forbidden'}, {status: 403})
	}

	const participants = getChatParticipantIds(chatId)
	const receiverId = participants.find(id => id !== authUserId)
	if (!receiverId) {
		return NextResponse.json({error: 'Invalid chat'}, {status: 400})
	}

	await connectDB()

	const newMessage = await Message.create({
		chatId,
		text: text.trim(),
		senderId: authUserId,
		receiverId
	})
	const plain = newMessage.toObject()

	const messagePayload = {
		_id: String(plain._id),
		chatId: plain.chatId,
		text: plain.text,
		senderId: plain.senderId,
		receiverId: plain.receiverId,
		createdAt: new Date(plain.createdAt).toISOString()
	}

	publishChatEvent(chatId, {
		type: 'new_message',
		chatId,
		message: messagePayload
	})

	return NextResponse.json(
		{message: 'Message sent successfully', newMessage: messagePayload},
		{status: 201}
	)
}

export async function GET(request: Request) {
	const authUserId = await getAuthUserId()
	if (!authUserId) {
		return NextResponse.json({error: 'Unauthorized'}, {status: 401})
	}

	const {searchParams} = new URL(request.url)
	const chatId = searchParams.get('chatId')
	const rawLimit = Number(searchParams.get('limit'))
	const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? rawLimit : 50

	if (!chatId) {
		return NextResponse.json({error: 'Chat ID is required'}, {status: 400})
	}

	if (!isUserInChat(chatId, authUserId)) {
		return NextResponse.json({error: 'Forbidden'}, {status: 403})
	}

	await connectDB()

	const messages = await Message.find({chatId})
		.sort({createdAt: -1})
		.limit(limit)
		.lean()

	return NextResponse.json(
		messages.reverse().map(m => ({
			_id: String(m._id),
			chatId: m.chatId,
			text: m.text,
			senderId: m.senderId,
			receiverId: m.receiverId,
			createdAt: m.createdAt.toISOString()
		})),
		{status: 200}
	)
}
