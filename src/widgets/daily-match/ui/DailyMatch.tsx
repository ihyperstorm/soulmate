"use client"

import { buildChatHref, useMatchCandidates } from "@/features/match/rank-candidates"
import { dayKey, pickDaily } from "@/shared/lib/dailyPick"
import { UserCard } from "@/widgets/user-card"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { useMemo } from "react"

// Из скольких лучших кандидатов выбирается человек дня.
// Брать строго первого нельзя: это был бы один и тот же человек каждый день,
// пока никто не поменяет интересы, и «раз в сутки» потеряло бы смысл.
// Пул из пяти сохраняет релевантность и даёт сменяемость.
const DAILY_POOL_SIZE = 5

// Ниже этого процента блок не показывается вовсе: «лучший матч на сегодня»
// с 8% совпадения — обещание, которое подрывает доверие к подбору.
const MIN_COVERAGE_PERCENT = 40

const DailyMatch = () => {
	const { ranked, myId, myWeights, myMoods, idfMap, isLoading } = useMatchCandidates()
	const t = useTranslations("dailyMatch")
	const router = useRouter()

	const daily = useMemo(() => {
		if (!myId) return null
		const pool = ranked
			.filter((candidate) => candidate.coveragePercent >= MIN_COVERAGE_PERCENT)
			.slice(0, DAILY_POOL_SIZE)
		// Сид из (мой id + сутки): весь день один и тот же человек, у разных
		// пользователей — разные. Ничего не пишется в базу, крон не нужен.
		return pickDaily(pool, `${myId}:${dayKey()}`, (candidate) => candidate.user._id)
	}, [ranked, myId])

	// Блока просто нет, если не из кого выбирать — пустая рамка хуже отсутствия.
	if (isLoading || !daily || !myId) return null

	const handleChatClick = (receiverId: string, username: string, draft?: string) => {
		router.push(buildChatHref(myId, receiverId, username, draft))
	}

	return (
		<section>
			<h2 className="text-3xl font-bold text-ink mb-1">{t("title")}</h2>
			<p className="text-sm text-subtle">{t("subtitle")}</p>

			<div className="daily-ring mt-5 max-w-md">
				<UserCard
					user={daily.user}
					myWeights={myWeights}
					myMoods={myMoods}
					idfMap={idfMap}
					onChatClick={handleChatClick}
					// Своя рамка карточке не нужна — её роль играет градиент снаружи.
					// Подъём на ховере тоже убираем: он бы отклеил карточку от рамки.
					className="border-transparent hover:border-transparent hover:translate-y-0 hover:shadow-none"
				/>
			</div>
		</section>
	)
}

export default DailyMatch
