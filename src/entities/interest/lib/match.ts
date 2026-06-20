export type InterestWeights = Record<string, number>

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

export function calculateMatch(
	a: InterestWeights,
	b: InterestWeights,
): number {
	const safeA = a ?? {}
	const safeB = b ?? {}
	const allKeys = new Set([
		...Object.keys(safeA),
		...Object.keys(safeB),
	])

	let minSum = 0
	let maxSum = 0

	for (const key of allKeys) {
		const weightA = safeA[key] ?? 0
		const weightB = safeB[key] ?? 0

		minSum += Math.min(weightA, weightB)
		maxSum += Math.max(weightA, weightB)
	}

	if (maxSum === 0) return 0

	return minSum / maxSum
}

/** 0–100 для отображения «N% match» */
export function calculateMatchPercent(
	a: InterestWeights,
	b: InterestWeights,
): number {
	return Math.round(calculateMatch(a, b) * 100)
}
