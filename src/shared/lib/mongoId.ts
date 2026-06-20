/** Стабильная строка ObjectId из API (string, EJSON {$oid}, Mongoose-объект). */
export function mongoIdString(id: unknown): string {
	if (id == null) return ''
	if (typeof id === 'string') return id
	if (
		typeof id === 'object' &&
		id !== null &&
		'$oid' in id &&
		typeof (id as { $oid: string }).$oid === 'string'
	) {
		return (id as { $oid: string }).$oid
	}
	const s = String(id)
	if (/^[a-f\d]{24}$/i.test(s)) return s
	return s
}
