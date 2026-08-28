import type {ValidationTranslator} from '@/i18n/types'
import * as yup from 'yup'

export const createRegisterSchema = (t: ValidationTranslator) =>
	yup.object({
		username: yup.string().required(t('nameRequired')),
		email: yup.string().email(t('emailInvalid')).required(t('emailRequired')),
		password: yup
			.string()
			.min(3, t('passwordMin'))
			.required(t('passwordRequired')),
	})
