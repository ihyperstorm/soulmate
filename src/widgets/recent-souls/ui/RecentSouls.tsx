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
			<h1 className="text-2xl font-semibold text-ink mb-1">Recent souls</h1>
			<div className="mt-4">
				<Users direction="row" onlyUserIds={peerIds} />
			</div>
		</section>
	)
}

export default RecentSouls
