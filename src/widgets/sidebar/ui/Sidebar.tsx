import {
	CircleUserRound,
	Home,
	LucideIcon,
	MessageCircle,
	Settings,
	Users,
} from 'lucide-react'
import Link from 'next/link'

const Sidebar = () => {
	const ELEMENTS = [
		{
			icon: Home,
			label: 'Dashboard',
			href: '/dashboard',
		},
		{
			icon: CircleUserRound,
			label: 'My profile',
			href: '/users/me',
		},
		{
			icon: Users,
			label: 'Users',
			href: '/users',
		},
		{
			icon: MessageCircle,
			label: 'Messages',
			href: '/messages',
		},
		{
			icon: Settings,
			label: 'Settings',
			href: '/settings',
		},
	]

	return (
		<nav className='flex flex-col gap-1 p-3 bg-surface border border-divider rounded-2xl h-fit'>
			{ELEMENTS.map(
				(element: {icon: LucideIcon; label: string; href: string}) => (
					<Link
						key={element.href}
						href={element.href}
						className='flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted hover:text-primary hover:bg-primary-soft transition-colors'
					>
						{element.icon && <element.icon className='w-5 h-5' />}
						<span>{element.label}</span>
					</Link>
				),
			)}
		</nav>
	)
}

export default Sidebar
