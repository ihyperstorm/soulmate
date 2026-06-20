import * as yup from 'yup'

export const interestsSchema = yup.object({
	interests: yup
		.array()
		.of(yup.string().required())
		.min(3, 'Select at least 3 interests')
		.max(10, 'You can select at most 10 interests')
		.required(),
	ratings: yup.object().default({}),
})
