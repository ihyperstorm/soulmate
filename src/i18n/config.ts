/** Поддерживаемые локали. Русская — дефолтная. */
export const locales = ['ru', 'en'] as const

export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'ru'

/** Имя cookie, в которой хранится выбор пользователя. NEXT_LOCALE — конвенция next-intl. */
export const LOCALE_COOKIE = 'NEXT_LOCALE'

export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365

/** Подписи для переключателя языка. */
export const localeLabels: Record<Locale, string> = {
	ru: 'Русский',
	en: 'English',
}
