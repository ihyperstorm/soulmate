import type {ValidationTranslator} from '@/i18n/types'
import * as yup from 'yup'

export const createLoginSchema = (t: ValidationTranslator) =>
	yup.object({
		email: yup.string().email(t('emailInvalid')).required(t('emailRequired')),
		password: yup
			.string()
			.min(3, t('passwordMin'))
			.required(t('passwordRequired')),
	})
