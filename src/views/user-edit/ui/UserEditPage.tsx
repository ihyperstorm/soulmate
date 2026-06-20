'use client'

import type {IUser} from '@/entities/user'
import {useQuery} from '@tanstack/react-query'
import {useAppQueryClient} from '@/shared/api/providers'
import axios from 'axios'
import Image from 'next/image'
import {useParams, useRouter} from 'next/navigation'
import {useEffect, useState} from 'react'
import toast from 'react-hot-toast'
import {format} from 'date-fns'

/** Для input type="date" — только YYYY-MM-DD; API отдаёт строку/Date. */
function toDateInputValue(value: unknown): string {
	if (value == null || value === '') return ''
	const d = value instanceof Date ? value : new Date(String(value))
	if (Number.isNaN(d.getTime())) return ''
	const m = format(d, 'yyyy-MM-dd')
	return m
}

export default function UserEditPage() {
	const params = useParams<{id: string}>()
	const userId = Array.isArray(params?.id) ? params.id[0] : params?.id
	const router = useRouter()
	const queryClient = useAppQueryClient()

	const {
		data: user,
		isLoading,
		isError,
	} = useQuery<IUser>({
		queryKey: ['user', userId],
		queryFn: () => axios.get(`/api/users/${userId}`).then(res => res.data),
		enabled: Boolean(userId),
	})

	const [username, setUsername] = useState<string>('')
	const [avatarUrl, setAvatarUrl] = useState<string>('')
	const [avatarFile, setAvatarFile] = useState<File | null>(null)
	const [bio, setBio] = useState<string>('')
	const [location, setLocation] = useState<string>('')
	const [birthday, setBirthday] = useState<string>('')
	const [sex, setSex] = useState<string>('')
	useEffect(() => {
		if (!user) return
		setUsername(user.username ?? '')
		setAvatarUrl(user.avatarUrl ?? '')
		setBio(user.bio ?? '')
		setLocation(user.location ?? '')
		setBirthday(toDateInputValue(user.birthday))
		setSex(user.gender ?? '')
	}, [user])

	const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault()
		try {
			const formData = new FormData()
			formData.append('username', username)
			formData.append('bio', bio)
			formData.append('location', location)
			if (birthday.trim()) {
				formData.append('birthday', birthday)
			}
			formData.append('gender', sex)
			if (avatarFile) {
				formData.append('avatar', avatarFile)
			}

			await axios.patch(`/api/users/me`, formData)
			await queryClient.invalidateQueries({queryKey: ['user', userId]})
			toast.success('User updated')
			router.push(`/users/${userId}`)
		} catch (err) {
			console.log('err', err)
			toast.error('Error updating user')
		}
	}

	if (isLoading)
		return (
			<div className='flex justify-center items-center min-h-[60vh] text-sm text-muted'>
				Loading…
			</div>
		)
	if (isError)
		return (
			<div className='flex justify-center items-center py-20 text-sm text-danger'>
				Error: {String(isError)}
			</div>
		)

	const inputClass =
		'bg-surface border border-line rounded-lg px-3 py-2 text-sm text-ink placeholder:text-faint focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-soft transition-all w-full'

	return (
		<div className='py-10'>
			<div className='grid grid-cols-1 md:grid-cols-[20rem_minmax(0,1fr)] gap-8 max-w-5xl mx-auto'>
				<div className='bg-surface border border-divider rounded-2xl p-6 flex flex-col items-center'>
					<div className='relative w-full flex justify-center items-center'>
						<Image
							src={avatarUrl || '/9dba1c75826cde0e6cf64a5a8fd25bf6.jpg'}
							alt='avatar'
							width={300}
							height={300}
							className='rounded-2xl object-cover w-64 h-64'
						/>
					</div>
					<label
						htmlFor='avatarUrl'
						className='mt-4 inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium text-ink bg-surface-muted hover:bg-divider transition-colors cursor-pointer'
					>
						Change photo
						<input
							type='file'
							id='avatarUrl'
							name='avatar'
							className='sr-only'
							accept='image/*'
							onChange={e => {
								const file = e.target.files?.[0]
								if (file) {
									setAvatarFile(file)
									setAvatarUrl(URL.createObjectURL(file))
								}
							}}
						/>
					</label>
				</div>
				<div className='bg-surface border border-divider rounded-2xl p-6 md:p-8'>
					<h1 className='text-2xl font-semibold text-ink mb-6'>Edit profile</h1>
					<form onSubmit={onSubmit} className='flex flex-col gap-4'>
						<div className='flex flex-col gap-1'>
							<label htmlFor='username' className='text-xs font-medium text-muted'>
								Username
							</label>
							<input
								type='text'
								id='username'
								name='username'
								value={username}
								onChange={e => setUsername(e.target.value)}
								className={inputClass}
							/>
						</div>
						<div className='flex flex-col gap-1'>
							<label htmlFor='bio' className='text-xs font-medium text-muted'>
								Bio
							</label>
							<textarea
								id='bio'
								name='bio'
								value={bio}
								onChange={e => setBio(e.target.value)}
								className={`${inputClass} resize-none h-24`}
							/>
						</div>
						<div className='flex flex-col gap-1'>
							<label htmlFor='location' className='text-xs font-medium text-muted'>
								Location
							</label>
							<input
								type='text'
								id='location'
								name='location'
								value={location}
								onChange={e => setLocation(e.target.value)}
								className={inputClass}
							/>
						</div>
						<div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
							<div className='flex flex-col gap-1'>
								<label htmlFor='birthday' className='text-xs font-medium text-muted'>
									Birthday
								</label>
								<input
									type='date'
									id='birthday'
									name='birthday'
									value={birthday}
									onChange={e => setBirthday(e.target.value)}
									className={inputClass}
								/>
							</div>
							<div className='flex flex-col gap-1'>
								<label htmlFor='gender' className='text-xs font-medium text-muted'>
									Gender
								</label>
								<input
									type='text'
									id='gender'
									name='gender'
									value={sex}
									onChange={e => setSex(e.target.value)}
									className={inputClass}
								/>
							</div>
						</div>
						<div className='flex gap-2 mt-2'>
							<button
								className='inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium text-white bg-primary hover:bg-primary-hover transition-colors cursor-pointer'
								type='submit'
							>
								Save changes
							</button>
							<button
								className='inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium text-muted bg-surface border border-line hover:bg-surface-muted transition-colors cursor-pointer'
								type='button'
								onClick={() => router.back()}
							>
								Cancel
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	)
}
