import {HandshakeIcon, MessageCircleIcon, SmileIcon} from 'lucide-react'

const items = [
	{
		Icon: SmileIcon,
		title: 'Perfect match',
		desc: 'Discover people who naturally align with your interests and vibe.',
	},
	{
		Icon: MessageCircleIcon,
		title: 'Interesting conversations',
		desc: 'Skip small talk and dive straight into what really matters to you.',
	},
	{
		Icon: HandshakeIcon,
		title: 'Real connections',
		desc: 'Build genuine relationships, online and beyond the screen.',
	},
]

const Advantages = () => {
	return (
		<section className='w-full grid grid-cols-1 md:grid-cols-3 gap-4 px-6 pb-20'>
			{items.map(({Icon, title, desc}) => (
				<div
					key={title}
					className='bg-surface border border-divider rounded-2xl p-6 flex flex-col items-start gap-3 transition-colors hover:border-line'
				>
					<div className='w-10 h-10 rounded-xl bg-primary-soft flex items-center justify-center'>
						<Icon className='w-5 h-5 text-primary' />
					</div>
					<h3 className='text-base font-semibold text-ink'>{title}</h3>
					<p className='text-sm text-muted leading-relaxed'>{desc}</p>
				</div>
			))}
		</section>
	)
}

export default Advantages
