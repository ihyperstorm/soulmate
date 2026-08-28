"use client"
import type { IUser } from "@/entities/user"
import { useCurrentUser } from "@/entities/user"
import { pickQuestion } from "@/shared/data/talkQuestions"
import { useLocale, useTranslations } from "next-intl"
import { useMemo } from "react"

type NamedInterest = { _id: string; name: string }

const getInterestNames = (me: IUser | null | undefined): NamedInterest[] => {
	return (me?.userInterests ?? [])
		.map((ui) => ui.interestId)
		.filter(
			(interest): interest is NamedInterest =>
				typeof interest === "object" && interest !== null && "name" in interest,
		)
}

const TalkIdeas = () => {
	const { data: me, isLoading } = useCurrentUser()
	const t = useTranslations("talkIdeas")
	const locale = useLocale()

	const interests = getInterestNames(me)
	// Ключ из имён интересов: useMemo пересчитывает рандом только когда меняется
	// набор интересов, а не на каждый ре-рендер. Полная перезагрузка страницы =
	// новый монтаж → новый рандом.
	const namesKey = interests.map((i) => i.name).join("|")

	const ideas = useMemo(
		() =>
			interests.map((interest) => ({
				id: interest._id,
				name: interest.name,
				question: pickQuestion(interest.name, locale),
			})),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[namesKey, locale],
	)

	if (isLoading) return null

	return (
		<section>
			<h1 className="text-3xl font-bold text-ink mb-1">{t("title")}</h1>
			<p className="text-sm text-muted">{t("subtitle")}</p>

			{ideas.length === 0 ? (
				<p className="mt-5 text-sm text-muted">{t("empty")}</p>
			) : (
				<div className="mt-5 flex flex-col gap-3">
					{ideas.map(({ id, name, question }) => (
						<div
							key={id}
							className="max-w-2xl rounded-2xl rounded-tl-sm bg-primary-soft border border-primary/15 px-4 py-3"
						>
							<span className="inline-block text-[11px] font-semibold uppercase tracking-wide text-primary mb-1">
								{name}
							</span>
							<p className="text-sm text-ink leading-snug">{question}</p>
						</div>
					))}
				</div>
			)}
		</section>
	)
}

export default TalkIdeas
