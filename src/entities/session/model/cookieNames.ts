// Имена cookie вынесены в отдельный модуль без импортов: их читает и Edge
// (proxy.ts), и Node (API-роуты), и клиентский интерцептор.

export const ACCESS_COOKIE = 'accessToken'

/**
 * path: '/' обязателен, хотя эндпоинт refresh живёт в /api/auth.
 * Причина: proxy.ts на страничных маршрутах должен видеть наличие этой cookie,
 * чтобы не редиректить на /signin при истёкшем access-токене. Если сузить путь
 * до /api/auth, proxy её не увидит и выкинет пользователя с живой сессией.
 */
export const REFRESH_COOKIE = 'refreshToken'
