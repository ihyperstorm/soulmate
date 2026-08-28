"use client"

import { CURRENT_USER_KEY, useCurrentUser } from "@/entities/user"
import { useAppQueryClient } from "@/shared/api/providers"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
	SidebarRail,
} from "@/components/ui/sidebar"
import axios from "axios"
import { Bell, ChevronRight, ChevronsUpDown, CircleUserRound, CreditCard, Home, LogOut, MessageCircle, Settings, Sparkles, Users } from "lucide-react"
import { useTranslations } from "next-intl"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"

// Навигация. Саб-пункты пока частично заглушки (url: "#").
// title/items[].title — ключи неймспейса `nav`, подписи резолвятся в рендере.
const NAV = [
	{
		title: "dashboard",
		icon: Home,
		url: "/dashboard",
		items: [
			{ title: "overview", url: "/dashboard" },
			{ title: "activity", url: "#" },
		],
	},
	{
		title: "users",
		icon: Users,
		url: "/users",
		items: [
			{ title: "allUsers", url: "/users" },
			{ title: "matches", url: "#" },
		],
	},
	{
		title: "messages",
		icon: MessageCircle,
		url: "/messages",
		items: [
			{ title: "inbox", url: "/messages" },
			{ title: "requests", url: "#" },
		],
	},
	{
		title: "settings",
		icon: Settings,
		url: "/settings",
		items: [
			{ title: "account", url: "/settings" },
			{ title: "billing", url: "#" },
			{ title: "notifications", url: "#" },
		],
	},
] as const

export function AppSidebar() {
	const pathname = usePathname()
	const router = useRouter()
	const queryClient = useAppQueryClient()
	const { data: me } = useCurrentUser()
	const t = useTranslations("sidebar")
	const tNav = useTranslations("nav")
	const tHeader = useTranslations("header")

	// Явные разворачивания пользователем. Секции контролируемые: без записи здесь
	// открытость выводится из pathname (активная секция раскрыта). Держать это в
	// defaultOpen нельзя — при навигации он менялся бы у уже смонтированного
	// Collapsible, и Base UI ругается на uncontrolled → controlled.
	const [openSections, setOpenSections] = useState<Record<string, boolean>>({})

	const logout = async () => {
		queryClient.setQueryData(CURRENT_USER_KEY, null)
		try {
			await axios.post("/api/auth/logout")
		} catch {
			// даже при ошибке уводим на signin — сессия локально сброшена
		}
		router.replace("/signin")
	}

	const initial = me?.username?.charAt(0)?.toUpperCase() ?? "U"

	return (
		<Sidebar collapsible="icon">
			{/* Свитчер воркспейса (заглушка) */}
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<DropdownMenu>
							<DropdownMenuTrigger
								render={
									<SidebarMenuButton size="lg">
										<div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-white">
											S
										</div>
										<div className="grid flex-1 text-left text-sm leading-tight">
											<span className="truncate font-semibold">Soulmate</span>
											<span className="truncate text-xs text-sidebar-foreground/70">{t("freePlan")}</span>
										</div>
										<ChevronsUpDown className="ml-auto" />
									</SidebarMenuButton>
								}
							/>
							<DropdownMenuContent align="start" side="bottom" className="w-56">
								{/* GroupLabel в Base UI обязан быть внутри Menu.Group */}
								<DropdownMenuGroup>
									<DropdownMenuLabel>{t("workspaces")}</DropdownMenuLabel>
									<DropdownMenuItem>Soulmate</DropdownMenuItem>
									<DropdownMenuItem>{t("addWorkspace")}</DropdownMenuItem>
								</DropdownMenuGroup>
							</DropdownMenuContent>
						</DropdownMenu>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>

			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>{tNav("platform")}</SidebarGroupLabel>
					<SidebarMenu>
						{NAV.map((item) => {
							const sectionActive =
								pathname === item.url || pathname.startsWith(item.url + "/") || item.items.some((s) => s.url !== "#" && pathname === s.url)
							return (
								<Collapsible
										key={item.title}
										open={openSections[item.title] ?? sectionActive}
										onOpenChange={(open) => setOpenSections((prev) => ({ ...prev, [item.title]: open }))}
										className="group/collapsible"
									>
									<SidebarMenuItem>
										<CollapsibleTrigger
											render={
												<SidebarMenuButton tooltip={tNav(item.title)}>
													<item.icon />
													<span>{tNav(item.title)}</span>
													<ChevronRight className="ml-auto transition-transform group-data-open/collapsible:rotate-90" />
												</SidebarMenuButton>
											}
										/>
										<CollapsibleContent>
											<SidebarMenuSub>
												{item.items.map((sub) => (
													<SidebarMenuSubItem key={sub.title}>
														<SidebarMenuSubButton isActive={sub.url !== "#" && pathname === sub.url} render={<Link href={sub.url} />}>
															<span>{tNav(sub.title)}</span>
														</SidebarMenuSubButton>
													</SidebarMenuSubItem>
												))}
											</SidebarMenuSub>
										</CollapsibleContent>
									</SidebarMenuItem>
								</Collapsible>
							)
						})}
					</SidebarMenu>
				</SidebarGroup>
			</SidebarContent>

			{/* Футер: меню пользователя */}
			<SidebarFooter>
				<SidebarMenu>
					<SidebarMenuItem>
						<DropdownMenu>
							<DropdownMenuTrigger
								render={
									<SidebarMenuButton size="lg">
										<Avatar className="size-8 rounded-lg">
											<AvatarImage src={me?.avatarUrl || "/9dba1c75826cde0e6cf64a5a8fd25bf6.jpg"} alt={me?.username ?? "avatar"} />
											<AvatarFallback className="rounded-lg">{initial}</AvatarFallback>
										</Avatar>
										<div className="grid flex-1 text-left text-sm leading-tight">
											<span className="truncate font-semibold">{me?.username ?? t("guest")}</span>
											<span className="truncate text-xs text-sidebar-foreground/70">{me?.email ?? ""}</span>
										</div>
										<ChevronsUpDown className="ml-auto size-4" />
									</SidebarMenuButton>
								}
							/>
							<DropdownMenuContent align="end" side="top" className="min-w-56">
								{/* Не DropdownMenuLabel: это блок личности, а не заголовок группы
								    (Base UI GroupLabel требует обёртку Menu.Group) */}
								<div className="grid px-1.5 py-1 text-left text-sm leading-tight">
									<span className="truncate font-semibold text-foreground">{me?.username ?? t("guest")}</span>
									<span className="truncate text-xs text-muted-foreground">{me?.email ?? ""}</span>
								</div>
								<DropdownMenuSeparator />
								<DropdownMenuItem>
									<Sparkles />
									{t("upgradeToPro")}
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem render={<Link href="/users/me" />}>
									<CircleUserRound />
									{tNav("account")}
								</DropdownMenuItem>
								<DropdownMenuItem render={<Link href="/settings" />}>
									<CreditCard />
									{tNav("billing")}
								</DropdownMenuItem>
								<DropdownMenuItem>
									<Bell />
									{tNav("notifications")}
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem variant="destructive" onClick={logout}>
									<LogOut />
									{tHeader("signOut")}
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarFooter>

			<SidebarRail />
		</Sidebar>
	)
}
