import {createHash, randomBytes} from 'node:crypto'
import type mongoose from 'mongoose'
import PasswordResetToken from '../model/PasswordResetToken'

// Node-рантайм: node:crypto + mongoose. В Edge (proxy.ts) не импортировать.

/**
 * Час. Ссылка из письма живёт в истории почты и может быть переслана,
 * поэтому срок короткий — но не настолько, чтобы человек не успел дойти
 * до почты и придумать пароль.
 */
export const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000

const hashToken = (token: string): string =>
	createHash('sha256').update(token).digest('hex')

/** Выпускает токен и возвращает его в открытом виде — для ссылки в письме. */
export const issuePasswordResetToken = async (
	userId: mongoose.Types.ObjectId,
): Promise<string> => {
	const token = randomBytes(32).toString('base64url')

	await PasswordResetToken.create({
		userId,
		tokenHash: hashToken(token),
		expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
	})

	return token
}

export type ConsumeResult =
	| {ok: true; userId: mongoose.Types.ObjectId}
	| {ok: false; reason: 'invalid' | 'expired'}

/**
 * Гасит токен и возвращает владельца.
 *
 * Пометка `usedAt` делается атомарно тем же запросом, что и поиск: фильтр
 * `usedAt: null` гарантирует, что два параллельных запроса с одной ссылкой
 * не сбросят пароль дважды — второй просто не найдёт документ.
 */
export const consumePasswordResetToken = async (
	token: string,
): Promise<ConsumeResult> => {
	const record = await PasswordResetToken.findOneAndUpdate(
		{tokenHash: hashToken(token), usedAt: null},
		{$set: {usedAt: new Date()}},
	)

	if (!record) return {ok: false, reason: 'invalid'}

	// Срок проверяем после захвата: TTL-индекс Mongo чистит с задержкой
	// до минуты, так что протухший документ вполне может ещё лежать.
	if (record.expiresAt.getTime() <= Date.now()) {
		return {ok: false, reason: 'expired'}
	}

	return {ok: true, userId: record.userId}
}

/** Гасит все невыданные токены юзера — после успешной смены пароля. */
export const invalidatePasswordResetTokens = async (
	userId: mongoose.Types.ObjectId,
): Promise<void> => {
	await PasswordResetToken.updateMany(
		{userId, usedAt: null},
		{$set: {usedAt: new Date()}},
	)
}
