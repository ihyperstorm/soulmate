import {Sidebar} from '@/widgets/sidebar'

export default function SettingsPage() {
	return (
		<div className='grid grid-cols-[11rem_minmax(0,1fr)_minmax(0,1fr)] gap-4 py-10'>
			<Sidebar />
			<section className='bg-surface border border-divider rounded-2xl p-6'>
				<h1 className='text-2xl font-semibold text-ink mb-1'>Settings</h1>
				<p className='text-sm text-muted'>Manage your account preferences.</p>
			</section>
		</div>
	)
}
