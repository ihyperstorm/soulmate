import type {Locale} from '@/i18n/config'
import {defaultLocale} from '@/i18n/config'

// Вопросы-айсбрейкеры, сгруппированные по интересам и локалям.
// Ключи наборов — это имя интереса в нижнем регистре (см. pickQuestion ниже),
// поэтому "Gaming", "gaming" и " Gaming " матчатся на один и тот же набор.

type QuestionPools = {
	byInterest: Record<string, string[]>
	// Запасные вопросы для интересов, у которых нет своего набора —
	// чтобы каждый интерес пользователя всё равно получил бабл.
	fallback: string[]
}

export const talkQuestions: Record<Locale, QuestionPools> = {
	ru: {
		byInterest: {
			gaming: [
				'Какая игра сильнее всего повлияла на тебя?',
				'Какая игра вызвала самые сильные эмоции?',
				'Во что можешь играть бесконечно?',
				'Последняя игра, которая тебя по-настоящему затянула?',
			],
			movies: [
				'Какой фильм ты пересматриваешь?',
				'Какой фильм недооценён?',
				'Какой фильм изменил твой взгляд на что-то?',
				'Какую сцену из фильма ты не можешь забыть?',
			],
			music: [
				'Какая песня напоминает тебе важный период жизни?',
				'Что сейчас играет у тебя на репите?',
				'Под какую музыку ты лучше всего работаешь?',
				'Какой концерт мечтаешь посетить?',
			],
			books: [
				'Какая книга осталась с тобой надолго?',
				'Что читаешь сейчас?',
				'Какую книгу советуешь всем подряд?',
			],
			travel: [
				'Куда бы ты вернулся снова?',
				'Какое место удивило тебя сильнее всего?',
				'Город или природа — что тебе ближе в путешествии?',
			],
			sports: [
				'Какой матч ты до сих пор вспоминаешь?',
				'За кого болеешь?',
				'Каким спортом занимаешься сам?',
			],
			cooking: [
				'Какое блюдо у тебя получается лучше всего?',
				'Что готовишь, когда хочется себя порадовать?',
				'Кухня какой страны тебя вдохновляет?',
			],
			art: [
				'Какая работа тебя по-настоящему зацепила?',
				'Что тебя вдохновляет создавать?',
				'Какой стиль тебе ближе всего?',
			],
			photography: [
				'Что ты любишь снимать больше всего?',
				'Какой кадр стал твоим любимым?',
				'Плёнка или цифра — и почему?',
			],
			technology: [
				'Какая технология тебя сейчас по-настоящему удивляет?',
				'Какой гаджет изменил твою повседневность?',
				'За какими трендами в технологиях следишь?',
			],
			ai: [
				'Что тебе нравится в AI?',
				'Где AI уже помогает тебе каждый день?',
				'Чего ты ждёшь от AI в будущем?',
			],
			fitness: [
				'Что мотивирует тебя на тренировки?',
				'Утро или вечер — когда тебе лучше тренироваться?',
				'Какая твоя маленькая победа в спорте?',
			],
			nature: [
				'Где ты чувствуешь себя по-настоящему спокойно?',
				'Горы, лес или море?',
				'Какой момент на природе ты запомнил надолго?',
			],
		},
		fallback: [
			'Что тебя в этом по-настоящему зацепило?',
			'Как ты к этому пришёл?',
			'Что бы ты посоветовал новичку в этом?',
			'Какой момент, связанный с этим, ты вспоминаешь с улыбкой?',
		],
	},
	en: {
		byInterest: {
			gaming: [
				'Which game shaped you the most?',
				'Which game gave you the strongest emotions?',
				'What can you play endlessly?',
				'What was the last game that really pulled you in?',
			],
			movies: [
				'Which film do you keep rewatching?',
				'Which film is underrated?',
				'Which film changed the way you see something?',
				'Which movie scene do you still think about?',
			],
			music: [
				'Which song reminds you of an important time in your life?',
				'What is on repeat for you right now?',
				'What music do you work best to?',
				'Which concert do you dream of going to?',
			],
			books: [
				'Which book stayed with you the longest?',
				'What are you reading right now?',
				'Which book do you recommend to everyone?',
			],
			travel: [
				'Where would you go back to?',
				'Which place surprised you the most?',
				'City or nature — what suits you better when travelling?',
			],
			sports: [
				'Which match do you still remember?',
				'Who do you root for?',
				'Which sport do you play yourself?',
			],
			cooking: [
				'Which dish do you cook best?',
				'What do you cook when you want to treat yourself?',
				'Which country’s cuisine inspires you?',
			],
			art: [
				'Which piece really moved you?',
				'What inspires you to create?',
				'Which style feels closest to you?',
			],
			photography: [
				'What do you love shooting the most?',
				'Which shot became your favourite?',
				'Film or digital — and why?',
			],
			technology: [
				'Which technology genuinely amazes you right now?',
				'Which gadget changed your daily routine?',
				'Which tech trends do you follow?',
			],
			ai: [
				'What do you like about AI?',
				'Where does AI already help you every day?',
				'What are you hoping for from AI?',
			],
			fitness: [
				'What motivates you to train?',
				'Morning or evening — when do you train best?',
				'What is your small win in sport?',
			],
			nature: [
				'Where do you feel truly calm?',
				'Mountains, forest or sea?',
				'Which moment in nature stayed with you?',
			],
		},
		fallback: [
			'What really got you into this?',
			'How did you get into it?',
			'What would you tell someone just starting out?',
			'Which moment related to this makes you smile?',
		],
	},
}

// Возвращает 1 случайный вопрос для интереса.
// Math.random вызывается при каждом обращении — поэтому при перезагрузке
// страницы (новый монтаж компонента) вопросы рандомайзятся заново.
export const pickQuestion = (
	interestName: string,
	locale: Locale = defaultLocale,
): string => {
	const key = interestName.trim().toLowerCase()
	const pools = talkQuestions[locale] ?? talkQuestions[defaultLocale]
	const pool = pools.byInterest[key] ?? pools.fallback
	return pool[Math.floor(Math.random() * pool.length)]
}
