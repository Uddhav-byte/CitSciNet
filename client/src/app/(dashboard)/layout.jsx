'use client';

import { useState } from 'react';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import useAuthStore from '../../store/authStore';
import useObservationStore from '../../store/useObservationStore';
import SocketProvider from '../../providers/SocketProvider';
import {
    Globe, Map, FlaskConical, Target, User, Settings, LogOut,
    Wifi, WifiOff, Users, Eye, ChevronLeft, ChevronRight, Menu,
    GraduationCap, BookOpen, Shield, Compass, BarChart3, Trophy
} from 'lucide-react';

function Sidebar({ collapsed, setCollapsed, user }) {
    const pathname = usePathname();

    const isResearcher = user?.role === 'researcher';

    // Grouped navigation
    const navSections = [
        {
            label: 'Core',
            items: [
                {
                    icon: Map,
                    label: 'Map Dashboard',
                    desc: 'Live observations & missions',
                    href: isResearcher ? '/researcher' : '/citizen',
                },
                ...(isResearcher
                    ? [{
                        icon: FlaskConical,
                        label: 'Research Lab',
                        desc: 'Create & manage missions',
                        href: '/researcher',
                    }]
                    : [{
                        icon: Target,
                        label: 'Missions',
                        desc: 'Browse active missions',
                        href: '/citizen',
                    }]
                ),
            ],
        },
        {
            label: 'Research',
            items: [
                ...(isResearcher
                    ? [{
                        icon: Compass,
                        label: 'Explore',
                        desc: 'Spatial area analysis',
                        href: '/researcher',
                        highlight: true,
                    }]
                    : []
                ),
                ...(isResearcher
                    ? [{
                        icon: Shield,
                        label: 'Review Queue',
                        desc: 'Moderate submissions',
                        href: '/review',
                    }]
                    : []
                ),
                {
                    icon: BookOpen,
                    label: 'Papers',
                    desc: 'Published research',
                    href: '/papers',
                },
            ].filter(Boolean),
        },
        {
            label: 'Insights',
            items: [
                {
                    icon: BarChart3,
                    label: 'Analytics',
                    desc: 'Charts & trends',
                    href: '/admin',
                },
                {
                    icon: Trophy,
                    label: 'Leaderboard',
                    desc: 'Top contributors & rewards',
                    href: isResearcher ? '/researcher' : '/citizen',
                    highlight: !isResearcher,
                },
            ],
        },
    ];

    return (
        <aside
            className={`sidebar-desktop fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-white/[0.06] transition-all duration-300 ${collapsed ? 'w-[64px]' : 'w-[220px]'
                }`}
            style={{ background: 'rgba(11, 14, 20, 0.95)', backdropFilter: 'blur(20px)' }}
        >
            {/* Logo */}
            <div className="flex items-center gap-2.5 border-b border-white/[0.06] px-4 py-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#00F2FF] to-[#3b82f6] shadow-lg shadow-[#00F2FF]/20">
                    <Globe className="h-4.5 w-4.5 text-white" />
                </div>
                {!collapsed && (
                    <div className="overflow-hidden">
                        <h1 className="text-sm font-bold tracking-tight text-white">
                            CitSci<span className="text-[#00F2FF]">Net</span>
                        </h1>
                        <p className="text-[8px] font-medium uppercase tracking-[0.15em] text-white/30">
                            Science Network
                        </p>
                    </div>
                )}
            </div>

            {/* Nav Sections */}
            <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2 py-3">
                {navSections.map((section) => (
                    <div key={section.label} className="mb-2">
                        {!collapsed && (
                            <div className="px-3 pb-1.5 pt-2">
                                <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/20">
                                    {section.label}
                                </span>
                            </div>
                        )}
                        {section.items.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 ${isActive
                                        ? 'bg-[#00F2FF]/10 text-[#00F2FF] shadow-[inset_0_0_20px_rgba(0,242,255,0.05)]'
                                        : 'text-white/40 hover:bg-white/[0.04] hover:text-white/70'
                                        }`}
                                    title={collapsed ? item.label : undefined}
                                >
                                    <item.icon className={`h-[18px] w-[18px] shrink-0 ${isActive ? 'text-[#00F2FF]' : ''}`} />
                                    {!collapsed && (
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-sm font-medium">{item.label}</span>
                                                {item.highlight && (
                                                    <span className="rounded bg-[#00F2FF]/15 px-1 py-0.5 text-[8px] font-bold text-[#00F2FF]">
                                                        NEW
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-[10px] text-white/20 leading-tight">
                                                {item.desc}
                                            </span>
                                        </div>
                                    )}
                                    {isActive && !collapsed && (
                                        <div className="ml-auto h-1.5 w-1.5 rounded-full bg-[#00F2FF] shadow-[0_0_6px_rgba(0,242,255,0.6)]" />
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                ))}
            </nav>

            {/* User section at bottom */}
            <div className="border-t border-white/[0.06] px-2 py-3">
                {!collapsed && user && (
                    <div className="mb-2 flex items-center gap-2 rounded-xl bg-white/[0.03] px-3 py-2">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#00F2FF] to-[#3b82f6] text-[10px] font-bold text-white">
                            {(user.name || user.email || '?')[0].toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-medium text-white/80">{user.name || user.email}</p>
                            <p className="text-[10px] text-white/30 capitalize">{user.role}</p>
                        </div>
                    </div>
                )}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs text-white/30 transition-colors hover:bg-white/[0.04] hover:text-white/50"
                >
                    {collapsed ? <ChevronRight className="h-4 w-4" /> : <><ChevronLeft className="h-4 w-4" /><span>Collapse</span></>}
                </button>
            </div>
        </aside>
    );
}


function TopBar({ user }) {
    const router = useRouter();
    const isConnected = useObservationStore((s) => s.isConnected);
    const clientCount = useObservationStore((s) => s.clientCount);
    const observationCount = useObservationStore((s) => s.observations.length);
    const logout = useAuthStore((s) => s.logout);

    return (
        <header className="flex h-12 shrink-0 items-center justify-between border-b border-white/[0.06] px-5" style={{ background: 'rgba(11, 14, 20, 0.8)', backdropFilter: 'blur(12px)' }}>
            {/* Left: context */}
            <div className="flex items-center gap-3">
                <h2 className="topbar-brand text-sm font-semibold text-white/50">
                    {user?.role === 'researcher' ? 'Research Lab' : 'Explorer Dashboard'}
                </h2>
                {user && (
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${user.role === 'researcher'
                        ? 'bg-[#9D50FF]/15 text-[#9D50FF]'
                        : 'bg-[#00F2FF]/15 text-[#00F2FF]'
                        }`}>
                        {user.role}
                    </span>
                )}
            </div>

            {/* Right: live stats + user */}
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.02] px-3 py-1 text-xs">
                    <Eye className="h-3 w-3 text-[#00F2FF]/70" />
                    <span className="font-mono text-white/60">{observationCount}</span>
                </div>

                <div className="flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.02] px-3 py-1 text-xs">
                    <Users className="h-3 w-3 text-[#9D50FF]/70" />
                    <span className="font-mono text-white/60">{clientCount}</span>
                </div>

                <div className="flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.02] px-3 py-1 text-xs">
                    {isConnected ? (
                        <>
                            <div className="relative">
                                <div className="absolute inset-0 rounded-full bg-emerald-400" style={{ animation: 'heartbeat 2s ease-in-out infinite' }} />
                                <div className="relative h-2 w-2 rounded-full bg-emerald-400" />
                            </div>
                            <span className="text-emerald-400/80">Live</span>
                        </>
                    ) : (
                        <>
                            <WifiOff className="h-3 w-3 text-red-400" />
                            <span className="text-red-400/80">Offline</span>
                        </>
                    )}
                </div>

                <div className="h-5 w-px bg-white/[0.06]" />

                <button
                    onClick={() => { logout(); router.push('/'); }}
                    className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs text-white/40 transition-all hover:bg-red-500/10 hover:text-red-400"
                >
                    <LogOut className="h-3.5 w-3.5" />
                </button>
            </div>
        </header>
    );
}

function BottomNav({ user }) {
    const pathname = usePathname();
    const navItems = [
        { icon: Map, label: 'Map', href: user?.role === 'researcher' ? '/researcher' : '/citizen' },
        { icon: Target, label: 'Missions', href: '/citizen' },
        { icon: User, label: 'Profile', href: '#' },
        { icon: Settings, label: 'Settings', href: '#' },
    ];

    return (
        <nav className="bottom-nav-mobile fixed bottom-0 left-0 right-0 z-50 items-center justify-around border-t border-white/[0.06] py-2" style={{ background: 'rgba(11, 14, 20, 0.95)', backdropFilter: 'blur(20px)' }}>
            {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                    <Link
                        key={item.label}
                        href={item.href}
                        className={`flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] ${isActive ? 'text-[#00F2FF]' : 'text-white/30'
                            }`}
                    >
                        <item.icon className="h-5 w-5" />
                        <span>{item.label}</span>
                    </Link>
                );
            })}
        </nav>
    );
}

export default function DashboardLayout({ children }) {
    const router = useRouter();
    const user = useAuthStore((s) => s.user);
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    useEffect(() => {
        if (!isAuthenticated()) {
            router.replace('/login');
        }
    }, [isAuthenticated, router]);

    if (!user) {
        return (
            <div className="flex h-screen items-center justify-center" style={{ background: '#0B0E14' }}>
                <div className="flex flex-col items-center gap-3">
                    <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#00F2FF] border-t-transparent" />
                    <span className="text-sm text-[#00F2FF]/70">Loading CitSciNet...</span>
                </div>
            </div>
        );
    }

    return (
        <SocketProvider>
            <div className="flex h-screen" style={{ background: '#0B0E14' }}>
                {/* Sidebar (desktop) */}
                <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} user={user} />

                {/* Main area */}
                <div
                    className={`flex flex-1 flex-col transition-all duration-300 ${sidebarCollapsed ? 'ml-[64px]' : 'ml-[220px]'
                        }`}
                    style={{ marginLeft: undefined }}
                >
                    <style jsx>{`
                        @media (min-width: 769px) {
                            div { margin-left: ${sidebarCollapsed ? '64px' : '220px'}; }
                        }
                        @media (max-width: 768px) {
                            div { margin-left: 0 !important; padding-bottom: 60px; }
                        }
                    `}</style>
                    <TopBar user={user} />
                    <div className="flex flex-1 overflow-hidden">
                        {children}
                    </div>
                </div>

                {/* Bottom nav (mobile) */}
                <BottomNav user={user} />
            </div>
        </SocketProvider>
    );
}
