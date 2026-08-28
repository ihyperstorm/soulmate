import {useTranslations} from 'next-intl'

const APP_VERSION = '1.0.0'

const Footer = () => {
	const t = useTranslations('footer')

	return (
		<footer className='border-t border-divider bg-surface'>
			<div className='max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 px-6 py-4 text-xs text-muted'>
				<p>{t('rights', {year: new Date().getFullYear()})}</p>
				<p>{t('version', {version: APP_VERSION})}</p>
				<p>
					{t.rich('craftedBy', {
						author: chunks => (
							<a
								href='https://github.com/yourusername'
								target='_blank'
								rel='noopener noreferrer'
								className='text-primary hover:text-primary-hover transition-colors font-medium'
							>
								{chunks}
							</a>
						),
					})}
				</p>
			</div>
		</footer>
	)
}

export default Footer
