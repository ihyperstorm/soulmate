import type {locales} from '@/i18n/config'
import type messages from '../messages/ru.json'

/**
 * Типизация next-intl: t('...') проверяет ключи по ru.json (дефолтная локаль),
 * а Locale сужается до 'ru' | 'en'.
 */
declare module 'next-intl' {
	interface AppConfig {
		Locale: (typeof locales)[number]
		Messages: typeof messages
	}
}
