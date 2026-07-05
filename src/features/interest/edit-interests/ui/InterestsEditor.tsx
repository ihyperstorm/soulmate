'use client'

import {InterestStarRating} from '@/entities/interest'
import type {IInterest, PopulatedUserInterest} from '@/entities/interest'
import {CURRENT_USER_KEY, useCurrentUser} from '@/entities/user'
import {useAppQueryClient} from '@/shared/api/providers'
import {mongoIdString} from '@/shared/lib/mongoId'
import {useQuery} from '@tanstack/react-query'
import axios from 'axios'
import {Search, X} from 'lucide-react'
import {useEffect, useMemo, useRef, useState} from 'react'
import toast from 'react-hot-toast'

// Вес (1–5) нужен матчингу (calculateMatch) — у каждого чипа свои звёзды.
// Новый интерес стартует с нейтрального DEFAULT_WEIGHT, дальше юзер правит звёздами.
const DEFAULT_WEIGHT = 3
const MAX_RESULTS = 50

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
	const [query, setQuery] = useState('')
	const [open, setOpen] = useState(false)
	const [highlight, setHighlight] = useState(0)
	const [isSaving, setIsSaving] = useState(false)
	const boxRef = useRef<HTMLDivElement>(null)

	// Сидируем чипы из текущих интересов юзера один раз, когда приходят данные.
	// Делаем это в фазе рендера с guard'ом (а не в useEffect) — рекомендованный React-
	// паттерн инициализации стейта из данных без каскадных ре-рендеров.
	const meId = me?._id ?? null
	if (meId && seededForUser !== meId) {
		setSeededForUser(meId)
		setSelected(buildSelectedFromUser(me?.userInterests))
	}

	const selectedIds = useMemo(
		() => new Set(selected.map(s => s._id)),
		[selected],
	)

	// Доступные для добавления: все интересы минус уже выбранные, отфильтрованные запросом.
	const matches = useMemo<Option[]>(() => {
		const q = query.trim().toLowerCase()
		return allInterests
			.map(i => ({_id: mongoIdString(i._id), name: i.name}))
			.filter(o => !selectedIds.has(o._id) && (q === '' || o.name.toLowerCase().includes(q)))
			.slice(0, MAX_RESULTS)
	}, [allInterests, selectedIds, query])

	// Клик вне компонента — закрыть выпадашку.
	useEffect(() => {
		const onMouseDown = (e: MouseEvent) => {
			if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
				setOpen(false)
			}
		}
		document.addEventListener('mousedown', onMouseDown)
		return () => document.removeEventListener('mousedown', onMouseDown)
	}, [])

	const addInterest = (option: Option) => {
		setSelected(prev =>
			prev.some(s => s._id === option._id)
				? prev
				: [...prev, {...option, weight: DEFAULT_WEIGHT}],
		)
		setQuery('')
		setHighlight(0)
	}

	const removeInterest = (id: string) => {
		setSelected(prev => prev.filter(s => s._id !== id))
	}

	const setWeight = (id: string, weight: number) => {
		setSelected(prev => prev.map(s => (s._id === id ? {...s, weight} : s)))
	}

	const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'ArrowDown') {
			e.preventDefault()
			setOpen(true)
			setHighlight(h => Math.min(h + 1, matches.length - 1))
		} else if (e.key === 'ArrowUp') {
			e.preventDefault()
			setHighlight(h => Math.max(h - 1, 0))
		} else if (e.key === 'Enter') {
			e.preventDefault()
			const option = matches[highlight]
			if (option) addInterest(option)
		} else if (e.key === 'Escape') {
			setOpen(false)
		} else if (e.key === 'Backspace' && query === '' && selected.length > 0) {
			// Backspace в пустом инпуте удаляет последний чип — привычное поведение.
			removeInterest(selected[selected.length - 1]._id)
		}
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

			{/* Поиск: добавление интересов */}
			<div ref={boxRef} className='relative'>
				<div className='flex items-center gap-2 bg-surface border border-line rounded-lg px-3 py-2 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary-soft transition-all'>
					<Search className='w-4 h-4 text-faint shrink-0' />
					<input
						value={query}
						onChange={e => {
							setQuery(e.target.value)
							setOpen(true)
							setHighlight(0)
						}}
						onFocus={() => setOpen(true)}
						onKeyDown={onKeyDown}
						placeholder={selected.length ? 'Add more…' : 'Search interests…'}
						className='flex-1 bg-transparent text-sm text-ink placeholder:text-faint focus:outline-none py-0.5'
						role='combobox'
						aria-expanded={open}
						aria-controls='interests-listbox'
					/>
				</div>

				{open && matches.length > 0 && (
					<ul
						id='interests-listbox'
						role='listbox'
						className='absolute z-20 mt-1 w-full max-h-60 overflow-auto bg-surface border border-divider rounded-lg shadow-lg py-1'
					>
						{matches.map((option, index) => (
							<li
								key={option._id}
								role='option'
								aria-selected={index === highlight}
								// onMouseDown, чтобы добавить ДО того как input потеряет фокус (blur).
								onMouseDown={e => {
									e.preventDefault()
									addInterest(option)
								}}
								onMouseEnter={() => setHighlight(index)}
								className={`px-3 py-2 text-sm cursor-pointer transition-colors ${
									index === highlight
										? 'bg-primary-soft text-primary'
										: 'text-ink hover:bg-surface-muted'
								}`}
							>
								{option.name}
							</li>
						))}
					</ul>
				)}

				{open && query.trim() !== '' && matches.length === 0 && (
					<div className='absolute z-20 mt-1 w-full bg-surface border border-divider rounded-lg shadow-lg px-3 py-2 text-sm text-muted'>
						No interests found
					</div>
				)}
			</div>

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
				<button
					type='button'
					onClick={save}
					disabled={isSaving}
					className='inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium text-white bg-primary hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer'
				>
					{isSaving ? 'Saving…' : 'Save interests'}
				</button>
			</div>
		</div>
	)
}
