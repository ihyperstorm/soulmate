'use client'

import {Star} from 'lucide-react'

type Props = {
	/** 0 = не выбрано, 1–5 */
	value: number
	onChange: (value: number) => void
	size?: number
}

export function InterestStarRating({value, onChange, size = 24}: Props) {
	const clamped = Math.min(5, Math.max(0, Math.floor(value)))

	return (
		<div
			className='flex gap-0.5 items-center justify-center'
			role='group'
			aria-label='Rating'
		>
			{[1, 2, 3, 4, 5].map(n => (
				<button
					key={n}
					type='button'
					className='p-0.5 rounded transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-soft cursor-pointer'
					aria-pressed={n <= clamped}
					aria-label={`${n} of 5 stars`}
					onClick={() => onChange(n)}
				>
					<Star
						size={size}
						strokeWidth={1.5}
						className={
							n <= clamped
								? 'fill-amber-400 text-amber-400'
								: 'fill-transparent text-faint'
						}
					/>
				</button>
			))}
		</div>
	)
}
