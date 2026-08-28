export default function UsersLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="w-full mx-auto">
			<div>{children}</div>
		</div>
	)
}
