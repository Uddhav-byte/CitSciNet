'use client';

import { useQuery } from '@tanstack/react-query';
import PaperCard from '../../../components/PaperCard';
import { BookOpen, Plus, Loader2 } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function PapersPage() {
    const { data: papers, isLoading, error } = useQuery({
        queryKey: ['papers'],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/api/papers`);
            if (!res.ok) throw new Error('Failed to fetch papers');
            return res.json();
        },
    });

    return (
        <div className="flex-1 overflow-y-auto p-6" style={{ background: '#0B0E14' }}>
            <div className="mx-auto max-w-4xl">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between" style={{ animation: 'fadeSlideIn 0.3s ease both' }}>
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#00F2FF]/15">
                            <BookOpen className="h-5 w-5 text-[#00F2FF]" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-white">Research Papers</h1>
                            <p className="text-xs text-white/40">AI-summarized publications from CitSciNet data</p>
                        </div>
                    </div>
                </div>

                {/* Papers list */}
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="h-8 w-8 text-[#00F2FF] animate-spin mb-3" />
                        <span className="text-sm text-white/30">Loading papers...</span>
                    </div>
                ) : error ? (
                    <div className="glass-card p-8 text-center">
                        <p className="text-sm text-red-400">Failed to load papers</p>
                    </div>
                ) : papers?.length === 0 ? (
                    <div className="glass-card flex flex-col items-center justify-center py-16 text-center">
                        <BookOpen className="h-12 w-12 text-white/10 mb-3" />
                        <p className="text-sm text-white/50">No papers published yet</p>
                        <p className="text-xs text-white/25 mt-1">Researchers can upload their publications here</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {papers.map((paper, i) => (
                            <div key={paper.id} style={{ animation: `fadeSlideIn 0.3s ease ${i * 100}ms both` }}>
                                <PaperCard paper={paper} />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
