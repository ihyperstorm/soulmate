"use client";

import axios from "axios";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	MessageList,
	appendMessageDeduped,
	mergeMessagesDeduped,
	type ChatMessagePayload,
	type ChatRealtimeEvent,
} from "@/entities/message";
import toast from "react-hot-toast";
import { useAppQueryClient } from "@/shared/api/providers";

type Props = {
	chatId: string | null;
	senderId: string | null;
	receiverId: string | null;
	systemNotice: string | null;
};

const ChatBox = ({ chatId, senderId, receiverId, systemNotice }: Props) => {
	const [messages, setMessages] = useState<ChatMessagePayload[]>([]);
	const [text, setText] = useState<string>("");
	const [isOnline, setIsOnline] = useState(() =>
		typeof navigator === "undefined" ? true : navigator.onLine,
	);
	const [sending, setSending] = useState(false);
	const [isPeerTyping, setIsPeerTyping] = useState(false);
	const [lastPeerReadAt, setLastPeerReadAt] = useState<string | null>(null);
	const typingOffTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const stopTypingDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const queryClient = useAppQueryClient();

	const lastReadSentRef = useRef<string | null>(null);
	const scrollRef = useRef<HTMLDivElement | null>(null);
	const typingActiveRef = useRef(false);

	const postTyping = useCallback(
		(isTyping: boolean) => {
			if (!chatId) return;
			axios.post("/api/messages/typing", { chatId, isTyping }).catch(() => {});
		},
		[chatId],
	);

	useEffect(() => {
		if (!chatId || !senderId || !receiverId) return;

		let cancelled = false;

		const loadHistory = async () => {
			try {
				const res = await axios.get<ChatMessagePayload[]>(
					`/api/messages?chatId=${chatId}&limit=50`,
				);

				if (cancelled) return;

				setMessages((prev) => mergeMessagesDeduped(prev, res.data));
			} catch (error) {
				console.error("Error loading history", error);
			}
		};
		loadHistory();

		const source = new EventSource(`/api/messages/stream?chatId=${chatId}`);

		source.onopen = () => {
			setIsOnline(true);
			loadHistory();
			console.log("SSE open", chatId);
		};

		source.onmessage = (evt) => {
			const data = JSON.parse(evt.data) as ChatRealtimeEvent;

			if (data.type === "new_message") {
				if (data.chatId !== chatId) return;
				setMessages((prev) => appendMessageDeduped(prev, data.message));
			}

			if (data.type === "typing") {
				if (data.chatId !== chatId) return;
				if (data.userId === senderId) return; // игнор своего typing

				setIsPeerTyping(data.isTyping);

				if (typingOffTimerRef.current) clearTimeout(typingOffTimerRef.current);
				if (data.isTyping) {
					typingOffTimerRef.current = setTimeout(() => setIsPeerTyping(false), 2500);
				}
				return;
			}

			if (data.type === "read") {
				if (data.chatId !== chatId) return;
				if (data.userId === senderId) return; // это наш own read
				setLastPeerReadAt(data.readAt);
			}

			if (data.type === "presence_snapshot") {
				if (data.chatId !== chatId) return;

				const peerTyping = data.typingUserIds.some((id) => id !== senderId);
				setIsPeerTyping(peerTyping);

				if (typingOffTimerRef.current) clearTimeout(typingOffTimerRef.current);
				if (peerTyping) {
					typingOffTimerRef.current = setTimeout(() => setIsPeerTyping(false), 2500);
				}

				const peerReadAt =
					Object.entries(data.readByUserId).find(
						([userId]) => userId !== senderId,
					)?.[1] ?? null;
				setLastPeerReadAt(peerReadAt ?? null);

				return;
			}
		};

		source.onerror = (err) => {
			setIsOnline(false);
			console.log("SSE error", err);
		};

		return () => {
			cancelled = true;
			source.close();
			console.log("SSE closed");
			if (typingOffTimerRef.current) clearTimeout(typingOffTimerRef.current);
			if (stopTypingDebounceRef.current) clearTimeout(stopTypingDebounceRef.current);
			if (typingActiveRef.current) {
				typingActiveRef.current = false;
				postTyping(false);
			}
		};
	}, [chatId, senderId, receiverId, postTyping]);

	useEffect(() => {
		const goOnline = () => setIsOnline(true);
		const goOffline = () => setIsOnline(false);

		window.addEventListener("online", goOnline);
		window.addEventListener("offline", goOffline);

		return () => {
			window.removeEventListener("online", goOnline);
			window.removeEventListener("offline", goOffline);
		};
	}, []);

	useEffect(() => {
		if (scrollRef.current) {
			scrollRef.current?.scrollTo({
				top: scrollRef.current.scrollHeight,
				behavior: "smooth",
			});
		}
	}, [messages.length]);

	useEffect(() => {
		if (!chatId || !senderId || !receiverId || messages.length === 0) return;
		if (document.visibilityState !== "visible") return;

		const hasIncoming = messages.some((m) => m.senderId === receiverId);
		if (!hasIncoming) return;

		const marker = `${chatId}:${messages[messages.length - 1]?._id ?? ""}`;
		if (lastReadSentRef.current === marker) return;
		lastReadSentRef.current = marker;

		axios.post("/api/messages/read", { chatId }).catch(() => {});
		queryClient.invalidateQueries({ queryKey: ["chats"] });
	}, [messages, chatId, senderId, receiverId, queryClient]);

	const sendMessage = async (e: React.SubmitEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!chatId || !text.trim() || sending) return;

		setSending(true);
		try {
			await axios.post("/api/messages", { chatId, text });
			await axios
				.post("/api/messages/typing", { chatId, isTyping: false })
				.catch(() => {});
			queryClient.invalidateQueries({ queryKey: ["chats"] });
		} catch (error) {
			toast.error("Error sending message");
			console.error("Error sending message", error);
		} finally {
			setSending(false);
		}

		if (typingActiveRef.current) {
			typingActiveRef.current = false;
			postTyping(false);
		}
		if (stopTypingDebounceRef.current) clearTimeout(stopTypingDebounceRef.current);

		setText("");
	};

	const readText = lastPeerReadAt
		? new Date(lastPeerReadAt).toLocaleTimeString([], {
				weekday: "long",
				hour: "2-digit",
				minute: "2-digit",
			})
		: null;

	return (
		<div className="flex flex-col h-175 bg-surface border border-divider rounded-2xl overflow-hidden">
			<div className="flex flex-col gap-1 px-4 py-2 border-b border-divider min-h-12 justify-center">
				{systemNotice && <div className="text-xs text-muted">{systemNotice}</div>}
				{isPeerTyping && <div className="text-xs text-primary">typing…</div>}
				{readText && !isPeerTyping && (
					<div className="text-xs text-faint">Read at {readText}</div>
				)}
				{!isOnline && <div className="text-xs text-warning">Reconnecting…</div>}
			</div>
			<div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2 bg-background">
				<MessageList
					messages={messages}
					senderId={senderId ?? ""}
					receiverId={receiverId ?? ""}
				/>
			</div>
			<form
				onSubmit={sendMessage}
				className="p-3 border-t border-divider flex gap-2 bg-surface"
			>
				<input
					type="text"
					value={text}
					onChange={(e) => {
						const value = e.target.value;
						setText(value);
						if (!chatId) return;
						// старт typing только один раз
						if (value.trim() && !typingActiveRef.current) {
							typingActiveRef.current = true;
							postTyping(true);
						}
						// debounce stop typing после паузы
						if (stopTypingDebounceRef.current)
							clearTimeout(stopTypingDebounceRef.current);
						stopTypingDebounceRef.current = setTimeout(() => {
							if (typingActiveRef.current) {
								typingActiveRef.current = false;
								postTyping(false);
							}
						}, 1200);
						// если поле очистили — сразу stop typing
						if (!value.trim() && typingActiveRef.current) {
							typingActiveRef.current = false;
							postTyping(false);
						}
					}}
					className="flex-1 bg-surface-muted border border-transparent rounded-xl px-4 py-2.5 text-sm text-ink placeholder:text-faint focus:outline-none focus:border-primary focus:bg-surface transition-colors"
					placeholder="Type a message…"
				/>
				<button
					disabled={sending || !text.trim()}
					type="submit"
					className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-primary hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
				>
					{sending ? "Sending…" : "Send"}
				</button>
			</form>
		</div>
	);
};

export default ChatBox;
