import {createHmac, timingSafeEqual} from 'node:crypto'

// Server-only TipTopPay client. Holds the API secret — never import from a
// client component. Docs: https://developers.tiptoppay.kz/#api

const API_URL = 'https://api.tiptoppay.kz'

// Standard response envelope used by every TipTopPay endpoint.
export interface TipTopResponse<TModel = unknown> {
	Success: boolean
	Message: string | null
	Model?: TModel
}

const authHeader = (): string => {
	const publicId = process.env.TIPTOPPAY_PUBLIC_ID
	const apiSecret = process.env.TIPTOPPAY_API_SECRET
	if (!publicId || !apiSecret) {
		throw new Error('TIPTOPPAY_PUBLIC_ID / TIPTOPPAY_API_SECRET are not set')
	}
	return `Basic ${Buffer.from(`${publicId}:${apiSecret}`).toString('base64')}`
}

// POST a JSON request to the TipTopPay API (e.g. '/payments/cards/charge').
export const tiptopRequest = async <TModel = unknown>(
	path: string,
	body: Record<string, unknown>,
): Promise<TipTopResponse<TModel>> => {
	const res = await fetch(`${API_URL}${path}`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: authHeader(),
		},
		body: JSON.stringify(body),
	})
	return (await res.json()) as TipTopResponse<TModel>
}

// Verify a webhook: Content-HMAC = Base64(HMAC-SHA256(rawBody, ApiSecret)).
// Pass the RAW request body exactly as received (do not re-serialize).
export const isValidSignature = (
	rawBody: string,
	signature: string | null,
): boolean => {
	const apiSecret = process.env.TIPTOPPAY_API_SECRET
	if (!apiSecret || !signature) return false

	const expected = createHmac('sha256', apiSecret)
		.update(rawBody, 'utf8')
		.digest('base64')

	const a = Buffer.from(expected)
	const b = Buffer.from(signature)
	return a.length === b.length && timingSafeEqual(a, b)
}
