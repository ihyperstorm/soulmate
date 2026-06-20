import type {ChatRealtimeEvent} from '@/entities/message'

type Listener = (event: ChatRealtimeEvent) => void

const channels = new Map<string, Set<Listener>>()

export const subscribeToChat = (chatId: string, listener: Listener) => {
  const set = channels.get(chatId) ?? new Set<Listener>()
  set.add(listener)
  channels.set(chatId, set)

  return () => {
    set.delete(listener)
    if (set.size === 0) channels.delete(chatId)
  }
}

export const publishChatEvent = (
  chatId: string,
  event: ChatRealtimeEvent
) => {
  const set = channels.get(chatId)
  if (!set) return
  for (const listener of set) listener(event)
}
