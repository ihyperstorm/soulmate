'use client'

import {userInterestsToWeights, type IdfMap} from '@/entities/interest'
import {getActiveMoods, type ConversationMood} from '@/entities/mood'
import {useCurrentUser} from '@/entities/user'
import {useQuery} from '@tanstack/react-query'
import axios from 'axios'
import {useMemo} from 'react'
import {rankCandidates, type MatchCandidate, type RankedCandidate} from '../lib/rank'

const IDF_STALE_MS = 5 * 60 * 1000

type UseMatchCandidates = {
	/** Отсортированы по score: интересы + буст за совпавшее настроение. */
	ranked: RankedCandidate[]
	myId?: string
	myWeights: ReturnType<typeof userInterestsToWeights>
	/** Мои активные настроения — карточке нужны, чтобы подсветить совпавшие. */
	myMoods: ConversationMood[]
	idfMap?: IdfMap
	isLoading: boolean
	isError: boolean
}

/**
 * Единый источник ранжированных кандидатов для всех блоков подбора людей.
 * Ключи запросов те же, что использовались раньше (['users'], ['interests','idf']),
 * поэтому react-query переиспользует уже загруженные данные, а не грузит второй раз.
 */
export const useMatchCandidates = (): UseMatchCandidates => {
	const {data: me} = useCurrentUser()

	const {
		data: users,
		isLoading,
		isError,
	} = useQuery<MatchCandidate[]>({
		queryKey: ['users'],
		queryFn: () => axios.get('/api/users').then(res => res.data),
	})

	const {data: idfMap} = useQuery<IdfMap>({
		queryKey: ['interests', 'idf'],
		queryFn: () => axios.get('/api/interests/idf').then(res => res.data),
		staleTime: IDF_STALE_MS,
	})

	const myWeights = useMemo(
		() => userInterestsToWeights(me?.userInterests),
		[me?.userInterests],
	)

	const myMoods = useMemo(() => getActiveMoods(me), [me])

	const ranked = useMemo(
		() =>
			rankCandidates(users ?? [], {
				myId: me?._id,
				myWeights,
				myMoods,
				idfMap,
			}),
		[users, me?._id, myWeights, myMoods, idfMap],
	)

	return {ranked, myId: me?._id, myWeights, myMoods, idfMap, isLoading, isError}
}
