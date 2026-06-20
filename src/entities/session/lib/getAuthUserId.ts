import {verifyToken} from '@/entities/session/model/jwt'
import {cookies} from 'next/headers'

export const getAuthUserId = async (): Promise<string | null> => {
	const cookieStore = await cookies()
	const token = cookieStore.get('accessToken')?.value
	if (!token) return null

	try {
		const payload = verifyToken(token) as {userId?: string}
		return payload.userId ?? null
	} catch {
		return null
	}
}
