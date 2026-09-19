export {getAuthUserId} from './lib/getAuthUserId'
export {clearAuthCookies, setAuthCookies} from './lib/cookies'
export {
	issueSession,
	revokeAllSessions,
	revokeSession,
	rotateSession,
	type IssuedTokens,
	type RotateFailure,
	type RotateResult,
} from './lib/sessions'
export {ACCESS_COOKIE, REFRESH_COOKIE} from './model/cookieNames'
export {
	ACCESS_TOKEN_TTL_SECONDS,
	REFRESH_TOKEN_TTL_SECONDS,
	signToken,
	verifyToken,
} from './model/jwt'
export {default as Session} from './model/Session'
export type {ISession} from './model/Session'
export {
	consumePasswordResetToken,
	invalidatePasswordResetTokens,
	issuePasswordResetToken,
	PASSWORD_RESET_TTL_MS,
	type ConsumeResult,
} from './lib/passwordReset'
export {default as PasswordResetToken} from './model/PasswordResetToken'
export type {IPasswordResetToken} from './model/PasswordResetToken'
