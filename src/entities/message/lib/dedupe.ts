import type {ChatMessagePayload} from '@/entities/message/model/types'

export const appendMessageDeduped = (
	current: ChatMessagePayload[],
	incoming: ChatMessagePayload
): ChatMessagePayload[] => {
	if (current.some(m => m._id === incoming._id)) {
		return current
	}
	return [...current, incoming]
}

export const mergeMessagesDeduped = (
	a: ChatMessagePayload[],
	b: ChatMessagePayload[]
): ChatMessagePayload[] => {
	const byId = new Map<string, ChatMessagePayload>()
	for (const m of a) byId.set(m._id, m)
	for (const m of b) byId.set(m._id, m)
	return Array.from(byId.values()).sort(
		(x, y) =>
			new Date(x.createdAt).getTime() - new Date(y.createdAt).getTime()
	)
}
