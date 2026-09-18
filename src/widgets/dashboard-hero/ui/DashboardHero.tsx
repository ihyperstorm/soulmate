"use client"
import { useCurrentUser } from "@/entities/user"
import { useTranslations } from "next-intl"
import Image from "next/image"

export const DashboardHero = () => {
	const { data: user } = useCurrentUser()
	const t = useTranslations("dashboard")
	const name = user?.username

	// min-h растёт вместе с маскотом: иначе карточка ниже картинки и
	// overflow-hidden срезает ему макушку.
	return (
		<section className="relative overflow-hidden rounded-2xl border border-divider bg-linear-to-br from-aura-lilac-soft via-surface to-aura-peach-soft p-6 md:p-8 lg:min-h-64 xl:min-h-72">
			{/* Ширина текста ограничена так, чтобы он не заезжал под маскота. */}
			<div className="relative z-10 max-w-2xl lg:max-w-[62%]">
				<p className="text-sm font-medium text-primary">{name ? t("welcomeBack", { name }) : t("welcome")}</p>
				<h1 className="mt-1 text-3xl md:text-4xl font-bold tracking-tight text-ink">{t("title")}</h1>
				<p className="mt-2 max-w-xl text-base md:text-lg text-subtle">{t("subtitle")}</p>
			</div>

			{/*
				Декоративная иллюстрация: alt="" убирает её из дерева доступности,
				pointer-events-none не даёт перехватывать клики по блоку.
				Слегка выходит за правый нижний край — так она выглядит частью
				карточки, а не наклейкой поверх. Ниже lg скрыта: на узких экранах
				для неё просто нет места рядом с заголовком.
			*/}
			{/*
				sizes обязателен: без него Next строит srcset по всем deviceSizes
				вплоть до ширины исходника, и браузер тянет вариант в разы больше
				нужного — на 1254px-исходнике оптимизатор в dev просто вставал.
			*/}
			<Image
				src="/mascot.png"
				alt=""
				width={576}
				height={576}
				sizes="(min-width: 1280px) 288px, 240px"
				priority
				className="pointer-events-none absolute right-0 bottom-0 hidden h-auto w-60 translate-y-4 select-none lg:block xl:w-72"
			/>
		</section>
	)
}
