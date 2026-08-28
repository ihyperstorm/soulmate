import type {ConversationMood} from '../model/types'

/**
 * Сколько очков к score даёт одно совпавшее настроение. Наружу это число
 * не показывается: mood влияет на ПОРЯДОК карточек, а не на процент матча.
 * Процент остаётся объяснимым («он закрывает N% твоих тем») и не скачет,
 * когда человек меняет настроение. Подробнее — MOOD.md, решение №3.
 */
export const MOOD_BOOST_PER_MATCH = 8

/** Пересечение настроений, в порядке моих. */
export const sharedMoods = (
	mine: readonly ConversationMood[],
	theirs: readonly ConversationMood[],
): ConversationMood[] => mine.filter(mood => theirs.includes(mood))

export const moodBoost = (sharedCount: number): number =>
	Math.max(0, sharedCount) * MOOD_BOOST_PER_MATCH
