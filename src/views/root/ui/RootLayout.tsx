import Providers from '@/shared/api/providers'
import type {Metadata} from 'next'
import {Manrope} from 'next/font/google'
import {NextIntlClientProvider} from 'next-intl'
import {getLocale, getTranslations} from 'next-intl/server'
import {Toaster} from 'react-hot-toast'

// Переменная названа по роли, а не по гарнитуре: сменить шрифт — правка
// только этого файла, CSS трогать не нужно.
//
// cyrillic обязателен: интерфейс русский, а next/font качает ровно те
// подмножества, которые перечислены здесь. Без него кириллица подменяется
// системным шрифтом, даже если гарнитура её поддерживает.
const appFont = Manrope({
	variable: '--font-app',
	subsets: ['latin', 'cyrillic'],
	display: 'swap',
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
		<html lang={locale} className={appFont.variable}>
			<body className='antialiased min-h-screen'>
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
