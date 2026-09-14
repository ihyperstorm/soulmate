"use client"

import { useCurrentUser } from "@/entities/user"
import { MoodPicker } from "@/features/mood/set-mood"
import { useTranslations } from "next-intl"

const MoodBoard = () => {
	const { data: me, isLoading } = useCurrentUser()
	const t = useTranslations("moodBoard")

	// До загрузки профиля чипы мигнули бы из «ничего не выбрано» в выбранное.
	if (isLoading || !me?._id) return null

	return (
		<section>
			<h2 className="text-3xl font-bold text-ink mb-1">{t("title")}</h2>
			<p className="text-sm text-muted">{t("subtitle")}</p>

			<div className="mt-5">
				<MoodPicker />
			</div>

			<p className="mt-3 text-xs text-faint">{t("hint")}</p>
		</section>
	)
}

export default MoodBoard
