import {buildChatId} from '@/entities/chat'

/**
 * Ссылка на чат с человеком. `draft` подставляется в поле ввода (ChatBox
 * читает его из ?draft=) — так работают айсбрейкеры из карточки.
 */
export const buildChatHref = (
	myId: string,
	receiverId: string,
	receiverUsername: string,
	draft?: string,
): string => {
	const params = new URLSearchParams({
		chatId: buildChatId(myId, receiverId),
		senderId: myId,
		receiverId,
		username: receiverUsername,
	})
	if (draft) params.set('draft', draft)
	return `/messages?${params.toString()}`
}
