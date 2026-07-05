import { Users } from "@/widgets/users-list"

const TopSouls = () => {
	return (
		<section>
			<h1 className="text-3xl font-bold text-ink mb-1">Top matches</h1>
			<p className="text-sm text-muted">People who share your interests the most.</p>
			<div className="mt-5">
				<Users
					direction="row"
					minMatchPercent={30}
					emptyMessage="No matches yet — add or tweak your interests to surface people who overlap with you."
					emptyAction={{ label: "Edit interests", href: "/users/me/edit" }}
					userCount={3}
				/>
			</div>
		</section>
	)
}

export default TopSouls
