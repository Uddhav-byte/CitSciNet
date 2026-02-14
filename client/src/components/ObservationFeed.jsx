'use client';

import useObservationStore from '../store/useObservationStore';
import { Eye, Sparkles, Mic } from 'lucide-react';

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

function timeAgo(timestamp) {
    const now = new Date();
    const diff = now - new Date(timestamp);
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
}

export default function ObservationFeed() {
    const observations = useObservationStore((s) => s.observations);
    const setSelectedObservation = useObservationStore((s) => s.setSelectedObservation);

    return (
        <div className="space-y-2">
            {observations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-white/30">
                    <Eye className="h-10 w-10 mb-2" />
                    <p className="text-xs">No observations yet</p>
                    <p className="text-[10px] text-white/20">Be the first to contribute!</p>
                </div>
            ) : (
                observations.slice(0, 30).map((obs, i) => {
                    const color = CATEGORY_COLORS[obs.category] || '#94a3b8';
                    return (
                        <button
                            key={obs.id}
                            onClick={() => setSelectedObservation(obs)}
                            className="glass-card w-full p-3 text-left transition-all hover:bg-white/[0.04]"
                            style={{ animation: `fadeSlideIn 0.2s ease ${Math.min(i, 15) * 40}ms both` }}
                        >
                            <div className="flex items-start gap-3">
                                {/* Color dot */}
                                <div className="mt-1">
                                    <div
                                        className="h-2.5 w-2.5 rounded-full"
                                        style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}60` }}
                                    />
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-0.5">
                                        <span className="text-xs font-bold text-white">{obs.category}</span>
                                        <span className="text-[10px] font-mono text-white/25">{timeAgo(obs.createdAt)}</span>
                                    </div>

                                    {obs.aiLabel && (
                                        <div className="flex items-center gap-1 mb-1">
                                            <Sparkles className="h-2.5 w-2.5 text-[#9D50FF]" />
                                            <span className="text-[11px] text-[#9D50FF]/80">{obs.aiLabel}</span>
                                            {obs.confidenceScore && (
                                                <span className="text-[10px] font-mono text-[#00F2FF]/60">
                                                    {(obs.confidenceScore * 100).toFixed(0)}%
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    {obs.notes && (
                                        <p className="text-[11px] text-white/35 line-clamp-1">{obs.notes}</p>
                                    )}

                                    <div className="mt-1 flex items-center justify-between text-[10px] text-white/15">
                                        <span>by {obs.userName} · 📍 {obs.latitude.toFixed(3)}, {obs.longitude.toFixed(3)}</span>
                                        {obs.audioUrl && (
                                            <div className="flex items-center gap-1 text-[#f472b6]/60">
                                                <Mic className="h-2.5 w-2.5" />
                                                <span>Audio</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Thumbnail */}
                                {obs.imageUrl && (
                                    <div className="shrink-0 h-10 w-10 overflow-hidden rounded-lg">
                                        <img src={obs.imageUrl} alt="" className="h-full w-full object-cover" />
                                    </div>
                                )}
                            </div>
                        </button>
                    );
                })
            )}
        </div>
    );
}
