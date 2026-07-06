'use client'
import {Advantages} from '@/widgets/advantages'
import {Footer} from '@/widgets/footer'
import {Header} from '@/widgets/header'
import {Hero} from '@/widgets/hero'

export default function HomePage() {
	return (
		<div className='min-h-screen flex flex-col'>
			<Header />
			<main className='flex-1'>
				<div className='max-w-6xl mx-auto flex flex-col'>
					<Hero />
					<Advantages />
				</div>
			</main>
			<Footer />
		</div>
	)
}
