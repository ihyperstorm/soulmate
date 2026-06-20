'use client'

import {loginSchema} from '../model/loginSchema'
import {yupResolver} from '@hookform/resolvers/yup'
import axios from 'axios'
import Link from 'next/link'
import {useRouter} from 'next/navigation'
import {useState} from 'react'
import {useForm} from 'react-hook-form'
import {useAppQueryClient} from '@/shared/api/providers'

type LoginFormData = {
	email: string
	password: string
}

export const SignInForm = () => {
	const [error, setError] = useState<string | null>(null)
	const [success, setSuccess] = useState(false)
	const router = useRouter()
	const queryClient = useAppQueryClient()

	const {
		register,
		handleSubmit,
		formState: {errors, isSubmitting},
	} = useForm<LoginFormData>({
		defaultValues: {
			email: '',
			password: '',
		},
		resolver: yupResolver(loginSchema),
	})

	const onSubmit = async (data: LoginFormData) => {
		setError(null)
		setSuccess(false)

		try {
			await queryClient.setQueryData(['user'], null)
			const response = await axios.post('/api/auth/login', {
				email: data.email,
				password: data.password,
			})
			await queryClient.setQueryData(['user'], response.data.user)
			setSuccess(true)
			router.push('/dashboard')
		} catch (error) {
			await queryClient.invalidateQueries({queryKey: ['user']})
			if (axios.isAxiosError(error) && error.response?.data?.error) {
				setError(error.response.data.error)
			} else {
				setError('Request failed')
			}
		}
	}

	return (
		<div className='w-full max-w-sm bg-surface border border-divider rounded-2xl p-8'>
			<div className='text-center mb-6'>
				<h1 className='text-2xl font-semibold text-ink mb-1'>Welcome back</h1>
				<p className='text-sm text-muted'>Sign in to continue to Soulmate</p>
			</div>
			<form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-3'>
				{error && (
					<p className='text-sm text-danger bg-danger-soft border border-danger/20 rounded-lg px-3 py-2'>
						{error}
					</p>
				)}
				{success && (
					<p className='text-sm text-accent bg-accent-soft border border-accent/20 rounded-lg px-3 py-2'>
						Login successful!
					</p>
				)}
				<div className='flex flex-col gap-1'>
					<label className='text-xs font-medium text-muted'>Email</label>
					<input
						className='bg-surface border border-line rounded-lg px-3 py-2.5 text-sm text-ink placeholder:text-faint focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-soft transition-all'
						type='email'
						placeholder='you@example.com'
						{...register('email')}
					/>
					{errors.email && (
						<p className='text-xs text-danger mt-0.5'>{errors.email.message}</p>
					)}
				</div>
				<div className='flex flex-col gap-1'>
					<label className='text-xs font-medium text-muted'>Password</label>
					<input
						className='bg-surface border border-line rounded-lg px-3 py-2.5 text-sm text-ink placeholder:text-faint focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-soft transition-all'
						type='password'
						placeholder='••••••••'
						{...register('password')}
					/>
					{errors.password && (
						<p className='text-xs text-danger mt-0.5'>
							{errors.password.message}
						</p>
					)}
				</div>
				<button
					type='submit'
					disabled={isSubmitting}
					className='mt-2 inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-primary hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer'
				>
					{isSubmitting ? 'Signing in…' : 'Sign in'}
				</button>
			</form>
			<Link
				href='/signup'
				className='block text-sm text-center mt-5 text-muted hover:text-primary transition-colors'
			>
				Don&apos;t have an account?{' '}
				<span className='text-primary font-medium'>Sign up</span>
			</Link>
		</div>
	)
}
