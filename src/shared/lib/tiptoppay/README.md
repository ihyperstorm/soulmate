# TipTopPay — minimal integration

Boilerplate for the [TipTopPay](https://developers.tiptoppay.kz/) gateway.

## Files

- `shared/lib/tiptoppay/server.ts` — server API client (`tiptopRequest`) +
  webhook signature check (`isValidSignature`). **Server-only.**
- `widgets/payment-widget` — `<PaymentWidget>`, loads `widget.js` and opens the
  hosted payment widget.
- `app/api/payments/webhook/[type]/route.ts` — receives notifications
  (check/pay/fail/confirm/refund/recurrent/cancel), verifies HMAC.
- `app/api/payments/charge/route.ts` — server-to-server charge by cryptogram.

## Environment variables

| Variable                          | Side   | Purpose                                  |
| --------------------------------- | ------ | ---------------------------------------- |
| `NEXT_PUBLIC_TIPTOPPAY_TERMINAL_ID` | client | `publicTerminalId` for the widget        |
| `TIPTOPPAY_PUBLIC_ID`             | server | Basic-auth username (Public ID)          |
| `TIPTOPPAY_API_SECRET`            | server | Basic-auth password + HMAC key           |

## Usage

```tsx
import {PaymentWidget} from '@/widgets/payment-widget'

<PaymentWidget
  amount={1000}
  currency="KZT"
  description="Premium"
  externalId={orderId}
  onSuccess={() => router.refresh()}
/>
```

Then point the dashboard notification URLs at `/api/payments/webhook/<type>`
and fill in the `TODO`s in the webhook handler to update your own records.
