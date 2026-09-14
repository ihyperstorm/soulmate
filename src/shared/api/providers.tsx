'use client'

import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {createContext, useContext, useState} from 'react'
import {installAuthRefresh} from './authRefresh'

const FIVE_MINUTES_MS = 1000 * 60 * 5
const QueryClientContext = createContext<QueryClient | null>(null)

// На уровне модуля, а не в эффекте: интерцептор должен стоять до первого
// запроса, иначе самый ранний 401 (например /api/users/me при монтировании)
// пролетит мимо refresh. Внутри стоит защита от повторной установки.
installAuthRefresh()

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
