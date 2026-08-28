import type {ValidationTranslator} from '@/i18n/types'
import * as yup from 'yup'

export const createInterestsSchema = (t: ValidationTranslator) =>
	yup.object({
		interests: yup
			.array()
			.of(yup.string().required())
			.min(3, t('interestsMin'))
			.max(10, t('interestsMax'))
			.required(),
		ratings: yup.object().default({}),
	})
