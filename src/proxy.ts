import { verifyToken } from "@/entities/session/model/jwt"
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/entities/session/model/cookieNames"
import { NextRequest, NextResponse } from "next/server"

// Импортируем только jwt и имена cookie: proxy работает в Edge, где нет ни
// mongoose, ни node:crypto. Проверить refresh по БД здесь невозможно —
// поэтому proxy лишь решает «есть ли смысл пускать», а настоящая проверка
// живёт в /api/* (getAuthUserId) и в /api/auth/refresh.

export default async function proxy(req: NextRequest) {
	const pathname = req.nextUrl.pathname

	const isProtected =
		pathname.startsWith("/dashboard") || pathname.startsWith("/users") || pathname.startsWith("/messages") || pathname.startsWith("/settings")

	if (!isProtected) return NextResponse.next()

	// Живой access-токен — пропускаем сразу.
	const accessToken = req.cookies.get(ACCESS_COOKIE)?.value
	const payload = accessToken ? await verifyToken(accessToken) : null
	if (payload?.userId) return NextResponse.next()

	// Access истёк (он короткий, 15 минут — это норма), но refresh-cookie есть.
	// Пускаем на страницу: страницы клиентские и данные берут из /api/*, где 401
	// перехватит axios-интерцептор, молча обновит access и повторит запрос.
	// Если refresh окажется мёртвым, интерцептор сам уведёт на /signin.
	//
	// Редиректить здесь нельзя: это вернуло бы прежний баг «выкидывает через
	// полчаса» — у пользователя валидная 30-дневная сессия, истёк лишь access.
	if (req.cookies.get(REFRESH_COOKIE)?.value) return NextResponse.next()

	return NextResponse.redirect(new URL("/signin", req.url))
}

export const config = {
	matcher: ["/dashboard/:path*", "/users/:path*", "/messages/:path*", "/settings/:path*"],
}
