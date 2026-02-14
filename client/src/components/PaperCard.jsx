'use client';

import { BookOpen, ExternalLink, Sparkles, FlaskConical, User } from 'lucide-react';

const TYPE_COLORS = {
    Water: '#3b82f6',
    Wildlife: '#a855f7',
    Air: '#f59e0b',
    Plant: '#10b981',
};

export default function PaperCard({ paper }) {
    if (!paper) return null;

    const missionColor = TYPE_COLORS[paper.mission?.missionType] || '#94a3b8';

    return (
        <div
            className="glass-card overflow-hidden transition-all hover:bg-white/[0.04]"
            style={{ animation: 'fadeSlideIn 0.3s ease both' }}
        >
            {/* Header bar */}
            <div className="flex items-center justify-between border-b border-white/[0.04] px-4 py-3">
                <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-[#00F2FF]" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#00F2FF]/60">Research Paper</span>
                </div>
                {paper.pdfUrl && (
                    <a
                        href={paper.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 rounded-lg border border-white/[0.06] bg-white/[0.03] px-2 py-1 text-[10px] text-white/40 transition hover:bg-white/[0.06] hover:text-white"
                    >
                        <ExternalLink className="h-3 w-3" />
                        Read PDF
                    </a>
                )}
            </div>

            {/* Body */}
            <div className="p-4">
                <h3 className="text-sm font-bold leading-snug text-white/90 mb-2">
                    {paper.title}
                </h3>

                {/* Researcher */}
                {paper.researcher && (
                    <div className="flex items-center gap-1.5 mb-3 text-[11px] text-white/40">
                        <User className="h-3 w-3 text-[#9D50FF]" />
                        <span>{paper.researcher.name}</span>
                        {paper.researcher.institution && (
                            <span className="text-white/20">· {paper.researcher.institution}</span>
                        )}
                    </div>
                )}

                {/* Linked Mission */}
                {paper.mission && (
                    <div className="mb-3 flex items-center gap-1.5">
                        <FlaskConical className="h-3 w-3" style={{ color: missionColor }} />
                        <span
                            className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                            style={{ backgroundColor: `${missionColor}15`, color: missionColor }}
                        >
                            {paper.mission.missionType}
                        </span>
                        <span className="text-[11px] text-white/30 truncate">{paper.mission.title}</span>
                    </div>
                )}

                {/* AI Summary */}
                {paper.aiSummary && (
                    <div className="rounded-xl border border-[#9D50FF]/10 bg-[#9D50FF]/[0.03] p-3">
                        <div className="mb-1.5 flex items-center gap-1">
                            <Sparkles className="h-3 w-3 text-[#9D50FF]" />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#9D50FF]/60">
                                AI Summary — What is this about?
                            </span>
                        </div>
                        <p className="text-xs leading-relaxed text-white/60">
                            {paper.aiSummary}
                        </p>
                    </div>
                )}

                {/* Abstract (collapsed) */}
                {paper.abstract && !paper.aiSummary && (
                    <p className="text-xs leading-relaxed text-white/40 line-clamp-3">
                        {paper.abstract}
                    </p>
                )}

                {/* Date */}
                <div className="mt-3 text-[10px] text-white/15 font-mono">
                    Published {new Date(paper.createdAt).toLocaleDateString()}
                </div>
            </div>
        </div>
    );
}
