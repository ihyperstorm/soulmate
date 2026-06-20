import {getAuthUserId} from '@/entities/session/server'
import connectDB from '@/shared/lib/mongodb/db'
import {ChatReadState, ChatTyping, subscribeToChat} from '@/entities/chat/server'
import {getChatParticipantIds, isUserInChat} from '@/entities/chat'

export const runtime = 'nodejs'

const encoder = new TextEncoder()

export async function GET(request: Request) {
	const authUserId = await getAuthUserId()
	if (!authUserId) {
		return new Response('Unauthorized', {status: 401})
	}

	const {searchParams} = new URL(request.url)
	const chatId = searchParams.get('chatId')

	if (!chatId) {
		return new Response('chatId is required', {status: 400})
	}

	if (!isUserInChat(chatId, authUserId)) {
		return new Response('Forbidden', {status: 403})
	}

	await connectDB()

	const participantIds = getChatParticipantIds(chatId)
	const peerId = participantIds.find(id => id !== authUserId) ?? null

	const now = new Date()
	const activeTypingDocs = await ChatTyping.find({
		chatId,
		expiresAt: {$gt: now}
	})
		.select({userId: 1, _id: 0})
		.lean()

	const readDocs = await ChatReadState.find({chatId})
		.select({userId: 1, lastReadAt: 1, _id: 0})
		.lean()

	const typingUserIds = activeTypingDocs.map(d => d.userId)
	const readByUserId: Record<string, string> = {}
	for (const doc of readDocs) {
		readByUserId[doc.userId] = new Date(doc.lastReadAt).toISOString()
	}

	const stream = new ReadableStream<Uint8Array>({
		start(controller) {
			const send = (data: unknown) => {
				controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
			}

			controller.enqueue(encoder.encode(': connected\n\n'))
			const pingInterval = setInterval(() => {
				try {
					controller.enqueue(encoder.encode(': ping\n\n'))
				} catch {}
			}, 25000)

			send({
				type: 'presence_snapshot',
				chatId,
				typingUserIds,
				readByUserId
			})

			const unsubscribe = subscribeToChat(chatId, event => send(event))

			request.signal.addEventListener('abort', () => {
				clearInterval(pingInterval)
				unsubscribe()
				try {
					controller.close()
				} catch (error) {
					console.error('Error closing controller', error)
				}
			})
		}
	})

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache, no-transform',
			Connection: 'keep-alive'
		}
	})
}
