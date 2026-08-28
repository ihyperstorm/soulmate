# Optimization & Hardening Plan

Аудит проекта на безопасность, производительность и code quality.
Каждая находка помечена:

**Серьёзность:** 🔴 Critical · 🟠 High · 🟡 Medium · 🟢 Low
**Стоимость:** 💸 Cheap (≤ 30 мин) · 💰 Medium (≤ день) · 💎 Expensive (несколько дней / внешние сервисы)

---

## 🎯 Top-10 «сделать первым»

Если у тебя ограничено время — сначала это. Сортировано по соотношению impact/effort.

| # | Что | Сложность | Серьёзность |
|---|---|---|---|
| 1 | Убрать password hash из ответов `/api/auth/login` и `/register` | 💸 | 🔴 |
| 2 | Добавить проверку владельца в `PATCH /api/users/[id]` | 💸 | 🔴 |
| 4 | Лимит размера файла на upload аватара (5MB) | 💸 | 🟠 |
| 5 | Whitelist MIME-типов аватара (`image/jpeg`/`png`/`webp`) | 💸 | 🟠 |
| 6 | Заменить N+1 unread counts в `/api/chats` на одну aggregation | 💸 | 🟠 |
| 7 | Удалить `localStorage.setItem('userId')` из `SignUpForm` и `InterestsPage` | 💸 | 🟡 |
| 8 | Полноценный refresh-token flow (short access + long refresh, ротация, revoke) | 💰 | 🟠 |
| 9 | Пагинация на `GET /api/users` + серверный фильтр по `userIds` | 💰 | 🟠 |
| 10 | Rate limiting на `/api/auth/login` (5 попыток / 15 мин) | 💰 | 🟠 |

---

## 🔒 Безопасность

### 🔴 1. Password hash утекает в ответе login/register
- **Где:** `src/app/api/auth/login/route.ts:31`, `src/app/api/auth/register/route.ts:30`
- **Что:** Оба эндпоинта возвращают `user.toObject()` — это включает `password` (bcrypt-хэш).
- **Почему важно:** Принцип «отдавать минимум». Хэш не должен покидать сервер. Если фронт залогирует ответ или попадёт в Sentry — хэш засветится.
- **Фикс:** Перед возвратом сделать `const {password, ...safeUser} = user.toObject()` и вернуть `safeUser`. Или `.select('-password')` при создании.
- **💸 Cheap** — 2 строки в двух файлах.

### 🔴 2. Любой авторизованный юзер может править чужой профиль
- **Где:** `src/app/api/users/[id]/route.ts:42-120` (PATCH)
- **Что:** Нет проверки `authUserId === id`. Залогиненный юзер A может PATCH'ить юзера B.
- **Почему важно:** Полный bypass owner-only обновлений. Серьёзная дыра в matching-приложении (можно подменить чужие фото/био).
- **Фикс:** В начале handler'а: `const authId = await getAuthUserId(); if (!authId || authId !== id) return NextResponse.json({error: 'Forbidden'}, {status: 403})`.
- **💸 Cheap** — 3 строки.

### 🟠 4. Avatar upload без лимита размера
- **Где:** `src/app/api/users/me/route.ts:93-114`, `src/app/api/users/[id]/route.ts:65-86`
- **Что:** Проверяется `size > 0`, верхнего лимита нет. Можно залить 1 GB.
- **Почему важно:** Disk DoS. На Render diskspace ограничен.
- **Фикс:** `if (file.size > 5 * 1024 * 1024) return NextResponse.json({error: 'Max 5MB'}, {status: 413})`.
- **💸 Cheap** — 1 строка в двух местах.

### 🟠 5. Avatar upload без проверки типа
- **Где:** Те же файлы.
- **Что:** Расширение из имени файла. Можно загрузить `evil.exe`, `evil.html`.
- **Почему важно:** Если `/public/uploads/` отдаётся напрямую без правильных Content-Type заголовков — XSS через залитый HTML/SVG.
- **Фикс:** Whitelist на MIME-типе + magic bytes:
  ```ts
  const ALLOWED = ['image/jpeg', 'image/png', 'image/webp']
  if (!ALLOWED.includes(file.type)) return NextResponse.json({error: 'Only JPEG/PNG/WebP'}, {status: 415})
  ```
  Идеально — ещё проверить magic bytes (первые 4 байта файла), не доверять `file.type`.
- **💸 Cheap** — 3 строки. Magic bytes — +10 мин.

### 🟠 6. Нет rate limiting на login/register
- **Где:** `src/app/api/auth/login/route.ts`, `src/app/api/auth/register/route.ts`
- **Что:** Можно перебирать пароли в неограниченное число попыток.
- **Почему важно:** Brute-force паролей (особенно при текущем требовании 3+ символов — см. ниже).
- **Фикс:** Самое простое в твоём стеке — in-memory rate limiter в `proxy.ts` (Map<IP, attemptCount>). Лимит 5/15 мин. Для прода — `@upstash/ratelimit` с Redis.
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

### 🟠 11. Полноценный refresh-token flow (revocable sessions)
- **Где:** `src/entities/session/*`, `src/app/api/auth/*`, `src/proxy.ts`
- **Что:** Сейчас — sliding session: один access-токен (JWT, 30 мин), продлевается в `proxy.ts`. Нет отдельного refresh-токена, нет хранилища сессий, токен нельзя отозвать до истечения.
- **Почему важно:** Sliding закрыл UX-боль («выкидывает через 30 мин»), но не даёт: (1) logout со всех устройств; (2) принудительный разлогин при смене пароля / компрометации; (3) короткое окно жизни access-токена (украденный токен валиден все 30 мин, отозвать нельзя). Это следующий уровень безопасности сессий поверх sliding.
- **Фикс:** Два токена:
  - **access** — короткий JWT (5–15 мин), stateless, как сейчас.
  - **refresh** — длинный (~30 дней), httpOnly-cookie, **хранится в БД** (модель `Session`: `userId`, `tokenHash`, `expiresAt`, `userAgent`, `createdAt`).
  - `POST /api/auth/refresh`: валидирует refresh по БД → выдаёт новый access.
  - **Ротация:** каждый refresh инвалидирует старый и выдаёт новый (защита от повторного использования украденного).
  - **Revoke:** logout удаляет запись из БД; «выйти со всех устройств» — удалить все записи юзера.
  - Фронт: молчаливый refresh access-токена на 401 (axios-interceptor).
- **💰 Medium** — модель `Session` + endpoint + ротация + interceptor. Полдня–день.

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

### 🟢 14. Email без подтверждения
- **Где:** `/api/auth/register`
- **Что:** Юзер может зарегистрироваться с `fake@whatever.com`.
- **Почему важно:** Для MVP не критично. В прод — забить почту fake-аккаунтами легко.
- **Фикс:** Email confirmation flow с одноразовой ссылкой. Resend/Postmark/SendGrid.
- **💎 Expensive** — нужен email-сервис + UI + token store.

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
