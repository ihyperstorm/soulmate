'use client'

import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import axios from 'axios'
import {useTranslations} from 'next-intl'
import Link from 'next/link'
import {useSearchParams} from 'next/navigation'
import {useState} from 'react'

const MIN_PASSWORD_LENGTH = 8

export const ResetPasswordForm = () => {
	const t = useTranslations('auth.resetPassword')
	const tCommon = useTranslations('common')
	const searchParams = useSearchParams()
	const token = searchParams.get('token') ?? ''

	const [password, setPassword] = useState('')
	const [isSaving, setIsSaving] = useState(false)
	const [isDone, setIsDone] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		setError(null)
		setIsSaving(true)
		try {
			await axios.post('/api/auth/reset-password', {token, password})
			setIsDone(true)
		} catch (err) {
			setError(
				axios.isAxiosError(err) && err.response?.data?.error
					? err.response.data.error
					: tCommon('requestFailed'),
			)
		} finally {
			setIsSaving(false)
		}
	}

	// Без токена форму показывать незачем — ссылку открыли руками или обрезали.
	if (!token) {
		return (
			<div className='w-full max-w-sm mx-auto'>
				<h1 className='text-2xl font-semibold text-ink mb-2'>{t('noTokenTitle')}</h1>
				<p className='text-sm text-subtle'>{t('noTokenText')}</p>
				<Link
					href='/forgot-password'
					className='block text-sm text-center mt-6 text-primary font-medium hover:underline'
				>
					{t('requestNew')}
				</Link>
			</div>
		)
	}

	if (isDone) {
		return (
			<div className='w-full max-w-sm mx-auto'>
				<h1 className='text-2xl font-semibold text-ink mb-2'>{t('doneTitle')}</h1>
				<p className='text-sm text-subtle'>{t('doneText')}</p>
				<Link
					href='/signin'
					className='block text-sm text-center mt-6 text-primary font-medium hover:underline'
				>
					{t('goToSignIn')}
				</Link>
			</div>
		)
	}

	return (
		<div className='w-full max-w-sm mx-auto'>
			<h1 className='text-2xl font-semibold text-ink mb-1'>{t('title')}</h1>
			<p className='text-sm text-subtle mb-6'>{t('subtitle')}</p>

			<form onSubmit={onSubmit} className='flex flex-col gap-4'>
				<div className='flex flex-col gap-1'>
					<label htmlFor='password' className='text-xs font-medium text-subtle'>
						{t('newPassword')}
					</label>
					<Input
						id='password'
						type='password'
						autoComplete='new-password'
						value={password}
						onChange={e => setPassword(e.target.value)}
						required
					/>
					<p className='text-xs text-faint'>
						{t('passwordHint', {min: MIN_PASSWORD_LENGTH})}
					</p>
				</div>

				{error && <p className='text-sm text-danger'>{error}</p>}

				<Button
					type='submit'
					disabled={isSaving || password.length < MIN_PASSWORD_LENGTH}
					className='w-full'
				>
					{isSaving ? t('submitting') : t('submit')}
				</Button>
			</form>
		</div>
	)
}
