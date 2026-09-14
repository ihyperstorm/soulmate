# Soulmate

Знакомства по интересам: люди подбираются не по анкете, а по пересечению того,
что им нравится, и по тому, на какое общение они настроены сейчас.

Каждый интерес пользователь оценивает на 1–5 звёзд, совпадение считается
взвешенным Жаккаром с поправкой на редкость интереса (IDF) — совпасть на «UFO»
весомее, чем на «музыке».

---

## 📊 Состояние

| Направление | Где отслеживается | Статус |
|---|---|---|
| Фидбэк пре-альфа теста | [FEEDBACK.md](FEEDBACK.md) | ✅ 13 / 15 — открыт только OAuth |
| Техдолг и харденинг | [OPTIMIZATION.md](OPTIMIZATION.md) | 🟡 34 открытых пункта, из них 1×🔴 |
| Conversation Mood | [MOOD.md](MOOD.md) | 🟡 фазы 0–2 из 8 |
| Идеи для главной ленты | [IDEAS.md](IDEAS.md) | 🟡 2 из 11 сделано |
| Интеграция платежей | [src/shared/lib/tiptoppay/README.md](src/shared/lib/tiptoppay/README.md) | ✅ boilerplate готов |

---

## Стек

| | |
|---|---|
| Фреймворк | Next.js 16 (App Router), React 19, TypeScript |
| База | MongoDB через Mongoose 9 |
| Данные на клиенте | TanStack Query 5 + axios |
| Стили | Tailwind CSS 4, shadcn (стиль `base-nova`) поверх Base UI, иконки lucide |
| Формы | react-hook-form + yup |
| Локализация | next-intl 4 — `ru` (по умолчанию) и `en` |
| Авторизация | JWT через `jose` + bcrypt, сессии в БД |
| Платежи | TipTopPay |

---

## Быстрый старт

Нужен Node 20 (см. `.nvmrc`) и доступ к MongoDB.

```bash
npm install
cp .env.example .env   # файла нет — создай .env по таблице ниже
npm run dev
```

Приложение поднимется на http://localhost:3000.

> В репозитории лежат и `package-lock.json`, и `bun.lock`. Проектные скрипты
> гоняются через npm — если ставишь через bun, следи, чтобы лок-файлы не разъехались.

### Переменные окружения

| Переменная | Где нужна | Зачем |
|---|---|---|
| `DATABASE_URL` | сервер | Строка подключения к MongoDB. Есть фолбэк на `MONGODB_URI` |
| `JWT_SECRET` | сервер | Подпись access-токенов (HS256). Без неё выпуск токена падает |
| `NEXT_PUBLIC_TIPTOPPAY_TERMINAL_ID` | клиент | `publicTerminalId` для платёжного виджета |
| `TIPTOPPAY_PUBLIC_ID` | сервер | Basic-auth для серверного API TipTopPay |
| `TIPTOPPAY_API_SECRET` | сервер | Basic-auth + ключ HMAC для проверки вебхуков |

> ⚠️ Двух последних в текущем `.env` нет. Без них работает всё, кроме серверных
> вызовов платежей (`/api/payments/charge` и проверка подписи вебхука) — они
> бросят исключение при первом обращении.

### Скрипты

| Команда | Что делает |
|---|---|
| `npm run dev` | `next dev --turbo` |
| `npm run dev:turbo` | `next dev` без флага |
| `npm run build` | Продакшен-сборка |
| `npm start` | Запуск собранного приложения |
| `npm run lint` | ESLint |

> Имена `dev` и `dev:turbo` вводят в заблуждение: `--turbo` — это алиас
> `--turbopack`, так что Turbopack явно включает как раз `dev`, а не `dev:turbo`.

> Turbopack иногда не подхватывает правки в `src/app/globals.css`, если менялись
> только значения CSS-переменных. Если цвета не обновились — перезапусти dev-сервер,
> при необходимости удалив `.next/dev`.

### Dev-скрипты

```bash
node --env-file=.env scripts/seed-moods.mjs --dry   # посмотреть план
node --env-file=.env scripts/seed-moods.mjs         # проставить настроения тестовым юзерам
node --env-file=.env scripts/seed-moods.mjs --clear # снять у всех
```

Нужен, чтобы проверить подбор по настроению: буст срабатывает только когда настрой
задан **с обеих сторон**, поэтому на одном аккаунте фича выглядит неработающей.

---

## Архитектура

Feature-Sliced Design. Импортировать можно только вниз по списку:

```
app/        — роутинг Next.js, тонкие ре-экспорты из views
views/      — страницы целиком
widgets/    — самостоятельные блоки страницы (user-card, daily-match, sidebar…)
features/   — пользовательские сценарии (auth, match, interest, payment, locale)
entities/   — предметные модели (user, interest, mood, chat, message, session)
shared/     — переиспользуемое без привязки к домену (api, lib, data, hooks)
```

Особенности слоёв:

- У сущностей с серверной частью два входа: `index.ts` для клиента и `server.ts`
  для API-роутов и моделей Mongoose. Это не даёт затащить `'use client'`-компоненты
  и `node:crypto` в Edge-рантайм.
- `src/components/ui/` — сгенерированные shadcn-компоненты, живут вне FSD. Их
  стараемся не править: перезапишутся при `shadcn add`. Кастомизация — через
  токены в `globals.css` и `className` на месте использования.
- `src/proxy.ts` — middleware Next.js (App Router называет этот файл `proxy`).
  Работает в **Edge**: ни mongoose, ни `node:crypto` там недоступны.

---

## Как устроены ключевые механики

### Авторизация

Два токена. Access — короткий JWT (15 минут), stateless. Refresh — непрозрачная
строка на 30 дней, лежит в cookie, а её SHA-256 — в коллекции `sessions`, поэтому
сессию можно отозвать.

- `proxy.ts` на страничных маршрутах решает только «есть ли смысл пускать»:
  живой access → пускаем; access истёк, но refresh-cookie есть → тоже пускаем,
  потому что данные страницы всё равно берут из `/api/*`.
- Настоящая проверка — `getAuthUserId()` в API-роутах, ответ 401.
- Клиентский интерцептор (`shared/api/authRefresh.ts`) ловит 401, дёргает
  `POST /api/auth/refresh` и повторяет запрос. Параллельные 401 схлопываются
  в один refresh.
- Каждый refresh проворачивает токен. Есть окно на гонку между вкладками и
  детект повторного использования украденного токена.

### Подбор людей

`entities/interest/lib/match.ts` — метрики совпадения, `features/match/rank-candidates` —
хук, который грузит кандидатов и ранжирует их: процент по интересам плюс невидимый
буст за совпавшее настроение. Сам процент настроением не разбавляется, чтобы
не скакал при смене настроя.

### Реалтайм в чате

SSE (`/api/messages/stream`) с брокером в памяти процесса. Горизонтально не
масштабируется — см. соответствующий пункт в `OPTIMIZATION.md`.

### Локализация

Все подписи — в `messages/ru.json` и `messages/en.json`. Локаль хранится в cookie
`NEXT_LOCALE`. В базе лежат только стабильные id (например `deep-talks`), лейблы
резолвятся на рендере.

---

## Документация

| Файл | О чём |
|---|---|
| [FEEDBACK.md](FEEDBACK.md) | Разбор пользовательского тестирования и что по нему сделано |
| [OPTIMIZATION.md](OPTIMIZATION.md) | Аудит безопасности, производительности и качества кода |
| [MOOD.md](MOOD.md) | Проект фичи Conversation Mood: продуктовые решения и план по фазам |
| [IDEAS.md](IDEAS.md) | Черновик идей для главной ленты |
| [src/shared/lib/tiptoppay/README.md](src/shared/lib/tiptoppay/README.md) | Интеграция платежей |
