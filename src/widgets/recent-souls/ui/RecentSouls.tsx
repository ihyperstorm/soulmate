"use client"
import { Users } from "@/widgets/users-list"
import { Button } from "@/components/ui/button"
import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"

interface ChatRow {
	peer: { _id: string }
	lastMessageAt: string
}

const RecentSouls = () => {
	const router = useRouter()
	const t = useTranslations("recentSouls")
	const { data: chats, isLoading } = useQuery<ChatRow[]>({
		queryKey: ["chats"],
		queryFn: () => axios.get("/api/chats").then((res) => res.data),
	})

	if (isLoading) return null

	if (!chats || chats.length === 0) {
		return (
			<section>
				<h1 className="text-3xl font-bold text-ink mb-1">{t("title")}</h1>
				<p className="text-sm text-muted">{t("emptySubtitle")}</p>
				<div className="mt-4 flex flex-col items-center gap-3 rounded-xl border border-dashed border-line py-8 px-6 text-center">
					<p className="text-sm text-muted">{t("emptyHint")}</p>
					<Button onClick={() => router.push("/users")}>{t("findPeople")}</Button>
				</div>
			</section>
		)
	}

	const peerIds = chats.map((chat) => chat.peer._id)

	return (
		<section>
			<h1 className="text-3xl font-bold text-ink mb-1">{t("title")}</h1>
			<p className="text-sm text-muted">{t("subtitle")}</p>
			<div className="mt-5">
				<Users direction="row" onlyUserIds={peerIds} />
			</div>
		</section>
	)
}

export default RecentSouls
