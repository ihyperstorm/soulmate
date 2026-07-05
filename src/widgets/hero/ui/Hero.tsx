"use client"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

const Hero = () => {
	const router = useRouter()
	return (
		<section className="w-full px-6 pt-20 pb-16 flex flex-col items-center text-center">
			<span className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full text-xs font-medium bg-primary-soft text-primary">
				Find people who share your spark
			</span>
			<h1 className="mb-4 bg-linear-to-r from-[#0a66c2] via-[#0f9f6f] to-[#8443ce] bg-[length:200%_auto] bg-clip-text text-5xl font-semibold tracking-tight text-transparent md:text-6xl animate-gradient-x">
				Welcome to Soulmate
			</h1>
			<p className="text-base md:text-lg text-muted max-w-md mb-8">
				Connect with people who share your interests and start meaningful conversations.
			</p>
			<Button size="lg" className="h-11 px-8 text-base" onClick={() => router.push("/dashboard")}>
				Get Started
			</Button>
		</section>
	)
}

export default Hero
