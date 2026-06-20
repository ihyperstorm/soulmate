type MessageProps = {
	message: string
	isMine?: boolean
}

const Message = ({message, isMine}: MessageProps) => {
	return (
		<div
			className={`max-w-[75%] py-2 px-3.5 text-sm leading-relaxed w-fit break-words ${
				isMine
					? 'bg-primary text-white self-end rounded-2xl rounded-br-md'
					: 'bg-surface-muted text-ink self-start rounded-2xl rounded-bl-md'
			}`}
		>
			{message}
		</div>
	)
}

export default Message
