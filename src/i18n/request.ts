import {hasLocale} from 'next-intl'
import {getRequestConfig} from 'next-intl/server'
import {locales} from './config'
import {getUserLocale} from './locale'

/**
 * Конфиг i18n на каждый запрос. Подключается плагином из next.config.ts.
 *
 * Роутинга по локали нет (URL остаются без префикса /ru, /en), язык берётся из cookie —
 * поэтому не пришлось переносить весь app/ в сегмент [locale].
 */
export default getRequestConfig(async ({locale: override}) => {
	// override приходит, когда локаль передали явно: getTranslations({locale: 'en'}).
	const locale = hasLocale(locales, override) ? override : await getUserLocale()

	return {
		locale,
		messages: (await import(`../../messages/${locale}.json`)).default,
	}
})
