import axios from 'axios'
import ChatsItem from './ChatsItem'
import {useQuery} from '@tanstack/react-query'
import type {IUser} from '@/entities/user'
import {buildChatId} from '@/entities/chat'

export type SelectedChat = {
	chatId: string
	senderId: string
	receiverId: string
	systemNotice: string
}

interface IChat {
	peer: IUser
	lastMessageAt: string
	lastMessageText: string
	unreadCount: number
}

type ChatsListProps = {
	onSelectChat: (chat: SelectedChat) => void
}

const ChatsList = ({onSelectChat}: ChatsListProps) => {
	const {data: chats = []} = useQuery<IChat[]>({
		queryKey: ['chats'],
		queryFn: () => axios.get('/api/chats').then(res => res.data)
	})

	const {data: me} = useQuery<IUser>({
		queryKey: ['me'],
		queryFn: () => axios.get('/api/users/me').then(res => res.data)
	})

	const realUsers = chats?.filter((chat: IChat) => chat.peer._id !== me?._id)

	return (
		<div className='flex flex-col bg-surface border border-divider rounded-2xl h-fit overflow-hidden'>
			<div className='px-4 py-3 border-b border-divider'>
				<h2 className='text-sm font-semibold text-ink'>Chats</h2>
			</div>
			<div className='flex flex-col p-2'>
				{realUsers?.length > 0 ? (
					realUsers?.map((chat: IChat) => (
						<ChatsItem
							key={chat.peer._id}
							avatar={
								chat.peer.avatarUrl || '/9dba1c75826cde0e6cf64a5a8fd25bf6.jpg'
							}
							name={chat.peer.username}
							unreadCount={chat.unreadCount}
							onClick={() => {
								if (!me) return
								onSelectChat({
									chatId: buildChatId(me._id, chat.peer._id),
									senderId: me._id,
									receiverId: chat.peer._id,
									systemNotice: `You started a chat with ${chat.peer.username}`
								})
							}}
						/>
					))
				) : (
					<div className='flex justify-center items-center py-12 text-sm text-muted'>
						No chats yet
					</div>
				)}
			</div>
		</div>
	)
}

export default ChatsList
