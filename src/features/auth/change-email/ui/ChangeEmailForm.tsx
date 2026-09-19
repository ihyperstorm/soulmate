'use client'

import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {CURRENT_USER_KEY, useCurrentUser} from '@/entities/user'
import {useAppQueryClient} from '@/shared/api/providers'
import axios from 'axios'
import {useTranslations} from 'next-intl'
import {useState} from 'react'
import toast from 'react-hot-toast'

export const ChangeEmailForm = () => {
	const t = useTranslations('settings')
	const tCommon = useTranslations('common')
	const queryClient = useAppQueryClient()
	const {data: me} = useCurrentUser()

	const [email, setEmail] = useState('')
	const [currentPassword, setCurrentPassword] = useState('')
	const [isSaving, setIsSaving] = useState(false)

	const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		setIsSaving(true)
		try {
			await axios.patch('/api/auth/email', {email, currentPassword})
			setEmail('')
			setCurrentPassword('')
			await queryClient.invalidateQueries({queryKey: CURRENT_USER_KEY})
			toast.success(t('emailChanged'))
		} catch (error) {
			toast.error(
				axios.isAxiosError(error) && error.response?.data?.error
					? error.response.data.error
					: tCommon('requestFailed'),
			)
		} finally {
			setIsSaving(false)
		}
	}

	return (
		<form onSubmit={onSubmit} className='flex flex-col gap-3 max-w-sm'>
			<p className='text-xs text-faint'>
				{t('currentEmail', {email: me?.email ?? '—'})}
			</p>

			<div className='flex flex-col gap-1'>
				<label htmlFor='newEmail' className='text-xs font-medium text-subtle'>
					{t('newEmail')}
				</label>
				<Input
					id='newEmail'
					type='email'
					autoComplete='email'
					value={email}
					onChange={e => setEmail(e.target.value)}
				/>
			</div>

			<div className='flex flex-col gap-1'>
				<label
					htmlFor='emailCurrentPassword'
					className='text-xs font-medium text-subtle'
				>
					{t('currentPassword')}
				</label>
				<Input
					id='emailCurrentPassword'
					type='password'
					autoComplete='current-password'
					value={currentPassword}
					onChange={e => setCurrentPassword(e.target.value)}
				/>
			</div>

			<div>
				<Button
					type='submit'
					disabled={isSaving || !email || !currentPassword}
					variant='outline'
				>
					{isSaving ? t('emailSaving') : t('emailSubmit')}
				</Button>
			</div>
		</form>
	)
}
