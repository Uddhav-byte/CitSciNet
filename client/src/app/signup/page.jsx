'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Globe, Mail, Lock, User, FlaskConical, Leaf, Eye, EyeOff, ArrowRight, AlertTriangle } from 'lucide-react';
import useAuthStore from '../../store/authStore';

export default function SignupPage() {
    const router = useRouter();
    const signup = useAuthStore((s) => s.signup);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [name, setName] = useState('');
    const [role, setRole] = useState('citizen');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!email || !password) {
            setError('Please fill in all required fields.');
            return;
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setIsLoading(true);

        // Small delay for UX feel
        await new Promise((r) => setTimeout(r, 500));

        const result = signup(email, password, role, name);

        if (!result.success) {
            setError(result.error);
            setIsLoading(false);
            return;
        }

        router.push(role === 'researcher' ? '/researcher' : '/citizen');
    };

    const roles = [
        {
            value: 'citizen',
            label: 'Citizen Scientist',
            desc: 'Explore, observe, and contribute data',
            icon: Leaf,
            color: '#22d3ee',
        },
        {
            value: 'researcher',
            label: 'Researcher',
            desc: 'Create missions and analyze data',
            icon: FlaskConical,
            color: '#a855f7',
        },
    ];

    return (
        <div className="relative flex min-h-screen items-center justify-center bg-[#050510] px-4">
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
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/25">
                        <Globe className="h-6 w-6 text-white" />
                    </div>
                    <h1 className="text-xl font-bold text-white">
                        Join CitSci<span className="text-cyan-400">Net</span>
                    </h1>
                    <p className="mt-1 text-sm text-white/40">Create your account to get started</p>
                </div>

                {/* Card */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl">
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        {/* Role selection */}
                        <div>
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-cyan-400">
                                I am a
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                {roles.map((r) => (
                                    <button
                                        key={r.value}
                                        type="button"
                                        onClick={() => setRole(r.value)}
                                        className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition-all duration-200 ${role === r.value
                                                ? 'border-cyan-400/50 bg-cyan-400/10 shadow-[0_0_20px_rgba(34,211,238,0.1)]'
                                                : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                                            }`}
                                    >
                                        <div
                                            className="flex h-10 w-10 items-center justify-center rounded-lg"
                                            style={{ backgroundColor: `${r.color}15` }}
                                        >
                                            <r.icon className="h-5 w-5" style={{ color: r.color }} />
                                        </div>
                                        <span className={`text-sm font-semibold ${role === r.value ? 'text-white' : 'text-white/70'}`}>
                                            {r.label}
                                        </span>
                                        <span className="text-center text-[10px] text-white/40">{r.desc}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Name */}
                        <div>
                            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-cyan-400">
                                Name
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Your name"
                                    className="w-full rounded-lg border border-white/10 bg-white/5 py-2.5 pl-10 pr-3 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30"
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-cyan-400">
                                Email *
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    required
                                    className="w-full rounded-lg border border-white/10 bg-white/5 py-2.5 pl-10 pr-3 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-cyan-400">
                                Password *
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Min 6 characters"
                                    required
                                    className="w-full rounded-lg border border-white/10 bg-white/5 py-2.5 pl-10 pr-10 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30"
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

                        {/* Confirm password */}
                        <div>
                            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-cyan-400">
                                Confirm Password *
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Repeat password"
                                    required
                                    className="w-full rounded-lg border border-white/10 bg-white/5 py-2.5 pl-10 pr-3 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30"
                                />
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
                            className="group flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-500/25 transition-all duration-300 hover:shadow-cyan-500/40 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {isLoading ? (
                                <>
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                    Creating account...
                                </>
                            ) : (
                                <>
                                    Create Account
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

                    {/* Login link */}
                    <p className="text-center text-sm text-white/50">
                        Already have an account?{' '}
                        <Link href="/login" className="font-semibold text-cyan-400 hover:text-cyan-300 transition-colors">
                            Log In
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
