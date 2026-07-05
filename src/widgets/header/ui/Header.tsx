"use client"
import { useCurrentUser } from "@/entities/user"
import { LogoutButton } from "@/features/auth/logout"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { LogIn } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

const Header = () => {
	const router = useRouter()

	const { data: user } = useCurrentUser()

	return (
		<header className="sticky top-0 z-30 bg-surface/85 backdrop-blur border-b border-divider">
			<div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3">
				<Link href="/" className="flex items-center gap-2 text-ink text-base font-semibold tracking-tight">
					<span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-primary text-white text-sm font-semibold">S</span>
					Soulmate
				</Link>
				<div className="flex items-center gap-2">
					{user && (
						<Link href="/users/me" className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full bg-surface-muted">
							<Avatar className="size-7">
								<AvatarImage src={user?.avatarUrl || "/9dba1c75826cde0e6cf64a5a8fd25bf6.jpg"} alt="avatar" />
								<AvatarFallback>{user.username?.charAt(0)?.toUpperCase()}</AvatarFallback>
							</Avatar>
							<span className="text-sm font-medium text-ink">{user.username}</span>
						</Link>
					)}
					{!user ? (
						<button
							className="inline-flex items-center gap-2 text-sm font-medium text-ink hover:text-primary transition-colors px-3 py-2 rounded-lg hover:bg-surface-muted cursor-pointer"
							onClick={() => router.push("/signin")}
						>
							<LogIn className="w-4 h-4" />
							Sign in
						</button>
					) : (
						<LogoutButton />
					)}
				</div>
			</div>
		</header>
	)
}

export default Header
