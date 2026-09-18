'use client'

import {
	getActiveMoods,
	MAX_MOODS,
	MoodChip,
	moodHoursLeft,
	MOODS,
	type ConversationMood,
} from '@/entities/mood'
import {useCurrentUser} from '@/entities/user'
import {useTranslations} from 'next-intl'
import {useSetMood} from '../api/useSetMood'

/**
 * Пикер настроения. Кнопки «Сохранить» нет намеренно: настроение — это жест,
 * а не конфигурация. С кнопкой его обновляли бы раз в месяц, и фича бы умерла.
 *
 * Локального состояния тоже нет: выбранное читается из кэша текущего юзера,
 * а мутация обновляет этот кэш оптимистично — значит один источник правды
 * и никакой рассинхронизации между пикером и остальным интерфейсом.
 */
export const MoodPicker = () => {
	const {data: me} = useCurrentUser()
	const {mutate: setMood} = useSetMood()
	const t = useTranslations('moodPicker')

	const selected = getActiveMoods(me)
	const hoursLeft = moodHoursLeft(me?.moodUpdatedAt)

	const toggle = (mood: ConversationMood) => {
		const next = selected.includes(mood)
			? selected.filter(item => item !== mood)
			// Третий выбор вытесняет самый ранний, а не отвергается ошибкой:
			// упереться в лимит и получить toast — лишнее трение для одного тапа.
			: [...selected, mood].slice(-MAX_MOODS)

		setMood(next)
	}

	return (
		<div className='flex flex-col gap-3'>
			<div className='flex flex-wrap gap-2'>
				{MOODS.map(mood => (
					<MoodChip
						key={mood.id}
						mood={mood.id}
						selected={selected.includes(mood.id)}
						onSelectAction={toggle}
					/>
				))}
			</div>

			{/* Без явного счётчика исчезновение чипов через сутки читается как баг. */}
			{hoursLeft !== null && (
				<p className='text-xs text-faint'>{t('expiresIn', {hours: hoursLeft})}</p>
			)}
		</div>
	)
}
