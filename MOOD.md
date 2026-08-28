# Conversation Mood — план реализации

Фича «Чего хочется сегодня?»: пользователь отмечает, на какое общение он настроен
прямо сейчас, и это влияет на подборку людей и на первые фразы в чате.

Интересы отвечают на вопрос **«с кем мне потенциально интересно общаться?»**.
Mood отвечает на другой — **«с кем мне будет комфортно общаться прямо сейчас?»**.
Два человека могут совпадать на 90% по интересам, но один хочет глубокого
разговора, а второй — просто поболтать.

**Статус:** фазы 0–2 реализованы · фазы 3–7 впереди
**Оценка:** ~7 ч суммарно, ~4 ч до первой рабочей версии

---

## 📋 Оглавление

- [Продуктовые решения](#-продуктовые-решения) — что и почему решили именно так
- [Что уже есть в коде](#-что-уже-есть-в-коде) — точки интеграции
- [План по фазам](#-план-по-фазам) — 0…7
- [Что НЕ делаем сейчас](#-что-не-делаем-сейчас)
- [Чек-лист приёмки](#-чек-лист-приёмки)

---

## 🎯 Продуктовые решения

### 1. Шесть настроений, `meet-someone` выкинут

`meet-someone` («просто хочу познакомиться») — не настроение, а причина, по которой
человек вообще зарегистрировался. Его выберут почти все → нулевая различающая
способность, но при этом он создаёт ложные «совпадения». Убран.

`personal` и `deep-talks` частично пересекаются, но разница реальная:
«интеллектуально глубоко» vs «эмоционально близко». Оба оставлены.

| id (в БД) | emoji | ru | en |
|---|---|---|---|
| `deep-talks` | 🧠 | Глубокие разговоры | Deep talks |
| `casual-chat` | ☕ | Просто поболтать | Casual chat |
| `exchange-ideas` | 💡 | Обменяться идеями | Exchange ideas |
| `hobbies` | 🎮 | Про увлечения | Talk about hobbies |
| `personal` | ❤️ | Что-то личное | Something personal |
| `fun` | 🤪 | Повеселиться | Have some fun |

### 2. Максимум 2 настроения одновременно

При 6 вариантах и лимите 3 почти любая пара пересечётся хотя бы одним настроением —
строка «You both are up for» превратится в шум и перестанет что-либо значить.
При лимите 2 пересечение — это сигнал.

Лимит легко поднять позже. Опустить после релиза — уже нет: у людей будет сохранено
по три, и придётся решать, какое отрезать.

### 3. Mood НЕ входит в процент матча

Соблазн: `80% interests + 20% mood`, одно число. На MVP — нет, по трём причинам:

1. **Процент перестаёт быть объяснимым.** Сейчас `calculateCoveragePercent` честно
   отвечает «он закрывает N% твоих тем». Смешанное число не объяснить одной строкой
   под кольцом.
2. **Число начнёт скакать.** Человек сменил настроение — вчерашние 87% стали 71%.
   Пользователь читает это как «алгоритм сломался», а не «он передумал».
3. **Кольцо в `UserCard` — одно число.** Ломать его семантику дороже, чем добавить
   строку рядом.

**Развязка:**

| Сигнал | Где виден |
|---|---|
| Interest coverage % | Кольцо на карточке — **только интересы, как сейчас** |
| Shared moods | Отдельная строка «Right now: 🧠 Deep talks» |
| Mood boost | **Невидим** — влияет только на порядок карточек |

```ts
// только для сортировки, наружу не показываем
const score = coveragePercent + sharedMoods.length * 8
```

Mood влияет на **порядок**, а не на цифру. Пользователь видит: «у этих троих такой
же настрой, как у меня, и они наверху» — это читается как забота, а не как
манипуляция числом.

Двухуровневый Match (Interest Match + Conversation Match отдельными числами) —
правильное направление, но как **v2**, когда накопятся данные.

### 4. Никогда не фильтровать по mood

Классический cold start: пока настроение поставили 5 человек из 200, фильтр по mood
покажет пустой дашборд и фича будет выглядеть сломанной.

**Пустой mood = нейтральный, а не «исключён».** Только буст, никогда не фильтр.

### 5. Zero friction: без кнопки «Сохранить»

Интересы — это конфигурация (редактор + Save, как в `InterestsEditor`).
Настроение — это жест. Тап по чипу = мгновенный optimistic update + PATCH в фоне.

Если поставить туда Save, настроение будут обновлять раз в месяц, и фича умрёт.

По той же причине — **не делать это шагом онбординга**. `/interests` уже блокирующий
шаг с min 3 интересами; второй обязательный экран поднимет дропофф. Точка входа —
виджет на дашборде с пустым состоянием.

### 6. «Сегодня» = TTL 24 часа, считаем при чтении

«Today I'm up for» требует протухания, иначе через неделю на карточках висят мёртвые
настроения и фича начинает врать.

| Вариант | Вердикт |
|---|---|
| Cron, чистящий в полночь | ❌ новая инфраструктура ради ничего |
| «До локальной полуночи» | ❌ таймзоны, а `User` их не хранит |
| **`moodUpdatedAt` + TTL 24 ч при чтении** | ✅ ноль инфраструктуры, ноль таймзон |

Поле `moodUpdatedAt` всё равно нужно для статуса активности (см. ниже).

### 7. Статус активности — бесплатный бонус

`isMoodFresh(user)` даёт честный «🌿 Открыт к разговору» без presence-инфраструктуры:
человек заходил и осознанно сказал, чего хочет, менее суток назад.

Это честнее зелёной точки — и заодно закрывает захардкоженный `isOnline = true`
в `UserDetailPage`.

Формулировки в духе calm social: «🌿 Открыт к разговору» / «🌙 Не сейчас» вместо
механистичного «🟢 Online».

---

## 🔍 Что уже есть в коде

Точки интеграции, найденные при аудите:

| Файл | Что там | Значение для фичи |
|---|---|---|
| `src/views/dashboard/ui/DashboardPage.tsx:16` | Комментарий «Будущие виджеты: Mood/Energy · …» | Слот уже зарезервирован |
| `src/app/api/users/route.ts:10` | `User.find().select('-password').lean()` | Новые поля приедут на клиент **бесплатно**, роут менять не надо |
| `src/widgets/users-list/ui/Users.tsx:82` | `candidates.slice(0, userCount)` | **Сортировки нет вообще** — «Top souls» сейчас не top, а первые из БД. Без её починки буст по mood ни на что не повлияет |
| `src/views/user-detail/ui/UserDetailPage.tsx:45` | `const isOnline = true` | Заглушка, которую честно заменяет `isMoodFresh` |
| `src/features/interest/edit-interests/ui/InterestsEditor.tsx:123-135` | optimistic `setQueryData(CURRENT_USER_KEY)` + invalidate | Готовый паттерн для `useSetMood` |
| `src/app/api/users/me/premium/route.ts` | `getAuthUserId` + `connectDB` + `findByIdAndUpdate` | Шаблон для роута настроения |
| `src/shared/data/talkQuestions.ts` | `QuestionPools = {byInterest, fallback}` | Расширяется `byMood` без слома `pickQuestion` |
| `src/entities/user/model/User.ts:75` | HMR-хак с `delete mongoose.models.User` | Новые поля схемы подхватятся в dev без рестарта |

---

## 🗺️ План по фазам

Порядок фаз = порядок коммитов.
После **фазы 4** фича живая и видна на дашборде; **5–6** — то, ради чего она нужна.

### ✅ Фаза 0 — данные · 💸 ~20 мин · **сделано**

**`src/entities/user/model/User.ts`** — в схему и в `IUser`:

```ts
moods: {type: [String], default: []},
moodUpdatedAt: {type: Date, default: null},
```

**`src/entities/user/model/types.ts`** — в клиентский DTO:

```ts
moods?: ConversationMood[]
moodUpdatedAt?: string | null
```

Миграция не нужна — `default: []`.
`/api/users` и `/api/users/me` менять **не нужно** — оба возвращают полный `.lean()`.

---

### ✅ Фаза 1 — сущность `entities/mood` · 💰 ~1 ч · **сделано**

Зеркалим структуру `entities/interest`. Ключевое отличие: **moods — статичный enum
в коде, не коллекция в БД.** Их 6, у них нет `userCount`, им не нужен IDF, а лейблы
должны переводиться → в БД лежат только id.

```
src/entities/mood/
├── model/
│   ├── types.ts      ConversationMood, MoodDef, MoodHolder
│   └── moods.ts      MOODS, MOOD_IDS, MOOD_EMOJI, MAX_MOODS = 2, isConversationMood()
├── lib/
│   ├── active.ts     MOOD_TTL_MS, isMoodFresh(), getActiveMoods()
│   └── match.ts      sharedMoods(a, b), moodBoost(count), MOOD_BOOST_PER_MATCH = 8
├── ui/
│   └── MoodChip.tsx  emoji + лейбл из i18n; static (shared | muted) или toggle-кнопка
├── index.ts          баррель для клиента
└── server.ts         точка входа для роутов и mongoose — без 'use client'
```

`MOOD_IDS` — **массив**, а не Set: в таком виде он напрямую идёт в `enum` схемы
mongoose. Проверка принадлежности — через `isConversationMood()`.

`server.ts` заведён по конвенции репозитория (`entities/interest/server.ts`,
`entities/session/server.ts`): иначе `User.ts` и API-роут через общий баррель
затянули бы `MoodChip` с его `'use client'`.

```ts
// model/types.ts
export type ConversationMood =
  | 'deep-talks' | 'casual-chat' | 'exchange-ideas'
  | 'hobbies'    | 'personal'    | 'fun'

// lib/active.ts — mood протухает через сутки
export const MOOD_TTL_MS = 24 * 60 * 60 * 1000

export const isMoodFresh = (at?: string | Date | null): boolean =>
  !!at && Date.now() - new Date(at).getTime() < MOOD_TTL_MS

export const getActiveMoods = (
  u?: {moods?: ConversationMood[]; moodUpdatedAt?: string | null},
): ConversationMood[] =>
  isMoodFresh(u?.moodUpdatedAt) ? (u?.moods ?? []) : []
```

> ⚠️ `getActiveMoods` — **единственная** точка чтения настроений в UI.
> Ни один компонент не читает `user.moods` напрямую, иначе протухшие настроения
> полезут в интерфейс.

---

### ✅ Фаза 2 — API · 💸 ~30 мин · **сделано**

**`src/app/api/users/me/mood/route.ts`** — шаблон берём с `api/users/me/premium/route.ts`.

```
PATCH  {moods: string[]}  → auth через getAuthUserId
                          → валидация против MOOD_IDS, срез до MAX_MOODS
                          → $set {moods, moodUpdatedAt: new Date()}
                          → 200 {moods, moodUpdatedAt}

DELETE                    → $set {moods: [], moodUpdatedAt: null}
```

Возвращаем **узкий объект**, а не всего юзера: мутация вызывается часто, гонять
полный профиль на каждый тап незачем.

Ошибки — через `getTranslations('api')`, как в `api/interests/route.ts:24`
(добавлен ключ `api.invalidPayload`).

> Пустой набор настроений и `DELETE` идут через один и тот же `saveMoods()`:
> при `moods: []` в `moodUpdatedAt` пишется `null`. «Настроений нет» и «настроение
> свежее» не должны сосуществовать, иначе `isMoodFresh` начнёт врать статусу
> «🌿 Открыт к разговору».

---

### Фаза 3 — фича `features/mood/set-mood` · 💰 ~1.5 ч

```
src/features/mood/set-mood/
├── api/useSetMood.ts     useMutation + optimistic update
├── ui/MoodPicker.tsx     ряд чипов-тогглов, без Save
└── index.ts
```

`useSetMood` повторяет паттерн сохранения из `InterestsEditor.tsx:123-135`:

1. `queryClient.setQueryData(CURRENT_USER_KEY, …)` — оптимистично
   (`moods` + `moodUpdatedAt: new Date().toISOString()`);
2. `PATCH /api/users/me/mood`;
3. `invalidateQueries(['users'])` — чтобы карточки пересортировались;
4. `onError` — откат к предыдущему снапшоту + `toast.error`.

`MoodPicker`:
- тап тогглит настроение;
- при попытке взять третий — снимаем самый старый (тихо) либо `toast(t('maxReached'))`;
- повторный тап по единственному выбранному = сброс;
- начальное значение — `getActiveMoods(me)` прямо в рендере, **без `useEffect`-сидирования**
  (тот же приём, что и render-phase guard в `InterestsEditor.tsx:71-75`).

---

### Фаза 4 — виджет на дашборде · 💸 ~40 мин

**`src/widgets/mood-board/ui/MoodBoard.tsx`** — заголовок «Чего хочется сегодня?»
+ `MoodPicker` + подпись «Можно менять когда угодно».
Стили — `bg-surface border border-divider rounded-2xl`, как у остальных секций.

**`src/views/dashboard/ui/DashboardPage.tsx`** — вставляем **над** `<TopSouls />`.

> Почему выше, а не ниже матчей: иначе ломается причинно-следственная связь.
> Человек должен сначала увидеть, что задал настрой, и потом — что подборка под него
> подстроилась.

Комментарий на строке 16 обновить — Mood уходит из списка будущего.

---

### Фаза 5 — mood в матчинге · 💰 ~1.5 ч ← **ядро фичи**

**`src/widgets/users-list/ui/Users.tsx`** — сначала чиним отсутствие сортировки
(строка 82), потом добавляем буст:

```ts
const myMoods = getActiveMoods(me)

const ranked = candidates
  .map(u => {
    const coverage = calculateCoveragePercent(
      myWeights, userInterestsToWeights(u.userInterests), idfMap,
    )
    const shared = sharedMoods(myMoods, getActiveMoods(u))
    return {user: u, coverage, shared, score: coverage + moodBoost(shared.length)}
  })
  .sort((a, b) => b.score - a.score)
```

> ⚠️ Фильтр `minMatchPercent` остаётся по `coverage`, **не по `score`** — иначе mood
> начнёт протаскивать в «Top souls» людей с 10% общих интересов.

**`src/widgets/user-card/ui/UserCard.tsx`** — новая строка между «You both like»
и «Also into»:

| Условие | Что показываем |
|---|---|
| Есть общие настроения | `Right now` + чипы `shared` (акцентные) |
| Общих нет, но у него настроение есть | `Today they're up for` — приглушённо |
| Ничего нет | Блок не рендерим |

Кольцо процента **не трогаем**.

**`src/views/user-detail/ui/UserDetailPage.tsx`** — чипы настроений под именем;
`isOnline = true` (строка 45) → `isMoodFresh(user?.moodUpdatedAt)` с подписью
«🌿 Открыт к разговору» / «🌙 Не сейчас».

---

### Фаза 6 — conversation starters по настроению · 💰 ~1 ч

**`src/shared/data/talkQuestions.ts`** — расширяем существующую структуру, не ломая её:

```ts
type QuestionPools = {
  byInterest: Record<string, string[]>
  byMood: Record<ConversationMood, string[]>   // ← новое
  fallback: string[]
}

export const pickMoodQuestion = (mood: ConversationMood, locale?: Locale): string => …
```

`pickQuestion` остаётся как есть — его зовут `TalkIdeas.tsx:35` и `UserCard.tsx:87`.

Примерные пулы:

| mood | пример вопроса (ru) |
|---|---|
| `deep-talks` | «В чём ты недавно поменял мнение?» |
| `casual-chat` | «Что хорошего было на этой неделе?» |
| `exchange-ideas` | «Над какой идеей ты сейчас думаешь?» |
| `hobbies` | «О каком увлечении можешь говорить часами?» |
| `personal` | «Что тебя в последнее время радует?» |
| `fun` | «Какая самая нелепая вещь случилась с тобой недавно?» |

**`src/widgets/talk-ideas/ui/TalkIdeas.tsx`** — если настроение задано, 1–2 вопроса
по настроению идут первыми, дальше как сейчас по интересам. Та же `useMemo`-обёртка
по ключу (внутри `pickQuestion` живёт `Math.random`, см. комментарий на строках 25–27).

**`UserCard.tsx`** — при общем настроении первый айсбрейкер берём из `byMood`,
остальные — из общих интересов.

> Это тот момент, где фича перестаёт быть декоративной: общий настрой напрямую меняет
> первую фразу, которую человек отправит.

---

### 🟡 Фаза 7 — i18n · 💸 ~40 мин · **частично сделано**

Неймспейс `mood` и ключ `api.invalidPayload` добавлены вместе с фазами 1–2 —
без них `MoodChip` не рендерится, а роут не может ответить об ошибке.
Остаётся `moodBoard`, `userCard.rightNow` / `theyAreUpFor`, `profile.openToChat`.

`messages/ru.json` + `messages/en.json`:

```jsonc
// ✅ уже добавлено
"mood": {
  "deep-talks": {"label": "Глубокие разговоры", "description": "…"},  // ключ = id из БД
  "casual-chat": {"label": "Просто поболтать", "description": "…"},
  …
},
// ⬇ осталось
"moodBoard": {
  "title": "Чего хочется сегодня?",
  "subtitle": "…",
  "hint": "Можно менять когда угодно",
  "maxReached": "Можно выбрать не больше двух",
  "saveError": "…"
},
"userCard": {"rightNow": "…", "theyAreUpFor": "…"},   // дополняем существующий
"profile":  {"openToChat": "…", "notRightNow": "…"}    // дополняем существующий
```

> В БД лежит **только** `deep-talks`. Эмодзи — в `MOODS` (код, не переводится),
> лейбл и описание — в messages. Лейбл в БД не хранится никогда.

---

## 🚫 Что НЕ делаем сейчас

| Не сейчас | Почему |
|---|---|
| Коллекция `UserMood` с историей | Массив на `User` покрывает MVP; история нужна только для аналитики, которой ещё нет |
| Server-side сортировка и рекомендации | Упирается в `OPTIMIZATION.md` → «Нет пагинации на `/api/users`» и «Клиент фильтрует всех юзеров в браузере». Делать вместе с той задачей, не раньше |
| IDF / веса для настроений | 6 значений, обновляются ежедневно — статистика бессмысленна |
| Фильтр «показать только Deep talks» на `/users` | Пустой список при cold start убьёт доверие к фиче в первую неделю |
| Смешивание mood в процент матча | См. [продуктовое решение №3](#3-mood-не-входит-в-процент-матча) — сначала накопить данные |
| Presence через WebSocket | `isMoodFresh` даёт 80% ценности за 0% инфраструктуры |

---

## ✅ Чек-лист приёмки

- [ ] Настроение сохраняется одним тапом, без кнопки Save
- [ ] Выбрать третье настроение невозможно (или снимается самое старое)
- [ ] Настроение старше 24 ч нигде не отображается и не влияет на сортировку
- [ ] `candidates` в `Users.tsx` реально отсортированы (до фичи не были)
- [ ] Процент в кольце `UserCard` не изменился после смены настроения
- [ ] Юзер без настроения не исчезает из подборки, просто не получает буст
- [ ] Смена настроения обновляет `TopSouls` без перезагрузки (`invalidateQueries(['users'])`)
- [ ] Все подписи есть в `ru.json` и `en.json`; в БД лежат только id
- [ ] `PATCH /api/users/me/mood` без cookie → 401
- [ ] `PATCH` с мусорным id настроения → он молча отбрасывается, 200 с валидным остатком

---

## 📈 Куда это растёт дальше (v2+)

1. **Двухуровневый Match** — Interest Match и Conversation Match отдельными числами
   на карточке, когда накопится статистика по настроениям.
2. **История настроений** — коллекция `UserMood` с TTL-индексом; позволяет
   «обычно он настроен на глубокие разговоры» вместо только «сегодня».
3. **Mood в серверной выборке** — вместе с пагинацией `/api/users`.
4. **AI-генерация starters** — `byMood` пулы становятся промптом, а не константой.
5. **Смена главного слогана продукта** — с «Find people with similar interests»
   на **«Find people you'll enjoy talking to»**. Интересы + mood + bio становятся
   факторами, а не самой целью.
