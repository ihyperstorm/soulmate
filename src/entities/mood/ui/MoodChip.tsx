"use client"

import { cn } from "@/lib/utils"
import { useTranslations } from "next-intl"
import { MOOD_EMOJI } from "../model/moods"
import type { ConversationMood } from "../model/types"

/** shared — совпало с моим (акцент), muted — чужое настроение (приглушённо). */
type MoodChipVariant = "shared" | "muted"

type Props = {
	mood: ConversationMood
	variant?: MoodChipVariant
	/** Передан → чип становится кнопкой-тогглом (пикер настроения). */
	onSelectAction?: (mood: ConversationMood) => void
	selected?: boolean
	className?: string
}

const BASE = "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium"

const ACCENT = "bg-primary-soft text-primary border border-primary/15"
const MUTED = "bg-surface-muted text-muted border border-transparent"

export function MoodChip({ mood, variant = "shared", onSelectAction, selected = false, className }: Props) {
	const t = useTranslations("mood")
	const label = t(`${mood}.label`)
	const emoji = MOOD_EMOJI[mood]

	if (onSelectAction) {
		return (
			<button
				type="button"
				aria-pressed={selected}
				title={t(`${mood}.description`)}
				onClick={() => onSelectAction(mood)}
				className={cn(
					BASE,
					"cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-soft",
					selected ? ACCENT : cn(MUTED, "hover:text-ink hover:border-line"),
					className,
				)}
			>
				<span aria-hidden>{emoji}</span>
				{label}
			</button>
		)
	}

	return (
		<span className={cn(BASE, variant === "shared" ? ACCENT : MUTED, className)}>
			<span aria-hidden>{emoji}</span>
			{label}
		</span>
	)
}
