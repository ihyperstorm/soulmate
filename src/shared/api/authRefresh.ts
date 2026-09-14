import axios, {AxiosError, type InternalAxiosRequestConfig} from 'axios'

const REFRESH_URL = '/api/auth/refresh'
const SIGNIN_PATH = '/signin'

// Эндпоинты, 401 от которых обновлять бессмысленно: сам refresh, вход,
// регистрация и выход. Иначе получили бы рекурсию.
const SKIP_REFRESH = [REFRESH_URL, '/api/auth/login', '/api/auth/register', '/api/auth/logout']

type RetriableConfig = InternalAxiosRequestConfig & {_authRetried?: boolean}

/**
 * Один общий refresh на все параллельные 401. Без этого страница, которая
 * грузит /api/users/me, /api/users и /api/interests/idf одновременно, устроила
 * бы три ротации подряд — а на сервере есть окно гонки только на 30 секунд.
 */
let inFlight: Promise<void> | null = null

const refreshOnce = (): Promise<void> => {
	if (!inFlight) {
		inFlight = axios
			.post(REFRESH_URL)
			.then(() => undefined)
			.finally(() => {
				inFlight = null
			})
	}
	return inFlight
}

const redirectToSignIn = () => {
	if (typeof window === 'undefined') return
	if (window.location.pathname === SIGNIN_PATH) return
	// Полная навигация, а не router.replace: интерцептор живёт вне React,
	// и на этот момент кэш react-query уже содержит мусор от мёртвой сессии.
	window.location.replace(SIGNIN_PATH)
}

const SESSION_URL = '/api/auth/session'
const PROBE_THROTTLE_MS = 5_000

let lastProbeAt = 0

/**
 * Пинг защищённого эндпоинта, чтобы интерцептор при необходимости обновил
 * access-токен.
 *
 * Нужен клиентам, которые не ходят через axios: `EventSource` в ChatBox
 * переподключается сам, но при истёкшем access-токене каждый его реконнект
 * получает 401, и чат навсегда остаётся «оффлайн». Один пинг через axios
 * обновляет cookie, после чего собственный реконнект EventSource проходит.
 *
 * Дросселируем: EventSource ретраится примерно раз в 3 секунды.
 */
export const ensureFreshSession = async (): Promise<void> => {
	const now = Date.now()
	if (now - lastProbeAt < PROBE_THROTTLE_MS) return
	lastProbeAt = now
	try {
		await axios.get(SESSION_URL)
	} catch {
		// Не удалось — интерцептор уже увёл на /signin, если сессия мертва.
	}
}

let installed = false

/**
 * Ставит интерцептор на дефолтный инстанс axios — тот самый, которым уже
 * пользуются все хуки (`axios.get('/api/users')`), так что менять места вызова
 * не нужно.
 *
 * Логика: 401 → один раз попробовать /api/auth/refresh → повторить запрос.
 * Если refresh вернул reason 'missing', значит refresh-cookie нет вовсе —
 * это анонимный посетитель на публичной странице, и уводить его на /signin
 * нельзя, просто пробрасываем исходный 401 (useCurrentUser вернёт null).
 * Любая другая причина означает, что сессия была и умерла → на /signin.
 */
export const installAuthRefresh = (): void => {
	if (installed) return
	installed = true

	axios.interceptors.response.use(
		response => response,
		async (error: AxiosError<{reason?: string}>) => {
			const config = error.config as RetriableConfig | undefined
			const url = config?.url ?? ''

			const shouldTry =
				error.response?.status === 401 &&
				config &&
				!config._authRetried &&
				!SKIP_REFRESH.some(skip => url.startsWith(skip))

			if (!shouldTry) return Promise.reject(error)

			config._authRetried = true

			try {
				await refreshOnce()
			} catch (refreshError) {
				const reason =
					refreshError instanceof AxiosError
						? refreshError.response?.data?.reason
						: undefined
				if (reason !== 'missing') redirectToSignIn()
				return Promise.reject(error)
			}

			return axios.request(config)
		},
	)
}
