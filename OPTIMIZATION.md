# Optimization & Hardening Plan

Аудит проекта на безопасность, производительность и code quality.
Каждая находка помечена:

**Серьёзность:** 🔴 Critical · 🟠 High · 🟡 Medium · 🟢 Low
**Стоимость:** 💸 Cheap (≤ 30 мин) · 💰 Medium (≤ день) · 💎 Expensive (несколько дней / внешние сервисы)

---

## 📊 Overview

Закрытые пункты из этого файла удаляются, а не зачёркиваются — ниже только то,
что ещё открыто.

| Раздел | Открыто | Разбивка |
|---|---|---|
| 🔒 Безопасность | 9 | 1×🟠 · 8×🟡 |
| ⚡ Производительность | 10 | 4×🟠 · 4×🟡 · 2×🟢 |
| 📐 Best Practices | 11 | 5×🟡 · 6×🟢 |
| **Итого** | **30** | 5×🟠 · 17×🟡 · 8×🟢 |

**🔴 не осталось.** Открытое — уже не про «дырку», а про закалку: лимиты,
rate limiting, пагинация.

### ✅ Закрыто

| Пункт | Чем закрыт |
|---|---|
| 🔴 Password hash утекал в ответах `login` / `register` | Оба роута отдают профиль без поля `password` |
| 🔴 `PATCH /api/users/[id]` правил чужой профиль | Сверка `getAuthUserId()` с `id` из маршрута: нет токена → 401, чужой id → 403 |
| 🟠 Полноценный refresh-token flow | Модель `Session` в БД, короткий access (15 мин) + refresh (30 дней), ротация с окном на гонку, детект повторного использования, `POST /api/auth/refresh`, axios-интерцептор с молчаливым обновлением |
| 🟡 Нет UI для «выйти со всех устройств» | `LogoutEverywhereButton` в `/settings` → `POST /api/auth/logout` с `{all: true}` |
| 🟡 Нет смены пароля | `PATCH /api/auth/password` + форма в `/settings`. Отзывает все сессии и тут же выдаёт новую текущему устройству |
| 🟠 Avatar upload без лимита размера и без проверки типа | `shared/lib/avatarUpload.ts`: лимит 5 МБ → 413, тип по **сигнатуре файла** (не по имени и не по `file.type`) → 415. Расширение тоже берётся из сигнатуры. Дубль кода в двух роутах убран |

### 🔜 Следующий шаг

**Пункт 6 — rate limiting.** Он поднялся в приоритете: с появлением
`forgot-password` приложение умеет слать письма с нашего домена на любой
названный адрес без ограничений. До публичного запуска это обязательно.

Дальше по дешевизне — **пункт 6 производительности** (N+1 в `/api/chats`) и
**пункт 9 безопасности** (убрать `userId` из `localStorage` и из тела запроса
`/api/interests`).

---

## 🎯 Top-10 «сделать первым»

Если у тебя ограничено время — сначала это. Сортировано по соотношению impact/effort.

| # | Что | Сложность | Серьёзность |
|---|---|---|---|
| 6 | Заменить N+1 unread counts в `/api/chats` на одну aggregation | 💸 | 🟠 |
| 7 | Удалить `localStorage.setItem('userId')` из `SignUpForm` и `InterestsPage` | 💸 | 🟡 |
| 9 | Пагинация на `GET /api/users` + серверный фильтр по `userIds` | 💰 | 🟠 |
| 10 | Rate limiting на `/api/auth/login` (5 попыток / 15 мин) | 💰 | 🟠 |

---

## 🔒 Безопасность

### 🟠 6. Нет rate limiting на login / register / forgot-password
- **Где:** `src/app/api/auth/login/route.ts`, `register/route.ts`, `forgot-password/route.ts`
- **Что:** Можно перебирать пароли и дёргать рассылку писем без ограничений.
- **Почему важно:** Помимо brute-force паролей появился второй вектор: `forgot-password` отправляет письмо с нашего домена на любой адрес, который назовёт вызывающий. Это и способ спамить чужие ящики нашими руками, и прямой путь угробить репутацию домена жалобами — после чего в спам начнут падать уже все письма, включая сбросы паролей.
- **Фикс:** Самое простое в твоём стеке — in-memory rate limiter в `proxy.ts` (Map<IP, attemptCount>). Лимит 5/15 мин на login, отдельный и более жёсткий на forgot-password. Для прода — `@upstash/ratelimit` с Redis.
- **💰 Medium** — in-memory ~1 час, Redis-based ~полдня.

### 🟡 7. Слабая политика паролей
- **Где:** `src/features/auth/sign-up/model/registerSchema.ts:7`, `loginSchema.ts:5`
- **Что:** `min(3)` — три символа, без требований к сложности.
- **Почему важно:** Пароль `aaa` проходит. Brute-force за секунды.
- **Фикс:** `password: yup.string().required().min(8).matches(/[A-Z]/, 'need uppercase').matches(/[0-9]/, 'need number')`. На login оставить только `min(1)`, чтобы не блокировать существующих юзеров.
- **💸 Cheap** — пара строк yup.

### 🟡 8. JWT-секрет не валидируется
- **Где:** `src/entities/session/model/jwt.ts:3`
- **Что:** `process.env.JWT_SECRET!` с non-null assertion. Если переменная не задана — `signToken` выдаст пустой ключ (или упадёт неоднозначно).
- **Почему важно:** Хрупкая конфигурация.
- **Фикс:** Перенести валидацию на первый вызов (как сделали с `db.ts`): если `!JWT_SECRET || JWT_SECRET.length < 32`, кидать понятную ошибку.
- **💸 Cheap** — 4 строки.

### 🟡 9. localStorage хранит userId
- **Где:** `src/features/auth/sign-up/ui/SignUpForm.tsx:50`, `src/views/interests/ui/InterestsPage.tsx:140`
- **Что:** После регистрации `localStorage.setItem('userId', ...)`. Потом читается в InterestsPage и шлётся в API.
- **Почему важно:** При XSS легко украсть. Главное — это **дублирование auth state**: серверу не нужен userId от клиента, он его знает из JWT. Сейчас API `/api/interests` POST принимает `userId` из body — это самая дыра.
- **Фикс:** Удалить весь `localStorage` для userId. В API `/api/interests` POST — получать userId через `getAuthUserId()`, удалить параметр из body.
- **💸 Cheap** — два файла фронта + один бэк-handler.

### 🟡 10. Нет CSRF protection
- **Где:** Все POST/PATCH эндпоинты
- **Что:** Cookie с `sameSite: 'lax'` блокирует кросс-сайт POST в большинстве сценариев. Но GET — нет, и любой `<form action="...">` на другом сайте может submit'нуть POST с cookie.
- **Почему важно:** Атакующий может через `<img src=...>` или auto-submit form вызвать действия от имени юзера (отправить сообщение, поменять профиль).
- **Фикс (дёшево):** Проверка `Origin`/`Referer` header в proxy: если не наш домен → 403.
  ```ts
  const origin = req.headers.get('origin')
  if (origin && new URL(origin).host !== req.nextUrl.host) return new Response('Forbidden', {status: 403})
  ```
- **Фикс (правильно):** CSRF-токены через `next-csrf` или вручную.
- **💸 Cheap (origin check)** / **💰 Medium (tokens)**

### 🟡 12. Сообщения об ошибках светят детали БД
- **Где:** Большинство catch-блоков в `/api/*` — `error: error instanceof Error ? error.message : '...'`
- **Что:** Сырое сообщение Mongo (типа `E11000 duplicate key error... index: email_1`) уходит клиенту.
- **Почему важно:** Information disclosure — атакующий узнаёт имена полей, констрейнты, типы ошибок.
- **Фикс:** Логировать full error серверно, отдавать клиенту generic-сообщение:
  ```ts
  console.error('Auth error:', error)
  return NextResponse.json({error: 'Internal server error'}, {status: 500})
  ```
- **💸 Cheap** — пройтись по всем routes (≈10 файлов).

### 🟡 13. Нет валидации длины полей профиля
- **Где:** `/api/users/me/route.ts:80-87` (bio, location, birthday, username)
- **Что:** Принимаются без max-length и формата.
- **Почему важно:** Юзер может вставить 1 МБ био → bloated БД + большие ответы API.
- **Фикс:** `if (bio.length > 500) ...`, `if (username.length > 50) ...`. Лучше — общая Yup-схема `updateProfileSchema`.
- **💸 Cheap** — 10 строк проверок.

### 🟡 14. Email без подтверждения
- **Где:** `/api/auth/register`
- **Что:** Юзер может зарегистрироваться с `fake@whatever.com` или просто с опечаткой в адресе.
- **Почему важно:** Само по себе — спам-аккаунты, для MVP терпимо. Но это **предусловие восстановления пароля** (см. `FEEDBACK.md`, находка от 19.09.2026): письмо сброса уйдёт на адрес, которым человек не владеет, и запертым снаружи останется как раз тот, кому восстановление нужнее всего. Поэтому 🟡, а не 🟢.
- **Фикс:** Email confirmation flow с одноразовой ссылкой. **Подешевело:** мейлер (`shared/lib/mailer`) и модель одноразового токена (`PasswordResetToken`) уже написаны для сброса пароля — здесь тот же паттерн, меняется только смысл токена. Тем же заходом закрывается подтверждение НОВОГО адреса при смене почты, которое сейчас переключается сразу.
- **💰 Medium** — уже не Expensive: инфраструктура на месте, остаются модель, два роута и экран.

### 🟡 15. Нет лимита на размер тела запроса
- **Где:** Все роуты с `request.formData()` / `request.json()`
- **Что:** Лимит аватара в 5 МБ проверяется **после** `request.formData()`, а тот уже вычитал тело целиком. То есть на диск гигабайт не запишется, а вот в память сервера попадёт.
- **Почему важно:** Disk DoS закрыт, memory DoS — нет. В App Router у Route Handlers нет встроенного аналога `bodyParser.sizeLimit` из Pages API, поэтому средствами приложения это до конца не решается.
- **Фикс:** Предел на уровне прокси/платформы: `client_max_body_size` в nginx, лимит запроса у хостинга. Дополнительно можно читать тело потоком и обрывать по счётчику байт, но для MVP это перебор.
- **💰 Medium** — зависит от площадки деплоя, кодом не закрывается.

---

## ⚡ Производительность

### 🟠 1. N+1 query в `/api/chats` для unread counts
- **Где:** `src/app/api/chats/route.ts:68-88`
- **Что:** `Promise.all(rows.map(... Message.countDocuments()))` — N запросов вместо одного.
- **Почему важно:** При 100 чатах — 100 DB-запросов на каждый GET. Latency растёт линейно.
- **Фикс:** Одна aggregation:
  ```ts
  const counts = await Message.aggregate([
    {$match: {chatId: {$in: chatIds}, receiverId: authUserId, createdAt: {$gt: someDate}}},
    {$group: {_id: '$chatId', count: {$sum: 1}}}
  ])
  ```
  Затем lookup count'ов в Map по chatId.
- **💸 Cheap** — 15 строк, заменит блок Promise.all.

### 🟠 2. Нет пагинации на `/api/users`
- **Где:** `src/app/api/users/route.ts:10`
- **Что:** `User.find().select('-password').lean()` без `limit`. При 10к юзерах фронт получит всех.
- **Почему важно:** Memory spike на сервере, медленный TTFB, тяжёлый payload (десятки MB).
- **Фикс:** Добавить `?page&limit` query-params, default `limit: 30`. Вернуть `{users, total, hasMore}`.
- **💰 Medium** — серверная пагинация + клиентский infinite-scroll или page navigation.

### 🟠 3. Клиент фильтрует всех юзеров в браузере
- **Где:** `src/widgets/users-list/ui/Users.tsx:84-100`
- **Что:** Фетчит всех через `/api/users`, потом в JS фильтрует по `onlyUserIds` и `minMatchPercent`.
- **Почему важно:** Связано с предыдущим — даже если бы пагинация была, фильтр должен жить на сервере. Иначе с 10к юзеров JS просядет.
- **Фикс:** Поддержать `?userIds=a,b,c&minMatchPercent=70` на сервере. Match-расчёт перенести на сервер (там IDF уже в памяти, своих интересов знает из JWT).
- **💰 Medium** — серверный матч-движок + рефактор Users.tsx.

### 🟠 4. SSE-брокер в памяти — не масштабируется
- **Где:** `src/entities/chat/lib/broker.ts:5`
- **Что:** `Map` в памяти процесса. При деплое на > 1 инстанс чат разваливается между ними.
- **Почему важно:** Render free-tier — один инстанс, ок. Render paid auto-scale или Fly.io — сломается.
- **Фикс:** Redis pub/sub (Upstash bесплатный tier подходит). `publishChatEvent` → Redis publish, `subscribeToChat` → Redis subscribe.
- **💎 Expensive** — Upstash аккаунт + ENV vars + ~150 строк кода.

### 🟡 5. IDF-кэш тоже in-memory
- **Где:** `src/entities/interest/lib/idf.ts:6-31`
- **Что:** Module-level cache, TTL 5 мин. Каждый инстанс кэширует отдельно.
- **Почему важно:** На одном инстансе ок (current setup). На > 1 — inconsistencies в матчах между запросами.
- **Фикс:** Redis-кэш с тем же TTL, либо вычислять при изменениях интересов (на запись добавлять invalidate).
- **💰 Medium** — если Redis уже подключён ради SSE.

### 🟡 6. Promise.all без error boundaries
- **Где:** `src/app/api/chats/route.ts:68`
- **Что:** Если один `Message.countDocuments` бросит — весь `Promise.all` falls, эндпоинт 500'ит.
- **Почему важно:** Один битый чат ломает список всех чатов.
- **Фикс:** `Promise.allSettled` или, ещё лучше, одна aggregation (см. п.1).
- **💸 Cheap** — заодно с п.1.

### 🟡 7. Missing composite index для unread queries
- **Где:** `src/entities/message/model/Message.ts`
- **Что:** Есть `(receiverId, createdAt)`, но для `{chatId, receiverId, createdAt > lastReadAt}` нужен `(chatId, receiverId, createdAt)`.
- **Почему важно:** На больших объёмах сообщений Mongo пойдёт по `(receiverId, createdAt)` и потом filter по chatId — медленно.
- **Фикс:** Добавить `MessageSchema.index({chatId: 1, receiverId: 1, createdAt: 1})`.
- **💸 Cheap** — 1 строка.

### 🟡 8. Image — нет `priority`/`sizes` для outdoor аватаров
- **Где:** `src/widgets/header/ui/Header.tsx:46-51`, `UserCard.tsx`
- **Что:** `<Image>` без `priority` для above-fold и без `sizes` для responsive.
- **Почему важно:** Cumulative Layout Shift (CLS) метрика страдает.
- **Фикс:** В Header добавить `priority`. В карточках — `sizes="(max-width: 768px) 80px, 120px"`.
- **💸 Cheap** — 5 props.

### 🟢 9. lucide-react tree-shake — проверить bundle
- **Где:** `src/widgets/header/ui/Header.tsx:9`
- **Что:** Named imports должны tree-shake'иться, но в lucide-react 1.x возможны нюансы.
- **Почему важно:** Если попадает вся библиотека — +50KB в bundle.
- **Фикс:** `bun add -D @next/bundle-analyzer`, прогнать `ANALYZE=true bun run build`. Если lucide попадает целиком — `import LogIn from 'lucide-react/dist/esm/icons/log-in'` или мигрировать на современный lucide.
- **💸 Cheap (проверка)** — 15 минут.

### 🟢 10. /api/interests возвращает все интересы без лимита
- **Где:** `src/app/api/interests/route.ts:11`
- **Что:** `Interest.find().sort({name: 1})` без limit.
- **Почему важно:** Минимально — если интересов <500, ок. При росте — лимит.
- **Фикс:** Через год — добавить пагинацию или поиск по prefix.
- **💸 Cheap** — для MVP не нужен.

---

## 📐 Best Practices

### 🟡 1. Нет error.tsx / Error Boundary
- **Где:** Нигде в `src/app/`
- **Что:** Если страница throw'нет — белый экран.
- **Почему важно:** UX. Юзеру нужен fallback с «что-то пошло не так, попробуй обновить».
- **Фикс:** Создать `src/app/error.tsx` с минимальным fallback UI. Опционально — отдельные для route groups.
- **💸 Cheap** — один файл, 30 строк.

### 🟡 2. console.log/error в продакшене
- **Где:** ~24 места — `src/widgets/chat-box/ui/ChatBox.tsx:72,125,131`, `src/app/api/*` catch-блоки и пр.
- **Что:** Debug-логи попадают в браузер-консоль клиента и в логи сервера.
- **Почему важно:** Шум в логах, потенциально утекает контекст ошибок (см. п.12 в Security).
- **Фикс:** Wrap'нуть отладочные `console.log` в `if (process.env.NODE_ENV !== 'production')`. Для прод-логирования — pino/winston со structured logs.
- **💸 Cheap (debug-обёртка)** / **💰 Medium (structured logger)**

### 🟡 3. Username не валидируется на длину/формат
- **Где:** `src/features/auth/sign-up/model/registerSchema.ts:4`
- **Что:** `yup.string().required()` — и всё. Можно `username: ''` или 1MB строку.
- **Почему важно:** UI-баги (вёрстка ломается на длинном username), потенциальный XSS если где-то рендерится без escape.
- **Фикс:** `min(2).max(50).matches(/^[a-zA-Z0-9._-]+$/, 'letters, digits, ._- only')`. Заодно на сервере в register.
- **💸 Cheap** — 2 строки в schema + 3 на сервере.

### 🟡 4. Birthday без валидации
- **Где:** `/api/users/me/route.ts:87`
- **Что:** `new Date(birthday)` без проверки. Invalid Date пишется в БД.
- **Почему важно:** Garbage в БД, поломается сортировка/фильтр по возрасту.
- **Фикс:** Проверка `!isNaN(date.getTime())` + возраст в [13, 120] лет.
- **💸 Cheap** — 5 строк.

### 🟡 5. Нет лимита на длину сообщения
- **Где:** `src/app/api/messages/route.ts:14-20`
- **Что:** `text.trim()` проверяется на пустоту, но не на max-length.
- **Почему важно:** Можно отправить 1MB текста — bloated БД, тяжёлый SSE-event.
- **Фикс:** `if (text.trim().length > 5000)` → 400.
- **💸 Cheap** — 1 строка.

### 🟢 6. Hardcoded fallback-аватар повторяется 5 раз
- **Где:** `UserCard.tsx:33`, `Header.tsx:47`, `ChatsList.tsx:49`, `UserDetailPage.tsx:74`, `UserEditPage.tsx:102`
- **Что:** Строка `"/9dba1c75826cde0e6cf64a5a8fd25bf6.jpg"` копипастится.
- **Почему важно:** Maintenance — если поменять fallback, нужно править 5 файлов.
- **Фикс:** `src/shared/lib/constants.ts` → `export const DEFAULT_AVATAR_URL = '...'`. Заменить во всех местах.
- **💸 Cheap** — 5 минут.

### 🟢 7. Mixed quote styles, indent, semicolons
- **Где:** Везде понемногу.
- **Что:** Часть файлов на `'`, часть на `"`, часть с semi, часть без.
- **Почему важно:** Шумные diff-ы, code review устаёт.
- **Фикс:** `bun add -D prettier`, минимальный `.prettierrc`, прогнать `bunx prettier --write "src/**/*.{ts,tsx}"`. Затем pre-commit hook через husky.
- **💸 Cheap** — 30 минут.

### 🟢 8. Loading states непоследовательны
- **Где:** `src/views/*`, `src/widgets/*`
- **Что:** Где-то `Loading...` текстом, где-то ничего, где-то Suspense fallback null.
- **Почему важно:** UX скачет.
- **Фикс:** Один компонент `<Spinner />` или `<Skeleton />` в `src/shared/ui/`, использовать везде.
- **💸 Cheap** — компонент + замены.

### 🟢 9. Accessibility — частично страдает
- **Где:** Кнопки без `aria-label`, focus-ring не везде, `<button>` против `<a>` путаница.
- **Почему важно:** Screen reader-юзеры + клавиатурная навигация.
- **Фикс:** Прогнать https://wave.webaim.org/ на live-странице, исправить топ-замечания.
- **💸 Cheap (audit)** / **💰 Medium (полный фикс)**

### 🟢 10. Magic numbers
- **Где:** `ChatBox.tsx:91` (2500ms), `messages/typing/route.ts:7` (8000ms), `stream/route.ts:61` (25000ms)
- **Что:** Таймауты разбросаны числами.
- **Почему важно:** Если решишь синхронизировать typing-ping с TTL — нужно править 3 места.
- **Фикс:** В `src/entities/chat/lib/constants.ts` — `TYPING_TTL_MS`, `TYPING_PING_INTERVAL_MS`, `SSE_HEARTBEAT_MS`.
- **💸 Cheap** — extract constants.

### 🟢 11. Smart pagination на `/api/interests` будет нужна, не сейчас
- См. Performance п.10.

---

## 📦 Уже обсуждали ранее (для контекста)

Эти пункты ты уже знаешь — здесь как памятка:

- **Cookie `secure: true` для всех окружений** → уже починено (теперь зависит от `NODE_ENV`).
- **SSE single-instance broker** → см. Performance #4.
- **/api/users/me с upload аватара** → нужен лимит размера и MIME (Security #4, #5).

---

## 🗺️ Дорожная карта (моё мнение)

**Неделя 1 (3-4 часа):**
Top-10 пункты 1-7 целиком. Это закроет основные дыры безопасности. (Sliding session — главная UX-жалоба «выкидывает через 30 мин» — уже сделан.)

**Неделя 2 (полдня):**
Top-10 пункты 8-10 — пагинация, rate limit, полноценный refresh-token flow (опционально — sliding уже закрывает главную боль). Лучше параллельно: `error.tsx`, prettier, constants для fallback-аватара.

**Месяц 1 (когда юзеры будут):**
- Логирование (winston/pino)
- Bundle analyzer + lucide-tree-shake-проверка
- Email confirmation
- Полный accessibility audit

**Когда вырастешь до > 1 инстанса (≥ 1000 юзеров):**
- Redis pub/sub для SSE (Performance #4)
- Redis-кэш для IDF (Performance #5)
- CDN для аватаров (S3 + CloudFront или Cloudinary)

**Никогда не понадобится, пока MVP:**
- CSRF tokens (origin check достаточно)
- Аналитика, A/B testing инфраструктура

---

## 🧪 Что нужно протестировать после правок

Чтобы не наловить регрессий — минимальный smoke-test после каждой пачки фиксов:

1. Регистрация нового юзера → проверка onboarding интересов → попадание на dashboard
2. Логин существующего → переход на dashboard → проверка карточек с матчами
3. Открытие чата → отправка сообщения → получение SSE-уведомления → typing-индикатор
4. Edit профиля → upload аватара → проверка отображения везде
5. Logout → проверка редиректа на signin

При первом deploy на Render проверь, что:
- env vars (`DATABASE_URL`, `JWT_SECRET`) подцепились
- middleware `proxy.ts` отрабатывает (заход на /dashboard без cookie → /signin)
- SSE-соединение держится более 30 секунд (free-tier'ная пауза может рвать)
