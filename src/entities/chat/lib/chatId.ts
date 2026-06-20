export const buildChatId = (a: string, b: string) => [a, b].sort().join('_')

export const getChatParticipantIds = (chatId: string) =>
	chatId.split('_').filter(Boolean)

export const isUserInChat = (chatId: string, userId: string) =>
	getChatParticipantIds(chatId).includes(userId)
