"use client"
import { Users } from "@/widgets/users-list"
import { useTranslations } from "next-intl"

// Порог «настоящего» совпадения. На дашборде (TopSouls) планка мягче — 30% —
// потому что задача виджета показать хоть кого-то. Здесь вкладка прямо обещает
// совпадения, поэтому порог выше, и лучше показать пустой экран с призывом
// поправить интересы, чем разбавить список случайными людьми.
const MIN_MATCH_PERCENT = 70

export default function MatchesPage() {
	const t = useTranslations("matches")

	return (
		<div className="py-10">
			<header className="mb-6">
				<h1 className="text-3xl font-bold text-ink mb-1">{t("title")}</h1>
				<p className="text-sm text-muted">{t("subtitle", { percent: MIN_MATCH_PERCENT })}</p>
			</header>

			{/* userCount не задаём: на отдельной странице показываем всех, кто прошёл порог */}
			<Users
				direction="grid2"
				minMatchPercent={MIN_MATCH_PERCENT}
				emptyMessage={t("empty", { percent: MIN_MATCH_PERCENT })}
				emptyAction={{ label: t("editInterests"), href: "/users/me/edit" }}
			/>
		</div>
	)
}
