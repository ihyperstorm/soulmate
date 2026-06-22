import {NextResponse} from 'next/server'
import connectDB from '@/shared/lib/mongodb/db'
import {getIdfMap} from '@/entities/interest/lib/idf'

export async function GET() {
	try {
		await connectDB()
		const map = await getIdfMap()
		return NextResponse.json(map)
	} catch (error) {
		console.error('Error computing IDF map:', error)
		return NextResponse.json(
			{error: error instanceof Error ? error.message : 'Internal server error'},
			{status: 500},
		)
	}
}
