import { NextRequest, NextResponse } from "next/server"

export default async function proxy(req: NextRequest) {
	const token = req.cookies.get("accessToken")?.value
	const pathname = req.nextUrl.pathname

	const isProtected =
		pathname.startsWith("/dashboard") || pathname.startsWith("/users") || pathname.startsWith("/messages") || pathname.startsWith("/settings")

	if (isProtected && !token) {
		return NextResponse.redirect(new URL("/signin", req.url))
	}

	return NextResponse.next()
}

export const config = {
	matcher: ["/dashboard/:path*", "/users/:path*", "/messages/:path*", "/settings/:path*"],
}
