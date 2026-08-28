import Providers from '@/shared/api/providers'
import type {Metadata} from 'next'
import {Geist} from 'next/font/google'
import {NextIntlClientProvider} from 'next-intl'
import {getLocale, getTranslations} from 'next-intl/server'
import {Toaster} from 'react-hot-toast'

const geistSans = Geist({
	variable: '--font-geist-sans',
	subsets: ['latin'],
})

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations('app')

	return {
		title: t('title'),
		description: t('description'),
	}
}

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	const locale = await getLocale()

	return (
		<html lang={locale}>
			<body className={`${geistSans.variable} antialiased min-h-screen`}>
				{/* Без пропсов провайдер сам берёт locale и messages из i18n/request.ts */}
				<NextIntlClientProvider>
					<Providers>
						{children}
						<Toaster position='top-center' />
					</Providers>
				</NextIntlClientProvider>
			</body>
		</html>
	)
}
