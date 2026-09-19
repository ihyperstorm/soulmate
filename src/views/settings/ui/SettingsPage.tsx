import {ChangeEmailForm} from '@/features/auth/change-email'
import {ChangePasswordForm} from '@/features/auth/change-password'
import {LogoutEverywhereButton} from '@/features/auth/logout-everywhere'
import {
	BecomePremiumButton,
	PREMIUM_PRICE_KZT,
} from '@/features/payment/become-premium'
import {getTranslations} from 'next-intl/server'

export default async function SettingsPage() {
	const t = await getTranslations('settings')

	return (
		<div className='py-10'>
			<section className='bg-surface border border-divider rounded-2xl p-6 max-w-2xl'>
				<h1 className='text-2xl font-semibold text-ink mb-1'>{t('title')}</h1>
				<p className='text-sm text-subtle'>{t('subtitle')}</p>

				<div className='mt-6 border-t border-divider pt-6'>
					<h2 className='text-lg font-semibold text-ink mb-1'>
						{t('premiumTitle')}
					</h2>
					<p className='text-sm text-subtle mb-3'>
						{t('premiumDescription', {price: PREMIUM_PRICE_KZT})}
					</p>
					<BecomePremiumButton />
				</div>

				<div className='mt-6 border-t border-divider pt-6'>
					<h2 className='text-lg font-semibold text-ink mb-1'>
						{t('securityTitle')}
					</h2>
					<p className='text-sm text-subtle mb-4'>{t('emailDescription')}</p>
					<ChangeEmailForm />

					<div className='mt-6 border-t border-divider pt-6'>
						<p className='text-sm text-subtle mb-4'>{t('passwordDescription')}</p>
						<ChangePasswordForm />
					</div>

					<div className='mt-6 border-t border-divider pt-6'>
						<p className='text-sm text-subtle mb-3'>
							{t('logoutEverywhereDescription')}
						</p>
						<LogoutEverywhereButton />
					</div>
				</div>
			</section>
		</div>
	)
}
