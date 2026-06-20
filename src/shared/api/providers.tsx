'use client'

import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {createContext, useContext, useState} from 'react'

const FIVE_MINUTES_MS = 1000 * 60 * 5
const QueryClientContext = createContext<QueryClient | null>(null)

export default function Providers({children}: {children: React.ReactNode}) {
	const [client] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						staleTime: FIVE_MINUTES_MS,
					},
				},
			})
	)

	return (
		<QueryClientContext.Provider value={client}>
			<QueryClientProvider client={client}>{children}</QueryClientProvider>
		</QueryClientContext.Provider>
	)
}

export const useAppQueryClient = () => {
	const client = useContext(QueryClientContext)
	if (!client) {
		throw new Error('useAppQueryClient must be used inside Providers')
	}
	return client
}
