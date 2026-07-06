"use client"

import { CURRENT_USER_KEY, useCurrentUser } from "@/entities/user"
import { useAppQueryClient } from "@/shared/api/providers"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
	DropdownMenu,
	DropdownMenuContent,
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
import {
	Bell,
	ChevronRight,
	ChevronsUpDown,
	CircleUserRound,
	CreditCard,
	Home,
	LogOut,
	MessageCircle,
	Settings,
	Sparkles,
	Users,
} from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

// Навигация. Саб-пункты пока частично заглушки (url: "#").
const NAV = [
	{
		title: "Dashboard",
		icon: Home,
		url: "/dashboard",
		items: [
			{ title: "Overview", url: "/dashboard" },
			{ title: "Activity", url: "#" },
		],
	},
	{
		title: "Users",
		icon: Users,
		url: "/users",
		items: [
			{ title: "All users", url: "/users" },
			{ title: "Matches", url: "#" },
		],
	},
	{
		title: "Messages",
		icon: MessageCircle,
		url: "/messages",
		items: [
			{ title: "Inbox", url: "/messages" },
			{ title: "Requests", url: "#" },
		],
	},
	{
		title: "Settings",
		icon: Settings,
		url: "/settings",
		items: [
			{ title: "Account", url: "/settings" },
			{ title: "Billing", url: "#" },
			{ title: "Notifications", url: "#" },
		],
	},
]

export function AppSidebar() {
	const pathname = usePathname()
	const router = useRouter()
	const queryClient = useAppQueryClient()
	const { data: me } = useCurrentUser()

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
											<span className="truncate text-xs text-sidebar-foreground/70">
												Free plan
											</span>
										</div>
										<ChevronsUpDown className="ml-auto" />
									</SidebarMenuButton>
								}
							/>
							<DropdownMenuContent
								align="start"
								side="bottom"
								className="w-56"
							>
								<DropdownMenuLabel>Workspaces</DropdownMenuLabel>
								<DropdownMenuItem>Soulmate</DropdownMenuItem>
								<DropdownMenuItem>Add workspace</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>

			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>Platform</SidebarGroupLabel>
					<SidebarMenu>
						{NAV.map(item => {
							const sectionActive =
								pathname === item.url ||
								pathname.startsWith(item.url + "/") ||
								item.items.some(s => s.url !== "#" && pathname === s.url)
							return (
								<Collapsible
									key={item.title}
									defaultOpen={sectionActive}
									className="group/collapsible"
								>
									<SidebarMenuItem>
										<CollapsibleTrigger
											render={
												<SidebarMenuButton tooltip={item.title}>
													<item.icon />
													<span>{item.title}</span>
													<ChevronRight className="ml-auto transition-transform group-data-[open]/collapsible:rotate-90" />
												</SidebarMenuButton>
											}
										/>
										<CollapsibleContent>
											<SidebarMenuSub>
												{item.items.map(sub => (
													<SidebarMenuSubItem key={sub.title}>
														<SidebarMenuSubButton
															isActive={sub.url !== "#" && pathname === sub.url}
															render={<Link href={sub.url} />}
														>
															<span>{sub.title}</span>
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
											<AvatarImage
												src={
													me?.avatarUrl ||
													"/9dba1c75826cde0e6cf64a5a8fd25bf6.jpg"
												}
												alt={me?.username ?? "avatar"}
											/>
											<AvatarFallback className="rounded-lg">
												{initial}
											</AvatarFallback>
										</Avatar>
										<div className="grid flex-1 text-left text-sm leading-tight">
											<span className="truncate font-semibold">
												{me?.username ?? "Guest"}
											</span>
											<span className="truncate text-xs text-sidebar-foreground/70">
												{me?.email ?? ""}
											</span>
										</div>
										<ChevronsUpDown className="ml-auto size-4" />
									</SidebarMenuButton>
								}
							/>
							<DropdownMenuContent
								align="end"
								side="top"
								className="min-w-56"
							>
								<DropdownMenuLabel className="font-normal">
									<div className="grid text-left text-sm leading-tight">
										<span className="truncate font-semibold text-foreground">
											{me?.username ?? "Guest"}
										</span>
										<span className="truncate text-xs">{me?.email ?? ""}</span>
									</div>
								</DropdownMenuLabel>
								<DropdownMenuSeparator />
								<DropdownMenuItem>
									<Sparkles />
									Upgrade to Pro
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem render={<Link href="/users/me" />}>
									<CircleUserRound />
									Account
								</DropdownMenuItem>
								<DropdownMenuItem render={<Link href="/settings" />}>
									<CreditCard />
									Billing
								</DropdownMenuItem>
								<DropdownMenuItem>
									<Bell />
									Notifications
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem variant="destructive" onClick={logout}>
									<LogOut />
									Log out
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
