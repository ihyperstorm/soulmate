import mongoose from 'mongoose'
// Source - https://stackoverflow.com/a/79892633
// Posted by Xoosk
// Retrieved 2026-03-22, License - CC BY-SA 4.0

import {setServers} from 'node:dns/promises'
setServers(['1.1.1.1', '8.8.8.8'])

const MONGODB_URI = process.env.DATABASE_URL ?? process.env.MONGODB_URI

interface MongooseCache {
	conn: typeof mongoose | null
	promise: Promise<typeof mongoose> | null
}

declare global {
	var mongoose: MongooseCache | undefined
}

const cached: MongooseCache = global.mongoose || {conn: null, promise: null}

if (!global.mongoose) {
	global.mongoose = cached
}

async function connectDB() {
	if (cached.conn) {
		return cached.conn
	}

	if (!MONGODB_URI) {
		throw new Error(
			'Database connection URL is not set. Define DATABASE_URL (or MONGODB_URI) in your environment.',
		)
	}

	if (!cached.promise) {
		const opts = {
			bufferCommands: true, // Разрешаем буферизацию команд до подключения
		}

		cached.promise = mongoose.connect(MONGODB_URI, opts).then(mongoose => {
			console.log('Connected to MongoDB')
			return mongoose
		})
	}

	try {
		cached.conn = await cached.promise
	} catch (e) {
		cached.promise = null
		throw e
	}

	return cached.conn
}

export default connectDB
