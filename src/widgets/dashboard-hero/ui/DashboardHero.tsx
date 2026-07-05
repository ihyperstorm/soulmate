"use client"
import { useCurrentUser } from "@/entities/user"

export const DashboardHero = () => {
	const { data: user } = useCurrentUser()
	const name = user?.username

	return (
		<section className="rounded-2xl border border-divider bg-linear-to-br from-primary-soft via-surface to-surface p-6 md:p-8">
			<p className="text-sm font-medium text-primary">{name ? `Welcome back, ${name}` : "Welcome to Soulmate"}</p>
			<h1 className="mt-1 text-3xl md:text-4xl font-bold tracking-tight text-ink">Meet people who share your interests</h1>
			<p className="mt-2 max-w-xl text-base md:text-lg text-muted">
				Rate what you love — Soulmate surfaces the people who overlap with you the most.
			</p>
		</section>
	)
}
