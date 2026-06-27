"use client"

import { useState } from "react"

// TipTopPay payment widget. Docs: https://developers.tiptoppay.kz/#platezhnyy-vidzhet
const WIDGET_SRC = "https://widget.tiptoppay.kz/bundles/widget.js"

type TipTopResult = {
	type?: "payment" | "cancel" | "error" | string
	status?: "success" | "fail" | string
	[key: string]: unknown
}

interface TipTopWidget {
	start(params: Record<string, unknown>): Promise<TipTopResult>
}

declare global {
	interface Window {
		tiptop?: { Widget: new () => TipTopWidget }
	}
}

// Load widget.js once and resolve when `tiptop` is available.
let scriptPromise: Promise<void> | null = null
const loadWidgetScript = (): Promise<void> => {
	if (window.tiptop) return Promise.resolve()
	if (!scriptPromise) {
		scriptPromise = new Promise((resolve, reject) => {
			const script = document.createElement("script")
			script.src = WIDGET_SRC
			script.async = true
			script.onload = () => resolve()
			script.onerror = () => reject(new Error("Failed to load TipTopPay widget"))
			document.head.appendChild(script)
		})
	}
	return scriptPromise
}

export interface PaymentWidgetProps {
	amount: number
	currency?: "KZT" | "USD" | "EUR" | "GBP"
	description?: string
	externalId?: string // order id in your system
	email?: string
	paymentSchema?: "Single" | "Dual"
	onSuccess?: (result: TipTopResult) => void
	onFail?: (result: TipTopResult) => void
	onCancel?: () => void
}

export const PaymentWidget = ({
	amount,
	currency = "KZT",
	description,
	externalId,
	email,
	paymentSchema = "Single",
	onSuccess,
	onFail,
	onCancel,
}: PaymentWidgetProps) => {
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const pay = async () => {
		setError(null)
		setLoading(true)
		try {
			await loadWidgetScript()
			const Widget = window.tiptop?.Widget
			if (!Widget) throw new Error("TipTopPay widget is unavailable")

			const widget = new Widget()
			const result = await widget.start({
				publicTerminalId: process.env.NEXT_PUBLIC_TIPTOPPAY_TERMINAL_ID,
				amount,
				currency,
				paymentSchema,
				description,
				externalId,
				receiptEmail: email,
				culture: "ru-RU",
			})

			if (result.type === "payment" && result.status === "success") {
				onSuccess?.(result)
			} else if (result.type === "cancel") {
				onCancel?.()
			} else {
				onFail?.(result)
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : "Payment failed")
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="flex flex-col gap-2">
			<button
				type="button"
				onClick={pay}
				disabled={loading}
				className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-primary hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
			>
				{loading ? "Processing…" : "Pay"}
			</button>
			{error && <p className="text-xs text-danger">{error}</p>}
		</div>
	)
}

export default PaymentWidget
