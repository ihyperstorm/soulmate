import {mkdir, writeFile} from 'node:fs/promises'
import path from 'node:path'

export const MAX_AVATAR_BYTES = 5 * 1024 * 1024
export const MAX_AVATAR_MB = MAX_AVATAR_BYTES / (1024 * 1024)

/**
 * Тип определяется по сигнатуре файла, а не по расширению в имени и не по
 * `file.type`: и то и другое присылает клиент, и `evil.html` легко назвать
 * `avatar.png`. Каталог `/public/uploads/` отдаётся статикой, поэтому залитый
 * HTML или SVG со скриптом превратился бы в XSS на своём же домене.
 */
const SIGNATURES: {ext: string; matches: (head: Buffer) => boolean}[] = [
	{
		ext: 'jpg',
		matches: head => head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff,
	},
	{
		ext: 'png',
		matches: head =>
			head
				.subarray(0, 8)
				.equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
	},
	{
		ext: 'webp',
		matches: head =>
			head.subarray(0, 4).toString('ascii') === 'RIFF' &&
			head.subarray(8, 12).toString('ascii') === 'WEBP',
	},
]

export type AvatarUploadResult =
	| {ok: true; url: string}
	| {ok: false; reason: 'too-large' | 'unsupported-type'}

/** Похоже ли значение из formData на файл. */
export const isUploadedFile = (value: unknown): value is Blob & {size: number} =>
	value !== null &&
	typeof value === 'object' &&
	'arrayBuffer' in value &&
	'size' in value

/**
 * Проверяет и сохраняет аватар. Возвращает публичный URL либо причину отказа —
 * решение о статусе ответа остаётся за роутом.
 *
 * ВАЖНО: размер проверяется до чтения в память, чтобы не тянуть гигабайт
 * в буфер. Полностью это проблему не снимает — `request.formData()` уже
 * вычитал тело до вызова хелпера; настоящий предел нужно ставить на уровне
 * прокси/сервера.
 */
export const saveAvatar = async (
	file: Blob & {size: number},
	userId: string,
): Promise<AvatarUploadResult> => {
	if (file.size > MAX_AVATAR_BYTES) return {ok: false, reason: 'too-large'}

	const buffer = Buffer.from(await file.arrayBuffer())
	const signature = SIGNATURES.find(candidate => candidate.matches(buffer))
	if (!signature) return {ok: false, reason: 'unsupported-type'}

	const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'avatars')
	await mkdir(uploadDir, {recursive: true})

	const fileName = `avatar-${userId}-${Date.now()}.${signature.ext}`
	await writeFile(path.join(uploadDir, fileName), buffer)

	return {ok: true, url: `/uploads/avatars/${fileName}`}
}
