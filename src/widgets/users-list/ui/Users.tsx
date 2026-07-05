import {
	calculateCoveragePercent,
	userInterestsToWeights,
	type IdfMap,
} from "@/entities/interest"
import { useCurrentUser } from "@/entities/user"
import { UserCard, type UserCardData } from "@/widgets/user-card"
import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import Link from "next/link"
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
	emptyAction?: { label: string; href: string }
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
	emptyAction,
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

	const handleChatClick = (
		receiverId: string,
		receiverUsername: string,
		draft?: string,
	) => {
		if (!me?._id) return
		const chatId = [me._id, receiverId].sort().join("_")
		const draftParam = draft ? `&draft=${encodeURIComponent(draft)}` : ""
		router.push(
			`/messages?chatId=${chatId}&senderId=${me._id}&receiverId=${receiverId}&username=${encodeURIComponent(receiverUsername)}${draftParam}`,
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
		if (!emptyMessage) return null
		return (
			<div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-line py-10 px-6 text-center">
				<p className="max-w-xs text-sm text-muted">{emptyMessage}</p>
				{emptyAction && (
					<Link
						href={emptyAction.href}
						className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-primary hover:bg-primary-hover transition-colors"
					>
						{emptyAction.label}
					</Link>
				)}
			</div>
		)
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
