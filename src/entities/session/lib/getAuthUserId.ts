import {verifyToken} from '@/entities/session/model/jwt'
import {cookies} from 'next/headers'

export const getAuthUserId = async (): Promise<string | null> => {
	const cookieStore = await cookies()
	const token = cookieStore.get('accessToken')?.value
	if (!token) return null

	const payload = await verifyToken(token)
	return payload?.userId ?? null
}
