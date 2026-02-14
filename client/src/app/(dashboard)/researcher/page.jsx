'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import useObservationStore from '../../../store/useObservationStore';
import useAuthStore from '../../../store/authStore';
import {
    BarChart3, Target, Eye, CheckCircle2, AlertTriangle,
    ArrowUpDown, Search, MapPin, Sparkles, Clock, Filter
} from 'lucide-react';

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

const MissionCreator = dynamic(() => import('../../../components/MissionCreator'), {
    ssr: false,
});

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const CONFIDENCE_COLOR = (score) => {
    if (score >= 0.7) return 'text-green-400';
    if (score >= 0.4) return 'text-yellow-400';
    return 'text-red-400';
};

const CONFIDENCE_BG = (score) => {
    if (score >= 0.7) return 'bg-green-500/10 border-green-500/20';
    if (score >= 0.4) return 'bg-yellow-500/10 border-yellow-500/20';
    return 'bg-red-500/10 border-red-500/20';
};

function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
}

export default function ResearcherDashboard() {
    const user = useAuthStore((s) => s.user);
    const setObservations = useObservationStore((s) => s.setObservations);
    const observations = useObservationStore((s) => s.observations);
    const [missions, setMissions] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortField, setSortField] = useState('createdAt');
    const [sortDir, setSortDir] = useState('desc');
    const [filterCategory, setFilterCategory] = useState('all');
    const [viewMode, setViewMode] = useState('split'); // 'split', 'table', 'map'

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
    const { data: missionData, refetch: refetchMissions } = useQuery({
        queryKey: ['missions'],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/api/missions`);
            if (!res.ok) throw new Error('Failed to fetch');
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

    // Filter + sort observations
    const filtered = observations
        .filter((obs) => {
            if (filterCategory !== 'all' && obs.category !== filterCategory) return false;
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                return (
                    obs.category?.toLowerCase().includes(q) ||
                    obs.aiLabel?.toLowerCase().includes(q) ||
                    obs.userName?.toLowerCase().includes(q) ||
                    obs.notes?.toLowerCase().includes(q)
                );
            }
            return true;
        })
        .sort((a, b) => {
            let aVal, bVal;
            if (sortField === 'confidenceScore') {
                aVal = a.confidenceScore || 0;
                bVal = b.confidenceScore || 0;
            } else if (sortField === 'createdAt') {
                aVal = new Date(a.createdAt).getTime();
                bVal = new Date(b.createdAt).getTime();
            } else if (sortField === 'category') {
                aVal = a.category || '';
                bVal = b.category || '';
                return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
            } else {
                aVal = a[sortField] || '';
                bVal = b[sortField] || '';
            }
            return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
        });

    const toggleSort = (field) => {
        if (sortField === field) {
            setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDir('desc');
        }
    };

    const categories = [...new Set(observations.map((o) => o.category))];
    const avgConfidence = observations.length > 0
        ? observations.reduce((sum, o) => sum + (o.confidenceScore || 0), 0) / observations.length
        : 0;

    return (
        <div className="flex flex-1 overflow-hidden">
            {/* Left sidebar — Map + Mission Creator */}
            <div className="flex w-[45%] flex-col border-r border-white/10">
                <div className="relative flex-1">
                    <MapComponent missions={missions}>
                        <MissionCreator
                            onMissionCreated={() => {
                                refetchMissions();
                            }}
                        />
                    </MapComponent>
                </div>

                {/* Mission stats bar */}
                <div className="flex items-center gap-4 border-t border-white/10 bg-gray-950/80 px-4 py-2.5">
                    <div className="flex items-center gap-1.5 text-xs">
                        <Target className="h-3.5 w-3.5 text-cyan-400" />
                        <span className="text-white/70">{missions.length} missions</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-white/40">Draw polygon on map to create a new mission</span>
                    </div>
                </div>
            </div>

            {/* Right panel — Data Table */}
            <div className="flex flex-1 flex-col overflow-hidden">
                {/* Stats header */}
                <div className="grid grid-cols-4 gap-3 border-b border-white/10 bg-gray-950/50 p-4">
                    {[
                        { label: 'Total Observations', value: observations.length, icon: Eye, color: '#22d3ee' },
                        { label: 'Active Missions', value: missions.filter((m) => m.active).length, icon: Target, color: '#a855f7' },
                        { label: 'Avg Confidence', value: `${(avgConfidence * 100).toFixed(0)}%`, icon: Sparkles, color: '#fbbf24' },
                        { label: 'Verified', value: observations.filter((o) => o.verified).length, icon: CheckCircle2, color: '#22c55e' },
                    ].map((stat) => (
                        <div
                            key={stat.label}
                            className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3"
                        >
                            <div
                                className="flex h-9 w-9 items-center justify-center rounded-lg"
                                style={{ backgroundColor: `${stat.color}15` }}
                            >
                                <stat.icon className="h-4 w-4" style={{ color: stat.color }} />
                            </div>
                            <div>
                                <p className="text-lg font-bold text-white">{stat.value}</p>
                                <p className="text-[10px] uppercase tracking-wider text-white/40">{stat.label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Search + filter bar */}
                <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/30" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search observations..."
                            className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-9 pr-3 text-sm text-white placeholder-white/30 outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30"
                        />
                    </div>
                    <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70 outline-none focus:border-cyan-400"
                    >
                        <option value="all">All Categories</option>
                        {categories.map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                    <span className="text-xs text-white/40">{filtered.length} results</span>
                </div>

                {/* Table */}
                <div className="flex-1 overflow-y-auto">
                    <table className="w-full text-sm">
                        <thead className="sticky top-0 z-10 bg-gray-950/95 backdrop-blur-sm">
                            <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-white/40">
                                <th className="px-4 py-3 font-medium">
                                    <button
                                        onClick={() => toggleSort('category')}
                                        className="flex items-center gap-1 hover:text-white/70"
                                    >
                                        Category
                                        <ArrowUpDown className="h-3 w-3" />
                                    </button>
                                </th>
                                <th className="px-4 py-3 font-medium">AI Label</th>
                                <th className="px-4 py-3 font-medium">
                                    <button
                                        onClick={() => toggleSort('confidenceScore')}
                                        className="flex items-center gap-1 hover:text-white/70"
                                    >
                                        Confidence
                                        <ArrowUpDown className="h-3 w-3" />
                                    </button>
                                </th>
                                <th className="px-4 py-3 font-medium">User</th>
                                <th className="px-4 py-3 font-medium">Location</th>
                                <th className="px-4 py-3 font-medium">
                                    <button
                                        onClick={() => toggleSort('createdAt')}
                                        className="flex items-center gap-1 hover:text-white/70"
                                    >
                                        Time
                                        <ArrowUpDown className="h-3 w-3" />
                                    </button>
                                </th>
                                <th className="px-4 py-3 font-medium">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center text-white/30">
                                        <Eye className="mx-auto mb-2 h-8 w-8" />
                                        <p className="text-sm">No observations found</p>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((obs) => (
                                    <tr
                                        key={obs.id}
                                        className="border-b border-white/5 transition-colors hover:bg-white/[0.03]"
                                    >
                                        <td className="px-4 py-3">
                                            <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-white/80">
                                                {obs.category}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1.5">
                                                <Sparkles className="h-3 w-3 text-purple-400" />
                                                <span className="text-white/70">{obs.aiLabel || '—'}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            {obs.confidenceScore ? (
                                                <span
                                                    className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold ${CONFIDENCE_BG(obs.confidenceScore)} ${CONFIDENCE_COLOR(obs.confidenceScore)}`}
                                                >
                                                    {(obs.confidenceScore * 100).toFixed(0)}%
                                                </span>
                                            ) : (
                                                <span className="text-white/30">—</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-white/60">{obs.userName}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1 text-xs text-white/40">
                                                <MapPin className="h-3 w-3" />
                                                {obs.latitude.toFixed(2)}, {obs.longitude.toFixed(2)}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1 text-xs text-white/40">
                                                <Clock className="h-3 w-3" />
                                                {formatTime(obs.createdAt)}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            {obs.verified ? (
                                                <span className="flex items-center gap-1 text-xs font-medium text-green-400">
                                                    <CheckCircle2 className="h-3 w-3" />
                                                    Verified
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-xs text-yellow-400/70">
                                                    <AlertTriangle className="h-3 w-3" />
                                                    Pending
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
