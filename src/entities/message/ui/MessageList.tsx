import type {ChatMessagePayload} from '@/entities/message/model/types'
import Message from './Message'

type MessageListProps = {
	messages: ChatMessagePayload[]
	senderId: string
	receiverId: string
}

const MessageList = ({messages, senderId}: MessageListProps) => {
	return (
		<div className='flex flex-col gap-2'>
			{messages.map(m => {
				const isMine = m.senderId === senderId
				return (
					<Message
						key={m._id}
						message={m.text}
						isMine={isMine}
					/>
				)
			})}
		</div>
	)
}

export default MessageList
