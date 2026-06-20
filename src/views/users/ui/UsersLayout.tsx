export default function UsersLayout({children}: {children: React.ReactNode}) {
	return (
		<div className='w-full max-w-7xl mx-auto'>
			<div>{children}</div>
		</div>
	)
}
