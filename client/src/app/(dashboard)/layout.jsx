'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '../../store/authStore';
import Navbar from '../../components/Navbar';
import SocketProvider from '../../providers/SocketProvider';

export default function DashboardLayout({ children }) {
    const router = useRouter();
    const user = useAuthStore((s) => s.user);
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

    useEffect(() => {
        if (!isAuthenticated()) {
            router.replace('/login');
        }
    }, [isAuthenticated, router]);

    if (!user) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#050510]">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
                    <span className="text-sm text-cyan-400/70">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <SocketProvider>
            <div className="flex h-screen flex-col bg-[#050510]">
                <Navbar />
                <div className="flex flex-1 overflow-hidden">
                    {children}
                </div>
            </div>
        </SocketProvider>
    );
}
