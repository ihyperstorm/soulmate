"use client"
import { Button } from "@/components/ui/button"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"

const Hero = () => {
	const router = useRouter()
	const t = useTranslations("home.hero")

	return (
		<section className="w-full px-6 pt-20 pb-16 flex flex-col items-center text-center">
			<span className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full text-xs font-medium bg-primary-soft text-primary">
				{t("badge")}
			</span>
			<h1 className="mb-4 bg-linear-to-r from-[#0a66c2] via-[#0f9f6f] to-[#8443ce] bg-size-[200%_auto] bg-clip-text text-5xl font-semibold tracking-tight text-transparent md:text-6xl animate-gradient-x">
				{t("title")}
			</h1>
			<p className="text-base md:text-lg text-muted max-w-xl mb-8">{t("subtitle")}</p>
			<Button size="lg" className="cursor-pointer h-11 px-8 text-base" onClick={() => router.push("/dashboard")}>
				{t("cta")}
			</Button>
		</section>
	)
}

export default Hero
