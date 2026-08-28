/**
 * Настроение общения — «на какой разговор человек настроен сейчас».
 * Отвечает на другой вопрос, чем интересы: не «с кем мне потенциально интересно»,
 * а «с кем мне будет комфортно прямо сейчас».
 */
export type ConversationMood =
	| 'deep-talks'
	| 'casual-chat'
	| 'exchange-ideas'
	| 'hobbies'
	| 'personal'
	| 'fun'

/**
 * Запись каталога. Лейбл и описание здесь НЕ хранятся — они переводятся
 * и живут в messages/*.json под ключом `mood.<id>`.
 */
export type MoodDef = {
	id: ConversationMood
	emoji: string
}

/** Минимальная форма юзера, из которой читаются настроения. */
export type MoodHolder = {
	moods?: ConversationMood[] | null
	moodUpdatedAt?: string | Date | null
}
