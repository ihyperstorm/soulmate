'use client'
import {ChatBox} from '@/widgets/chat-box'
import {ChatsList} from '@/widgets/chats-list'
import {Sidebar} from '@/widgets/sidebar'
import {useSearchParams} from 'next/navigation'
import {Suspense, useMemo, useState} from 'react'

type ChatSelection = {
	chatId: string | null
	senderId: string | null
	receiverId: string | null
	systemNotice: string | null
}

function MessagesContent() {
	const searchParams = useSearchParams()

	const fromQuery = useMemo<ChatSelection>(() => {
		if (!searchParams) {
			return {chatId: null, senderId: null, receiverId: null, systemNotice: null}
		}

		const qChatId = searchParams.get('chatId')
		const qSenderId = searchParams.get('senderId')
		const qReceiverId = searchParams.get('receiverId')
		const qUsername = searchParams.get('username')

		if (qChatId && qSenderId && qReceiverId) {
			return {
				chatId: qChatId,
				senderId: qSenderId,
				receiverId: qReceiverId,
				systemNotice: qUsername ? `You started a chat with ${qUsername}` : null,
			}
		}

		return {chatId: null, senderId: null, receiverId: null, systemNotice: null}
	}, [searchParams])

	const [selectedChat, setSelectedChat] = useState<ChatSelection | null>(null)
	const activeChat = selectedChat ?? fromQuery

	return (
		<div className='grid grid-cols-[11rem_minmax(0,1fr)_minmax(0,1.5fr)] gap-4 py-10'>
			<Sidebar />
			<ChatsList
				onSelectChat={chat => {
					setSelectedChat(chat)
				}}
			/>
			<ChatBox
				key={activeChat.chatId ?? 'empty'}
				chatId={activeChat.chatId}
				senderId={activeChat.senderId}
				receiverId={activeChat.receiverId}
				systemNotice={activeChat.systemNotice}
			/>
		</div>
	)
}

export default function MessagesPage() {
	return (
		<Suspense fallback={null}>
			<MessagesContent />
		</Suspense>
	)
}
