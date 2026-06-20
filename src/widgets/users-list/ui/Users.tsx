import { calculateMatchPercent, userInterestsToWeights } from "@/entities/interest"
import { UserCard, type UserCardData } from "@/widgets/user-card"
import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import { useRouter } from "next/navigation"

interface IUser extends UserCardData {
	email: string
	bio: string
	createdAt: string
	updatedAt: string
}

type UsersDirection = "row" | "col"

interface UsersProps {
	userCount?: number
	direction?: UsersDirection
	minMatchPercent?: number
	onlyUserIds?: string[]
	emptyMessage?: string
}

const directionClass: Record<UsersDirection, string> = {
	row: "flex flex-row gap-3",
	col: "flex flex-col gap-3",
}

const Users = ({
	userCount,
	direction = "col",
	minMatchPercent,
	onlyUserIds,
	emptyMessage,
}: UsersProps) => {
	const router = useRouter()

	const {
		data: users,
		isLoading,
		isError,
	} = useQuery<IUser[]>({
		queryKey: ["users"],
		queryFn: () => axios.get("/api/users").then((res) => res.data),
	})

	const { data: me } = useQuery<IUser>({
		queryKey: ["me"],
		queryFn: () => axios.get("/api/users/me").then((res) => res.data),
	})

	const handleChatClick = (receiverId: string, receiverUsername: string) => {
		if (!me?._id) return
		const chatId = [me._id, receiverId].sort().join("_")
		router.push(
			`/messages?chatId=${chatId}&senderId=${me._id}&receiverId=${receiverId}&username=${encodeURIComponent(receiverUsername)}`,
		)
	}

	if (isLoading)
		return (
			<div className="flex justify-center items-center py-20 text-muted text-sm">Loading...</div>
		)
	if (isError)
		return (
			<div className="flex justify-center items-center py-20 text-danger text-sm">
				Error. Please try again later.
			</div>
		)

	const myWeights = userInterestsToWeights(me?.userInterests)

	let candidates = users?.filter((user) => user._id !== me?._id) ?? []

	if (onlyUserIds) {
		const byId = new Map(candidates.map((u) => [u._id, u]))
		candidates = onlyUserIds.map((id) => byId.get(id)).filter((u): u is IUser => u !== undefined)
	}

	if (typeof minMatchPercent === "number") {
		candidates = candidates.filter(
			(user) =>
				calculateMatchPercent(myWeights, userInterestsToWeights(user.userInterests)) >=
				minMatchPercent,
		)
	}

	const visible = candidates.slice(0, userCount ?? candidates.length)

	if (visible.length === 0) {
		return emptyMessage ? <div className="py-6 text-sm text-muted">{emptyMessage}</div> : null
	}

	return (
		<div className={directionClass[direction]}>
			{visible.map((user) => (
				<UserCard key={user._id} user={user} myWeights={myWeights} onChatClick={handleChatClick} />
			))}
		</div>
	)
}

export default Users
