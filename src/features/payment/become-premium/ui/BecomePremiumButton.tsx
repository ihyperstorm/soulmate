'use client'

import {CURRENT_USER_KEY, useCurrentUser} from '@/entities/user'
import {useAppQueryClient} from '@/shared/api/providers'
import {PaymentWidget} from '@/widgets/payment-widget'
import axios from 'axios'
import {useState} from 'react'

// Premium price in KZT (TipTopPay `amount` is in major currency units).
const PREMIUM_PRICE_KZT = 990

export const BecomePremiumButton = () => {
	const queryClient = useAppQueryClient()
	const [status, setStatus] = useState<'idle' | 'upgrading' | 'done' | 'error'>(
		'idle',
	)

	const {data: user} = useCurrentUser()

	if (user?.isPremium) {
		return (
			<div className='inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-soft text-accent text-sm font-medium'>
				<span aria-hidden>✨</span> Premium active
			</div>
		)
	}

	// Fired when the TipTopPay widget reports a successful payment.
	const handleSuccess = async () => {
		setStatus('upgrading')
		try {
			await axios.post('/api/users/me/premium')
			await queryClient.invalidateQueries({queryKey: CURRENT_USER_KEY})
			setStatus('done')
		} catch {
			setStatus('error')
		}
	}

	return (
		<div className='flex flex-col gap-2'>
			<PaymentWidget
				amount={PREMIUM_PRICE_KZT}
				currency='KZT'
				description='Soulmate Premium'
				externalId={user?._id}
				email={user?.email}
				onSuccess={handleSuccess}
				onFail={() => setStatus('error')}
			/>
			{status === 'upgrading' && (
				<p className='text-xs text-muted'>Activating premium…</p>
			)}
			{status === 'done' && (
				<p className='text-xs text-accent'>Premium activated! 🎉</p>
			)}
			{status === 'error' && (
				<p className='text-xs text-danger'>Could not activate premium.</p>
			)}
		</div>
	)
}

export default BecomePremiumButton
