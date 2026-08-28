import { getTranslations } from "next-intl/server"

export default async function NotFound() {
	const t = await getTranslations("notFound")

	return (
		<div className="flex-1 flex flex-col justify-center items-center w-full h-full">
			<h1>{t("title")}</h1>
			<p>{t("description")}</p>
		</div>
	)
}
