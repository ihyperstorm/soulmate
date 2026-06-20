export default async function DashboardLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return <main className='w-full max-w-7xl mx-auto py-10'>{children}</main>
}
