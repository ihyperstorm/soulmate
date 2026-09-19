import {ResetPasswordForm} from '@/features/auth/reset-password'
import {Suspense} from 'react'

export default function ResetPasswordPage() {
	// useSearchParams требует Suspense-границы, иначе страница целиком
	// выпадает в client-side rendering на билде.
	return (
		<Suspense>
			<ResetPasswordForm />
		</Suspense>
	)
}
