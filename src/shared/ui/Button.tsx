const Button = ({
	children,
	onClick,
	className,
}: {
	children: React.ReactNode
	onClick: () => void
	className?: string
}) => {
	return (
		<button
			onClick={onClick}
			className={`inline-flex items-center justify-center rounded-lg font-medium cursor-pointer transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-soft ${className ?? ''}`}
		>
			{children}
		</button>
	)
}

export default Button
