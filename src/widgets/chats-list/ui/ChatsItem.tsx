import Image from 'next/image'

type Props = {
	avatar: string
	name: string
	onClick: () => void
	unreadCount: number
}

const ChatsItem = ({avatar, name, unreadCount, onClick}: Props) => {
	return (
		<button
			type='button'
			onClick={onClick}
			className='flex items-center gap-3 hover:bg-surface-muted rounded-xl p-2 cursor-pointer transition-colors text-left'
		>
			<Image
				src={avatar}
				alt='avatar'
				width={100}
				height={100}
				className='rounded-full object-cover w-10 h-10'
			/>
			<div className='flex items-center justify-between gap-2 flex-1 min-w-0'>
				<span className='text-sm font-medium text-ink truncate'>{name}</span>
				{unreadCount > 0 && (
					<span className='shrink-0 min-w-5 h-5 px-1.5 rounded-full bg-primary text-white text-[11px] font-semibold flex items-center justify-center'>
						{unreadCount > 99 ? '99+' : unreadCount}
					</span>
				)}
			</div>
		</button>
	)
}

export default ChatsItem
