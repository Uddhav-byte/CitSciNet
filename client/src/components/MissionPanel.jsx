'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Target, Award, Check, X, Clock, Users, MapPin, Zap,
    Camera, FileText, Layers, Beaker, ListChecks, Upload, ChevronRight
} from 'lucide-react';
import useMissionStore from '../store/useMissionStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const DATA_REQ_META = {
    image: { icon: Camera, label: 'Photo Required', color: '#00F2FF' },
    text: { icon: FileText, label: 'Text Data Only', color: '#9D50FF' },
    both: { icon: Layers, label: 'Photo + Text', color: '#10b981' },
};

export default function MissionPanel({ userName = 'Anonymous', onSubmitData }) {
    const activeMission = useMissionStore((s) => s.activeMission);
    const clearActiveMission = useMissionStore((s) => s.clearActiveMission);
    const markAccepted = useMissionStore((s) => s.markAccepted);
    const acceptedMissionIds = useMissionStore((s) => s.acceptedMissionIds);

    const [isAccepting, setIsAccepting] = useState(false);
    const [acceptError, setAcceptError] = useState(null);

    const isAccepted = activeMission ? acceptedMissionIds.has(activeMission.id) : false;
    const isAlreadyAccepted = activeMission?.userMissions?.some(
        (um) => um.userName === userName
    );
    const accepted = isAccepted || isAlreadyAccepted;
    const reqMeta = DATA_REQ_META[activeMission?.dataRequirement] || DATA_REQ_META.both;

    const handleAccept = async () => {
        if (!activeMission) return;
        setIsAccepting(true);
        setAcceptError(null);

        try {
            const res = await fetch(`${API_URL}/api/missions/${activeMission.id}/accept`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userName }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to accept mission');
            }

            markAccepted(activeMission.id);
        } catch (err) {
            setAcceptError(err.message);
        } finally {
            setIsAccepting(false);
        }
    };

    const handleSubmitData = () => {
        if (onSubmitData && activeMission) {
            onSubmitData(activeMission);
            clearActiveMission();
        }
    };

    return (
        <AnimatePresence>
            {activeMission && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={clearActiveMission}
                        className="fixed inset-0 z-[1400] bg-black/40 backdrop-blur-sm"
                    />

                    {/* Panel */}
                    <motion.div
                        initial={{ x: '100%', opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: '100%', opacity: 0 }}
                        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                        className="fixed right-0 top-0 z-[1500] h-full w-[400px] max-w-[90vw] border-l shadow-2xl"
                        style={{
                            background: 'rgba(21, 25, 33, 0.95)',
                            borderColor: 'rgba(255, 255, 255, 0.06)',
                            backdropFilter: 'blur(24px)',
                        }}
                    >
                        <div className="flex h-full flex-col">
                            {/* Header */}
                            <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
                                <div className="flex items-center gap-2.5">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#dc2626]/15">
                                        <Target className="h-4.5 w-4.5 text-[#dc2626]" />
                                    </div>
                                    <div>
                                        <span className="text-xs font-bold uppercase tracking-wider text-white/40">
                                            Mission Intel
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={clearActiveMission}
                                    className="rounded-lg p-1.5 text-white/30 transition-colors hover:bg-white/[0.06] hover:text-white"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto px-6 py-5">
                                {/* Title */}
                                <h2 className="mb-1 text-xl font-bold text-white">
                                    {activeMission.title}
                                </h2>
                                <div className="mb-4 flex items-center gap-2">
                                    <span className="text-xs text-white/30">Created by</span>
                                    <span className="text-xs font-medium text-[#00F2FF]/70">
                                        {activeMission.createdBy || 'Researcher'}
                                    </span>
                                </div>

                                {/* Description */}
                                {activeMission.description && (
                                    <p className="mb-5 text-sm leading-relaxed text-white/50">
                                        {activeMission.description}
                                    </p>
                                )}

                                {/* Stats grid */}
                                <div className="mb-5 grid grid-cols-3 gap-2">
                                    <div className="glass-card p-3 text-center">
                                        <Zap className="h-3.5 w-3.5 mx-auto mb-1 text-[#f59e0b]" />
                                        <p className="text-lg font-bold text-[#f59e0b]">{activeMission.bountyPoints}</p>
                                        <span className="text-[9px] uppercase tracking-wider text-white/30">Bounty</span>
                                    </div>
                                    <div className="glass-card p-3 text-center">
                                        <Users className="h-3.5 w-3.5 mx-auto mb-1 text-[#00F2FF]" />
                                        <p className="text-lg font-bold text-[#00F2FF]">{activeMission.userMissions?.length || 0}</p>
                                        <span className="text-[9px] uppercase tracking-wider text-white/30">Joined</span>
                                    </div>
                                    <div className="glass-card p-3 text-center">
                                        <reqMeta.icon className="h-3.5 w-3.5 mx-auto mb-1" style={{ color: reqMeta.color }} />
                                        <p className="text-[10px] font-bold mt-1" style={{ color: reqMeta.color }}>{reqMeta.label}</p>
                                        <span className="text-[9px] uppercase tracking-wider text-white/30">Data</span>
                                    </div>
                                </div>

                                {/* Scientific Goal */}
                                {activeMission.scientificGoal && (
                                    <div className="mb-4 glass-card p-4">
                                        <div className="flex items-center gap-1.5 mb-2">
                                            <Beaker className="h-3.5 w-3.5 text-[#9D50FF]" />
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#9D50FF]">
                                                Scientific Goal
                                            </span>
                                        </div>
                                        <p className="text-xs leading-relaxed text-white/50">
                                            {activeMission.scientificGoal}
                                        </p>
                                    </div>
                                )}

                                {/* Data Protocol */}
                                {activeMission.dataProtocol && (
                                    <div className="mb-4 glass-card p-4">
                                        <div className="flex items-center gap-1.5 mb-2">
                                            <ListChecks className="h-3.5 w-3.5 text-[#10b981]" />
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#10b981]">
                                                Data Collection Protocol
                                            </span>
                                        </div>
                                        <p className="text-xs leading-relaxed text-white/50 whitespace-pre-wrap font-mono">
                                            {activeMission.dataProtocol}
                                        </p>
                                    </div>
                                )}

                                {/* Meta */}
                                <div className="mb-4 space-y-2.5 glass-card p-4">
                                    <div className="flex items-center gap-2 text-xs text-white/40">
                                        <Clock className="h-3.5 w-3.5" />
                                        <span>
                                            Created{' '}
                                            {new Date(activeMission.createdAt).toLocaleDateString('en-US', {
                                                month: 'long',
                                                day: 'numeric',
                                                year: 'numeric',
                                            })}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-white/40">
                                        <MapPin className="h-3.5 w-3.5" />
                                        <span className="font-mono">
                                            Geofenced Zone • {activeMission.geometry?.coordinates?.[0]?.length || 0} vertices
                                        </span>
                                    </div>
                                </div>

                                {/* Error */}
                                {acceptError && (
                                    <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-400">
                                        {acceptError}
                                    </div>
                                )}
                            </div>

                            {/* Footer — Accept / Submit Actions */}
                            <div className="border-t border-white/[0.06] p-6 space-y-2">
                                {accepted ? (
                                    <>
                                        <div className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 py-2.5 text-xs font-bold text-emerald-400">
                                            <Check className="h-4 w-4" />
                                            Mission Accepted ✅
                                        </div>
                                        {onSubmitData && (
                                            <button
                                                onClick={handleSubmitData}
                                                className="btn-glow flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#9D50FF] to-[#3b82f6] py-3 text-sm font-bold text-white transition-all duration-300 hover:brightness-110"
                                            >
                                                <Upload className="h-4 w-4" />
                                                Submit Observation Data
                                                <ChevronRight className="h-3.5 w-3.5" />
                                            </button>
                                        )}
                                    </>
                                ) : (
                                    <button
                                        onClick={handleAccept}
                                        disabled={isAccepting}
                                        className="btn-glow flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#00F2FF] to-[#3b82f6] py-3.5 text-sm font-bold text-white transition-all duration-300 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {isAccepting ? (
                                            <>
                                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                                Accepting...
                                            </>
                                        ) : (
                                            <>
                                                <Target className="h-4 w-4" />
                                                Accept Mission
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
