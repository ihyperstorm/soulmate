"use client"
import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import type { IUser } from "../model/types"

// Единый ключ для текущего залогиненного юзера (/api/users/me).
// Намеренно НЕ ['user'], чтобы не пересекаться по префиксу с ['user', userId]
// (чужие профили из /api/users/:id) при invalidateQueries.
export const CURRENT_USER_KEY = ["currentUser"] as const

export const fetchCurrentUser = async (): Promise<IUser | null> => {
	try {
		const res = await axios.get("/api/users/me")
		return res.data as IUser
	} catch (error) {
		// На публичных страницах юзер может быть не залогинен — это не ошибка.
		if (axios.isAxiosError(error) && error.response?.status === 401) return null
		throw error
	}
}

export const useCurrentUser = () =>
	useQuery<IUser | null>({
		queryKey: CURRENT_USER_KEY,
		queryFn: fetchCurrentUser,
		retry: false,
		refetchOnWindowFocus: false,
	})
