export type MailMessage = {
	to: string
	subject: string
	text: string
}

/**
 * Базовый URL приложения для ссылок в письмах.
 *
 * Берётся из переменной окружения, а НЕ из заголовка Host запроса: иначе
 * атакующий подменяет Host, и жертве уходит письмо со ссылкой на его домен
 * вместе с валидным токеном сброса. Классический host header injection.
 */
export const getAppUrl = (): string =>
	process.env.APP_URL?.replace(/\/+$/, '') ?? 'http://localhost:3000'

/**
 * Отправка письма.
 *
 * Без `RESEND_API_KEY` письмо печатается в консоль — этого достаточно, чтобы
 * разрабатывать и проверять флоу целиком: ссылку копируешь из терминала.
 * С ключом уходит через Resend по обычному REST, без npm-зависимости.
 */
export const sendMail = async (message: MailMessage): Promise<void> => {
	const apiKey = process.env.RESEND_API_KEY

	if (!apiKey) {
		console.info(
			[
				'',
				'──── письмо (мейлер не настроен, вывод в консоль) ────',
				`кому:  ${message.to}`,
				`тема:  ${message.subject}`,
				'',
				message.text,
				'──────────────────────────────────────────────────────',
				'',
			].join('\n'),
		)
		return
	}

	const response = await fetch('https://api.resend.com/emails', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${apiKey}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			from: process.env.MAIL_FROM ?? 'onboarding@resend.dev',
			to: message.to,
			subject: message.subject,
			text: message.text,
		}),
	})

	if (!response.ok) {
		// Тело ответа обязательно: /forgot-password намеренно отвечает 200 даже
		// при сбое отправки, поэтому лог — единственное место, где вообще видно,
		// что пошло не так. Один статус тут бесполезен: у Resend и «домен не
		// верифицирован», и «неверный ключ» приходят с 4xx, а различить их можно
		// только по описанию.
		const details = await response.text().catch(() => '')
		throw new Error(`Resend responded ${response.status}: ${details || '(пустой ответ)'}`)
	}
}
