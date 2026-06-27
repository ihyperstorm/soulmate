import {isValidSignature} from '@/shared/lib/tiptoppay/server'
import {NextResponse} from 'next/server'

// TipTopPay notifications. Configure each URL in the merchant dashboard, e.g.:
//   Check     -> /api/payments/webhook/check
//   Pay       -> /api/payments/webhook/pay
//   Fail      -> /api/payments/webhook/fail
//   Confirm   -> /api/payments/webhook/confirm
//   Refund    -> /api/payments/webhook/refund
//   Recurrent -> /api/payments/webhook/recurrent
//   Cancel    -> /api/payments/webhook/cancel
// Docs: https://developers.tiptoppay.kz/#api (Уведомления)
export async function POST(
	request: Request,
	{params}: {params: Promise<{type: string}>},
) {
	const {type} = await params

	// Raw body is required AS-IS for HMAC verification — read it first.
	const rawBody = await request.text()
	const signature =
		request.headers.get('Content-HMAC') ?? request.headers.get('X-Content-HMAC')

	if (!isValidSignature(rawBody, signature)) {
		// 13 = reject — refuse to process an unverified notification.
		return NextResponse.json({code: 13})
	}

	// Notifications are sent as application/x-www-form-urlencoded.
	const data = Object.fromEntries(new URLSearchParams(rawBody))
	console.log(`TipTopPay "${type}" notification:`, data.TransactionId ?? '(no id)')

	switch (type) {
		case 'check':
			// Validate order/amount before the charge. Response codes:
			// 0 ok · 11 wrong amount · 12 cannot accept · 13 reject · 5 auth error.
			// TODO: find order by data.InvoiceId / data.AccountId, verify data.Amount.
			return NextResponse.json({code: 0})

		case 'pay':
			// TODO: mark order paid (data.TransactionId, data.Amount, data.Token, …).
			return NextResponse.json({code: 0})

		case 'fail':
		case 'confirm':
		case 'refund':
		case 'recurrent':
		case 'cancel':
			// TODO: update your records for this event type.
			return NextResponse.json({code: 0})

		default:
			return NextResponse.json({code: 0})
	}
}
