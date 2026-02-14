'use client';

import { useEffect, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import useObservationStore from '../../../store/useObservationStore';
import useAuthStore from '../../../store/authStore';
import useMissionStore from '../../../store/useMissionStore';
import ObservationFeed from '../../../components/ObservationFeed';
import LocationSearch from '../../../components/LocationSearch';
import AreaAnalysis from '../../../components/AreaAnalysis';
import {
    FlaskConical, Download, FileJson, FileSpreadsheet, Target,
    Eye, TrendingUp, Users, ChevronRight, ChevronLeft,
    Check, X as XIcon, BarChart3, Zap, MapPin, Search,
    Table2, Radio, Compass, Globe, Sparkles, ArrowRight,
    Music, Volume2
} from 'lucide-react';

const MapComponent = dynamic(() => import('../../../components/MapComponent'), {
    ssr: false,
    loading: () => (
        <div className="flex h-full w-full items-center justify-center" style={{ background: '#0B0E14' }}>
            <div className="flex flex-col items-center gap-3">
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#9D50FF] border-t-transparent" />
                <span className="text-sm text-[#9D50FF]/60">Loading research map...</span>
            </div>
        </div>
    ),
});

const MissionCreator = dynamic(() => import('../../../components/MissionCreator'), { ssr: false });

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function ResearcherDashboard() {
    const user = useAuthStore((s) => s.user);
    const setObservations = useObservationStore((s) => s.setObservations);
    const observations = useObservationStore((s) => s.observations);
    const missions = useMissionStore((s) => s.missions);
    const setMissions = useMissionStore((s) => s.setMissions);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [activeTab, setActiveTab] = useState('data');
    const [searchLocation, setSearchLocation] = useState(null);
    const [flyTarget, setFlyTarget] = useState(null);

    const { data: obsData, refetch: refetchObs } = useQuery({
        queryKey: ['observations'],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/api/observations`);
            if (!res.ok) throw new Error('Failed to fetch');
            return res.json();
        },
    });

    const { data: missionData, refetch: refetchMissions } = useQuery({
        queryKey: ['missions'],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/api/missions`);
            if (!res.ok) throw new Error('Failed to fetch missions');
            return res.json();
        },
    });

    useEffect(() => { if (obsData) setObservations(obsData); }, [obsData, setObservations]);
    useEffect(() => { if (missionData) setMissions(missionData); }, [missionData, setMissions]);

    const verifiedCount = observations.filter(o => o.verified).length;
    const categories = {};
    observations.forEach(o => { categories[o.category] = (categories[o.category] || 0) + 1; });

    const handleLocationSelect = useCallback((loc) => {
        setSearchLocation(loc);
        setFlyTarget({ lat: loc.lat, lng: loc.lng, zoom: 13 });
        setActiveTab('explore');
        setSidebarOpen(true);
    }, []);

    const handleCloseExplore = () => {
        setSearchLocation(null);
        setActiveTab('data');
    };

    const exportJSON = () => {
        const blob = new Blob([JSON.stringify(observations, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `citsci-observations-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const exportCSV = () => {
        if (observations.length === 0) return;
        const headers = ['id', 'latitude', 'longitude', 'category', 'aiLabel', 'confidenceScore', 'userName', 'notes', 'verified', 'createdAt'];
        const csvRows = [headers.join(',')];
        observations.forEach(obs => {
            csvRows.push(headers.map(h => {
                const val = obs[h];
                if (val === null || val === undefined) return '';
                const str = String(val);
                return str.includes(',') || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
            }).join(','));
        });
        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `citsci-observations-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleVerify = async (id, verified) => {
        try {
            await fetch(`${API_URL}/api/observations/${id}/verify`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ verified }),
            });
            refetchObs();
        } catch { }
    };

    const handleDelete = async (id) => {
        try {
            await fetch(`${API_URL}/api/observations/${id}`, { method: 'DELETE' });
            refetchObs();
        } catch { }
    };

    const SIDEBAR_TABS = [
        { id: 'data', label: 'Data Table', icon: Table2, desc: 'All observations' },
        { id: 'feed', label: 'Live Feed', icon: Radio, desc: 'Real-time updates' },
        { id: 'explore', label: 'Explore', icon: Compass, desc: 'Area analysis', highlight: !!searchLocation },
    ];

    return (
        <div className="relative flex flex-1 overflow-hidden">
            {/* Map Area */}
            <div className="flex-1 relative">
                <MapComponent missions={missions} flyTarget={flyTarget}>
                    <MissionCreator onMissionCreated={() => refetchMissions()} />
                </MapComponent>

                {/* Search bar overlay */}
                <div className="absolute top-4 left-4 z-[1000]">
                    <LocationSearch onLocationSelect={handleLocationSelect} />
                </div>

                {/* Stat pills */}
                <div className="absolute top-4 right-4 z-10">
                    <div className="glass-surface flex items-center gap-4 rounded-full px-5 py-2">
                        <div className="flex items-center gap-1.5 text-xs">
                            <Eye className="h-3 w-3 text-[#00F2FF]" />
                            <span className="font-mono text-white/70">{observations.length}</span>
                        </div>
                        <div className="h-3 w-px bg-white/10" />
                        <div className="flex items-center gap-1.5 text-xs">
                            <Target className="h-3 w-3 text-[#dc2626]" />
                            <span className="font-mono text-white/70">{missions.length}</span>
                        </div>
                        <div className="h-3 w-px bg-white/10" />
                        <div className="flex items-center gap-1.5 text-xs">
                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" style={{ animation: 'heartbeat 2s ease-in-out infinite' }} />
                            <span className="text-emerald-400/70">Live</span>
                        </div>
                    </div>
                </div>

                {!sidebarOpen && (
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="absolute top-1/2 right-0 z-20 -translate-y-1/2 rounded-l-xl border border-r-0 border-white/[0.06] px-1.5 py-4 text-white/40 backdrop-blur-md transition-all hover:text-white"
                        style={{ background: 'rgba(21,25,33,0.9)' }}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                )}
            </div>

            {/* Right Sidebar */}
            <aside
                className={`flex shrink-0 flex-col border-l border-white/[0.06] transition-all duration-300 ${sidebarOpen ? 'w-[380px]' : 'w-0 overflow-hidden border-l-0'
                    }`}
                style={{ background: 'rgba(11, 14, 20, 0.7)', backdropFilter: 'blur(16px)' }}
            >
                {sidebarOpen && (
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="ml-auto mr-2 mt-2 rounded-lg p-1 text-white/20 hover:text-white/50"
                    >
                        <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                )}

                {/* Research Stats */}
                <div className="grid grid-cols-4 gap-1.5 px-3 pb-3">
                    {[
                        { label: 'Total', value: observations.length, icon: BarChart3, color: '#00F2FF' },
                        { label: 'Verified', value: verifiedCount, icon: Check, color: '#10b981' },
                        { label: 'Missions', value: missions.length, icon: Target, color: '#dc2626' },
                        { label: 'Species', value: Object.keys(categories).length, icon: TrendingUp, color: '#f59e0b' },
                    ].map((stat) => (
                        <div key={stat.label} className="glass-card flex flex-col items-center py-2.5">
                            <stat.icon className="h-3 w-3 mb-1" style={{ color: stat.color }} />
                            <span className="text-base font-bold text-white">{stat.value}</span>
                            <span className="text-[8px] uppercase tracking-wider text-white/25">{stat.label}</span>
                        </div>
                    ))}
                </div>

                {/* Export bar */}
                <div className="flex items-center gap-2 border-b border-white/[0.06] px-3 pb-3">
                    <span className="text-[10px] uppercase tracking-wider text-white/30">Export:</span>
                    <button
                        onClick={exportCSV}
                        className="flex items-center gap-1 rounded-lg border border-white/[0.06] bg-white/[0.03] px-2.5 py-1.5 text-xs font-medium text-white/60 transition-all hover:bg-white/[0.06] hover:text-white"
                    >
                        <FileSpreadsheet className="h-3 w-3 text-emerald-400" />
                        CSV
                    </button>
                    <button
                        onClick={exportJSON}
                        className="flex items-center gap-1 rounded-lg border border-white/[0.06] bg-white/[0.03] px-2.5 py-1.5 text-xs font-medium text-white/60 transition-all hover:bg-white/[0.06] hover:text-white"
                    >
                        <FileJson className="h-3 w-3 text-[#f59e0b]" />
                        JSON
                    </button>
                    <div className="flex-1" />
                    <Download className="h-3.5 w-3.5 text-white/20" />
                </div>

                {/* Tab Navigation — Redesigned with icons & descriptions */}
                <div className="flex border-b border-white/[0.06] px-2 py-1.5 gap-1">
                    {SIDEBAR_TABS.map((tab) => {
                        const isActive = activeTab === tab.id;
                        const accentColor = tab.id === 'explore' ? '#00F2FF' : '#9D50FF';
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex flex-1 items-center gap-2 rounded-lg px-2.5 py-2 transition-all ${isActive
                                    ? 'bg-white/[0.06] shadow-sm'
                                    : 'hover:bg-white/[0.03]'
                                    }`}
                                style={isActive ? {
                                    boxShadow: `0 0 12px ${accentColor}10`,
                                } : {}}
                            >
                                <tab.icon
                                    className="h-3.5 w-3.5 shrink-0"
                                    style={{ color: isActive ? accentColor : 'rgba(255,255,255,0.25)' }}
                                />
                                <div className="text-left min-w-0">
                                    <div className={`text-[11px] font-semibold leading-tight ${isActive ? 'text-white' : 'text-white/40'
                                        }`}>
                                        {tab.label}
                                    </div>
                                    <div className="text-[9px] text-white/20 leading-tight truncate">
                                        {tab.desc}
                                    </div>
                                </div>
                                {tab.highlight && isActive && (
                                    <div className="ml-auto h-1.5 w-1.5 rounded-full bg-[#00F2FF] shadow-[0_0_6px_rgba(0,242,255,0.6)]" />
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                    {activeTab === 'data' ? (
                        <DataTable
                            observations={observations}
                            onVerify={handleVerify}
                            onDelete={handleDelete}
                        />
                    ) : activeTab === 'feed' ? (
                        <div className="p-3">
                            <ObservationFeed />
                        </div>
                    ) : activeTab === 'explore' ? (
                        searchLocation ? (
                            <AreaAnalysis location={searchLocation} onClose={handleCloseExplore} />
                        ) : (
                            <ExploreEmptyState />
                        )
                    ) : null}
                </div>
            </aside>
        </div>
    );
}

/* ─── Explore Empty State ─────────────────────────────────────────── */
function ExploreEmptyState() {
    return (
        <div className="flex flex-col items-center justify-center px-6 py-12">
            {/* Hero icon with animated rings */}
            <div className="relative mb-6">
                <div className="absolute inset-0 rounded-full bg-[#00F2FF]/[0.03]" style={{ animation: 'pulse 3s ease-in-out infinite', width: '80px', height: '80px', top: '-12px', left: '-12px' }} />
                <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#00F2FF]/10 to-[#3b82f6]/10 border border-[#00F2FF]/20">
                    <Compass className="h-6 w-6 text-[#00F2FF]" />
                </div>
            </div>

            <h3 className="text-base font-bold text-white mb-1.5">Spatial Research Explorer</h3>
            <p className="text-xs text-white/40 text-center mb-6 max-w-[240px] leading-relaxed">
                Discover environmental data, species, and missions for any location on the planet.
            </p>

            {/* Feature list */}
            <div className="w-full max-w-[260px] space-y-2.5 mb-6">
                {[
                    { icon: Globe, color: '#00F2FF', title: 'Observation Density', desc: 'See how many observations exist in an area' },
                    { icon: Sparkles, color: '#9D50FF', title: 'Species Breakdown', desc: 'Full breakdown of species detected' },
                    { icon: Target, color: '#dc2626', title: 'Active Missions', desc: 'Find ongoing research missions nearby' },
                    { icon: TrendingUp, color: '#10b981', title: 'Temporal Analysis', desc: 'Activity patterns over time' },
                ].map((f, i) => (
                    <div
                        key={f.title}
                        className="flex items-start gap-3 rounded-xl bg-white/[0.02] border border-white/[0.04] p-3 transition-colors hover:bg-white/[0.04]"
                        style={{ animation: `fadeSlideIn 0.3s ease ${i * 80}ms both` }}
                    >
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${f.color}12` }}>
                            <f.icon className="h-3.5 w-3.5" style={{ color: f.color }} />
                        </div>
                        <div>
                            <p className="text-[11px] font-semibold text-white/70">{f.title}</p>
                            <p className="text-[10px] text-white/30">{f.desc}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Call to action */}
            <div className="flex items-center gap-2 rounded-xl bg-[#00F2FF]/[0.06] border border-[#00F2FF]/10 px-4 py-2.5">
                <Search className="h-3.5 w-3.5 text-[#00F2FF]" />
                <span className="text-[11px] text-[#00F2FF]/80 font-medium">
                    Use the search bar on the map to get started
                </span>
                <ArrowRight className="h-3 w-3 text-[#00F2FF]/40" />
            </div>
        </div>
    );
}

/* ─── Data Table ──────────────────────────────────────────────────── */
function DataTable({ observations, onVerify, onDelete }) {
    return (
        <div className="text-xs">
            {/* Header */}
            <div className="sticky top-0 z-10 grid grid-cols-[1fr_70px_60px_70px_60px] gap-2 border-b border-white/[0.06] px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-white/30" style={{ background: 'rgba(11,14,20,0.95)' }}>
                <span>Category / Label</span>
                <span>Conf.</span>
                <span>Audio</span>
                <span>Status</span>
                <span className="text-right">Act</span>
            </div>

            {/* Rows */}
            {observations.map((obs, i) => (
                <div
                    key={obs.id}
                    className="grid grid-cols-[1fr_70px_60px_70px_60px] items-center gap-2 border-b border-white/[0.04] px-3 py-2 transition-colors hover:bg-white/[0.02]"
                    style={{ animation: `fadeSlideIn 0.2s ease ${Math.min(i, 20) * 30}ms both` }}
                >
                    <div className="min-w-0">
                        <span className="font-semibold text-white/80 truncate block">{obs.category}</span>
                        {obs.aiLabel && (
                            <div className="flex items-center gap-1 mt-0.5">
                                <span className="text-[#9D50FF] shrink-0">AI:</span>
                                <span className="text-white/40 truncate">{obs.aiLabel}</span>
                            </div>
                        )}
                    </div>
                    <span className="font-mono text-[#00F2FF]/80 whitespace-nowrap">
                        {obs.confidenceScore ? `${(obs.confidenceScore * 100).toFixed(0)}%` : '—'}
                    </span>
                    <div className="flex items-center">
                        {obs.audioUrl ? (
                            <button
                                onClick={() => {
                                    const audio = document.getElementById(`audio-${obs.id}`);
                                    if (audio) {
                                        if (audio.paused) audio.play();
                                        else audio.pause();
                                    }
                                }}
                                className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f472b6]/10 text-[#f472b6] hover:bg-[#f472b6]/20 transition-all"
                                title="Play audio"
                            >
                                <Music className="h-3.5 w-3.5" />
                                <audio id={`audio-${obs.id}`} src={obs.audioUrl} className="hidden" onPlay={(e) => {
                                    // Stop other audios
                                    document.querySelectorAll('audio').forEach(a => {
                                        if (a !== e.target) { a.pause(); a.currentTime = 0; }
                                    });
                                }} />
                            </button>
                        ) : (
                            <span className="text-white/10">—</span>
                        )}
                    </div>
                    <span>
                        {obs.verified ? (
                            <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] text-emerald-400">✓</span>
                        ) : (
                            <span className="rounded bg-yellow-500/15 px-1.5 py-0.5 text-[10px] text-yellow-400">?</span>
                        )}
                    </span>
                    <div className="flex justify-end gap-1">
                        <button
                            onClick={() => onVerify(obs.id, !obs.verified)}
                            className="rounded p-1 text-white/20 hover:bg-emerald-500/10 hover:text-emerald-400"
                            title={obs.verified ? 'Unverify' : 'Verify'}
                        >
                            <Check className="h-3 w-3" />
                        </button>
                        <button
                            onClick={() => onDelete(obs.id)}
                            className="rounded p-1 text-white/20 hover:bg-red-500/10 hover:text-red-400"
                            title="Delete"
                        >
                            <XIcon className="h-3 w-3" />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
