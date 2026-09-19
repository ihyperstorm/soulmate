'use client'

import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import axios from 'axios'
import {useTranslations} from 'next-intl'
import Link from 'next/link'
import {useState} from 'react'

export const ForgotPasswordForm = () => {
	const t = useTranslations('auth.forgotPassword')
	const tFields = useTranslations('auth.fields')
	const tCommon = useTranslations('common')

	const [email, setEmail] = useState('')
	const [isSending, setIsSending] = useState(false)
	const [isSent, setIsSent] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		setError(null)
		setIsSending(true)
		try {
			await axios.post('/api/auth/forgot-password', {email})
			setIsSent(true)
		} catch {
			setError(tCommon('requestFailed'))
		} finally {
			setIsSending(false)
		}
	}

	// Формулировка нарочно не подтверждает, что адрес существует: сервер
	// отвечает одинаково в обоих случаях, и текст не должен это выдавать.
	if (isSent) {
		return (
			<div className='w-full max-w-sm mx-auto'>
				<h1 className='text-2xl font-semibold text-ink mb-2'>{t('sentTitle')}</h1>
				<p className='text-sm text-subtle'>{t('sentText')}</p>
				<Link
					href='/signin'
					className='block text-sm text-center mt-6 text-subtle hover:text-primary transition-colors'
				>
					{t('backToSignIn')}
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
					<label htmlFor='email' className='text-xs font-medium text-subtle'>
						{tFields('email')}
					</label>
					<Input
						id='email'
						type='email'
						autoComplete='email'
						placeholder={tFields('emailPlaceholder')}
						value={email}
						onChange={e => setEmail(e.target.value)}
						required
					/>
				</div>

				{error && <p className='text-sm text-danger'>{error}</p>}

				<Button type='submit' disabled={isSending || !email} className='w-full'>
					{isSending ? t('submitting') : t('submit')}
				</Button>
			</form>

			<Link
				href='/signin'
				className='block text-sm text-center mt-5 text-subtle hover:text-primary transition-colors'
			>
				{t('backToSignIn')}
			</Link>
		</div>
	)
}
