'use client'

import {InterestStarRating} from '@/entities/interest'
import {CURRENT_USER_KEY} from '@/entities/user'
import {createInterestsSchema} from '@/features/interest/rate-interests'
import {yupResolver} from '@hookform/resolvers/yup'
import {mongoIdString} from '@/shared/lib/mongoId'
import {useAppQueryClient} from '@/shared/api/providers'
import axios from 'axios'
import {useTranslations} from 'next-intl'
import {useRouter} from 'next/navigation'
import {useEffect, useMemo, useState} from 'react'
import {FieldErrors, Resolver, useForm} from 'react-hook-form'
import toast from 'react-hot-toast'

type Interest = {
	_id: string
	name: string
	weight: number
}

type InterestsFormData = {
	interests: string[]
	ratings: Record<string, number>
}

export default function InterestsPage() {
	const [interests, setInterests] = useState<Interest[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const router = useRouter()
	const queryClient = useAppQueryClient()
	const t = useTranslations('interests')
	const tValidation = useTranslations('validation')

	const {
		handleSubmit,
		setValue,
		getValues,
		clearErrors,
		reset,
		formState: {isSubmitting},
	} = useForm<InterestsFormData>({
		defaultValues: {
			interests: [],
			ratings: {},
		},
		resolver: yupResolver(
			createInterestsSchema(tValidation),
		) as Resolver<InterestsFormData>,
	})

	const [ratings, setRatings] = useState<Record<string, number>>({})

	const selectedCount = useMemo(
		() =>
			Object.values(ratings).filter(w => typeof w === 'number' && w >= 1 && w <= 5)
				.length,
		[ratings],
	)

	const canContinue = selectedCount >= 3 && selectedCount <= 10 && !isSubmitting

	useEffect(() => {
		const fetchInterests = async () => {
			try {
				setIsLoading(true)
				const response = await axios.get('/api/interests')
				const raw = (response.data || []) as Interest[]
				setInterests(
					raw.map(item => ({
						...item,
						_id: mongoIdString(item._id),
					})),
				)
			} catch (err) {
				console.error('Error fetching interests:', err)
				if (axios.isAxiosError(err) && err.response?.data?.error) {
					setError(err.response.data.error)
				} else {
					setError(t('loadError'))
				}
			} finally {
				setIsLoading(false)
			}
		}
		fetchInterests()
	}, [t])

	useEffect(() => {
		setValue('ratings', ratings, {
			shouldValidate: false,
			shouldDirty: true,
		})
		const selectedInterestNames = interests
			.filter(item => {
				const r = ratings[mongoIdString(item._id)]
				return typeof r === 'number' && r >= 1 && r <= 5
			})
			.map(item => item.name)
		setValue('interests', selectedInterestNames, {
			shouldValidate: false,
			shouldDirty: true,
		})
	}, [ratings, interests, setValue])

	const onSubmit = async () => {
		setError(null)
		// Локальный state — единственный надёжный источник: setValue('ratings') внутри setState
		// иногда не попадает в data при submit из-за порядка обновлений RHF.
		const merged = {
			...getValues('ratings'),
			...ratings,
		}
		const ratingsPayload: Record<string, number> = {}
		for (const [k, v] of Object.entries(merged)) {
			const id = mongoIdString(k)
			if (!id || typeof v !== 'number' || v < 1 || v > 5) {
				continue
			}
			ratingsPayload[id] = v
		}

		const ratedCount = Object.keys(ratingsPayload).length
		if (ratedCount === 0) {
			if (process.env.NODE_ENV === 'development') {
				console.debug('[interests] submit: no ids in 1..5 range', {
					ratingsState: ratings,
					ratingsFromForm: getValues('ratings'),
					merged,
					ratingsPayload,
				})
			}
			toast.error(t('rateAtLeastOne'))
			return
		}
		if (ratedCount < 3) {
			toast.error(tValidation('interestsMin'))
			return
		}
		if (ratedCount > 10) {
			toast.error(tValidation('interestsMax'))
			return
		}
		// Получаем userId из localStorage
		const userId = localStorage.getItem('userId')

		if (!userId) {
			setError(t('mustBeLoggedIn'))
			return
		}

		try {
			// Сервер берёт список интересов из ключей ratings (ObjectId), не из имён —
			// иначе при рассинхроне id/имя сохранялся бы один интерес.
			await axios.post('/api/interests', {
				ratings: ratingsPayload,
				userId: userId,
			})

			const optimisticUserInterests = Object.entries(ratingsPayload).map(
				([interestId, weight]) => {
					const name =
						interests.find(i => mongoIdString(i._id) === interestId)?.name ?? ''
					return {
						userId,
						interestId: {_id: interestId, name},
						weight,
					}
				},
			)

			queryClient.setQueryData(CURRENT_USER_KEY, (prev: unknown) => {
				if (!prev || typeof prev !== 'object') return prev
				return {
					...(prev as Record<string, unknown>),
					userInterests: optimisticUserInterests,
				}
			})
			await queryClient.invalidateQueries({queryKey: CURRENT_USER_KEY})
			await queryClient.invalidateQueries({queryKey: ['users']})

			toast.success(t('saved'))

			router.push('/dashboard')
		} catch (err) {
			console.error('Error saving interests:', err)
			if (axios.isAxiosError(err) && err.response?.data?.error) {
				setError(err.response.data.error)
			} else {
				setError(t('saveError'))
			}
		} finally {
			setIsLoading(false)
		}
	}

	const onInvalid = (formErrors: FieldErrors<InterestsFormData>) => {
		const interestsMsg = formErrors.interests?.message
		if (typeof interestsMsg === 'string') {
			toast.error(interestsMsg)
		}
		if (typeof formErrors.ratings?.message === 'string') {
			toast.error(formErrors.ratings.message)
		}
	}

	const handleRating = (interestId: string, weight: number) => {
		const idKey = mongoIdString(interestId)
		setRatings(prev => {
			const wasRated =
				typeof prev[idKey] === 'number' && prev[idKey] >= 1 && prev[idKey] <= 5
			const countBefore = Object.values(prev).filter(
				w => typeof w === 'number' && w >= 1 && w <= 5,
			).length
			if (!wasRated && countBefore >= 10) {
				queueMicrotask(() => toast.error(tValidation('interestsMax')))
				return prev
			}
			return {...prev, [idKey]: weight}
		})
	}

	const handleReset = () => {
		setRatings({})
		reset({interests: [], ratings: {}})
		clearErrors()
	}

	if (isLoading) {
		return (
			<div className='flex flex-col items-center justify-center min-h-screen bg-background'>
				<p className='text-sm text-muted animate-pulse'>{t('loading')}</p>
			</div>
		)
	}

	if (error) {
		return (
			<div className='flex flex-col items-center justify-center min-h-screen bg-background'>
				<p className='text-sm text-danger'>{t('errorPrefix', {message: error})}</p>
			</div>
		)
	}

	return (
		<div className='flex flex-col items-center justify-center min-h-screen bg-background py-12 px-4'>
			<div className='w-full max-w-3xl bg-surface border border-divider rounded-2xl p-8 md:p-10'>
				<div className='mb-6'>
					<h1 className='text-2xl md:text-3xl font-semibold text-ink mb-1'>
						{t('title')}
					</h1>
					<p className='text-sm text-muted'>{t('subtitle')}</p>
				</div>
				<div className='flex items-center gap-2 mb-6'>
					<span className='inline-flex items-center px-2.5 py-0.5 rounded-full bg-primary-soft text-primary text-xs font-medium'>
						{t('selectedCount', {count: selectedCount})}
					</span>
					{selectedCount < 3 && (
						<span className='text-xs text-faint'>{t('atLeastThree')}</span>
					)}
				</div>
				<form onSubmit={handleSubmit(onSubmit, onInvalid)} className='w-full'>
					<div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-8'>
						{interests.map(interest => {
							const id = mongoIdString(interest._id)
							const isSelected = ratings[id] >= 1 && ratings[id] <= 5

							return (
								<div
									className={`border rounded-xl p-4 flex flex-col gap-3 items-center justify-center transition-colors ${
										isSelected
											? 'border-primary bg-primary-soft'
											: 'border-divider bg-surface hover:border-line'
									}`}
									key={id}
								>
									<span className='text-sm font-medium text-ink capitalize'>
										{interest.name}
									</span>
									<InterestStarRating
										value={
											ratings[id] ??
											(typeof interest.weight === 'number' &&
											interest.weight >= 1 &&
											interest.weight <= 5
												? interest.weight
												: 0)
										}
										onChange={n => handleRating(id, n)}
										size={22}
									/>
								</div>
							)
						})}
					</div>
					<div className='flex gap-3'>
						<button
							type='submit'
							disabled={!canContinue}
							className='flex-1 inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-primary hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer'
						>
							{isSubmitting ? t('saving') : t('continue')}
						</button>
						<button
							type='button'
							onClick={handleReset}
							className='inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-medium text-muted bg-surface border border-line hover:bg-surface-muted transition-colors cursor-pointer'
						>
							{t('reset')}
						</button>
					</div>
				</form>
			</div>
		</div>
	)
}
