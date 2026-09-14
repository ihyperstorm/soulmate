"use client"
import { DashboardHero } from "@/widgets/dashboard-hero"
import { MoodBoard } from "@/widgets/mood-board"
import { DailyMatch } from "@/widgets/daily-match"
import { TopSouls } from "@/widgets/top-souls"
import { RecentSouls } from "@/widgets/recent-souls"

export default function DashboardPage() {
	return (
		<div className="flex flex-col gap-8">
			<DashboardHero />
			<div className="flex flex-col gap-10 bg-surface border border-divider rounded-2xl p-6 md:p-8">
				{/* Пикер выше подборки: связка «задал настрой → люди подстроились»
				    должна читаться сверху вниз. */}
				<MoodBoard />
				<DailyMatch />
				<TopSouls />
				<RecentSouls />
			</div>
			{/* Будущие виджеты: Mood/Energy · Shared topics · Daily match · Spotify taste · Mini rooms */}
			{/* TalkIdeas удалён: обезличенные идеи для разговора вытеснены блоком
			    «Растопить лёд» в UserCard — там опенеры привязаны к конкретному человеку
			    и к общим с ним интересам. */}
		</div>
	)
}
