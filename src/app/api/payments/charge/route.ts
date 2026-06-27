import {getAuthUserId} from '@/entities/session/server'
import {tiptopRequest} from '@/shared/lib/tiptoppay/server'
import {NextResponse} from 'next/server'

// POST /api/payments/charge — single-stage charge by cryptogram.
// For the server-to-server flow; the widget flow does not need this route.
// Docs: https://developers.tiptoppay.kz/#api (/payments/cards/charge)
export async function POST(request: Request) {
	const authUserId = await getAuthUserId()
	if (!authUserId) {
		return NextResponse.json({error: 'Unauthorized'}, {status: 401})
	}

	const {amount, currency, cardCryptogramPacket, invoiceId, description, email} =
		await request.json()

	if (typeof amount !== 'number' || amount <= 0 || !cardCryptogramPacket) {
		return NextResponse.json(
			{error: 'amount and cardCryptogramPacket are required'},
			{status: 400},
		)
	}

	const ip =
		request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? '127.0.0.1'

	const result = await tiptopRequest('/payments/cards/charge', {
		Amount: amount,
		Currency: currency ?? 'KZT',
		IpAddress: ip,
		CardCryptogramPacket: cardCryptogramPacket,
		InvoiceId: invoiceId,
		Description: description,
		AccountId: authUserId,
		Email: email,
	})

	// TODO: persist the transaction; handle 3-D Secure if Model.PaReq/AcsUrl returned.
	return NextResponse.json(result)
}
