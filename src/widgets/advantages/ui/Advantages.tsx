import {HandshakeIcon, MessageCircleIcon, SmileIcon} from 'lucide-react'
import {useTranslations} from 'next-intl'

const items = [
	{key: 'match', Icon: SmileIcon},
	{key: 'conversations', Icon: MessageCircleIcon},
	{key: 'connections', Icon: HandshakeIcon},
] as const

const Advantages = () => {
	const t = useTranslations('home.advantages')

	return (
		<section className='w-full grid grid-cols-1 md:grid-cols-3 gap-4 px-6 pb-20'>
			{items.map(({Icon, key}) => (
				<div
					key={key}
					className='bg-surface border border-divider rounded-2xl p-6 flex flex-col items-start gap-3 transition-colors hover:border-line'
				>
					<div className='w-10 h-10 rounded-xl bg-primary-soft flex items-center justify-center'>
						<Icon className='w-5 h-5 text-primary' />
					</div>
					<h3 className='text-base font-semibold text-ink'>{t(`${key}.title`)}</h3>
					<p className='text-sm text-muted leading-relaxed'>
						{t(`${key}.description`)}
					</p>
				</div>
			))}
		</section>
	)
}

export default Advantages
