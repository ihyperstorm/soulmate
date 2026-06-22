export type InterestWeights = Record<string, number>
export type IdfMap = Record<string, number>

/** Строка из API / populate: userInterests[].interestId + weight */
export type UserInterestRow = {
	interestId?: string | {_id?: string} | null
	weight?: number
}

/**
 * Массив UserInterest → карта interestId → weight для calculateMatch.
 */
export function userInterestsToWeights(
	list: UserInterestRow[] | undefined | null,
): InterestWeights {
	if (!list?.length) return {}
	const out: InterestWeights = {}
	for (const row of list) {
		const raw = row.interestId
		const id =
			raw !== null && typeof raw === 'object'
				? String(raw._id ?? '')
				: String(raw ?? '')
		if (!id) continue
		const w = typeof row.weight === 'number' ? row.weight : Number(row.weight)
		if (Number.isFinite(w)) out[id] = w
	}
	return out
}

const idfFor = (idf: IdfMap | undefined, key: string): number =>
	idf?.[key] ?? 1

/**
 * Симметричный взвешенный Жаккард. Если передан idf — каждый ключ умножается
 * на его IDF (редкие интересы весомее).
 */
export function calculateMatch(
	a: InterestWeights,
	b: InterestWeights,
	idf?: IdfMap,
): number {
	const safeA = a ?? {}
	const safeB = b ?? {}
	const allKeys = new Set([...Object.keys(safeA), ...Object.keys(safeB)])

	let minSum = 0
	let maxSum = 0

	for (const key of allKeys) {
		const w = idfFor(idf, key)
		const weightA = safeA[key] ?? 0
		const weightB = safeB[key] ?? 0

		minSum += Math.min(weightA, weightB) * w
		maxSum += Math.max(weightA, weightB) * w
	}

	if (maxSum === 0) return 0
	return minSum / maxSum
}

/** 0–100 для отображения «N% match» */
export function calculateMatchPercent(
	a: InterestWeights,
	b: InterestWeights,
	idf?: IdfMap,
): number {
	return Math.round(calculateMatch(a, b, idf) * 100)
}

/**
 * Асимметричная метрика «насколько ОН закрывает МОИ интересы».
 * Знаменатель — только моя сумма весов, поэтому юзеры с большим количеством
 * интересов не штрафуются за «лишние» теги. С IDF редкие совпадения весомее.
 */
export function calculateCoverage(
	mine: InterestWeights,
	theirs: InterestWeights,
	idf?: IdfMap,
): number {
	const safeMine = mine ?? {}
	const safeTheirs = theirs ?? {}

	let numerator = 0
	let denominator = 0

	for (const key of Object.keys(safeMine)) {
		const w = idfFor(idf, key)
		const myWeight = safeMine[key] ?? 0
		const theirWeight = safeTheirs[key] ?? 0

		denominator += myWeight * w
		numerator += Math.min(myWeight, theirWeight) * w
	}

	if (denominator === 0) return 0
	return numerator / denominator
}

/** 0–100 для отображения «закрывает N% твоих тем» */
export function calculateCoveragePercent(
	mine: InterestWeights,
	theirs: InterestWeights,
	idf?: IdfMap,
): number {
	return Math.round(calculateCoverage(mine, theirs, idf) * 100)
}
