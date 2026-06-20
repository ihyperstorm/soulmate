import * as yup from 'yup'

export const registerSchema = yup.object({
	username: yup.string().required('Name is required'),
	email: yup.string().email('Invalid email').required('Email is required'),
	password: yup
		.string()
		.min(3, 'Password must be at least 3 characters')
		.required('Password is required'),
})
