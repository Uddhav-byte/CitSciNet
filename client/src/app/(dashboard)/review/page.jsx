'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Shield, Check, X, AlertTriangle, Eye, MapPin,
    Sparkles, Loader2, ChevronDown, ChevronUp
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const SCORE_COLORS = {
    high: { bg: 'rgba(16,185,129,0.1)', border: '#10b981', text: '#10b981' },
    mid: { bg: 'rgba(245,158,11,0.1)', border: '#f59e0b', text: '#f59e0b' },
    low: { bg: 'rgba(239,68,68,0.1)', border: '#ef4444', text: '#ef4444' },
};

function getScoreStyle(score) {
    if (score >= 0.7) return SCORE_COLORS.high;
    if (score >= 0.4) return SCORE_COLORS.mid;
    return SCORE_COLORS.low;
}

function ReviewCard({ obs, onApprove, onReject, isActing }) {
    const [expanded, setExpanded] = useState(false);
    const [notes, setNotes] = useState('');
    const scoreStyle = getScoreStyle(obs.validationScore || 0);
    const scorePct = ((obs.validationScore || 0) * 100).toFixed(0);

    return (
        <div
            className="glass-card overflow-hidden transition-all hover:bg-white/[0.03]"
            style={{ animation: 'fadeSlideIn 0.3s ease both' }}
        >
            {/* Top bar with score */}
            <div className="flex items-center justify-between border-b border-white/[0.04] px-4 py-2.5">
                <div className="flex items-center gap-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-[#f59e0b]" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#f59e0b]/70">
                        Needs Review
                    </span>
                </div>
                <div
                    className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold"
                    style={{ backgroundColor: scoreStyle.bg, color: scoreStyle.text, border: `1px solid ${scoreStyle.border}30` }}
                >
                    <Sparkles className="h-3 w-3" />
                    AI Score: {scorePct}%
                </div>
            </div>

            {/* Body */}
            <div className="p-4">
                <div className="flex items-start gap-3 mb-3">
                    {obs.imageUrl && (
                        <div className="shrink-0 h-16 w-16 rounded-lg overflow-hidden border border-white/10">
                            <img src={obs.imageUrl} alt={obs.category} className="h-full w-full object-cover" />
                        </div>
                    )}
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="rounded-full bg-[#00F2FF]/10 px-2 py-0.5 text-[10px] font-bold text-[#00F2FF]">
                                {obs.category}
                            </span>
                            {obs.aiLabel && (
                                <span className="text-xs text-[#9D50FF]">{obs.aiLabel}</span>
                            )}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-white/40">
                            <MapPin className="h-3 w-3" />
                            <span className="font-mono">{obs.latitude?.toFixed(4)}, {obs.longitude?.toFixed(4)}</span>
                        </div>
                        <div className="mt-1 text-[11px] text-white/30">
                            by <span className="text-white/50">{obs.userName}</span> · {new Date(obs.createdAt).toLocaleDateString()}
                        </div>
                    </div>
                </div>

                {obs.notes && (
                    <p className="text-xs text-white/50 mb-3 bg-white/[0.02] rounded-lg p-2 border border-white/[0.04]">
                        {obs.notes}
                    </p>
                )}

                {/* AI Reasoning (expandable) */}
                {obs.validationNotes && (
                    <div className="mb-3">
                        <button
                            onClick={() => setExpanded(!expanded)}
                            className="flex w-full items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#9D50FF]/60 hover:text-[#9D50FF]"
                        >
                            <Sparkles className="h-3 w-3" />
                            AI Reasoning
                            {expanded ? <ChevronUp className="h-3 w-3 ml-auto" /> : <ChevronDown className="h-3 w-3 ml-auto" />}
                        </button>
                        {expanded && (
                            <div className="mt-2 rounded-lg bg-[#9D50FF]/[0.04] border border-[#9D50FF]/10 p-3 text-xs text-white/50 whitespace-pre-wrap">
                                {obs.validationNotes}
                            </div>
                        )}
                    </div>
                )}

                {/* Reviewer notes input */}
                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add review notes (optional)..."
                    className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-xs text-white/70 placeholder-white/20 outline-none focus:border-[#00F2FF]/30 resize-none mb-3"
                    rows={2}
                />

                {/* Action buttons */}
                <div className="flex gap-2">
                    <button
                        onClick={() => onApprove(obs.id, notes)}
                        disabled={isActing}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-500/15 px-3 py-2 text-xs font-bold text-emerald-400 transition-all hover:bg-emerald-500/25 disabled:opacity-50"
                    >
                        {isActing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                        Approve & Send to Researcher
                    </button>
                    <button
                        onClick={() => onReject(obs.id, notes)}
                        disabled={isActing}
                        className="flex items-center justify-center gap-1.5 rounded-lg bg-red-500/15 px-3 py-2 text-xs font-bold text-red-400 transition-all hover:bg-red-500/25 disabled:opacity-50"
                    >
                        {isActing ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                        Reject
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function ReviewQueuePage() {
    const queryClient = useQueryClient();
    const [actingId, setActingId] = useState(null);

    const { data: queue, isLoading } = useQuery({
        queryKey: ['review-queue'],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/api/observations/review-queue`);
            if (!res.ok) throw new Error('Failed');
            return res.json();
        },
        refetchInterval: 10000, // Poll every 10s
    });

    const reviewMutation = useMutation({
        mutationFn: async ({ id, action, reviewerNotes }) => {
            const res = await fetch(`${API_URL}/api/observations/${id}/review`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, reviewerNotes }),
            });
            if (!res.ok) throw new Error('Review failed');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['review-queue'] });
            setActingId(null);
        },
        onError: () => setActingId(null),
    });

    const handleApprove = (id, notes) => {
        setActingId(id);
        reviewMutation.mutate({ id, action: 'approve', reviewerNotes: notes });
    };

    const handleReject = (id, notes) => {
        setActingId(id);
        reviewMutation.mutate({ id, action: 'reject', reviewerNotes: notes });
    };

    return (
        <div className="flex-1 overflow-y-auto p-6" style={{ background: '#0B0E14' }}>
            <div className="mx-auto max-w-3xl">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between" style={{ animation: 'fadeSlideIn 0.3s ease both' }}>
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f59e0b]/15">
                            <Shield className="h-5 w-5 text-[#f59e0b]" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-white">Review Queue</h1>
                            <p className="text-xs text-white/40">
                                Observations with AI confidence &lt; 80% need manual review
                            </p>
                        </div>
                    </div>
                    {queue && (
                        <div className="flex items-center gap-1.5 rounded-full bg-[#f59e0b]/10 px-3 py-1">
                            <AlertTriangle className="h-3 w-3 text-[#f59e0b]" />
                            <span className="text-xs font-bold text-[#f59e0b]">{queue.length} pending</span>
                        </div>
                    )}
                </div>

                {/* Queue */}
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="h-8 w-8 text-[#f59e0b] animate-spin mb-3" />
                        <span className="text-sm text-white/30">Loading review queue...</span>
                    </div>
                ) : queue?.length === 0 ? (
                    <div className="glass-card flex flex-col items-center justify-center py-16 text-center">
                        <Check className="h-12 w-12 text-emerald-400/30 mb-3" />
                        <p className="text-sm text-white/50 font-medium">Queue is clear!</p>
                        <p className="text-xs text-white/25 mt-1">All observations have been reviewed. Nice work! 🎉</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {queue.map((obs, i) => (
                            <div key={obs.id} style={{ animation: `fadeSlideIn 0.3s ease ${i * 80}ms both` }}>
                                <ReviewCard
                                    obs={obs}
                                    onApprove={handleApprove}
                                    onReject={handleReject}
                                    isActing={actingId === obs.id}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
