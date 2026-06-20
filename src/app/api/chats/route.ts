import connectDB from '@/shared/lib/mongodb/db'
import {ChatReadState} from '@/entities/chat/server'
import {Message} from '@/entities/message/server'
import {User} from '@/entities/user/server'
import {getAuthUserId} from '@/entities/session/server'
import {NextResponse} from 'next/server'

export async function GET() {
	try {
		const authUserId = await getAuthUserId()
		if (!authUserId) {
			return NextResponse.json({error: 'Unauthorized'}, {status: 401})
		}

		await connectDB()

		// Берем только сообщения, где текущий пользователь участник
		const rows = await Message.aggregate([
			{
				$match: {
					$or: [{senderId: authUserId}, {receiverId: authUserId}]
				}
			},
			{
				$addFields: {
					peerId: {
						$cond: [
							{$eq: ['$senderId', authUserId]},
							'$receiverId',
							'$senderId'
						]
					}
				}
			},
			{$sort: {createdAt: -1}},
			{
				$group: {
					_id: '$peerId',
					lastMessageAt: {$first: '$createdAt'},
					lastMessageText: {$first: '$text'}
				}
			},
			{$sort: {lastMessageAt: -1}}
		])

		const peerIds = rows.map(r => r._id).filter(Boolean)
		const chatIds = rows.map(
			r => `${[authUserId, String(r._id)].sort().join('_')}`
		)

		const users = await User.find({_id: {$in: peerIds}})
			.select('-password')
			.lean()

		const readStates = await ChatReadState.find({
			userId: authUserId,
			chatId: {$in: chatIds}
		})
			.select({chatId: 1, lastReadAt: 1, _id: 0})
			.lean()
		const readByChatId = new Map<string, Date>()
		for (const rs of readStates) {
			readByChatId.set(rs.chatId, new Date(rs.lastReadAt))
		}

		const userById = new Map(users.map(u => [String(u._id), u]))

		const chats = await Promise.all(
			rows.map(async r => {
				const peer = userById.get(String(r._id))
				if (!peer) return null

				const chatId = [authUserId, String(r._id)].sort().join('_')
				const lastReadAt = readByChatId.get(chatId)
				const unreadCount = await Message.countDocuments({
					chatId,
					receiverId: authUserId,
					...(lastReadAt ? {createdAt: {$gt: lastReadAt}} : {})
				})

				return {
					peer,
					lastMessageAt: r.lastMessageAt,
					lastMessageText: r.lastMessageText,
					unreadCount
				}
			})
		)

		return NextResponse.json(chats.filter(Boolean), {status: 200})
	} catch (error) {
		console.error('Error fetching chats:', error)
		return NextResponse.json({error: 'Internal server error'}, {status: 500})
	}
}
