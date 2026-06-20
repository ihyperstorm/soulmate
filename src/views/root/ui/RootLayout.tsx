import {Header} from '@/widgets/header'
import {Footer} from '@/widgets/footer'
import Providers from '@/shared/api/providers'
import type {Metadata} from 'next'
import {Geist} from 'next/font/google'
import {Toaster} from 'react-hot-toast'

const geistSans = Geist({
	variable: '--font-geist-sans',
	subsets: ['latin'],
})

export const metadata: Metadata = {
	title: 'Soulmate — Connect by interests',
	description: 'Find your perfect match through shared interests.',
}

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<html lang='en'>
			<body
				className={`${geistSans.variable} antialiased min-h-screen flex flex-col`}
			>
				<Providers>
					<div className='min-h-screen flex flex-col'>
						<Header />
						<main className='flex-1 flex flex-col min-h-0'>{children}</main>
						<Footer />
					</div>
					<Toaster position='top-center' />
				</Providers>
			</body>
		</html>
	)
}
