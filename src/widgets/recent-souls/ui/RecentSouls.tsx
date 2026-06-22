"use client"
import { Users } from "@/widgets/users-list"
import { useQuery } from "@tanstack/react-query"
import axios from "axios"

interface ChatRow {
	peer: { _id: string }
	lastMessageAt: string
}

const RecentSouls = () => {
	const { data: chats, isLoading } = useQuery<ChatRow[]>({
		queryKey: ["chats"],
		queryFn: () => axios.get("/api/chats").then((res) => res.data),
	})

	if (isLoading) return null
	if (!chats || chats.length === 0) return null

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
