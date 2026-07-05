import { Bubble, BubbleContent } from "@/components/ui/bubble"

type MessageProps = {
	message: string
	isMine?: boolean
}

const Message = ({ message, isMine }: MessageProps) => {
	return (
		<Bubble
			variant={isMine ? "default" : "muted"}
			align={isMine ? "end" : "start"}
		>
			<BubbleContent>{message}</BubbleContent>
		</Bubble>
	)
}

export default Message
