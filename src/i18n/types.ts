import type {useTranslations} from 'next-intl'

/**
 * Переводчик неймспейса `validation`. Схемы валидации не могут звать хуки,
 * поэтому форма прокидывает в фабрику схемы уже готовый `t`.
 */
export type ValidationTranslator = ReturnType<typeof useTranslations<'validation'>>
