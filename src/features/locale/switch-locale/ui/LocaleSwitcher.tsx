'use client'

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {localeLabels, locales, type Locale} from '@/i18n/config'
import {setUserLocale} from '@/i18n/locale'
import {Languages} from 'lucide-react'
import {useLocale, useTranslations} from 'next-intl'
import {useRouter} from 'next/navigation'
import {useTransition} from 'react'

export const LocaleSwitcher = () => {
	const locale = useLocale()
	const t = useTranslations('localeSwitcher')
	const router = useRouter()
	const [isPending, startTransition] = useTransition()

	const selectLocale = (next: Locale) => {
		if (next === locale) return

		startTransition(async () => {
			await setUserLocale(next)
			// Серверные компоненты уже отрендерены с прежней локалью — перечитываем дерево,
			// иначе новая cookie подхватится только на следующей навигации.
			router.refresh()
		})
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				disabled={isPending}
				aria-label={t('label')}
				className='inline-flex items-center gap-2 text-sm font-medium text-ink hover:text-primary transition-colors px-3 py-2 rounded-lg hover:bg-surface-muted cursor-pointer disabled:opacity-50'
			>
				<Languages className='w-4 h-4' />
				{locale.toUpperCase()}
			</DropdownMenuTrigger>
			<DropdownMenuContent align='end' className='w-40'>
				<DropdownMenuRadioGroup
					value={locale}
					onValueChange={value => selectLocale(value as Locale)}
				>
					{locales.map(item => (
						<DropdownMenuRadioItem key={item} value={item} closeOnClick>
							{localeLabels[item]}
						</DropdownMenuRadioItem>
					))}
				</DropdownMenuRadioGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
