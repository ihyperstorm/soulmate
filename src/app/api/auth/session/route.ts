import {getAuthUserId} from '@/entities/session/server'
import {NextResponse} from 'next/server'

/**
 * GET /api/auth/session — дешёвая проверка, жив ли access-токен. Без БД.
 *
 * Нужен клиентам, которые не ходят через axios и потому не получают
 * молчаливого refresh — сейчас это EventSource в ChatBox (см. ensureFreshSession).
 */
export async function GET() {
	const userId = await getAuthUserId()
	if (!userId) {
		return NextResponse.json({error: 'Unauthorized'}, {status: 401})
	}
	return NextResponse.json({userId})
}
