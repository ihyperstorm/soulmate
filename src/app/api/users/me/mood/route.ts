import { isConversationMood, MAX_MOODS, type ConversationMood } from "@/entities/mood/server"
import { getAuthUserId } from "@/entities/session/server"
import { User } from "@/entities/user/server"
import connectDB from "@/shared/lib/mongodb/db"
import { getTranslations } from "next-intl/server"
import { NextResponse } from "next/server"

type MoodResponse = {
	moods: ConversationMood[]
	moodUpdatedAt: string | null
}

/**
 * Мутация вызывается на каждый тап по чипу, поэтому возвращаем узкий объект,
 * а не весь профиль — гонять его туда-сюда незачем.
 */
const saveMoods = async (userId: string, moods: ConversationMood[]): Promise<MoodResponse | null> => {
	await connectDB()

	// Пустой набор = сброс. Держим moodUpdatedAt согласованным с moods:
	// «нет настроений» и «настроение свежее» не должны сосуществовать.
	const moodUpdatedAt = moods.length > 0 ? new Date() : null

	const updated = await User.findByIdAndUpdate(userId, { moods, moodUpdatedAt }, { new: true }).select("moods moodUpdatedAt").lean()

	if (!updated) return null

	return {
		moods: updated.moods ?? [],
		moodUpdatedAt: updated.moodUpdatedAt ? new Date(updated.moodUpdatedAt).toISOString() : null,
	}
}

// PATCH /api/users/me/mood — задать настроения на сегодня.
// Неизвестные id молча отбрасываются, лишние сверх MAX_MOODS обрезаются:
// клиент уже ограничивает выбор, и падать из-за рассинхрона каталога незачем.
export async function PATCH(request: Request) {
	const t = await getTranslations("api")

	try {
		const authUserId = await getAuthUserId()
		if (!authUserId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
		}

		let body: unknown
		try {
			body = await request.json()
		} catch {
			return NextResponse.json({ error: t("invalidPayload") }, { status: 400 })
		}

		const raw = (body as { moods?: unknown } | null)?.moods
		if (!Array.isArray(raw)) {
			return NextResponse.json({ error: t("invalidPayload") }, { status: 400 })
		}

		const moods: ConversationMood[] = []
		for (const value of raw) {
			if (!isConversationMood(value) || moods.includes(value)) continue
			moods.push(value)
			if (moods.length === MAX_MOODS) break
		}

		const result = await saveMoods(authUserId, moods)
		if (!result) {
			return NextResponse.json({ error: t("userNotFound") }, { status: 404 })
		}

		return NextResponse.json(result)
	} catch (error) {
		console.error("Error saving moods:", error)
		return NextResponse.json({ error: t("serverError") }, { status: 500 })
	}
}

// DELETE /api/users/me/mood — сбросить настроение.
export async function DELETE() {
	const t = await getTranslations("api")

	try {
		const authUserId = await getAuthUserId()
		if (!authUserId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
		}

		const result = await saveMoods(authUserId, [])
		if (!result) {
			return NextResponse.json({ error: t("userNotFound") }, { status: 404 })
		}

		return NextResponse.json(result)
	} catch (error) {
		console.error("Error clearing moods:", error)
		return NextResponse.json({ error: t("serverError") }, { status: 500 })
	}
}
