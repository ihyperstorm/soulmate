'use client'
import {Users} from '@/widgets/users-list'
import {Sidebar} from '@/widgets/sidebar'

export default function UsersPage() {
	return (
		<div className='grid grid-cols-[11rem_minmax(0,1fr)_minmax(0,1fr)] gap-4 py-10'>
			<Sidebar />
			<Users />
		</div>
	)
}
