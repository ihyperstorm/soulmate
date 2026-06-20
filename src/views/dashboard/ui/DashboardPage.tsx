"use client"
import { TopSouls } from "@/widgets/top-souls"
import { Sidebar } from "@/widgets/sidebar"
import { TalkIdeas } from "@/widgets/talk-ideas"
import { RecentSouls } from "@/widgets/recent-souls"

export default function DashboardPage() {
	return (
		<div className="grid grid-cols-[11rem_minmax(0,1fr)] gap-6">
			<Sidebar />
			<div className="flex flex-col gap-6 bg-surface border border-divider rounded-2xl p-6">
				<TopSouls />
				<RecentSouls />
				<TalkIdeas />
				<div>🌱 Mood / Energy</div>
				<div>🧠 Shared Topics </div>
				<div>✨ Daily Match</div>
				<div> 🪐 Calm widgets</div>
				🎧 Shared music taste Если Spotify API подключишь. 🎮 Mini rooms
			</div>
		</div>
	)
}
