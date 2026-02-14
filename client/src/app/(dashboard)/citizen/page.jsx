'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import useObservationStore from '../../../store/useObservationStore';
import useAuthStore from '../../../store/authStore';
import useMissionStore from '../../../store/useMissionStore';
import UploadObservation from '../../../components/UploadObservation';
import ObservationFeed from '../../../components/ObservationFeed';
import MissionPanel from '../../../components/MissionPanel';
import GamificationPanel from '../../../components/GamificationPanel';
import {
    Camera, X, Sparkles, Target, ChevronLeft, ChevronRight,
    MapPin, Zap, TrendingUp, Award, Eye, Upload, Trophy
} from 'lucide-react';

const MapComponent = dynamic(() => import('../../../components/MapComponent'), {
    ssr: false,
    loading: () => (
        <div className="flex h-full w-full items-center justify-center" style={{ background: '#0B0E14' }}>
            <div className="flex flex-col items-center gap-3">
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#00F2FF] border-t-transparent" />
                <span className="text-sm text-[#00F2FF]/60">Loading map...</span>
            </div>
        </div>
    ),
});

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function CitizenDashboard() {
    const user = useAuthStore((s) => s.user);
    const setObservations = useObservationStore((s) => s.setObservations);
    const observations = useObservationStore((s) => s.observations);
    const missions = useMissionStore((s) => s.missions);
    const setMissions = useMissionStore((s) => s.setMissions);
    const [userLocation, setUserLocation] = useState(null);
    const [showObservationPanel, setShowObservationPanel] = useState(false);
    const [selectedMission, setSelectedMission] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [activeTab, setActiveTab] = useState('feed');
    const [flyTarget, setFlyTarget] = useState(null);

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

    const { data: missionData } = useQuery({
        queryKey: ['missions'],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/api/missions`);
            if (!res.ok) throw new Error('Failed to fetch missions');
            return res.json();
        },
        retry: 3,
        retryDelay: 2000,
    });

    useEffect(() => { if (obsData) setObservations(obsData); }, [obsData, setObservations]);
    useEffect(() => { if (missionData) setMissions(missionData); }, [missionData, setMissions]);

    useEffect(() => {
        if (!navigator.geolocation) return;
        const watchId = navigator.geolocation.watchPosition(
            (pos) => setUserLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
            () => { },
            { enableHighAccuracy: true, timeout: 10000 }
        );
        return () => navigator.geolocation.clearWatch(watchId);
    }, []);

    // When MissionPanel's "Submit Data" is clicked, open observation form with that mission
    const handleSubmitForMission = (mission) => {
        setSelectedMission(mission);
        setShowObservationPanel(true);
    };

    // When observation panel opens without mission context (generic)
    const handleGenericObservation = () => {
        if (showObservationPanel) {
            setShowObservationPanel(false);
            setSelectedMission(null);
        } else {
            setSelectedMission(null);
            setShowObservationPanel(true);
        }
    };

    // Compute personal stats
    const myObservations = observations.filter(o => o.userName === (user?.name || 'Anonymous'));
    const uniqueCategories = new Set(myObservations.map(o => o.category));

    return (
        <div className="relative flex flex-1 overflow-hidden">
            {/* Map Area */}
            <div className="flex-1 relative">
                <MapComponent missions={missions} userLocation={userLocation} flyTarget={flyTarget} />

                {/* Top center: Live stats */}
                <div className="absolute top-4 left-1/2 z-10 -translate-x-1/2">
                    <div className="glass-surface flex items-center gap-4 rounded-full px-5 py-2">
                        <div className="flex items-center gap-1.5 text-xs">
                            <MapPin className="h-3 w-3 text-[#00F2FF]" />
                            <span className="font-mono text-white/70">{observations.length}</span>
                            <span className="text-white/30">obs</span>
                        </div>
                        <div className="h-3 w-px bg-white/10" />
                        <div className="flex items-center gap-1.5 text-xs">
                            <Target className="h-3 w-3 text-[#dc2626]" />
                            <span className="font-mono text-white/70">{missions.length}</span>
                            <span className="text-white/30">missions</span>
                        </div>
                        <div className="h-3 w-px bg-white/10" />
                        <div className="flex items-center gap-1.5 text-xs">
                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" style={{ animation: 'heartbeat 2s ease-in-out infinite' }} />
                            <span className="text-emerald-400/70">Live</span>
                        </div>
                    </div>
                </div>

                {/* FAB: New Observation */}
                <button
                    onClick={handleGenericObservation}
                    className="btn-glow absolute bottom-6 right-6 z-[1000] flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-[#00F2FF] to-[#3b82f6] px-5 py-3.5 shadow-xl transition-all duration-300 hover:scale-105"
                >
                    {showObservationPanel ? (
                        <X className="h-5 w-5 text-white" />
                    ) : (
                        <>
                            <Camera className="h-5 w-5 text-white" />
                            <span className="text-sm font-bold text-white">New Observation</span>
                            <Zap className="h-3.5 w-3.5 text-yellow-300" />
                        </>
                    )}
                </button>

                {/* Floating observation form */}
                {showObservationPanel && (
                    <div
                        className="absolute bottom-20 right-6 z-[1000] w-[400px] max-h-[75vh] overflow-y-auto rounded-2xl p-5 shadow-2xl"
                        style={{
                            background: 'rgba(21, 25, 33, 0.95)',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            animation: 'fadeSlideIn 0.3s ease both',
                        }}
                    >
                        <div className="mb-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {selectedMission ? (
                                    <>
                                        <Upload className="h-4 w-4 text-[#9D50FF]" />
                                        <h3 className="text-sm font-bold text-white">Submit Data</h3>
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="h-4 w-4 text-[#9D50FF]" />
                                        <h3 className="text-sm font-bold text-white">New Observation</h3>
                                    </>
                                )}
                                <span className="rounded-full bg-[#9D50FF]/15 px-2 py-0.5 text-[10px] font-bold text-[#9D50FF]">
                                    AI-Powered
                                </span>
                            </div>
                            <button
                                onClick={() => { setShowObservationPanel(false); setSelectedMission(null); }}
                                className="rounded-lg p-1 text-white/30 hover:bg-white/[0.06] hover:text-white"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <UploadObservation mission={selectedMission} />
                    </div>
                )}

                {/* Sidebar toggle */}
                {!sidebarOpen && (
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="absolute top-1/2 right-0 z-20 -translate-y-1/2 rounded-l-xl border border-r-0 border-white/[0.06] px-1.5 py-4 text-white/40 backdrop-blur-md transition-all hover:text-white"
                        style={{ background: 'rgba(21,25,33,0.9)' }}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                )}
            </div>

            {/* Right Sidebar */}
            <aside
                className={`flex shrink-0 flex-col border-l border-white/[0.06] transition-all duration-300 ${sidebarOpen ? 'w-[320px]' : 'w-0 overflow-hidden border-l-0'
                    }`}
                style={{ background: 'rgba(11, 14, 20, 0.7)', backdropFilter: 'blur(16px)' }}
            >
                {/* Collapse */}
                {sidebarOpen && (
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="ml-auto mr-2 mt-2 rounded-lg p-1 text-white/20 hover:text-white/50"
                    >
                        <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                )}

                {/* Gamification Compact Widget */}
                <div className="px-3 pb-3">
                    <GamificationPanel compact />
                </div>

                {/* Tabs */}
                <div className="flex border-b border-white/[0.06]">
                    {[
                        { id: 'feed', label: 'Live Feed', icon: Sparkles },
                        { id: 'missions', label: 'Missions', icon: Target },
                        { id: 'rewards', label: 'Rewards', icon: Trophy },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex flex-1 items-center justify-center gap-1.5 px-3 py-2.5 text-[11px] font-medium transition-colors ${activeTab === tab.id
                                ? 'border-b-2 border-[#f59e0b] text-[#f59e0b]'
                                : 'text-white/30 hover:text-white/50'
                                }`}
                        >
                            <tab.icon className="h-3 w-3" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-3">
                    {activeTab === 'feed' ? (
                        <ObservationFeed />
                    ) : activeTab === 'missions' ? (
                        <MissionListView missions={missions} userName={user?.name || 'Anonymous'} onFlyTo={setFlyTarget} />
                    ) : activeTab === 'rewards' ? (
                        <GamificationPanel />
                    ) : null}
                </div>

                {/* Footer */}
                <div className="border-t border-white/[0.06] px-4 py-2">
                    <div className="flex items-center justify-center gap-1 text-[10px] text-white/15">
                        <span>CitSciNet v1.0</span>
                        <span>•</span>
                        <span>Hackathon 2026</span>
                    </div>
                </div>
            </aside>

            {/* Mission Panel overlay — with submit data callback */}
            <MissionPanel
                userName={user?.name || 'Anonymous'}
                onSubmitData={handleSubmitForMission}
            />
        </div>
    );
}

// Compute center of a GeoJSON polygon geometry
function getGeometryCenter(geometry) {
    try {
        let coords = [];
        if (geometry?.type === 'Polygon') {
            coords = geometry.coordinates?.[0] || [];
        } else if (geometry?.type === 'MultiPolygon') {
            coords = geometry.coordinates?.[0]?.[0] || [];
        } else if (geometry?.coordinates) {
            coords = geometry.coordinates?.[0] || geometry.coordinates;
        }
        if (!coords.length) return null;
        const lats = coords.map(c => c[1]);
        const lngs = coords.map(c => c[0]);
        return {
            lat: lats.reduce((a, b) => a + b, 0) / lats.length,
            lng: lngs.reduce((a, b) => a + b, 0) / lngs.length,
        };
    } catch {
        return null;
    }
}

function MissionListView({ missions, userName, onFlyTo }) {
    const setActiveMission = useMissionStore((s) => s.setActiveMission);

    const handleMissionClick = (mission) => {
        setActiveMission(mission);
        // Fly map to mission location
        if (onFlyTo && mission.geometry) {
            const center = getGeometryCenter(mission.geometry);
            if (center) {
                onFlyTo({ lat: center.lat, lng: center.lng, zoom: 14 });
            }
        }
    };

    return (
        <div className="space-y-2">
            {missions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-white/30">
                    <Target className="h-10 w-10 mb-2" />
                    <p className="text-xs">No active missions</p>
                </div>
            ) : (
                missions.map((mission, i) => {
                    const isAccepted = mission.userMissions?.some((um) => um.userName === userName);
                    return (
                        <button
                            key={mission.id}
                            onClick={() => handleMissionClick(mission)}
                            className="glass-card w-full p-3 text-left transition-all hover:bg-white/[0.04]"
                            style={{ animation: `fadeSlideIn 0.3s ease ${i * 60}ms both` }}
                        >
                            <div className="mb-1.5 flex items-start justify-between">
                                <h4 className="text-sm font-bold text-white">{mission.title}</h4>
                                <span className="rounded-full bg-[#00F2FF]/10 px-2 py-0.5 text-xs font-bold text-[#00F2FF]">
                                    {mission.bountyPoints}
                                </span>
                            </div>
                            {mission.description && (
                                <p className="mb-1.5 text-xs text-white/40 line-clamp-2">{mission.description}</p>
                            )}
                            <div className="flex items-center gap-2">
                                {isAccepted && (
                                    <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400">
                                        ✅ Accepted
                                    </span>
                                )}
                                <span className="text-[10px] text-white/20">
                                    {mission.userMissions?.length || 0} joined
                                </span>
                                {mission.dataRequirement && (
                                    <span className={`ml-auto rounded px-1.5 py-0.5 text-[9px] font-bold ${mission.dataRequirement === 'image' ? 'bg-[#00F2FF]/10 text-[#00F2FF]' :
                                        mission.dataRequirement === 'text' ? 'bg-[#9D50FF]/10 text-[#9D50FF]' :
                                            'bg-emerald-500/10 text-emerald-400'
                                        }`}>
                                        {mission.dataRequirement === 'image' ? '📷' :
                                            mission.dataRequirement === 'text' ? '📝' : '📷📝'}
                                    </span>
                                )}
                            </div>
                        </button>
                    );
                })
            )}
        </div>
    );
}
