import { Users } from "@/widgets/users-list"

const TopSouls = () => {
	return (
		<section>
			<h1 className="text-2xl font-semibold text-ink mb-1">Top souls</h1>
			<p className="text-sm text-muted">Welcome back. Here&apos;s a quick look at your space.</p>
			<div className="mt-4">
				<Users
					direction="row"
					minMatchPercent={30}
					emptyMessage="No matches above yet."
					userCount={3}
				/>
			</div>
		</section>
	)
}

export default TopSouls
