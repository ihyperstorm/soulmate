export type ChatMessagePayload = {
  _id: string
  chatId: string
  text: string
  senderId: string
  receiverId: string
  createdAt: string
}

export type NewMessageEvent = {
  type: 'new_message'
  chatId: string
  message: ChatMessagePayload
}

export type TypingEvent = {
  type: 'typing'
  chatId: string
  userId: string
  isTyping: boolean
  at: string
}

export type ReadEvent = {
  type: 'read'
  chatId: string
  userId: string
  readAt: string
}

export type PresenceSnapshotEvent = {
  type: 'presence_snapshot'
  chatId: string
  typingUserIds: string[]
  readByUserId: Record<string, string> // userId -> ISO readAt
}

export type ChatRealtimeEvent = NewMessageEvent | TypingEvent | ReadEvent | PresenceSnapshotEvent
