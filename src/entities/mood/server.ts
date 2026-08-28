// Серверная точка входа (как entities/interest/server.ts): только чистая модель,
// без 'use client'-компонентов — чтобы API-роуты и mongoose-схемы не тянули React.
export {isConversationMood, MAX_MOODS, MOOD_IDS} from './model/moods'
export type {ConversationMood} from './model/types'
