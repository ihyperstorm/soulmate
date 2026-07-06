import {BecomePremiumButton} from '@/features/payment/become-premium'

export default function SettingsPage() {
	return (
		<div className='py-10'>
			<section className='bg-surface border border-divider rounded-2xl p-6 max-w-2xl'>
				<h1 className='text-2xl font-semibold text-ink mb-1'>Settings</h1>
				<p className='text-sm text-muted'>Manage your account preferences.</p>

				<div className='mt-6 border-t border-divider pt-6'>
					<h2 className='text-lg font-semibold text-ink mb-1'>Premium</h2>
					<p className='text-sm text-muted mb-3'>
						Unlock premium features for 990 ₸.
					</p>
					<BecomePremiumButton />
				</div>
			</section>
		</div>
	)
}
