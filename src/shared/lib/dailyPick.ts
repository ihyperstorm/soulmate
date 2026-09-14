/**
 * Стабильный 32-битный хеш строки (FNV-1a). Не криптография — нужен только
 * детерминированный сид, одинаковый при любом рендере и на любой машине.
 */
const hashString = (value: string): number => {
	let hash = 0x811c9dc5
	for (let i = 0; i < value.length; i++) {
		hash ^= value.charCodeAt(i)
		hash = Math.imul(hash, 0x01000193)
	}
	return hash >>> 0
}

/**
 * Ключ суток по локальному времени пользователя: смена происходит в его
 * полночь. Таймзону для этого хранить не нужно — она приходит из браузера.
 */
export const dayKey = (date: Date = new Date()): string =>
	`${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`

/**
 * Детерминированный выбор одного элемента на сутки.
 *
 * Почему не `Math.random()`: выбор менялся бы на каждый ре-рендер, и «человек
 * дня» перестал бы быть человеком дня.
 *
 * Почему не `hash(seed) % items.length`: пул за день меняется — кто-то
 * зарегистрировался, кто-то переоценил интересы. Длина сдвинулась бы, а с ней
 * и индекс, то есть выбор поменялся посреди дня. Поэтому хешируем каждого
 * кандидата вместе с сидом и берём минимальный: новый кандидат меняет выбор
 * только если сам оказался ближе к сиду, остальные перестановки не влияют.
 */
export const pickDaily = <T>(
	items: readonly T[],
	seed: string,
	keyOf: (item: T) => string,
): T | null => {
	let best: T | null = null
	let bestHash = Number.POSITIVE_INFINITY

	for (const item of items) {
		const hash = hashString(`${seed}:${keyOf(item)}`)
		if (hash < bestHash) {
			bestHash = hash
			best = item
		}
	}

	return best
}
