'use client';

import { useState, useEffect } from 'react';
import {
    Trophy, Medal, Star, Zap, Target, TrendingUp, Crown,
    Shield, Award, Flame, ChevronUp, Eye, Sparkles, Users
} from 'lucide-react';
import useAuthStore from '../store/authStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const RANK_CONFIG = {
    Novice: { color: '#94a3b8', gradient: 'from-slate-500/20 to-slate-600/20', emoji: '🌱', icon: Star, next: 'Scout', threshold: 30 },
    Scout: { color: '#22d3ee', gradient: 'from-cyan-500/20 to-cyan-600/20', emoji: '🔭', icon: Eye, next: 'Explorer', threshold: 100 },
    Explorer: { color: '#a78bfa', gradient: 'from-violet-500/20 to-violet-600/20', emoji: '🧭', icon: Target, next: 'Expert', threshold: 250 },
    Expert: { color: '#f59e0b', gradient: 'from-amber-500/20 to-amber-600/20', emoji: '⚡', icon: Zap, next: 'Master', threshold: 500 },
    Master: { color: '#ef4444', gradient: 'from-red-500/20 to-red-600/20', emoji: '👑', icon: Crown, next: null, threshold: Infinity },
};

const ACHIEVEMENTS = [
    { id: 'first_obs', label: 'First Discovery', desc: 'Submit your first observation', emoji: '🔬', requirement: (s) => s.observationCount >= 1 },
    { id: 'five_obs', label: 'Field Worker', desc: 'Submit 5 observations', emoji: '📋', requirement: (s) => s.observationCount >= 5 },
    { id: 'ten_obs', label: 'Data Collector', desc: 'Submit 10 observations', emoji: '📊', requirement: (s) => s.observationCount >= 10 },
    { id: 'first_bounty', label: 'Bounty Hunter', desc: 'Complete a mission bounty', emoji: '🎯', requirement: (s) => s.bountyCount >= 1 },
    { id: 'three_bounty', label: 'Mission Veteran', desc: 'Complete 3 mission bounties', emoji: '🏅', requirement: (s) => s.bountyCount >= 3 },
    { id: 'scout_rank', label: 'Rising Star', desc: 'Reach Scout rank', emoji: '⭐', requirement: (s) => s.totalPoints >= 30 },
    { id: 'explorer_rank', label: 'Trailblazer', desc: 'Reach Explorer rank', emoji: '🗺️', requirement: (s) => s.totalPoints >= 100 },
    { id: 'century', label: 'Century Club', desc: 'Earn 100+ points', emoji: '💯', requirement: (s) => s.totalPoints >= 100 },
];

export default function GamificationPanel({ compact = false }) {
    const user = useAuthStore((s) => s.user);
    const [stats, setStats] = useState(null);
    const [leaderboard, setLeaderboard] = useState([]);
    const [activeSection, setActiveSection] = useState('rank');
    const [pointsAnimation, setPointsAnimation] = useState(null);

    const userName = user?.name || 'Anonymous';

    useEffect(() => {
        fetchStats();
        fetchLeaderboard();
    }, [userName]);

    // Listen for real-time points awards
    useEffect(() => {
        const handlePointsAwarded = (data) => {
            if (data.userName === userName) {
                setPointsAnimation({ points: data.points, reason: data.reason });
                setTimeout(() => setPointsAnimation(null), 3000);
                fetchStats(); // Refresh
            }
        };

        // Simple polling fallback since we may not have socket exposed here
        const interval = setInterval(fetchStats, 30000);
        return () => clearInterval(interval);
    }, [userName]);

    const fetchStats = async () => {
        try {
            const res = await fetch(`${API_URL}/api/users/${encodeURIComponent(userName)}/stats`);
            if (res.ok) setStats(await res.json());
        } catch { }
    };

    const fetchLeaderboard = async () => {
        try {
            const res = await fetch(`${API_URL}/api/leaderboard?limit=10`);
            if (res.ok) setLeaderboard(await res.json());
        } catch { }
    };

    if (!stats) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#f59e0b] border-t-transparent" />
            </div>
        );
    }

    const rankConfig = RANK_CONFIG[stats.rank] || RANK_CONFIG.Novice;
    const unlockedBadges = ACHIEVEMENTS.filter(a => a.requirement(stats));
    const lockedBadges = ACHIEVEMENTS.filter(a => !a.requirement(stats));

    if (compact) {
        return <CompactGamification stats={stats} rankConfig={rankConfig} unlockedCount={unlockedBadges.length} />;
    }

    return (
        <div className="space-y-3">
            {/* Points Animation Toast */}
            {pointsAnimation && (
                <div
                    className="fixed top-4 left-1/2 z-[2000] -translate-x-1/2 flex items-center gap-2 rounded-full bg-[#f59e0b]/20 border border-[#f59e0b]/30 px-5 py-2 shadow-xl"
                    style={{ animation: 'fadeSlideIn 0.4s ease both' }}
                >
                    <Zap className="h-4 w-4 text-[#f59e0b]" />
                    <span className="text-sm font-bold text-[#f59e0b]">+{pointsAnimation.points} pts</span>
                    <span className="text-xs text-white/50">
                        {pointsAnimation.reason === 'observation' ? 'Observation Reward' : 'Bounty Claimed!'}
                    </span>
                </div>
            )}

            {/* Section Tabs */}
            <div className="flex gap-1 rounded-xl bg-white/[0.03] p-1">
                {[
                    { id: 'rank', label: 'Rank', icon: Shield },
                    { id: 'badges', label: 'Badges', icon: Award },
                    { id: 'leaderboard', label: 'Top 10', icon: Trophy },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveSection(tab.id)}
                        className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all ${activeSection === tab.id
                            ? 'bg-white/[0.08] text-white shadow-sm'
                            : 'text-white/30 hover:text-white/50'
                            }`}
                    >
                        <tab.icon className="h-3 w-3" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {activeSection === 'rank' && (
                <RankSection stats={stats} rankConfig={rankConfig} />
            )}

            {activeSection === 'badges' && (
                <BadgesSection unlocked={unlockedBadges} locked={lockedBadges} />
            )}

            {activeSection === 'leaderboard' && (
                <LeaderboardSection leaderboard={leaderboard} currentUser={userName} />
            )}
        </div>
    );
}

/* ─── Compact Gamification (for sidebar stats) ────────────────────── */
function CompactGamification({ stats, rankConfig, unlockedCount }) {
    return (
        <div className="glass-card p-3">
            <div className="flex items-center gap-3">
                {/* Rank badge */}
                <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${rankConfig.gradient}`}
                >
                    <span className="text-lg">{rankConfig.emoji}</span>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white">{stats.rank}</span>
                        <span className="text-[10px] font-bold" style={{ color: rankConfig.color }}>
                            {stats.totalPoints} pts
                        </span>
                    </div>
                    {/* XP Bar */}
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                        <div
                            className="h-full rounded-full transition-all duration-1000 ease-out"
                            style={{
                                width: `${stats.rankProgress}%`,
                                background: `linear-gradient(90deg, ${rankConfig.color}, ${rankConfig.color}80)`,
                                boxShadow: `0 0 8px ${rankConfig.color}40`,
                            }}
                        />
                    </div>
                    <div className="mt-0.5 flex items-center justify-between text-[9px] text-white/20">
                        <span>{stats.rank}</span>
                        {stats.nextRank && <span>{stats.nextRank} → {stats.nextRankPoints}pts</span>}
                    </div>
                </div>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-1.5">
                <div className="flex items-center gap-1 text-[10px]">
                    <Eye className="h-2.5 w-2.5 text-[#00F2FF]" />
                    <span className="text-white/50">{stats.observationCount} obs</span>
                </div>
                <div className="flex items-center gap-1 text-[10px]">
                    <Target className="h-2.5 w-2.5 text-[#dc2626]" />
                    <span className="text-white/50">{stats.bountyCount} bounties</span>
                </div>
                <div className="flex items-center gap-1 text-[10px]">
                    <Award className="h-2.5 w-2.5 text-[#f59e0b]" />
                    <span className="text-white/50">{unlockedCount} badges</span>
                </div>
            </div>
        </div>
    );
}

/* ─── Rank Section ────────────────────────────────────────────────── */
function RankSection({ stats, rankConfig }) {
    return (
        <div className="space-y-3">
            {/* Rank Hero Card */}
            <div
                className={`relative overflow-hidden rounded-2xl border border-white/[0.06] p-5 bg-gradient-to-br ${rankConfig.gradient}`}
            >
                {/* Glow orb */}
                <div
                    className="absolute -top-6 -right-6 h-24 w-24 rounded-full opacity-20 blur-2xl"
                    style={{ background: rankConfig.color }}
                />
                <div className="relative flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-2"
                        style={{ borderColor: `${rankConfig.color}40`, background: `${rankConfig.color}10` }}
                    >
                        <span className="text-3xl">{rankConfig.emoji}</span>
                    </div>
                    <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-white/30">Current Rank</div>
                        <h3 className="text-2xl font-black text-white">{stats.rank}</h3>
                        <div className="flex items-center gap-1 mt-0.5">
                            <Zap className="h-3 w-3" style={{ color: rankConfig.color }} />
                            <span className="text-sm font-bold" style={{ color: rankConfig.color }}>
                                {stats.totalPoints} Bounty Tokens
                            </span>
                        </div>
                    </div>
                </div>

                {/* XP Progress */}
                {stats.nextRank && (
                    <div className="mt-4">
                        <div className="flex items-center justify-between text-[10px] text-white/40 mb-1">
                            <span>Progress to {stats.nextRank}</span>
                            <span>{stats.rankProgress}%</span>
                        </div>
                        <div className="h-2.5 w-full overflow-hidden rounded-full bg-black/30">
                            <div
                                className="h-full rounded-full transition-all duration-1000 ease-out"
                                style={{
                                    width: `${stats.rankProgress}%`,
                                    background: `linear-gradient(90deg, ${rankConfig.color}, ${rankConfig.color}cc)`,
                                    boxShadow: `0 0 12px ${rankConfig.color}50`,
                                }}
                            />
                        </div>
                        <div className="mt-1 flex items-center justify-between text-[9px] text-white/25">
                            <span>{stats.totalPoints} pts</span>
                            <span>{stats.nextRankPoints} pts needed</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-2">
                <div className="glass-card flex flex-col items-center py-3">
                    <Eye className="h-4 w-4 mb-1 text-[#00F2FF]" />
                    <span className="text-xl font-black text-white">{stats.observationCount}</span>
                    <span className="text-[9px] uppercase tracking-wider text-white/25">Observations</span>
                    <span className="text-[9px] text-[#00F2FF]/50">+{stats.observationCount * 10}pts</span>
                </div>
                <div className="glass-card flex flex-col items-center py-3">
                    <Target className="h-4 w-4 mb-1 text-[#dc2626]" />
                    <span className="text-xl font-black text-white">{stats.bountyCount}</span>
                    <span className="text-[9px] uppercase tracking-wider text-white/25">Bounties</span>
                    <span className="text-[9px] text-[#dc2626]/50">Claimed</span>
                </div>
                <div className="glass-card flex flex-col items-center py-3">
                    <Flame className="h-4 w-4 mb-1 text-[#f59e0b]" />
                    <span className="text-xl font-black text-white">{stats.totalPoints}</span>
                    <span className="text-[9px] uppercase tracking-wider text-white/25">Total XP</span>
                    <span className="text-[9px] text-[#f59e0b]/50">Bounty Tokens</span>
                </div>
            </div>

            {/* How points work */}
            <div className="glass-card p-3">
                <div className="flex items-center gap-1.5 mb-2">
                    <Sparkles className="h-3 w-3 text-[#f59e0b]" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/30">
                        How to Earn Bounty Tokens
                    </span>
                </div>
                <div className="space-y-1.5">
                    {[
                        { action: 'Submit observation', pts: '+10', color: '#00F2FF' },
                        { action: 'Complete mission bounty', pts: '+25–75', color: '#dc2626' },
                        { action: 'AI auto-approved data', pts: '+5 bonus', color: '#10b981' },
                    ].map((item) => (
                        <div key={item.action} className="flex items-center justify-between">
                            <span className="text-[11px] text-white/40">{item.action}</span>
                            <span className="text-[11px] font-bold" style={{ color: item.color }}>
                                {item.pts}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Rank Ladder */}
            <div className="glass-card p-3">
                <div className="flex items-center gap-1.5 mb-2">
                    <ChevronUp className="h-3 w-3 text-[#9D50FF]" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/30">
                        Rank Ladder
                    </span>
                </div>
                <div className="space-y-1">
                    {Object.entries(RANK_CONFIG).map(([rank, config]) => {
                        const isCurrentRank = rank === stats.rank;
                        const isPastRank = Object.keys(RANK_CONFIG).indexOf(rank) < Object.keys(RANK_CONFIG).indexOf(stats.rank);
                        return (
                            <div
                                key={rank}
                                className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 ${isCurrentRank
                                    ? 'bg-white/[0.06] border border-white/[0.08]'
                                    : ''
                                    }`}
                            >
                                <span className="text-sm">{config.emoji}</span>
                                <span className={`text-xs flex-1 ${isCurrentRank ? 'font-bold text-white' : isPastRank ? 'text-white/50' : 'text-white/20'
                                    }`}>
                                    {rank}
                                </span>
                                {isCurrentRank && (
                                    <span className="text-[9px] font-bold rounded px-1.5 py-0.5" style={{
                                        backgroundColor: `${config.color}20`,
                                        color: config.color,
                                    }}>
                                        YOU
                                    </span>
                                )}
                                {isPastRank && (
                                    <span className="text-[10px] text-emerald-400">✓</span>
                                )}
                                <span className="text-[9px] text-white/15 font-mono w-10 text-right">
                                    {config.threshold === Infinity ? '500+' : `${config.threshold}`}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

/* ─── Badges Section ──────────────────────────────────────────────── */
function BadgesSection({ unlocked, locked }) {
    return (
        <div className="space-y-3">
            {unlocked.length > 0 && (
                <div>
                    <div className="flex items-center gap-1.5 mb-2 px-1">
                        <Medal className="h-3 w-3 text-[#f59e0b]" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#f59e0b]">
                            Earned ({unlocked.length})
                        </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        {unlocked.map((badge, i) => (
                            <div
                                key={badge.id}
                                className="glass-card p-3 border border-[#f59e0b]/10"
                                style={{ animation: `fadeSlideIn 0.3s ease ${i * 80}ms both` }}
                            >
                                <span className="text-2xl">{badge.emoji}</span>
                                <p className="text-[11px] font-bold text-white mt-1">{badge.label}</p>
                                <p className="text-[9px] text-white/30">{badge.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {locked.length > 0 && (
                <div>
                    <div className="flex items-center gap-1.5 mb-2 px-1">
                        <Shield className="h-3 w-3 text-white/20" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-white/20">
                            Locked ({locked.length})
                        </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        {locked.map((badge) => (
                            <div key={badge.id} className="glass-card p-3 opacity-40">
                                <span className="text-2xl grayscale">{badge.emoji}</span>
                                <p className="text-[11px] font-bold text-white/40 mt-1">{badge.label}</p>
                                <p className="text-[9px] text-white/20">{badge.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

/* ─── Leaderboard Section ─────────────────────────────────────────── */
function LeaderboardSection({ leaderboard, currentUser }) {
    if (leaderboard.length === 0) {
        return (
            <div className="flex flex-col items-center py-8 text-center">
                <Trophy className="h-10 w-10 text-white/10 mb-2" />
                <p className="text-xs text-white/30">No contributors yet</p>
                <p className="text-[10px] text-white/15">Be the first to submit an observation!</p>
            </div>
        );
    }

    const medalColors = ['#f59e0b', '#94a3b8', '#cd7f32'];

    return (
        <div className="space-y-1.5">
            {leaderboard.map((user, i) => {
                const isMe = user.name === currentUser;
                const rankConf = RANK_CONFIG[user.rank] || RANK_CONFIG.Novice;
                return (
                    <div
                        key={user.id || i}
                        className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 transition-all ${isMe
                            ? 'bg-[#f59e0b]/[0.08] border border-[#f59e0b]/20'
                            : 'bg-white/[0.02] hover:bg-white/[0.04]'
                            }`}
                        style={{ animation: `fadeSlideIn 0.3s ease ${i * 60}ms both` }}
                    >
                        {/* Position */}
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center">
                            {i < 3 ? (
                                <div className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-black"
                                    style={{ backgroundColor: `${medalColors[i]}20`, color: medalColors[i] }}
                                >
                                    {i + 1}
                                </div>
                            ) : (
                                <span className="text-xs font-bold text-white/20">{i + 1}</span>
                            )}
                        </div>

                        {/* Avatar */}
                        <div
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                            style={{
                                background: `linear-gradient(135deg, ${rankConf.color}60, ${rankConf.color}30)`,
                            }}
                        >
                            {user.name[0]?.toUpperCase()}
                        </div>

                        {/* Name & rank */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                                <span className={`text-xs font-semibold truncate ${isMe ? 'text-[#f59e0b]' : 'text-white/70'}`}>
                                    {user.name}
                                </span>
                                {isMe && (
                                    <span className="rounded bg-[#f59e0b]/20 px-1 py-0.5 text-[8px] font-bold text-[#f59e0b]">
                                        YOU
                                    </span>
                                )}
                            </div>
                            <span className="text-[9px]" style={{ color: rankConf.color }}>
                                {rankConf.emoji} {user.rank}
                            </span>
                        </div>

                        {/* Points */}
                        <div className="text-right">
                            <div className="flex items-center gap-1">
                                <Zap className="h-3 w-3 text-[#f59e0b]" />
                                <span className="text-sm font-black text-white">{user.totalPoints}</span>
                            </div>
                            <span className="text-[9px] text-white/20">{user.observationCount} obs</span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
