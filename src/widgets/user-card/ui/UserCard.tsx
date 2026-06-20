import type { IInterest, IUserInterest, InterestWeights } from "@/entities/interest"
import { calculateMatchPercent, userInterestsToWeights } from "@/entities/interest"
import Image from "next/image"
import Link from "next/link"

export type UserInterestWithName = IUserInterest & {
	interestId: string | { _id: string; name: string } | null
}

export interface UserCardData {
	_id: string
	username: string
	avatarUrl?: string
	interests?: IInterest[]
	userInterests?: UserInterestWithName[]
}

interface UserCardProps {
	user: UserCardData
	myWeights?: InterestWeights
	onChatClick?: (userId: string, username: string) => void
}

const FALLBACK_AVATAR = "/9dba1c75826cde0e6cf64a5a8fd25bf6.jpg"

export const UserCard = ({ user, myWeights, onChatClick }: UserCardProps) => {
	const matchPercent = calculateMatchPercent(
		myWeights ?? {},
		userInterestsToWeights(user.userInterests),
	)

	return (
		<div className="bg-surface border border-divider rounded-2xl p-4 transition-colors hover:border-line">
			<div className="flex gap-4 mb-4">
				<div className="shrink-0">
					<Image
						src={user.avatarUrl || FALLBACK_AVATAR}
						alt="avatar"
						width={100}
						height={100}
						className="rounded-2xl object-cover w-16 h-16"
					/>
				</div>
				<div className="flex-1 min-w-0">
					<div className="flex items-center justify-between gap-3 mb-1">
						<h3 className="text-base font-semibold text-ink truncate">{user.username}</h3>
						<span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full bg-accent-soft text-accent text-xs font-medium">
							{matchPercent}% match
						</span>
					</div>
					<div className="flex flex-wrap gap-1.5">
						{user.userInterests?.map((userInterest) =>
							typeof userInterest.interestId === "object" && userInterest.interestId !== null ? (
								<span
									key={userInterest.interestId._id}
									className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-surface-muted text-muted text-xs font-medium"
								>
									{userInterest.interestId.name}
								</span>
							) : null,
						)}
					</div>
				</div>
			</div>
			<div className="flex gap-2">
				<Link
					href={`/users/${user._id}`}
					className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium text-ink bg-surface border border-line hover:bg-surface-muted transition-colors"
				>
					View Profile
				</Link>
				{onChatClick && (
					<button
						onClick={() => onChatClick(user._id, user.username)}
						className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium text-white bg-primary hover:bg-primary-hover transition-colors cursor-pointer"
					>
						Chat
					</button>
				)}
			</div>
		</div>
	)
}

export default UserCard
