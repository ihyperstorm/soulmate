'use client'

import {InterestStarRating} from '@/entities/interest'
import type {IInterest, PopulatedUserInterest} from '@/entities/interest'
import {CURRENT_USER_KEY, useCurrentUser} from '@/entities/user'
import {Button} from '@/components/ui/button'
import {
	Combobox,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
} from '@/components/ui/combobox'
import {useAppQueryClient} from '@/shared/api/providers'
import {mongoIdString} from '@/shared/lib/mongoId'
import {useQuery} from '@tanstack/react-query'
import axios from 'axios'
import {X} from 'lucide-react'
import {useState} from 'react'
import toast from 'react-hot-toast'

// Вес (1–5) нужен матчингу (calculateMatch) — у каждого чипа свои звёзды.
// Новый интерес стартует с нейтрального DEFAULT_WEIGHT, дальше юзер правит звёздами.
const DEFAULT_WEIGHT = 3

type SelectedInterest = {_id: string; name: string; weight: number}
type Option = {_id: string; name: string}
type InterestsEditorProps = {
	// Вызывается после успешного сохранения (напр. для навигации на профиль).
	onSaved?: () => void
}

// Текущие интересы юзера (с весами) → список выбранных чипов.
function buildSelectedFromUser(
	userInterests: PopulatedUserInterest[] | undefined,
): SelectedInterest[] {
	if (!userInterests) return []
	const seed: SelectedInterest[] = []
	for (const ui of userInterests) {
		const interest = ui.interestId
		if (interest && typeof interest === 'object' && 'name' in interest) {
			seed.push({
				_id: interest._id,
				name: interest.name,
				weight: ui.weight ?? DEFAULT_WEIGHT,
			})
		}
	}
	return seed
}

export function InterestsEditor({onSaved}: InterestsEditorProps) {
	const queryClient = useAppQueryClient()
	const {data: me} = useCurrentUser()

	const {data: allInterests = []} = useQuery<IInterest[]>({
		queryKey: ['interests'],
		queryFn: () => axios.get('/api/interests').then(res => res.data),
		staleTime: 5 * 60 * 1000,
	})

	const [selected, setSelected] = useState<SelectedInterest[]>([])
	const [seededForUser, setSeededForUser] = useState<string | null>(null)
	const [isSaving, setIsSaving] = useState(false)

	// Сидируем чипы из текущих интересов юзера один раз, когда приходят данные
	// (render-phase с guard'ом — без useEffect и каскадных ре-рендеров).
	const meId = me?._id ?? null
	if (meId && seededForUser !== meId) {
		setSeededForUser(meId)
		setSelected(buildSelectedFromUser(me?.userInterests))
	}

	// Данные для shadcn Combobox (мультиселект): все опции + текущее значение.
	const options: Option[] = allInterests.map(i => ({
		_id: mongoIdString(i._id),
		name: i.name,
	}))
	const value: Option[] = selected.map(s => ({_id: s._id, name: s.name}))

	// Тогл из списка комбобокса: новым даём DEFAULT_WEIGHT, у оставшихся сохраняем вес.
	const handleValueChange = (next: Option[]) => {
		setSelected(prev =>
			next.map(
				opt =>
					prev.find(s => s._id === opt._id) ?? {
						_id: opt._id,
						name: opt.name,
						weight: DEFAULT_WEIGHT,
					},
			),
		)
	}

	const removeInterest = (id: string) => {
		setSelected(prev => prev.filter(s => s._id !== id))
	}

	const setWeight = (id: string, weight: number) => {
		setSelected(prev => prev.map(s => (s._id === id ? {...s, weight} : s)))
	}

	const save = async () => {
		if (!me?._id) {
			toast.error('You must be signed in')
			return
		}
		if (selected.length === 0) {
			toast.error('Add at least one interest')
			return
		}
		setIsSaving(true)
		try {
			const ratings: Record<string, number> = {}
			for (const s of selected) ratings[s._id] = s.weight

			await axios.post('/api/interests', {ratings, userId: me._id})

			// Оптимистично обновляем текущего юзера (тот же паттерн, что на /interests).
			queryClient.setQueryData(CURRENT_USER_KEY, (prev: unknown) => {
				if (!prev || typeof prev !== 'object') return prev
				return {
					...(prev as Record<string, unknown>),
					userInterests: selected.map(s => ({
						userId: me._id,
						interestId: {_id: s._id, name: s.name},
						weight: s.weight,
					})),
				}
			})
			await queryClient.invalidateQueries({queryKey: CURRENT_USER_KEY})
			await queryClient.invalidateQueries({queryKey: ['users']})

			toast.success('Interests updated')
			onSaved?.()
		} catch (err) {
			toast.error(
				axios.isAxiosError(err) && err.response?.data?.error
					? err.response.data.error
					: 'Failed to save interests',
			)
		} finally {
			setIsSaving(false)
		}
	}

	return (
		<div className='flex flex-col gap-3'>
			<div className='flex items-center justify-between'>
				<h2 className='text-sm font-medium text-muted'>Interests</h2>
				<span className='text-xs text-faint'>{selected.length} selected</span>
			</div>

			{/* Поиск + добавление — shadcn Combobox в мультиселекте */}
			<Combobox
				multiple
				items={options}
				value={value}
				onValueChange={handleValueChange}
				itemToStringLabel={(o: Option) => o.name}
				isItemEqualToValue={(a: Option, b: Option) => a._id === b._id}
			>
				<ComboboxInput placeholder='Search interests…' />
				<ComboboxContent>
					<ComboboxEmpty>No interests found</ComboboxEmpty>
					<ComboboxList>
						{(option: Option) => (
							<ComboboxItem key={option._id} value={option}>
								{option.name}
							</ComboboxItem>
						)}
					</ComboboxList>
				</ComboboxContent>
			</Combobox>

			{/* Выбранные интересы: чип + звёзды (вес для матчинга) + удаление */}
			{selected.length > 0 && (
				<div className='flex flex-wrap gap-2'>
					{selected.map(chip => (
						<span
							key={chip._id}
							className='inline-flex items-center gap-2 pl-3 pr-1.5 py-1 rounded-full bg-primary-soft border border-primary/15'
						>
							<span className='text-xs font-medium text-primary capitalize'>
								{chip.name}
							</span>
							<InterestStarRating
								value={chip.weight}
								onChange={n => setWeight(chip._id, n)}
								size={13}
							/>
							<button
								type='button'
								onClick={() => removeInterest(chip._id)}
								aria-label={`Remove ${chip.name}`}
								className='inline-flex items-center justify-center w-4 h-4 rounded-full text-primary hover:bg-primary/15 transition-colors cursor-pointer'
							>
								<X className='w-3 h-3' />
							</button>
						</span>
					))}
				</div>
			)}

			<div>
				<Button type='button' onClick={save} disabled={isSaving}>
					{isSaving ? 'Saving…' : 'Save interests'}
				</Button>
			</div>
		</div>
	)
}
