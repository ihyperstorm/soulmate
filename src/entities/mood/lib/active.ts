import {isConversationMood} from '../model/moods'
import type {ConversationMood, MoodHolder} from '../model/types'

const DEFAULT_MOOD_TTL_HOURS = 24

/**
 * Срок жизни настроения в часах. Переопределяется через
 * `NEXT_PUBLIC_MOOD_TTL_HOURS` — в разработке удобно поставить длинный срок,
 * чтобы засеянные тестовые настроения не протухали посреди отладки.
 *
 * Префикс NEXT_PUBLIC_ обязателен: getActiveMoods вызывается в браузере
 * (UserCard, MoodPicker, useMatchCandidates), а обычные переменные окружения
 * в клиентский бандл не попадают — там значение оказалось бы undefined
 * и TTL молча схлопнулся бы к дефолту только на клиенте.
 */
const parseTtlHours = (raw: string | undefined): number => {
	if (!raw) return DEFAULT_MOOD_TTL_HOURS
	const hours = Number(raw)
	// Опечатка в .env не должна ломать интерфейс — откатываемся к суткам.
	if (!Number.isFinite(hours) || hours <= 0) return DEFAULT_MOOD_TTL_HOURS
	return hours
}

export const MOOD_TTL_HOURS = parseTtlHours(
	// Обращение целиком, без деструктуризации: Next подставляет значение
	// текстовой заменой именно этого выражения на этапе сборки.
	process.env.NEXT_PUBLIC_MOOD_TTL_HOURS,
)

/**
 * «Сегодня» = MOOD_TTL_HOURS с момента установки. Считаем при чтении, а не по
 * крону: не нужны ни фоновые джобы, ни таймзона пользователя (её мы не храним).
 */
export const MOOD_TTL_MS = MOOD_TTL_HOURS * 60 * 60 * 1000

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

/**
 * Сколько часов настроение ещё будет учитываться. null — если оно не задано
 * или уже протухло.
 *
 * Нужно, чтобы показать это пользователю: без явного «сбросится через N ч»
 * исчезновение чипов через сутки выглядит как поломка, а не как правило.
 */
export const moodHoursLeft = (
	moodUpdatedAt?: string | Date | null,
): number | null => {
	if (!isMoodFresh(moodUpdatedAt)) return null
	const setAt = new Date(moodUpdatedAt as string | Date).getTime()
	const msLeft = setAt + MOOD_TTL_MS - Date.now()
	// Округляем вверх: «осталось 0 ч» при живом настроении сбивает с толку.
	return Math.max(1, Math.ceil(msLeft / (60 * 60 * 1000)))
}
