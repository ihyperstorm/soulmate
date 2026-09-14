# Идеи · Main Feed

Что выводить в главной ленте (дашборде) и что можно добавить позже.
Черновик, не план реализации — приоритеты и оценки не расставлены.

Связанные документы: [MOOD.md](MOOD.md) — спроектированная фича Conversation Mood ·
[FEEDBACK.md](FEEDBACK.md) — закрытые пункты ревью · [OPTIMIZATION.md](OPTIMIZATION.md) — техдолг

---

## 📊 Overview

| # | Идея | Статус |
|---|---|---|
| 1 | 🎯 Top Matches | 🟡 есть виджет; нет `bio` в карточке и нет сортировки |
| 2 | 💡 Conversation Starters | ✅ живут в карточке («Растопить лёд»); отдельный блок в ленте удалён осознанно |
| 3 | 🌱 Mood / Energy | 🟡 модель и API готовы, интерфейса нет — см. [MOOD.md](MOOD.md) |
| 4 | 🧠 Shared Topics | ⬜ не начато |
| 5 | 💬 Recent Connections | 🟡 есть `recent-souls`, но это недавние **чаты**, а не матчи |
| 6 | ✨ Daily Match | ✅ сделано |
| 7 | 🪐 Calm widgets | ⬜ не начато |
| 8 | ✨ Stardust | ⬜ идея без описания |
| — | 🎧 Shared music taste | ⬜ позже, нужен Spotify API |
| — | 🎮 Mini rooms | ⬜ позже |
| — | 🧠 AI Icebreaker | ⬜ позже |

Самый дешёвый следующий шаг — довести пункт 3 (фазы 3–4 в `MOOD.md`): бэкенд уже
лежит, не хватает пикера настроения на дашборде.

---

## 🧠 Что выводить в main feed

### 1. 🎯 Top Matches — главное

> Best matches for you today

Карточки:

- аватар
- % match
- bio
- общие интересы

**Статус:** есть — `widgets/top-souls` + `widgets/user-card`.
Нет `bio` в карточке и нет сортировки по силе матча (`widgets/users-list/ui/Users.tsx`
фильтрует и режет, но не сортирует).

---

### 2. 💡 Conversation Starters

> Conversation ideas

Примеры:

- «Какая игра сильнее всего повлияла на тебя?»
- «Что тебе нравится в AI?»
- «Какой фильм пересматриваешь?»

👉 Это убирает awkward silence.

> ⚠️ Отдельный блок на дашборде **был и удалён** 03.09.2026 (виджет `TalkIdeas`) —
> обезличенные вопросы из своих интересов не отвечали на «что написать **этому**
> человеку». Сейчас вопросы живут внутри карточки: блок «Растопить лёд» в
> `UserCard.tsx`, клик подставляет текст в чат через `?draft=`.
> Если возвращать блок в ленту — нужен контекст, которого у него раньше не было
> (настроение или конкретный человек), иначе он снова окажется декоративным.
> Пулы вопросов лежат в `shared/data/talkQuestions.ts`.

---

### 3. 🌱 Mood / Energy

```
Today I'm open for:
• Deep talks
• Casual chat
• Startup discussions
```

**Статус:** спроектировано целиком → [MOOD.md](MOOD.md).
Фазы 0–2 сделаны (модель `entities/mood`, поля `moods` / `moodUpdatedAt` у юзера,
`PATCH /api/users/me/mood`). Осталось UI и влияние на матчинг.

---

### 4. 🧠 Shared Topics

```
Trending among your interests:
• AI tools
• Indie games
• Startups
```

**НО:**

- 👉 не как новости
- 👉 а как «темы для общения»

---

### 5. 💬 Recent Connections

> People you recently matched with

**Статус:** есть — `widgets/recent-souls` (сейчас это недавние чаты, не матчи).

---

### 6. ✨ Daily Match

```
Today's best connection
98% compatibility
```

👉 Это может стать главной фишкой.

**Статус:** ✅ сделано — `widgets/daily-match`, первый блок на дашборде.
Один человек на сутки, выбор детерминированный по сиду `id + дата`
(`shared/lib/dailyPick.ts`), пул — топ-5 по интересам с бустом за совпавшее
настроение, порог 40%. Выделен вращающейся градиентной рамкой `.daily-ring`.

---

### 7. 🪐 Calm widgets

Маленькие блоки:

- 🌙 «Late night conversations active»
- ☕ «12 people discussing design now»
- 🎵 «People listening to lo-fi»

---

## 🔥 Что можно добавить позже

### 🎧 Shared music taste

Если Spotify API подключишь.

### 🎮 Mini rooms

- coding room
- anime room
- startup room

### 🧠 AI Icebreaker

AI предлагает начало диалога.

### 8. Stardust - secret feature
