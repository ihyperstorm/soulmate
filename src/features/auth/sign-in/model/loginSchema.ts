import * as yup from 'yup'

export const loginSchema = yup.object({
	email: yup.string().email('Invalid email').required('Email is required'),
	password: yup
		.string()
		.min(3, 'Password must be at least 3 characters')
		.required('Password is required'),
})
