import {
	ACCESS_TOKEN_TTL_SECONDS,
	REFRESH_THRESHOLD_SECONDS,
	signToken,
	verifyToken,
} from "@/entities/session/model/jwt"
import { NextRequest, NextResponse } from "next/server"

export default async function proxy(req: NextRequest) {
	const token = req.cookies.get("accessToken")?.value
	const pathname = req.nextUrl.pathname

	const isProtected =
		pathname.startsWith("/dashboard") || pathname.startsWith("/users") || pathname.startsWith("/messages") || pathname.startsWith("/settings")

	if (isProtected) {
		// Проверяем не наличие cookie, а валидность JWT (подпись + срок).
		const payload = token ? await verifyToken(token) : null
		if (!payload) {
			return NextResponse.redirect(new URL("/signin", req.url))
		}

		const res = NextResponse.next()

		// Sliding session: если до истечения осталось меньше порога — перевыпускаем токен,
		// чтобы активный юзер не выпадал каждые 30 минут. Неактивный (без запросов) всё
		// равно истечёт. Обновление срабатывает на навигации по защищённым маршрутам.
		if (payload.userId && typeof payload.exp === "number") {
			const secondsLeft = payload.exp - Math.floor(Date.now() / 1000)
			if (secondsLeft < REFRESH_THRESHOLD_SECONDS) {
				try {
					const fresh = await signToken({ userId: payload.userId })
					res.cookies.set("accessToken", fresh, {
						httpOnly: true,
						secure: process.env.NODE_ENV === "production",
						sameSite: "lax",
						maxAge: ACCESS_TOKEN_TTL_SECONDS,
						path: "/",
					})
				} catch {
					// Не смогли перевыпустить — не критично: текущий токен ещё валиден.
				}
			}
		}

		return res
	}

	return NextResponse.next()
}

export const config = {
	matcher: ["/dashboard/:path*", "/users/:path*", "/messages/:path*", "/settings/:path*"],
}
