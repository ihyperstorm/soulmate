'use client'

import {Button} from '@/components/ui/button'
import {CURRENT_USER_KEY} from '@/entities/user'
import {useAppQueryClient} from '@/shared/api/providers'
import axios from 'axios'
import {useTranslations} from 'next-intl'
import {useState} from 'react'
import toast from 'react-hot-toast'

/**
 * Отзывает все refresh-сессии пользователя, включая текущую.
 *
 * Отдельно от обычного «Выйти» намеренно: там правильное поведение — выйти
 * только здесь, оставив телефон залогиненным. Эта кнопка нужна для другого
 * сценария («забыл выйти на чужом компьютере», «угнали аккаунт»), поэтому
 * живёт в настройках, где её сложнее нажать случайно.
 */
export const LogoutEverywhereButton = () => {
	const t = useTranslations('settings')
	const queryClient = useAppQueryClient()
	const [isLoading, setIsLoading] = useState(false)

	const logoutEverywhere = async () => {
		setIsLoading(true)
		try {
			await axios.post('/api/auth/logout', {all: true})
			queryClient.setQueryData(CURRENT_USER_KEY, null)
			// Полная навигация, а не router.replace: сессия мертва, и в кэше
			// react-query остались данные, которые больше нельзя перезапросить.
			window.location.replace('/signin')
		} catch {
			toast.error(t('logoutEverywhereError'))
			setIsLoading(false)
		}
	}

	return (
		<Button variant='outline' onClick={logoutEverywhere} disabled={isLoading}>
			{isLoading ? t('logoutEverywhereLoading') : t('logoutEverywhere')}
		</Button>
	)
}
