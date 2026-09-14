"use client"

import { buildChatHref, useMatchCandidates, type RankedCandidate } from "@/features/match/rank-candidates"
import { UserCard } from "@/widgets/user-card"
import { useTranslations } from "next-intl"
import Link from "next/link"
import { useRouter } from "next/navigation"

type UsersDirection = "row" | "col" | "grid2"

interface UsersProps {
	userCount?: number
	direction?: UsersDirection
	minMatchPercent?: number
	onlyUserIds?: string[]
	emptyMessage?: string
	emptyAction?: { label: string; href: string }
}

const directionClass: Record<UsersDirection, string> = {
	row: "grid grid-cols-[repeat(auto-fill,minmax(360px,1fr))] gap-3",
	col: "flex flex-col gap-3",
	grid2: "grid grid-cols-1 md:grid-cols-2 gap-4",
}

const Users = ({ userCount, direction = "col", minMatchPercent, onlyUserIds, emptyMessage, emptyAction }: UsersProps) => {
	const router = useRouter()
	const t = useTranslations("users")

	// Общий источник кандидатов: себя исключает, сортирует по score
	// (проценту по интересам + невидимый буст за совпавшее настроение).
	// Раньше загрузка и фильтрация были здесь инлайном и сортировки не было
	// вообще — «лучшие совпадения» показывались в порядке выдачи БД.
	const { ranked, myId, myWeights, myMoods, idfMap, isLoading, isError } = useMatchCandidates()

	const handleChatClick = (receiverId: string, receiverUsername: string, draft?: string) => {
		if (!myId) return
		router.push(buildChatHref(myId, receiverId, receiverUsername, draft))
	}

	if (isLoading) return <div className="flex justify-center items-center py-20 text-muted text-sm">{t("loading")}</div>
	if (isError) return <div className="flex justify-center items-center py-20 text-danger text-sm">{t("loadError")}</div>

	let candidates: RankedCandidate[] = ranked

	if (onlyUserIds) {
		// Порядок задаёт вызывающий (RecentSouls — по свежести переписки),
		// поэтому здесь сортировка по score намеренно перекрывается.
		const byId = new Map(candidates.map((candidate) => [candidate.user._id, candidate]))
		candidates = onlyUserIds.map((id) => byId.get(id)).filter((candidate): candidate is RankedCandidate => candidate !== undefined)
	}

	if (typeof minMatchPercent === "number") {
		// Порог по интересам, не по score: иначе настроение протаскивало бы
		// в «лучшие совпадения» людей с парой общих тем.
		candidates = candidates.filter((candidate) => candidate.coveragePercent >= minMatchPercent)
	}

	const visible = candidates.slice(0, userCount ?? candidates.length)

	if (visible.length === 0) {
		if (!emptyMessage) return null
		return (
			<div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-line py-10 px-6 text-center">
				<p className="max-w-xs text-sm text-muted">{emptyMessage}</p>
				{emptyAction && (
					<Link
						href={emptyAction.href}
						className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-primary hover:bg-primary-hover transition-colors"
					>
						{emptyAction.label}
					</Link>
				)}
			</div>
		)
	}

	return (
		<div className={directionClass[direction]}>
			{visible.map(({ user }) => (
				<UserCard key={user._id} user={user} myWeights={myWeights} myMoods={myMoods} idfMap={idfMap} onChatClick={handleChatClick} />
			))}
		</div>
	)
}

export default Users
