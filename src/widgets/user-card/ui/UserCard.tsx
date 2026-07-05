import type {
	IInterest,
	IdfMap,
	InterestWeights,
	PopulatedUserInterest,
} from "@/entities/interest"
import {
	calculateCoveragePercent,
	userInterestsToWeights,
} from "@/entities/interest"
import Image from "next/image"
import Link from "next/link"

export interface UserCardData {
	_id: string
	username: string
	avatarUrl?: string
	interests?: IInterest[]
	userInterests?: PopulatedUserInterest[]
}

interface UserCardProps {
	user: UserCardData
	myWeights?: InterestWeights
	idfMap?: IdfMap
	onChatClick?: (userId: string, username: string) => void
}

const FALLBACK_AVATAR = "/9dba1c75826cde0e6cf64a5a8fd25bf6.jpg"
const RARE_IDF_THRESHOLD = 2.0
const MATCH_RING_SIZE = 64
const MATCH_RING_STROKE = 6

type NamedInterest = { _id: string; name: string; idf: number }

const getNamedInterest = (
	ui: PopulatedUserInterest,
	idfMap: IdfMap | undefined,
): NamedInterest | null => {
	if (typeof ui.interestId !== "object" || ui.interestId === null) return null
	const id = ui.interestId._id
	return {
		_id: id,
		name: ui.interestId.name,
		idf: idfMap?.[id] ?? 0,
	}
}

export const UserCard = ({ user, myWeights, idfMap, onChatClick }: UserCardProps) => {
	const theirWeights = userInterestsToWeights(user.userInterests)
	const coveragePercent = calculateCoveragePercent(
		myWeights ?? {},
		theirWeights,
		idfMap,
	)

	const myIds = new Set(Object.keys(myWeights ?? {}))
	const interests = user.userInterests ?? []
	const shared: NamedInterest[] = []
	const other: NamedInterest[] = []
	for (const ui of interests) {
		const named = getNamedInterest(ui, idfMap)
		if (!named) continue
		if (myIds.has(named._id)) shared.push(named)
		else other.push(named)
	}
	shared.sort((a, b) => b.idf - a.idf)

	const matchColorClass =
		coveragePercent >= 70
			? "text-emerald-500"
			: coveragePercent >= 40
				? "text-amber-500"
				: "text-slate-400"

	const sharedCount = shared.length
	const subtitle =
		sharedCount === 0
			? "No shared interests yet"
			: `${sharedCount} shared ${sharedCount === 1 ? "interest" : "interests"}`

	const ringRadius = (MATCH_RING_SIZE - MATCH_RING_STROKE) / 2
	const ringCircumference = 2 * Math.PI * ringRadius
	const ringOffset = ringCircumference * (1 - coveragePercent / 100)

	return (
		<div className="flex flex-col justify-between bg-surface border border-divider rounded-2xl p-5 transition-all hover:border-line hover:-translate-y-0.5 hover:shadow-lg">
			<div className="flex items-center gap-4">
				<Image
					src={user.avatarUrl || FALLBACK_AVATAR}
					alt="avatar"
					width={120}
					height={120}
					className="shrink-0 rounded-2xl object-cover w-16 h-16"
				/>
				<div className="flex-1 min-w-0">
					<h3 className="text-lg font-bold text-ink truncate">{user.username}</h3>
					<p className="text-xs text-muted mt-0.5">{subtitle}</p>
				</div>
				{/* % match — центральный визуальный элемент карточки */}
				<div
					className={`relative shrink-0 ${matchColorClass}`}
					style={{ width: MATCH_RING_SIZE, height: MATCH_RING_SIZE }}
					title={`Covers ${coveragePercent}% of your interests`}
				>
					<svg
						width={MATCH_RING_SIZE}
						height={MATCH_RING_SIZE}
						viewBox={`0 0 ${MATCH_RING_SIZE} ${MATCH_RING_SIZE}`}
						className="-rotate-90"
					>
						<circle
							cx={MATCH_RING_SIZE / 2}
							cy={MATCH_RING_SIZE / 2}
							r={ringRadius}
							fill="none"
							stroke="currentColor"
							strokeWidth={MATCH_RING_STROKE}
							className="text-divider"
						/>
						<circle
							cx={MATCH_RING_SIZE / 2}
							cy={MATCH_RING_SIZE / 2}
							r={ringRadius}
							fill="none"
							stroke="currentColor"
							strokeWidth={MATCH_RING_STROKE}
							strokeLinecap="round"
							strokeDasharray={ringCircumference}
							strokeDashoffset={ringOffset}
						/>
					</svg>
					<div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
						<span className="text-lg font-extrabold text-ink">{coveragePercent}</span>
						<span className="text-[9px] font-semibold uppercase tracking-wide text-muted">
							match
						</span>
					</div>
				</div>
			</div>

			{shared.length > 0 && (
				<div className="mt-4">
					<p className="text-[11px] uppercase tracking-wider text-muted font-semibold mb-2">
						You both like
					</p>
					<div className="flex flex-wrap gap-1.5">
						{shared.map((interest) => {
							const isRare = interest.idf >= RARE_IDF_THRESHOLD
							return (
								<span
									key={interest._id}
									className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-medium ${
										isRare
											? "bg-amber-100 text-amber-700 ring-1 ring-amber-300"
											: "bg-accent-soft text-accent"
									}`}
									title={isRare ? "Rare interest" : undefined}
								>
									{isRare ? (
										<span aria-hidden>🔥</span>
									) : (
										<svg
											className="w-3 h-3"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											strokeWidth="3"
											strokeLinecap="round"
											strokeLinejoin="round"
										>
											<polyline points="20 6 9 17 4 12" />
										</svg>
									)}
									{interest.name}
								</span>
							)
						})}
					</div>
				</div>
			)}

			{other.length > 0 && (
				<div className="mt-3">
					<p className="text-[11px] uppercase tracking-wider text-muted font-semibold mb-2">
						Also into
					</p>
					<div className="flex flex-wrap gap-1.5">
						{other.slice(0, 6).map((interest) => (
							<span
								key={interest._id}
								className="inline-flex items-center px-2 py-0.5 rounded-full bg-surface-muted text-muted text-xs"
							>
								{interest.name}
							</span>
						))}
						{other.length > 6 && (
							<span className="inline-flex items-center px-2 py-0.5 rounded-full text-muted text-xs">
								+{other.length - 6}
							</span>
						)}
					</div>
				</div>
			)}

			<div className="mt-5 flex flex-col gap-2">
				{onChatClick && (
					<button
						onClick={() => onChatClick(user._id, user.username)}
						className="w-full inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-primary hover:bg-primary-hover transition-colors cursor-pointer"
					>
						Start chat
					</button>
				)}
				<Link
					href={`/users/${user._id}`}
					className="text-center text-xs text-muted hover:text-ink transition-colors"
				>
					View full profile
				</Link>
			</div>
		</div>
	)
}

export default UserCard
