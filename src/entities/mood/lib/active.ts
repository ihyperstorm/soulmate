import {isConversationMood} from '../model/moods'
import type {ConversationMood, MoodHolder} from '../model/types'

/**
 * «Сегодня» = 24 часа с момента установки. Считаем при чтении, а не по крону:
 * не нужны ни фоновые джобы, ни таймзона пользователя (её мы не храним).
 */
export const MOOD_TTL_MS = 24 * 60 * 60 * 1000

export const isMoodFresh = (moodUpdatedAt?: string | Date | null): boolean => {
	if (!moodUpdatedAt) return false
	const setAt = new Date(moodUpdatedAt).getTime()
	if (!Number.isFinite(setAt)) return false
	return Date.now() - setAt < MOOD_TTL_MS
}

/**
 * ЕДИНСТВЕННАЯ точка чтения настроений в UI. Читать `user.moods` напрямую нельзя —
 * протухшие настроения полезут в интерфейс, и карточки начнут врать.
 *
 * Заодно отсеиваются id, которых больше нет в каталоге (остались в базе после
 * правки MOODS) — иначе на них упадёт перевод.
 */
export const getActiveMoods = (user?: MoodHolder | null): ConversationMood[] => {
	if (!user || !isMoodFresh(user.moodUpdatedAt)) return []
	return (user.moods ?? []).filter(isConversationMood)
}
