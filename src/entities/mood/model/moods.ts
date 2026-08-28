import type {ConversationMood, MoodDef} from './types'

/**
 * Каталог настроений. В отличие от Interest это НЕ коллекция в БД: значений мало,
 * пользователи их не создают, и им не нужен IDF. В базе лежит только id —
 * лейбл берётся из i18n (`mood.<id>.label`).
 *
 * Порядок массива = порядок чипов в UI.
 */
export const MOODS: readonly MoodDef[] = [
	{id: 'deep-talks', emoji: '🧠'},
	{id: 'casual-chat', emoji: '☕'},
	{id: 'exchange-ideas', emoji: '💡'},
	{id: 'hobbies', emoji: '🎮'},
	{id: 'personal', emoji: '❤️'},
	{id: 'fun', emoji: '🤪'},
]

/** Плоский список id — годится и как mongoose enum. */
export const MOOD_IDS: readonly ConversationMood[] = MOODS.map(mood => mood.id)

export const MOOD_EMOJI: Record<ConversationMood, string> = MOODS.reduce(
	(acc, mood) => {
		acc[mood.id] = mood.emoji
		return acc
	},
	{} as Record<ConversationMood, string>,
)

/**
 * Больше двух — и пересечение перестаёт быть сигналом: при шести вариантах
 * почти любая пара совпала бы хотя бы одним настроением, и строка
 * «вы оба настроены на…» превратилась бы в шум.
 */
export const MAX_MOODS = 2

export const isConversationMood = (value: unknown): value is ConversationMood =>
	typeof value === 'string' && (MOOD_IDS as readonly string[]).includes(value)
