'use client'

import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import axios from 'axios'
import {useTranslations} from 'next-intl'
import {useState} from 'react'
import toast from 'react-hot-toast'

const MIN_PASSWORD_LENGTH = 8

export const ChangePasswordForm = () => {
	const t = useTranslations('settings')
	const tCommon = useTranslations('common')

	const [currentPassword, setCurrentPassword] = useState('')
	const [newPassword, setNewPassword] = useState('')
	const [isSaving, setIsSaving] = useState(false)

	const canSubmit =
		currentPassword.length > 0 &&
		newPassword.length >= MIN_PASSWORD_LENGTH &&
		!isSaving

	const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		setIsSaving(true)
		try {
			await axios.patch('/api/auth/password', {currentPassword, newPassword})
			setCurrentPassword('')
			setNewPassword('')
			// Остальные устройства разлогинены сервером, текущее получило новую
			// пару токенов — здесь ничего перезагружать не нужно.
			toast.success(t('passwordChanged'))
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
			<div className='flex flex-col gap-1'>
				<label htmlFor='currentPassword' className='text-xs font-medium text-subtle'>
					{t('currentPassword')}
				</label>
				<Input
					id='currentPassword'
					type='password'
					autoComplete='current-password'
					value={currentPassword}
					onChange={e => setCurrentPassword(e.target.value)}
				/>
			</div>

			<div className='flex flex-col gap-1'>
				<label htmlFor='newPassword' className='text-xs font-medium text-subtle'>
					{t('newPassword')}
				</label>
				<Input
					id='newPassword'
					type='password'
					autoComplete='new-password'
					value={newPassword}
					onChange={e => setNewPassword(e.target.value)}
				/>
				<p className='text-xs text-faint'>
					{t('passwordHint', {min: MIN_PASSWORD_LENGTH})}
				</p>
			</div>

			<div>
				<Button type='submit' disabled={!canSubmit}>
					{isSaving ? t('passwordSaving') : t('passwordSubmit')}
				</Button>
			</div>
		</form>
	)
}
