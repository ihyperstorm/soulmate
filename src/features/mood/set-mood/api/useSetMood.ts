'use client'

import type {ConversationMood} from '@/entities/mood'
import {CURRENT_USER_KEY, type IUser} from '@/entities/user'
import {useAppQueryClient} from '@/shared/api/providers'
import {useMutation} from '@tanstack/react-query'
import axios from 'axios'
import {useTranslations} from 'next-intl'
import toast from 'react-hot-toast'

type MoodResponse = {
	moods: ConversationMood[]
	moodUpdatedAt: string | null
}

type Context = {previous: unknown}

// Общий ключ для всех вызовов: по нему в onSettled считается, осталась ли
// эта мутация последней (см. ниже).
const SET_MOOD_KEY = ['setMood'] as const

export const useSetMood = () => {
	const queryClient = useAppQueryClient()
	// Неймспейс фичи, а не виджета: пикер живёт и на дашборде, и в профиле.
	const t = useTranslations('moodPicker')

	return useMutation<MoodResponse, unknown, ConversationMood[], Context>({
		mutationKey: SET_MOOD_KEY,
		mutationFn: moods =>
			axios.patch('/api/users/me/mood', {moods}).then(res => res.data),

		// Оптимистично: тап по чипу должен отзываться мгновенно, иначе пикер
		// ощущается как форма, а не как жест — и его перестанут трогать.
		onMutate: async moods => {
			await queryClient.cancelQueries({queryKey: CURRENT_USER_KEY})
			const previous = queryClient.getQueryData(CURRENT_USER_KEY)

			queryClient.setQueryData(CURRENT_USER_KEY, (prev: unknown) => {
				if (!prev || typeof prev !== 'object') return prev
				return {
					...(prev as IUser),
					moods,
					// Пустой набор = сброс, и moodUpdatedAt должен занулиться:
					// иначе getActiveMoods сочтёт «ничего не выбрано» свежим
					// и статус «открыт к разговору» останется включённым.
					moodUpdatedAt: moods.length > 0 ? new Date().toISOString() : null,
				}
			})

			return {previous}
		},

		onError: (_error, _moods, context) => {
			if (context) queryClient.setQueryData(CURRENT_USER_KEY, context.previous)
			toast.error(t('saveError'))
		},

		// Сверяемся с сервером только после ПОСЛЕДНЕЙ мутации: по чипам кликают
		// сериями, и ответ более раннего запроса, придя позже, откатил бы выбор
		// на промежуточный. `isMutating === 1` — это текущая, ещё не списанная.
		//
		// Ключ ['users'] не трогаем: там чужие данные, они не менялись.
		// Мои настроения ранжирование берёт из CURRENT_USER_KEY
		// (см. useMatchCandidates), поэтому обновления одного ключа достаточно.
		onSettled: () => {
			if (queryClient.isMutating({mutationKey: SET_MOOD_KEY}) === 1) {
				void queryClient.invalidateQueries({queryKey: CURRENT_USER_KEY})
			}
		},
	})
}
