'use client'
import {Sidebar} from '@/widgets/sidebar'
import type {IInterest, IUserInterest} from '@/entities/interest'
import {useQuery} from '@tanstack/react-query'
import axios from 'axios'
import Image from 'next/image'
import {useParams, useRouter} from 'next/navigation'

interface IUser {
	_id: string
	username: string
	email: string
	avatarUrl: string
	bio: string
	location: string
	birthday: Date
	gender: string
	createdAt: string
	updatedAt: string
	interests: IInterest[]
	userInterests: UserInterestWithName[]
}

type UserInterestWithName = IUserInterest & {
	interestId: string | {_id: string; name: string} | null
}

export default function UserDetailPage() {
	const params = useParams<{id: string}>()
	const userId = Array.isArray(params?.id) ? params.id[0] : params?.id
	const router = useRouter()

	const {
		data: user,
		isLoading,
		isError,
	} = useQuery<IUser>({
		queryKey: ['user', userId],
		queryFn: () => axios.get(`/api/users/${userId}`).then(res => res.data),
		enabled: Boolean(userId),
	})

	const {data: me} = useQuery<IUser>({
		queryKey: ['me'],
		queryFn: () => axios.get('/api/users/me').then(res => res.data),
	})

	const isOnline = true
	const createdAt = user?.createdAt
		? new Date(user.createdAt).toLocaleDateString()
		: 'N/A'

	if (isLoading)
		return (
			<div className='flex justify-center items-center min-h-[60vh]'>
				<div className='w-8 h-8 border-2 border-line border-t-primary rounded-full animate-spin'></div>
			</div>
		)

	if (isError)
		return (
			<div className='flex justify-center items-center py-20 text-sm text-danger'>
				Error. Please try again later.
			</div>
		)

	return (
		<div className='flex gap-4 py-10'>
			<Sidebar />
			<div className='flex-1 bg-surface border border-divider rounded-2xl p-6 md:p-8'>
				<div className='flex flex-col md:flex-row gap-6 md:gap-8'>
					<div className='shrink-0 flex justify-center'>
						<Image
							src={user?.avatarUrl || '/9dba1c75826cde0e6cf64a5a8fd25bf6.jpg'}
							alt='avatar'
							width={300}
							height={300}
							className='rounded-2xl object-cover w-40 h-40 md:w-48 md:h-48'
						/>
					</div>
					<div className='flex flex-col gap-3 flex-1'>
						<div className='flex items-center gap-3 flex-wrap'>
							<h1 className='text-3xl font-semibold text-ink'>
								{user?.username}
							</h1>
							<span className='inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-accent-soft text-accent text-xs font-medium'>
								<span className='w-1.5 h-1.5 rounded-full bg-online'></span>
								{isOnline ? 'Online' : 'Offline'}
							</span>
						</div>
						<p className='text-xs text-faint'>Joined {createdAt}</p>

						<div className='flex flex-wrap gap-1.5 mt-2'>
							{(user?.userInterests ?? []).map(
								(userInterest: UserInterestWithName) =>
									typeof userInterest.interestId === 'object' &&
									userInterest.interestId !== null ? (
										<span
											key={userInterest.interestId._id}
											className='inline-flex items-center px-2.5 py-0.5 rounded-full bg-primary-soft text-primary text-xs font-medium'
										>
											{userInterest.interestId.name}
										</span>
									) : null,
							)}
						</div>

						<dl className='grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 mt-4'>
							<div>
								<dt className='text-xs text-faint mb-0.5'>Bio</dt>
								<dd className='text-sm text-ink'>{user?.bio || '—'}</dd>
							</div>
							<div>
								<dt className='text-xs text-faint mb-0.5'>Location</dt>
								<dd className='text-sm text-ink'>{user?.location || '—'}</dd>
							</div>
							<div>
								<dt className='text-xs text-faint mb-0.5'>Birthday</dt>
								<dd className='text-sm text-ink'>
									{user?.birthday
										? new Date(user.birthday).toLocaleDateString()
										: '—'}
								</dd>
							</div>
							<div>
								<dt className='text-xs text-faint mb-0.5'>Gender</dt>
								<dd className='text-sm text-ink'>{user?.gender || '—'}</dd>
							</div>
						</dl>

						{user?._id === me?._id && (
							<button
								onClick={() => router.push(`/users/${userId}/edit`)}
								className='mt-6 self-start inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium text-white bg-primary hover:bg-primary-hover transition-colors cursor-pointer'
							>
								Edit profile
							</button>
						)}
					</div>
				</div>
			</div>
		</div>
	)
}
