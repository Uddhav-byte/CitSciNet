'use client';

import { useState, useEffect } from 'react';
import {
    MapPin, Target, Eye, Leaf, Bug, Bird, Waves, Wind,
    Users, Check, Calendar, TrendingUp, Loader2, X, Sparkles
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const TYPE_ICONS = { Water: Waves, Wildlife: Bug, Air: Wind, Plant: Leaf };
const TYPE_COLORS = { Water: '#3b82f6', Wildlife: '#a855f7', Air: '#f59e0b', Plant: '#10b981' };
const CAT_COLORS = {
    Bird: '#22d3ee', Mammal: '#a78bfa', Reptile: '#34d399', Insect: '#fbbf24',
    Plant: '#4ade80', Fish: '#60a5fa', Amphibian: '#f472b6', Other: '#94a3b8',
};

export default function AreaAnalysis({ location, onClose }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [radius, setRadius] = useState(5);

    useEffect(() => {
        if (!location) return;
        const fetchAnalysis = async () => {
            setLoading(true);
            try {
                const res = await fetch(
                    `${API_URL}/api/area-analysis?lat=${location.lat}&lng=${location.lng}&radiusKm=${radius}`
                );
                const json = await res.json();
                setData(json);
            } catch {
                setData(null);
            } finally {
                setLoading(false);
            }
        };
        fetchAnalysis();
    }, [location, radius]);

    if (!location) return null;

    const placeName = location.name?.split(',').slice(0, 2).join(', ') || 'Selected Area';

    return (
        <div
            className="flex flex-col h-full overflow-hidden"
            style={{ animation: 'fadeSlideIn 0.3s ease both' }}
        >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
                <div className="flex items-center gap-2 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#00F2FF]/15">
                        <MapPin className="h-4 w-4 text-[#00F2FF]" />
                    </div>
                    <div className="min-w-0">
                        <h3 className="text-sm font-bold text-white truncate">{placeName}</h3>
                        <span className="text-[10px] text-white/30 font-mono">
                            {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                        </span>
                    </div>
                </div>
                <button onClick={onClose} className="text-white/20 hover:text-white/50 p-1">
                    <X className="h-4 w-4" />
                </button>
            </div>

            {/* Radius selector */}
            <div className="flex items-center gap-2 px-4 py-2 border-b border-white/[0.04]">
                <span className="text-[10px] uppercase tracking-wider text-white/30">Radius:</span>
                {[2, 5, 10, 25].map(r => (
                    <button
                        key={r}
                        onClick={() => setRadius(r)}
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold transition-all ${radius === r
                                ? 'bg-[#00F2FF]/15 text-[#00F2FF] shadow-[0_0_8px_rgba(0,242,255,0.2)]'
                                : 'text-white/30 hover:text-white/60'
                            }`}
                    >
                        {r}km
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <Loader2 className="h-6 w-6 animate-spin text-[#00F2FF] mb-2" />
                        <span className="text-xs text-white/30">Analyzing area...</span>
                    </div>
                ) : data ? (
                    <>
                        {/* Summary stats */}
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { label: 'Observations', value: data.summary.totalObservations, icon: Eye, color: '#00F2FF' },
                                { label: 'Species', value: data.summary.uniqueSpecies, icon: Sparkles, color: '#9D50FF' },
                                { label: 'Missions', value: data.summary.activeMissions, icon: Target, color: '#dc2626' },
                            ].map(s => (
                                <div key={s.label} className="glass-card flex flex-col items-center py-2">
                                    <s.icon className="h-3 w-3 mb-1" style={{ color: s.color }} />
                                    <span className="text-lg font-bold text-white">{s.value}</span>
                                    <span className="text-[8px] uppercase tracking-wider text-white/25">{s.label}</span>
                                </div>
                            ))}
                        </div>

                        {/* Verification rate */}
                        <div className="glass-card px-3 py-2.5">
                            <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[10px] uppercase tracking-wider text-white/30">Verified Data</span>
                                <span className="text-xs font-bold text-emerald-400">{data.summary.verificationRate}%</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-[#00F2FF] transition-all duration-700"
                                    style={{ width: `${data.summary.verificationRate}%` }}
                                />
                            </div>
                        </div>

                        {/* Category breakdown */}
                        {Object.keys(data.categoryBreakdown).length > 0 && (
                            <div className="glass-card px-3 py-2.5">
                                <h4 className="text-[10px] uppercase tracking-wider text-white/30 mb-2">Category Distribution</h4>
                                <div className="space-y-1.5">
                                    {Object.entries(data.categoryBreakdown)
                                        .sort((a, b) => b[1] - a[1])
                                        .map(([cat, count]) => {
                                            const pct = (count / data.summary.totalObservations * 100).toFixed(0);
                                            const color = CAT_COLORS[cat] || '#94a3b8';
                                            return (
                                                <div key={cat} className="flex items-center gap-2">
                                                    <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                                                    <span className="text-xs text-white/60 flex-1">{cat}</span>
                                                    <span className="text-xs font-mono text-white/40">{count}</span>
                                                    <div className="w-16 h-1 rounded-full bg-white/[0.06] overflow-hidden">
                                                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                </div>
                            </div>
                        )}

                        {/* Species detected */}
                        {data.speciesList.length > 0 && (
                            <div className="glass-card px-3 py-2.5">
                                <h4 className="text-[10px] uppercase tracking-wider text-white/30 mb-2">
                                    AI-Detected Species ({data.speciesList.length})
                                </h4>
                                <div className="flex flex-wrap gap-1">
                                    {data.speciesList.map(sp => (
                                        <span
                                            key={sp}
                                            className="rounded-full bg-[#9D50FF]/10 px-2 py-0.5 text-[10px] text-[#9D50FF]"
                                        >
                                            {sp}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Active missions */}
                        {data.nearbyMissions.length > 0 && (
                            <div className="glass-card px-3 py-2.5">
                                <h4 className="text-[10px] uppercase tracking-wider text-white/30 mb-2">Active Missions</h4>
                                <div className="space-y-2">
                                    {data.nearbyMissions.map(m => {
                                        const Icon = TYPE_ICONS[m.missionType] || Target;
                                        const color = TYPE_COLORS[m.missionType] || '#dc2626';
                                        return (
                                            <div key={m.id} className="flex items-center gap-2 rounded-lg bg-white/[0.02] p-2">
                                                <Icon className="h-3.5 w-3.5 shrink-0" style={{ color }} />
                                                <div className="min-w-0 flex-1">
                                                    <div className="text-xs font-medium text-white/70 truncate">{m.title}</div>
                                                    <div className="text-[10px] text-white/25">{m.bountyPoints} pts</div>
                                                </div>
                                                <span
                                                    className="rounded-full px-1.5 py-0.5 text-[9px] font-bold"
                                                    style={{ backgroundColor: `${color}15`, color }}
                                                >
                                                    {m.missionType}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Top contributors */}
                        {data.topContributors.length > 0 && (
                            <div className="glass-card px-3 py-2.5">
                                <h4 className="text-[10px] uppercase tracking-wider text-white/30 mb-2">Top Contributors</h4>
                                <div className="space-y-1">
                                    {data.topContributors.map((c, i) => (
                                        <div key={c.name} className="flex items-center gap-2">
                                            <div
                                                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white"
                                                style={{
                                                    background: i === 0 ? 'linear-gradient(135deg, #00F2FF, #3b82f6)' :
                                                        i === 1 ? 'rgba(157,80,255,0.3)' : 'rgba(255,255,255,0.06)',
                                                }}
                                            >
                                                {i + 1}
                                            </div>
                                            <span className="text-xs text-white/60 flex-1">{c.name}</span>
                                            <span className="text-[10px] font-mono text-[#00F2FF]/60">{c.count} obs</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Recent observations */}
                        {data.recentObservations.length > 0 && (
                            <div className="glass-card px-3 py-2.5">
                                <h4 className="text-[10px] uppercase tracking-wider text-white/30 mb-2">Recent Activity</h4>
                                <div className="space-y-1.5">
                                    {data.recentObservations.slice(0, 5).map(obs => (
                                        <div key={obs.id} className="flex items-center gap-2 text-xs">
                                            <div
                                                className="h-1.5 w-1.5 rounded-full shrink-0"
                                                style={{ backgroundColor: CAT_COLORS[obs.category] || '#94a3b8' }}
                                            />
                                            <span className="text-white/50 truncate flex-1">
                                                {obs.aiLabel || obs.category}
                                            </span>
                                            <span className="text-white/20 text-[10px] font-mono shrink-0">
                                                {new Date(obs.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Empty state */}
                        {data.summary.totalObservations === 0 && (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                <Eye className="h-8 w-8 text-white/10 mb-2" />
                                <p className="text-xs text-white/40">No observations in this area yet</p>
                                <p className="text-[10px] text-white/20 mt-1">Try increasing the radius or searching another location</p>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center py-16">
                        <MapPin className="h-8 w-8 text-white/10 mb-2" />
                        <p className="text-xs text-white/40">Unable to load area data</p>
                    </div>
                )}
            </div>
        </div>
    );
}
