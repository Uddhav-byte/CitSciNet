'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import useObservationStore from '../../../store/useObservationStore';
import useAuthStore from '../../../store/authStore';
import UploadObservation from '../../../components/UploadObservation';
import ObservationFeed from '../../../components/ObservationFeed';
import MissionPanel from '../../../components/MissionPanel';
import { Layers, Camera, X, Sparkles, Target, ChevronLeft, ChevronRight, MapPin, Zap } from 'lucide-react';

const MapComponent = dynamic(() => import('../../../components/MapComponent'), {
    ssr: false,
    loading: () => (
        <div className="flex h-full w-full items-center justify-center bg-gray-950">
            <div className="flex flex-col items-center gap-3">
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
                <span className="text-sm text-cyan-400/70">Loading map...</span>
            </div>
        </div>
    ),
});

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function CitizenDashboard() {
    const user = useAuthStore((s) => s.user);
    const setObservations = useObservationStore((s) => s.setObservations);
    const observations = useObservationStore((s) => s.observations);
    const [missions, setMissions] = useState([]);
    const [userLocation, setUserLocation] = useState(null);
    const [showObservationPanel, setShowObservationPanel] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [activeTab, setActiveTab] = useState('feed');

    // Fetch observations
    const { data: obsData } = useQuery({
        queryKey: ['observations'],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/api/observations`);
            if (!res.ok) throw new Error('Failed to fetch');
            return res.json();
        },
        retry: 3,
        retryDelay: 2000,
    });

    // Fetch missions
    const { data: missionData } = useQuery({
        queryKey: ['missions'],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/api/missions`);
            if (!res.ok) throw new Error('Failed to fetch missions');
            return res.json();
        },
        retry: 3,
        retryDelay: 2000,
    });

    useEffect(() => {
        if (obsData) setObservations(obsData);
    }, [obsData, setObservations]);

    useEffect(() => {
        if (missionData) setMissions(missionData);
    }, [missionData]);

    // Track user location
    useEffect(() => {
        if (!navigator.geolocation) return;
        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                setUserLocation({
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude,
                });
            },
            () => { },
            { enableHighAccuracy: true, timeout: 10000 }
        );
        return () => navigator.geolocation.clearWatch(watchId);
    }, []);

    return (
        <div className="relative flex flex-1 overflow-hidden">
            {/* ═══ Full-screen Map ═══ */}
            <div className="flex-1 relative">
                <MapComponent
                    missions={missions}
                    userLocation={userLocation}
                    onAcceptMission={(mission) => {
                        fetch(`${API_URL}/api/missions/${mission.id}/accept`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ userName: user?.name || 'Anonymous' }),
                        }).then(() => window.location.reload());
                    }}
                />

                {/* ── Top-left: Map controls ── */}
                <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                    <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/60 px-3 py-1.5 text-xs backdrop-blur-sm">
                        <Layers className="h-3.5 w-3.5 text-cyan-400" />
                        <span className="text-white/70">Satellite 3D</span>
                    </div>
                </div>

                {/* ── Top-center: Live stats pill ── */}
                <div className="absolute top-4 left-1/2 z-10 -translate-x-1/2">
                    <div className="flex items-center gap-4 rounded-full border border-white/10 bg-black/60 px-5 py-2 backdrop-blur-md">
                        <div className="flex items-center gap-1.5 text-xs">
                            <MapPin className="h-3 w-3 text-cyan-400" />
                            <span className="font-mono text-white/80">{observations.length}</span>
                            <span className="text-white/40">observations</span>
                        </div>
                        <div className="h-3 w-px bg-white/15" />
                        <div className="flex items-center gap-1.5 text-xs">
                            <Target className="h-3 w-3 text-purple-400" />
                            <span className="font-mono text-white/80">{missions.length}</span>
                            <span className="text-white/40">missions</span>
                        </div>
                        <div className="h-3 w-px bg-white/15" />
                        <div className="flex items-center gap-1.5 text-xs">
                            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400" />
                            <span className="text-green-400/80">Live</span>
                        </div>
                    </div>
                </div>

                {/* ── Bottom-right: Floating AI Observation Button ── */}
                <button
                    onClick={() => setShowObservationPanel(!showObservationPanel)}
                    className="absolute bottom-6 right-6 z-[1000] flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3.5 shadow-xl shadow-cyan-500/30 transition-all duration-300 hover:scale-105 hover:shadow-cyan-500/50"
                    style={{ animation: 'pulseGlow 3s ease-in-out infinite' }}
                >
                    {showObservationPanel ? (
                        <X className="h-5 w-5 text-white" />
                    ) : (
                        <>
                            <Camera className="h-5 w-5 text-white" />
                            <span className="text-sm font-bold text-white">New Observation</span>
                            <Zap className="h-3.5 w-3.5 text-yellow-300" />
                        </>
                    )}
                </button>

                {/* ── Floating observation form ── */}
                {showObservationPanel && (
                    <div
                        className="absolute bottom-20 right-6 z-[1000] w-[380px] max-h-[75vh] overflow-y-auto rounded-2xl border border-white/10 bg-gray-950/95 p-5 shadow-2xl backdrop-blur-xl"
                        style={{ animation: 'fadeSlideIn 0.3s ease both' }}
                    >
                        <div className="mb-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-purple-400" />
                                <h3 className="text-sm font-bold text-white">New Observation</h3>
                                <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-[10px] font-medium text-cyan-400">
                                    AI-Powered
                                </span>
                            </div>
                            <button
                                onClick={() => setShowObservationPanel(false)}
                                className="rounded-lg p-1 text-white/40 hover:bg-white/10 hover:text-white"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <UploadObservation />
                    </div>
                )}

                {/* ── Sidebar toggle button (visible when sidebar is closed) ── */}
                {!sidebarOpen && (
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="absolute top-1/2 right-0 z-20 -translate-y-1/2 rounded-l-xl border border-r-0 border-white/10 bg-gray-950/90 px-1.5 py-4 text-white/60 backdrop-blur-md transition-all hover:bg-gray-950 hover:text-white"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                )}
            </div>

            {/* ═══ Collapsible Right Sidebar ═══ */}
            <aside
                className={`flex shrink-0 flex-col border-l border-white/10 bg-gray-950/70 backdrop-blur-xl transition-all duration-300 ${sidebarOpen ? 'w-[340px]' : 'w-0 overflow-hidden border-l-0'
                    }`}
            >
                {/* Collapse button */}
                <button
                    onClick={() => setSidebarOpen(false)}
                    className="absolute top-1/2 -left-3 z-10 -translate-y-1/2 rounded-full border border-white/10 bg-gray-950 p-1 text-white/50 hover:text-white"
                    style={{ position: 'relative', left: 0, top: 0, transform: 'none', marginLeft: 'auto', marginTop: '8px', marginRight: '8px', width: 'fit-content' }}
                >
                    <ChevronRight className="h-3.5 w-3.5" />
                </button>

                {/* Tab bar */}
                <div className="flex border-b border-white/10">
                    {[
                        { id: 'feed', label: 'Live Feed', icon: Sparkles },
                        { id: 'missions', label: `Missions (${missions.length})`, icon: Target },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex flex-1 items-center justify-center gap-1.5 px-3 py-3 text-[11px] font-medium transition-colors ${activeTab === tab.id
                                    ? 'border-b-2 border-cyan-400 text-cyan-400'
                                    : 'text-white/40 hover:text-white/60'
                                }`}
                        >
                            <tab.icon className="h-3 w-3" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {activeTab === 'feed' ? (
                        <ObservationFeed />
                    ) : (
                        <MissionPanel
                            missions={missions}
                            userLocation={userLocation}
                            userName={user?.name || 'Anonymous'}
                        />
                    )}
                </div>

                {/* Footer */}
                <div className="border-t border-white/10 px-4 py-2.5">
                    <div className="flex items-center justify-center gap-1 text-[10px] text-white/20">
                        <span>CitSciNet v1.0</span>
                        <span>•</span>
                        <span>Hackathon 2026</span>
                    </div>
                </div>
            </aside>
        </div>
    );
}
