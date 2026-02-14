'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Globe, Mail, Lock, Eye, EyeOff, ArrowRight, AlertTriangle } from 'lucide-react';
import useAuthStore from '../../store/authStore';

export default function LoginPage() {
    const router = useRouter();
    const login = useAuthStore((s) => s.login);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!email || !password) {
            setError('Please fill in all fields.');
            return;
        }

        setIsLoading(true);
        await new Promise((r) => setTimeout(r, 500));

        const result = login(email, password);

        if (!result.success) {
            setError(result.error);
            setIsLoading(false);
            return;
        }

        router.push(result.role === 'researcher' ? '/researcher' : '/citizen');
    };

    return (
        <div className="relative flex min-h-screen items-center justify-center bg-[#0B0E14] px-4">
            {/* Background */}
            <div
                className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full opacity-15 blur-3xl"
                style={{ background: 'radial-gradient(circle, #22d3ee, transparent)' }}
            />
            <div
                className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full opacity-15 blur-3xl"
                style={{ background: 'radial-gradient(circle, #a855f7, transparent)' }}
            />

            <div
                className="relative w-full max-w-md"
                style={{ animation: 'fadeSlideIn 0.6s ease both' }}
            >
                {/* Logo */}
                <div className="mb-8 flex flex-col items-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-[0_0_15px_rgba(0,242,255,0.3)]">
                        <Globe className="h-6 w-6 text-white" />
                    </div>
                    <h1 className="text-xl font-bold text-white">
                        Welcome Back to CitSci<span className="text-[#00F2FF]">Net</span>
                    </h1>
                    <p className="mt-1 text-sm text-white/40">Log in to continue your mission</p>
                </div>

                {/* Card */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl">
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        {/* Email */}
                        <div>
                            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#00F2FF]">
                                Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    required
                                    className="w-full rounded-lg border border-white/10 bg-white/5 py-2.5 pl-10 pr-3 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-[#00F2FF] focus:ring-1 focus:ring-[#00F2FF]/30"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#00F2FF]">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    className="w-full rounded-lg border border-white/10 bg-white/5 py-2.5 pl-10 pr-10 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-[#00F2FF] focus:ring-1 focus:ring-[#00F2FF]/30"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
                                <AlertTriangle className="h-4 w-4 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="group flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-3 text-sm font-bold text-white shadow-lg shadow-[0_0_15px_rgba(0,242,255,0.3)] transition-all duration-300 hover:shadow-[0_0_25px_rgba(0,242,255,0.5)] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {isLoading ? (
                                <>
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                    Logging in...
                                </>
                            ) : (
                                <>
                                    Log In
                                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="my-5 flex items-center gap-3">
                        <div className="h-px flex-1 bg-white/10" />
                        <span className="text-xs text-white/30">or</span>
                        <div className="h-px flex-1 bg-white/10" />
                    </div>

                    {/* Signup link */}
                    <p className="text-center text-sm text-white/50">
                        Don&apos;t have an account?{' '}
                        <Link href="/signup" className="font-semibold text-[#00F2FF] hover:text-[#00F2FF]/80 transition-colors">
                            Sign Up
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
