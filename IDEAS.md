# Идеи · Main Feed

Что выводить в главной ленте (дашборде) и что можно добавить позже.
Черновик, не план реализации — приоритеты и оценки не расставлены.

Связанные документы: [MOOD.md](MOOD.md) — спроектированная фича Conversation Mood ·
[FEEDBACK.md](FEEDBACK.md) — закрытые пункты ревью · [OPTIMIZATION.md](OPTIMIZATION.md) — техдолг

---

## 📊 Overview

| # | Идея | Статус |
|---|---|---|
| 1 | 🎯 Top Matches | ✅ сделано — аватар, % матча, bio, общие интересы, сортировка |
| 2 | 💡 Conversation Starters | ✅ живут в карточке («Растопить лёд»); отдельный блок в ленте удалён осознанно |
| 3 | 🌱 Mood / Energy | ✅ сделано — см. [MOOD.md](MOOD.md) |
| 4 | 🧠 Shared Topics | ⬜ не начато |
| 5 | 💬 Recent Connections | 🟡 есть `recent-souls`, но это недавние **чаты**, а не матчи |
| 6 | ✨ Daily Match | ✅ сделано |
| 7 | 🪐 Calm widgets | ⬜ не начато |
| 8 | ✨ Stardust | ⬜ идея без описания |
| — | 🎧 Shared music taste | ⬜ позже, нужен Spotify API |
| — | 🎮 Mini rooms | ⬜ позже |
| — | 🧠 AI Icebreaker | ⬜ позже |

Следующие незакрытые — пункты 4, 5 и 7: Shared Topics, Recent Connections
как матчи (сейчас это чаты) и calm-виджеты.

---

## 🧠 Что выводить в main feed

### 1. 🎯 Top Matches — главное

> Best matches for you today

Карточки:

- аватар
- % match
- bio
- общие интересы

**Статус:** ✅ сделано. Сортировка по силе матча пришла с фазой 5 `MOOD.md` — `Users.tsx` перешёл
на `features/match/rank-candidates`. Bio выводится под шапкой карточки в две строки.

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

**Статус:** ✅ сделано целиком, все 8 фаз → [MOOD.md](MOOD.md).
Настроение задаётся с дашборда (`MoodBoard`) и из профиля, живёт 24 часа,
поднимает совпавших в подборке и меняет первый айсбрейкер в карточке.

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
