'use client';

import { useState } from 'react';
import { Target, Award, Check, X, Clock, Users } from 'lucide-react';
import useMissionStore from '../store/useMissionStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function MissionPanel({ userName = 'Anonymous' }) {
    const activeMission = useMissionStore((s) => s.activeMission);
    const clearActiveMission = useMissionStore((s) => s.clearActiveMission);
    const markAccepted = useMissionStore((s) => s.markAccepted);
    const acceptedMissionIds = useMissionStore((s) => s.acceptedMissionIds);

    const [isAccepting, setIsAccepting] = useState(false);
    const [acceptError, setAcceptError] = useState(null);

    const isOpen = !!activeMission;
    const isAccepted = activeMission ? acceptedMissionIds.has(activeMission.id) : false;
    const isAlreadyAccepted = activeMission?.userMissions?.some(
        (um) => um.userName === userName
    );

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

    return (
        <div
            className={`fixed right-0 top-0 z-[1500] h-full w-[380px] border-l border-white/10 bg-gray-950/95 shadow-2xl backdrop-blur-xl transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'
                }`}
        >
            {activeMission && (
                <div className="flex h-full flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                        <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/20">
                                <Target className="h-4 w-4 text-red-400" />
                            </div>
                            <span className="text-xs font-semibold uppercase tracking-wider text-white/50">
                                Mission Details
                            </span>
                        </div>
                        <button
                            onClick={clearActiveMission}
                            className="rounded-lg p-1.5 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-5">
                        {/* Title */}
                        <h2 className="mb-2 text-xl font-bold text-white">
                            {activeMission.title}
                        </h2>

                        {/* Description */}
                        {activeMission.description && (
                            <p className="mb-5 text-sm leading-relaxed text-white/60">
                                {activeMission.description}
                            </p>
                        )}

                        {/* Stats cards */}
                        <div className="mb-5 grid grid-cols-2 gap-3">
                            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                                <div className="mb-1 flex items-center gap-1.5">
                                    <Award className="h-3.5 w-3.5 text-yellow-400" />
                                    <span className="text-[10px] uppercase tracking-wider text-white/40">
                                        Reward
                                    </span>
                                </div>
                                <p className="text-lg font-bold text-yellow-400">
                                    {activeMission.bountyPoints} pts
                                </p>
                            </div>
                            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                                <div className="mb-1 flex items-center gap-1.5">
                                    <Users className="h-3.5 w-3.5 text-cyan-400" />
                                    <span className="text-[10px] uppercase tracking-wider text-white/40">
                                        Participants
                                    </span>
                                </div>
                                <p className="text-lg font-bold text-cyan-400">
                                    {activeMission.userMissions?.length || 0}
                                </p>
                            </div>
                        </div>

                        {/* Meta info */}
                        <div className="mb-5 space-y-2 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                            <div className="flex items-center gap-2 text-xs text-white/50">
                                <Clock className="h-3 w-3" />
                                <span>
                                    Created{' '}
                                    {new Date(activeMission.createdAt).toLocaleDateString('en-US', {
                                        month: 'long',
                                        day: 'numeric',
                                        year: 'numeric',
                                    })}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-white/50">
                                <Target className="h-3 w-3" />
                                <span>By {activeMission.createdBy || 'Researcher'}</span>
                            </div>
                        </div>

                        {/* Error message */}
                        {acceptError && (
                            <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                                {acceptError}
                            </div>
                        )}
                    </div>

                    {/* Footer — Accept button */}
                    <div className="border-t border-white/10 p-5">
                        {isAccepted || isAlreadyAccepted ? (
                            <div className="flex items-center justify-center gap-2 rounded-xl bg-green-500/15 py-3.5 text-sm font-bold text-green-400">
                                <Check className="h-5 w-5" />
                                Mission Accepted! ✅
                            </div>
                        ) : (
                            <button
                                onClick={handleAccept}
                                disabled={isAccepting}
                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-cyan-500/25 transition-all duration-300 hover:shadow-cyan-500/40 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
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
            )}
        </div>
    );
}
