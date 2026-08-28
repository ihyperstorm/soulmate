'use server'

import {hasLocale} from 'next-intl'
import {cookies} from 'next/headers'
import {
	LOCALE_COOKIE,
	LOCALE_COOKIE_MAX_AGE,
	defaultLocale,
	locales,
	type Locale,
} from './config'

/** Локаль из cookie. Мусор и отсутствие значения падают в дефолт (ru). */
export async function getUserLocale(): Promise<Locale> {
	const store = await cookies()
	const candidate = store.get(LOCALE_COOKIE)?.value
	return hasLocale(locales, candidate) ? candidate : defaultLocale
}

/**
 * Смена языка: пишем cookie и полагаемся на ре-рендер серверных компонентов.
 * Вызывать из клиента как server action, после — router.refresh().
 */
export async function setUserLocale(locale: Locale) {
	const store = await cookies()
	store.set(LOCALE_COOKIE, locale, {
		path: '/',
		maxAge: LOCALE_COOKIE_MAX_AGE,
		sameSite: 'lax',
	})
}
