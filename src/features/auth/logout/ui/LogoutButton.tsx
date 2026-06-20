'use client'

import axios from 'axios'
import {useRouter} from 'next/navigation'
import {useState} from 'react'
import {LogOut} from 'lucide-react'
import {useAppQueryClient} from '@/shared/api/providers'

export const LogoutButton = () => {
	const router = useRouter()
	const queryClient = useAppQueryClient()
	const [isLoading, setIsLoading] = useState(false)

	const logoutHandler = async () => {
		setIsLoading(true)
		queryClient.setQueryData(['user'], null)

		try {
			await axios.post('/api/auth/logout')
			await queryClient.cancelQueries({queryKey: ['user']})
			router.replace('/signin')
		} catch {
			await queryClient.invalidateQueries({queryKey: ['user']})
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<button
			className='inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-danger transition-colors px-3 py-2 rounded-lg hover:bg-surface-muted cursor-pointer disabled:opacity-50'
			onClick={logoutHandler}
			disabled={isLoading}
		>
			<LogOut className='w-4 h-4' />
			{isLoading ? 'Signing out...' : 'Sign out'}
		</button>
	)
}
