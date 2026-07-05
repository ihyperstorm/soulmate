"use client"
import { DashboardHero } from "@/widgets/dashboard-hero"
import { TopSouls } from "@/widgets/top-souls"
import { Sidebar } from "@/widgets/sidebar"
import { TalkIdeas } from "@/widgets/talk-ideas"
import { RecentSouls } from "@/widgets/recent-souls"

export default function DashboardPage() {
	return (
		<div className="grid grid-cols-[11rem_minmax(0,1fr)] gap-6">
			<Sidebar />
			<div className="flex flex-col gap-8 min-w-0">
				<DashboardHero />
				<div className="flex flex-col gap-10 bg-surface border border-divider rounded-2xl p-6 md:p-8">
					<TopSouls />
					<RecentSouls />
					<TalkIdeas />
				</div>
				{/* Будущие виджеты: Mood/Energy · Shared topics · Daily match · Spotify taste · Mini rooms */}
			</div>
		</div>
	)
}
