'use client'
import {Advantages} from '@/widgets/advantages'
import {Hero} from '@/widgets/hero'

export default function HomePage() {
	return (
		<div className='w-full'>
			<div className='max-w-6xl mx-auto flex flex-col'>
				<Hero />
				<Advantages />
			</div>
		</div>
	)
}
