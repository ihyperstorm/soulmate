import {
	calculateCoveragePercent,
	userInterestsToWeights,
	type IdfMap,
	type InterestWeights,
	type PopulatedUserInterest,
} from '@/entities/interest'
import {
	getActiveMoods,
	moodBoost,
	sharedMoods,
	type ConversationMood,
} from '@/entities/mood'

/**
 * Кандидат в том виде, в котором его отдаёт GET /api/users.
 * Структурно совместим с UserCardData — карточке можно передавать напрямую.
 */
export type MatchCandidate = {
	_id: string
	username: string
	avatarUrl?: string
	bio?: string
	userInterests?: PopulatedUserInterest[]
	moods?: ConversationMood[]
	moodUpdatedAt?: string | null
}

export type RankedCandidate = {
	user: MatchCandidate
	/** Процент по интересам — то, что показывается в кольце карточки. */
	coveragePercent: number
	/** Совпавшие настроения. Пустой массив, если чьё-то настроение протухло. */
	shared: ConversationMood[]
	/** Только для сортировки, наружу не показывается. */
	score: number
}

type RankOptions = {
	/** Себя из выдачи исключаем. */
	myId?: string
	myWeights: InterestWeights
	myMoods: readonly ConversationMood[]
	idfMap?: IdfMap
}

/**
 * Порядок кандидатов: процент по интересам плюс невидимый буст за совпавшее
 * настроение. Сам процент настроением НЕ разбавляется — он остаётся
 * объяснимым («закрывает N% твоих тем») и не скачет, когда человек меняет
 * настрой. Подробнее — MOOD.md, решение №3.
 */
export const rankCandidates = (
	users: readonly MatchCandidate[],
	{myId, myWeights, myMoods, idfMap}: RankOptions,
): RankedCandidate[] => {
	const ranked: RankedCandidate[] = []

	for (const user of users) {
		if (myId && user._id === myId) continue

		const coveragePercent = calculateCoveragePercent(
			myWeights,
			userInterestsToWeights(user.userInterests),
			idfMap,
		)
		const shared = sharedMoods(myMoods, getActiveMoods(user))

		ranked.push({
			user,
			coveragePercent,
			shared,
			score: coveragePercent + moodBoost(shared.length),
		})
	}

	return ranked.sort((a, b) => b.score - a.score)
}
