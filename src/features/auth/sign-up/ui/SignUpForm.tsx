"use client";

import { registerSchema } from "../model/registerSchema";
import { yupResolver } from "@hookform/resolvers/yup";
import { useAppQueryClient } from "@/shared/api/providers";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

type RegisterFormData = {
	username: string;
	email: string;
	password: string;
};

export const SignUpForm = () => {
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);
	const router = useRouter();
	const queryClient = useAppQueryClient();

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<RegisterFormData>({
		defaultValues: {
			username: "",
			email: "",
			password: "",
		},
		resolver: yupResolver(registerSchema),
	});

	const onSubmit = async (data: RegisterFormData) => {
		setError(null);
		setSuccess(false);

		try {
			const response = await axios.post("/api/auth/register", {
				username: data.username,
				email: data.email,
				password: data.password,
			});
			queryClient.setQueryData(["user"], response.data.user);

			if (response.data.user?._id) {
				localStorage.setItem("userId", response.data.user._id);
			}

			setSuccess(true);
			router.replace("/interests");
			router.refresh();
		} catch (err) {
			queryClient.setQueryData(["user"], null);
			setError("Registration failed");
			console.error(err);
		}
	};

	return (
		<div className="w-full max-w-sm bg-surface border border-divider rounded-2xl p-8">
			<div className="text-center mb-6">
				<h1 className="text-2xl font-semibold text-ink mb-1">Create account</h1>
				<p className="text-sm text-muted">Join Soulmate and meet your people</p>
			</div>
			<form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
				{error && (
					<p className="text-sm text-danger bg-danger-soft border border-danger/20 rounded-lg px-3 py-2">
						{error}
					</p>
				)}
				{success && (
					<p className="text-sm text-accent bg-accent-soft border border-accent/20 rounded-lg px-3 py-2">
						Registration successful!
					</p>
				)}
				<div className="flex flex-col gap-1">
					<label className="text-xs font-medium text-muted">Full name</label>
					<input
						className="bg-surface border border-line rounded-lg px-3 py-2.5 text-sm text-ink placeholder:text-faint focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-soft transition-all"
						type="text"
						placeholder="Your name"
						{...register("username")}
					/>
					{errors.username && (
						<p className="text-xs text-danger mt-0.5">{errors.username.message}</p>
					)}
				</div>
				<div className="flex flex-col gap-1">
					<label className="text-xs font-medium text-muted">Email</label>
					<input
						className="bg-surface border border-line rounded-lg px-3 py-2.5 text-sm text-ink placeholder:text-faint focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-soft transition-all"
						type="email"
						placeholder="you@example.com"
						{...register("email")}
					/>
					{errors.email && (
						<p className="text-xs text-danger mt-0.5">{errors.email.message}</p>
					)}
				</div>
				<div className="flex flex-col gap-1">
					<label className="text-xs font-medium text-muted">Password</label>
					<input
						className="bg-surface border border-line rounded-lg px-3 py-2.5 text-sm text-ink placeholder:text-faint focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-soft transition-all"
						type="password"
						placeholder="••••••••"
						{...register("password")}
					/>
					{errors.password && (
						<p className="text-xs text-danger mt-0.5">{errors.password.message}</p>
					)}
				</div>
				<button
					type="submit"
					disabled={isSubmitting}
					className="mt-2 inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-primary hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
				>
					{isSubmitting ? "Creating account…" : "Sign up"}
				</button>
			</form>
			<Link
				href="/signin"
				className="block text-sm text-center mt-5 text-muted hover:text-primary transition-colors"
			>
				Already have an account? <span className="text-primary font-medium">Sign in</span>
			</Link>
		</div>
	);
};
