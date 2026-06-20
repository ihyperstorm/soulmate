import {NextResponse} from 'next/server'
import {getAuthUserId} from '@/entities/session/server'
import {isUserInChat} from '@/entities/chat'
import {ChatReadState, publishChatEvent} from '@/entities/chat/server'
import connectDB from '@/shared/lib/mongodb/db'

export async function POST(request: Request) {
  const authUserId = await getAuthUserId()
  if (!authUserId) return NextResponse.json({error: 'Unauthorized'}, {status: 401})

  const {chatId} = await request.json()
  if (!chatId) {
    return NextResponse.json({error: 'chatId is required'}, {status: 400})
  }

  if (!isUserInChat(chatId, authUserId)) {
    return NextResponse.json({error: 'Forbidden'}, {status: 403})
  }

  await connectDB()

  const now = new Date()

  await ChatReadState.updateOne(
    {chatId, userId: authUserId},
    {$set: {lastReadAt: now}},
    {upsert: true}
  )

  publishChatEvent(chatId, {
    type: 'read',
    chatId,
    userId: authUserId,
    readAt: now.toISOString()
  })

  return NextResponse.json({ok: true}, {status: 200})
}