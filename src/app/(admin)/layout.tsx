import { AppSidebar } from "@/widgets/sidebar"
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@/components/ui/sidebar"
import { cookies } from "next/headers"

export default async function AdminLayout({
	children,
}: {
	children: React.ReactNode
}) {
	// Сохраняем состояние сайдбара между перезагрузками (cookie ставит SidebarProvider).
	const cookieStore = await cookies()
	const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false"

	return (
		<SidebarProvider defaultOpen={defaultOpen}>
			<AppSidebar />
			<SidebarInset>
				<header className="flex h-14 shrink-0 items-center gap-2 border-b border-divider px-4">
					<SidebarTrigger />
				</header>
				<div className="flex-1 min-h-0 overflow-auto px-4 md:px-6">
					{children}
				</div>
			</SidebarInset>
		</SidebarProvider>
	)
}
