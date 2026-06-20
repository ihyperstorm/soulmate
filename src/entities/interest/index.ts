export type {IInterest} from './model/Interest'
export type {IUserInterest} from './model/UserInterest'
export {InterestStarRating} from './ui/InterestStarRating'
export {
	calculateMatch,
	calculateMatchPercent,
	userInterestsToWeights,
	type InterestWeights,
	type UserInterestRow,
} from './lib/match'
