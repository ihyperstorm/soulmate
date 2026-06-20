const Footer = () => {
	return (
		<footer className='border-t border-divider bg-surface'>
			<div className='max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 px-6 py-4 text-xs text-muted'>
				<p>© 2026 Soulmate. All rights reserved.</p>
				<p>Version 1.0.0</p>
				<p>
					Crafted by{' '}
					<a
						href='https://github.com/yourusername'
						target='_blank'
						rel='noopener noreferrer'
						className='text-primary hover:text-primary-hover transition-colors font-medium'
					>
						Your Name
					</a>
				</p>
			</div>
		</footer>
	)
}

export default Footer
