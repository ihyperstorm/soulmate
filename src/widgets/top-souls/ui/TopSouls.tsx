import { Users } from "@/widgets/users-list"
import { useTranslations } from "next-intl"

const TopSouls = () => {
	const t = useTranslations("topSouls")

	return (
		<section>
			<h1 className="text-3xl font-bold text-ink mb-1">{t("title")}</h1>
			<p className="text-sm text-muted">{t("subtitle")}</p>
			<div className="mt-5">
				<Users
					direction="row"
					minMatchPercent={30}
					emptyMessage={t("empty")}
					emptyAction={{ label: t("editInterests"), href: "/users/me/edit" }}
					userCount={3}
				/>
			</div>
		</section>
	)
}

export default TopSouls
