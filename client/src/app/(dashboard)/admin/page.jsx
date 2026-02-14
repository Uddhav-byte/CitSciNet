'use client';

import { useEffect, useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import useObservationStore from '../../../store/useObservationStore';
import useAuthStore from '../../../store/authStore';
import {
    GraduationCap, Download, FileSpreadsheet, FileJson, BarChart3,
    TrendingUp, Eye, Filter, Bird, Droplets, Wind, Leaf, Bug
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const CATEGORY_COLORS = {
    Bird: '#22d3ee',
    Mammal: '#a78bfa',
    Reptile: '#34d399',
    Insect: '#fbbf24',
    Plant: '#4ade80',
    Fish: '#60a5fa',
    Amphibian: '#f472b6',
    Other: '#94a3b8',
};

export default function AdminDashboard() {
    const user = useAuthStore((s) => s.user);
    const setObservations = useObservationStore((s) => s.setObservations);
    const observations = useObservationStore((s) => s.observations);
    const [filterCategory, setFilterCategory] = useState('All');
    const [timeRange, setTimeRange] = useState('all');

    const { data: obsData } = useQuery({
        queryKey: ['observations'],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/api/observations`);
            if (!res.ok) throw new Error('Failed to fetch');
            return res.json();
        },
    });

    useEffect(() => { if (obsData) setObservations(obsData); }, [obsData, setObservations]);

    // Computed data
    const categories = useMemo(() => {
        const cats = {};
        observations.forEach(o => { cats[o.category] = (cats[o.category] || 0) + 1; });
        return Object.entries(cats).sort((a, b) => b[1] - a[1]);
    }, [observations]);

    const filteredObs = useMemo(() => {
        let filtered = observations;
        if (filterCategory !== 'All') {
            filtered = filtered.filter(o => o.category === filterCategory);
        }
        if (timeRange !== 'all') {
            const now = new Date();
            const ranges = { '24h': 86400000, '7d': 604800000, '30d': 2592000000 };
            const cutoff = ranges[timeRange];
            filtered = filtered.filter(o => now - new Date(o.createdAt) < cutoff);
        }
        return filtered;
    }, [observations, filterCategory, timeRange]);

    const timelineData = useMemo(() => {
        const days = {};
        observations.forEach(o => {
            const day = new Date(o.createdAt).toLocaleDateString();
            days[day] = (days[day] || 0) + 1;
        });
        return Object.entries(days).slice(-7).reverse();
    }, [observations]);

    // Export
    const exportCSV = () => {
        if (filteredObs.length === 0) return;
        const headers = ['id', 'latitude', 'longitude', 'category', 'aiLabel', 'confidenceScore', 'userName', 'notes', 'verified', 'createdAt'];
        const csvRows = [headers.join(',')];
        filteredObs.forEach(obs => {
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
        a.download = `citsci-data-${filterCategory}-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const exportJSON = () => {
        const blob = new Blob([JSON.stringify(filteredObs, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `citsci-data-${filterCategory}-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const maxCatCount = categories[0]?.[1] || 1;

    return (
        <div className="flex-1 overflow-y-auto p-6" style={{ background: '#0B0E14' }}>
            <div className="mx-auto max-w-6xl">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between" style={{ animation: 'fadeSlideIn 0.3s ease both' }}>
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f59e0b]/15">
                            <GraduationCap className="h-5 w-5 text-[#f59e0b]" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-white">Educator Dashboard</h1>
                            <p className="text-xs text-white/40">Aggregated datasets for classroom use</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={exportCSV} className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-xs font-medium text-white/60 transition-all hover:bg-white/[0.06] hover:text-white">
                            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" /> Export CSV
                        </button>
                        <button onClick={exportJSON} className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-xs font-medium text-white/60 transition-all hover:bg-white/[0.06] hover:text-white">
                            <FileJson className="h-3.5 w-3.5 text-[#f59e0b]" /> Export JSON
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="mb-6 grid grid-cols-4 gap-3" style={{ animation: 'fadeSlideIn 0.3s ease 100ms both' }}>
                    {[
                        { label: 'Total Observations', value: observations.length, icon: Eye, color: '#00F2FF' },
                        { label: 'Categories', value: categories.length, icon: BarChart3, color: '#9D50FF' },
                        { label: 'Contributors', value: new Set(observations.map(o => o.userName)).size, icon: TrendingUp, color: '#10b981' },
                        { label: 'Filtered', value: filteredObs.length, icon: Filter, color: '#f59e0b' },
                    ].map((stat) => (
                        <div key={stat.label} className="glass-card p-4">
                            <div className="mb-2 flex items-center gap-1.5">
                                <stat.icon className="h-3.5 w-3.5" style={{ color: stat.color }} />
                                <span className="text-[10px] uppercase tracking-wider text-white/30">{stat.label}</span>
                            </div>
                            <p className="text-2xl font-bold text-white">{stat.value}</p>
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <div className="mb-6 flex items-center gap-3 glass-card p-3" style={{ animation: 'fadeSlideIn 0.3s ease 200ms both' }}>
                    <Filter className="h-4 w-4 text-white/30" />
                    <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white outline-none focus:border-[#00F2FF]"
                    >
                        <option value="All" className="bg-[#151921]">All Categories</option>
                        {categories.map(([cat]) => (
                            <option key={cat} value={cat} className="bg-[#151921]">{cat}</option>
                        ))}
                    </select>
                    <select
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value)}
                        className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white outline-none focus:border-[#00F2FF]"
                    >
                        <option value="all" className="bg-[#151921]">All Time</option>
                        <option value="24h" className="bg-[#151921]">Last 24h</option>
                        <option value="7d" className="bg-[#151921]">Last 7 days</option>
                        <option value="30d" className="bg-[#151921]">Last 30 days</option>
                    </select>
                    <span className="text-xs text-white/20">
                        Showing {filteredObs.length} of {observations.length}
                    </span>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    {/* Category Distribution */}
                    <div className="glass-card p-5" style={{ animation: 'fadeSlideIn 0.3s ease 300ms both' }}>
                        <h3 className="mb-4 text-sm font-bold text-white">Category Distribution</h3>
                        <div className="space-y-2.5">
                            {categories.map(([cat, count]) => (
                                <div key={cat} className="flex items-center gap-3">
                                    <span className="w-20 text-xs text-white/60">{cat}</span>
                                    <div className="flex-1 h-5 rounded-full bg-white/[0.03] overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-500"
                                            style={{
                                                width: `${(count / maxCatCount) * 100}%`,
                                                backgroundColor: CATEGORY_COLORS[cat] || '#94a3b8',
                                                boxShadow: `0 0 10px ${CATEGORY_COLORS[cat] || '#94a3b8'}40`,
                                            }}
                                        />
                                    </div>
                                    <span className="w-8 text-right text-xs font-mono text-white/50">{count}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recent Timeline */}
                    <div className="glass-card p-5" style={{ animation: 'fadeSlideIn 0.3s ease 400ms both' }}>
                        <h3 className="mb-4 text-sm font-bold text-white">Recent Activity (7 days)</h3>
                        <div className="space-y-2">
                            {timelineData.length === 0 ? (
                                <p className="text-xs text-white/30 py-8 text-center">No data available</p>
                            ) : (
                                timelineData.map(([day, count]) => (
                                    <div key={day} className="flex items-center gap-3">
                                        <span className="w-24 text-xs font-mono text-white/40">{day}</span>
                                        <div className="flex-1 h-4 rounded-full bg-white/[0.03] overflow-hidden">
                                            <div
                                                className="h-full rounded-full bg-gradient-to-r from-[#00F2FF] to-[#9D50FF] transition-all duration-500"
                                                style={{
                                                    width: `${Math.max((count / Math.max(...timelineData.map(t => t[1]))) * 100, 5)}%`,
                                                }}
                                            />
                                        </div>
                                        <span className="w-6 text-right text-xs font-mono text-white/50">{count}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Data Table */}
                <div className="mt-6 glass-card overflow-hidden" style={{ animation: 'fadeSlideIn 0.3s ease 500ms both' }}>
                    <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
                        <h3 className="text-sm font-bold text-white">Observation Data</h3>
                        <span className="text-[10px] text-white/20 font-mono">{filteredObs.length} records</span>
                    </div>
                    <div className="max-h-[400px] overflow-y-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="border-b border-white/[0.06] text-left text-[10px] uppercase tracking-wider text-white/30" style={{ background: 'rgba(11,14,20,0.5)' }}>
                                    <th className="px-4 py-2">Category</th>
                                    <th className="px-4 py-2">AI Label</th>
                                    <th className="px-4 py-2">Confidence</th>
                                    <th className="px-4 py-2">Location</th>
                                    <th className="px-4 py-2">Observer</th>
                                    <th className="px-4 py-2">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredObs.slice(0, 50).map((obs) => (
                                    <tr key={obs.id} className="border-b border-white/[0.03] transition-colors hover:bg-white/[0.02]">
                                        <td className="px-4 py-2">
                                            <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ backgroundColor: `${CATEGORY_COLORS[obs.category] || '#94a3b8'}20`, color: CATEGORY_COLORS[obs.category] || '#94a3b8' }}>
                                                {obs.category}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2 text-white/60">{obs.aiLabel || '—'}</td>
                                        <td className="px-4 py-2 font-mono text-[#00F2FF]/80">
                                            {obs.confidenceScore ? `${(obs.confidenceScore * 100).toFixed(0)}%` : '—'}
                                        </td>
                                        <td className="px-4 py-2 font-mono text-white/30">
                                            {obs.latitude.toFixed(3)}, {obs.longitude.toFixed(3)}
                                        </td>
                                        <td className="px-4 py-2 text-white/50">{obs.userName}</td>
                                        <td className="px-4 py-2 font-mono text-white/30">
                                            {new Date(obs.createdAt).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
