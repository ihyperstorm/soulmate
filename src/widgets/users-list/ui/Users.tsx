import {
	calculateCoveragePercent,
	userInterestsToWeights,
	type IdfMap,
} from "@/entities/interest"
import { useCurrentUser } from "@/entities/user"
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

type UsersDirection = "row" | "col" | "grid2"

interface UsersProps {
	userCount?: number
	direction?: UsersDirection
	minMatchPercent?: number
	onlyUserIds?: string[]
	emptyMessage?: string
}

const directionClass: Record<UsersDirection, string> = {
	row: "grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3",
	col: "flex flex-col gap-3",
	grid2: "grid grid-cols-1 md:grid-cols-2 gap-4",
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

	const { data: me } = useCurrentUser()

	const { data: idfMap } = useQuery<IdfMap>({
		queryKey: ["interests", "idf"],
		queryFn: () => axios.get("/api/interests/idf").then((res) => res.data),
		staleTime: 5 * 60 * 1000,
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
				calculateCoveragePercent(
					myWeights,
					userInterestsToWeights(user.userInterests),
					idfMap,
				) >= minMatchPercent,
		)
	}

	const visible = candidates.slice(0, userCount ?? candidates.length)

	if (visible.length === 0) {
		return emptyMessage ? <div className="py-6 text-sm text-muted">{emptyMessage}</div> : null
	}

	return (
		<div className={directionClass[direction]}>
			{visible.map((user) => (
				<UserCard
					key={user._id}
					user={user}
					myWeights={myWeights}
					idfMap={idfMap}
					onChatClick={handleChatClick}
				/>
			))}
		</div>
	)
}

export default Users
