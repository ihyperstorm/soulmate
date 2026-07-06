"use client"
import { Users } from "@/widgets/users-list"
import { Button } from "@/components/ui/button"
import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import { useRouter } from "next/navigation"

interface ChatRow {
	peer: { _id: string }
	lastMessageAt: string
}

const RecentSouls = () => {
	const router = useRouter()
	const { data: chats, isLoading } = useQuery<ChatRow[]>({
		queryKey: ["chats"],
		queryFn: () => axios.get("/api/chats").then((res) => res.data),
	})

	if (isLoading) return null

	if (!chats || chats.length === 0) {
		return (
			<section>
				<h1 className="text-3xl font-bold text-ink mb-1">Recent chats</h1>
				<p className="text-sm text-muted">No conversations yet.</p>
				<div className="mt-4 flex flex-col items-center gap-3 rounded-xl border border-dashed border-line py-8 px-6 text-center">
					<p className="text-sm text-muted">
						Break the ice with someone from your matches and start your first chat.
					</p>
					<Button onClick={() => router.push("/users")}>Find people</Button>
				</div>
			</section>
		)
	}

	const peerIds = chats.map((chat) => chat.peer._id)

	return (
		<section>
			<h1 className="text-3xl font-bold text-ink mb-1">Recent chats</h1>
			<p className="text-sm text-muted">People you&apos;ve been talking to.</p>
			<div className="mt-5">
				<Users direction="row" onlyUserIds={peerIds} />
			</div>
		</section>
	)
}

export default RecentSouls
