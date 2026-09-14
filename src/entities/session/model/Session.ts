import mongoose, {Document, Model, Schema} from 'mongoose'

/**
 * Refresh-сессия. Хранится в БД именно для того, чтобы её можно было отозвать:
 * access-токен stateless и до истечения неотзываем, а вот сессию можно удалить
 * (logout, «выйти со всех устройств», смена пароля).
 *
 * В базе лежит SHA-256 от токена, а не сам токен: утечка коллекции не должна
 * давать возможность войти под пользователем.
 */
export interface ISession extends Document {
	userId: mongoose.Types.ObjectId
	tokenHash: string
	expiresAt: Date
	userAgent: string
	createdAt: Date
	/**
	 * Когда сессия была провёрнута (её токен обменяли на новый).
	 * Не удаляем такие записи сразу — по ним детектируется повторное
	 * использование украденного токена, см. rotateSession.
	 */
	rotatedAt: Date | null
}

const SessionSchema = new Schema<ISession>(
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
		userAgent: {
			type: String,
			default: '',
		},
		rotatedAt: {
			type: Date,
			default: null,
		},
	},
	{
		timestamps: {createdAt: true, updatedAt: false},
	},
)

// TTL-индекс: Mongo сама удаляет протухшие сессии, отдельный крон не нужен.
// expireAfterSeconds: 0 = «удалить, когда наступит время в expiresAt».
SessionSchema.index({expiresAt: 1}, {expireAfterSeconds: 0})

const Session: Model<ISession> =
	mongoose.models.Session || mongoose.model<ISession>('Session', SessionSchema)

export default Session
