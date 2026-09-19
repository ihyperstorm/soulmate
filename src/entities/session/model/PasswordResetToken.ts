import mongoose, {Document, Model, Schema} from 'mongoose'

/**
 * Одноразовый токен сброса пароля.
 *
 * Лежит рядом с сессиями намеренно: это тоже «предъявитель получает доступ»,
 * и правила те же — в базе SHA-256, а не сам токен, короткий срок жизни,
 * одноразовость.
 */
export interface IPasswordResetToken extends Document {
	userId: mongoose.Types.ObjectId
	tokenHash: string
	expiresAt: Date
	/** Проставляется при использовании. Ненулевое значение = токен сгорел. */
	usedAt: Date | null
	createdAt: Date
}

const PasswordResetTokenSchema = new Schema<IPasswordResetToken>(
	{
		userId: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			required: true,
			index: true,
		},
		tokenHash: {
			type: String,
			required: true,
			unique: true,
		},
		expiresAt: {
			type: Date,
			required: true,
		},
		usedAt: {
			type: Date,
			default: null,
		},
	},
	{
		timestamps: {createdAt: true, updatedAt: false},
	},
)

// Протухшие токены удаляет сама Mongo.
PasswordResetTokenSchema.index({expiresAt: 1}, {expireAfterSeconds: 0})

const PasswordResetToken: Model<IPasswordResetToken> =
	mongoose.models.PasswordResetToken ||
	mongoose.model<IPasswordResetToken>(
		'PasswordResetToken',
		PasswordResetTokenSchema,
	)

export default PasswordResetToken
