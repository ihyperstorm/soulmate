import {NextResponse} from 'next/server'
import {getAuthUserId} from '@/entities/session/server'
import {isUserInChat} from '@/entities/chat'
import {ChatTyping, publishChatEvent} from '@/entities/chat/server'
import connectDB from '@/shared/lib/mongodb/db'

const TYPING_TTL_MS = 8000

export async function POST(request: Request) {
	const authUserId = await getAuthUserId()
	if (!authUserId)
		return NextResponse.json({error: 'Unauthorized'}, {status: 401})

	const {chatId, isTyping} = await request.json()
	if (!chatId || typeof isTyping !== 'boolean') {
		return NextResponse.json(
			{error: 'chatId and isTyping are required'},
			{status: 400}
		)
	}

	if (!isUserInChat(chatId, authUserId)) {
		return NextResponse.json({error: 'Forbidden'}, {status: 403})
	}

	await connectDB()

	if (isTyping) {
		await ChatTyping.updateOne(
			{chatId, userId: authUserId},
			{$set: {expiresAt: new Date(Date.now() + TYPING_TTL_MS)}},
			{upsert: true}
		)
	} else {
		await ChatTyping.deleteOne({chatId, userId: authUserId})
	}

	publishChatEvent(chatId, {
		type: 'typing',
		chatId,
		userId: authUserId,
		isTyping,
		at: new Date().toISOString()
	})

	return NextResponse.json({ok: true}, {status: 200})
}
