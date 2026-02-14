'use client';

import { Globe, Wifi, WifiOff, Users, Eye, LogOut, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import useObservationStore from '../store/useObservationStore';
import useAuthStore from '../store/authStore';

export default function Navbar() {
    const router = useRouter();
    const isConnected = useObservationStore((s) => s.isConnected);
    const clientCount = useObservationStore((s) => s.clientCount);
    const observationCount = useObservationStore((s) => s.observations.length);
    const user = useAuthStore((s) => s.user);
    const logout = useAuthStore((s) => s.logout);

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    return (
        <nav className="flex items-center justify-between border-b border-white/10 bg-gray-950/80 px-6 py-3 backdrop-blur-xl">
            <div className="flex items-center gap-3">
                <Link href="/" className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20">
                        <Globe className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold tracking-tight text-white">
                            CitSci<span className="text-cyan-400">Net</span>
                        </h1>
                        <p className="text-[10px] font-medium uppercase tracking-widest text-white/40">
                            Citizen Science Network
                        </p>
                    </div>
                </Link>
            </div>

            <div className="flex items-center gap-4">
                {/* Live stats — shown when on dashboards */}
                {user && (
                    <>
                        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs">
                            <Eye className="h-3.5 w-3.5 text-cyan-400" />
                            <span className="font-mono text-white/70">{observationCount}</span>
                            <span className="text-white/40">obs</span>
                        </div>

                        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs">
                            <Users className="h-3.5 w-3.5 text-purple-400" />
                            <span className="font-mono text-white/70">{clientCount}</span>
                            <span className="text-white/40">live</span>
                        </div>

                        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs">
                            {isConnected ? (
                                <>
                                    <div className="relative">
                                        <div className="absolute inset-0 animate-ping rounded-full bg-green-400 opacity-40" />
                                        <Wifi className="relative h-3.5 w-3.5 text-green-400" />
                                    </div>
                                    <span className="text-green-400">Live</span>
                                </>
                            ) : (
                                <>
                                    <WifiOff className="h-3.5 w-3.5 text-red-400" />
                                    <span className="text-red-400">Offline</span>
                                </>
                            )}
                        </div>

                        {/* Separator */}
                        <div className="h-6 w-px bg-white/10" />
                    </>
                )}

                {/* Auth section */}
                {user ? (
                    <div className="flex items-center gap-3">
                        {/* User profile pill */}
                        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-[10px] font-bold text-white">
                                {user.name ? user.name[0].toUpperCase() : user.email[0].toUpperCase()}
                            </div>
                            <span className="text-xs font-medium text-white/80">{user.name || user.email}</span>
                            <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${user.role === 'researcher'
                                        ? 'bg-purple-500/20 text-purple-400'
                                        : 'bg-cyan-500/20 text-cyan-400'
                                    }`}
                            >
                                {user.role === 'researcher' ? 'Researcher' : 'Citizen'}
                            </span>
                        </div>

                        {/* Logout */}
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/60 transition-all hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
                        >
                            <LogOut className="h-3.5 w-3.5" />
                            Logout
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <Link
                            href="/login"
                            className="rounded-lg border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-white/70 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white"
                        >
                            Log In
                        </Link>
                        <Link
                            href="/signup"
                            className="rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-1.5 text-xs font-bold text-white shadow-lg shadow-cyan-500/20 transition-all hover:shadow-cyan-500/40 hover:brightness-110"
                        >
                            Sign Up
                        </Link>
                    </div>
                )}
            </div>
        </nav>
    );
}
