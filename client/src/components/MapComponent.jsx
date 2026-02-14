'use client';

import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon, useMap, Tooltip, Circle } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import useObservationStore from '../store/useObservationStore';
import useMissionStore from '../store/useMissionStore';
import { useGeofence } from '../hooks/useGeofence';
import 'leaflet/dist/leaflet.css';

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

function createCustomIcon(color) {
    return L.divIcon({
        className: 'custom-marker',
        html: `
      <div style="position: relative;">
        <div style="
          position: absolute;
          top: -20px;
          left: -20px;
          width: 40px;
          height: 40px;
          background: ${color}30;
          border-radius: 50%;
          animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
        "></div>
        <div style="
          position: relative;
          width: 24px;
          height: 24px;
          background: ${color};
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 0 20px ${color}80, 0 4px 6px rgba(0,0,0,0.3);
          transform: translate(-12px, -12px);
        "></div>
      </div>
    `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -12],
    });
}

function createClusterIcon(cluster) {
    const count = cluster.getChildCount();
    const size = count < 10 ? 36 : count < 50 ? 44 : 52;
    return L.divIcon({
        html: `<div style="
            width: ${size}px;
            height: ${size}px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(0, 242, 255, 0.15);
            border: 2px solid rgba(0, 242, 255, 0.5);
            border-radius: 50%;
            color: #00F2FF;
            font-weight: 700;
            font-size: ${count < 10 ? 12 : 14}px;
            font-family: var(--font-geist-mono, monospace);
            box-shadow: 0 0 15px rgba(0, 242, 255, 0.3);
            backdrop-filter: blur(8px);
        ">${count}</div>`,
        className: 'marker-cluster-custom',
        iconSize: L.point(size, size, true),
    });
}

function FlyToNewObservation() {
    const map = useMap();
    const observations = useObservationStore((s) => s.observations);
    const prevCountRef = useRef(0);

    useEffect(() => {
        if (observations.length > prevCountRef.current && observations.length > 0) {
            const latest = observations[0];
            map.flyTo([latest.latitude, latest.longitude], 15, { duration: 2 });
        }
        prevCountRef.current = observations.length;
    }, [observations, map]);

    return null;
}

function FlyToTarget({ flyTarget }) {
    const map = useMap();
    const prevTarget = useRef(null);

    useEffect(() => {
        if (!flyTarget) return;
        const key = `${flyTarget.lat}-${flyTarget.lng}`;
        if (prevTarget.current === key) return;
        prevTarget.current = key;
        map.flyTo([flyTarget.lat, flyTarget.lng], flyTarget.zoom || 13, { duration: 2 });
    }, [flyTarget, map]);

    return null;
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
}

export default function MapComponent({ missions = [], userLocation, flyTarget, children }) {
    const observations = useObservationStore((s) => s.observations);
    const { isInZone, activeMission: geofenceMission } = useGeofence(missions, userLocation);
    const activeMission = useMissionStore((s) => s.activeMission);
    const setActiveMission = useMissionStore((s) => s.setActiveMission);

    const getMissionColor = (mission) => {
        const isActive = activeMission && activeMission.id === mission.id;
        const isGeoActive = geofenceMission && geofenceMission.id === mission.id;

        if (isActive) {
            return { color: '#00F2FF', fillColor: '#00F2FF', fillOpacity: 0.25, weight: 3, dashArray: '8 4' };
        }
        if (isGeoActive) {
            return { color: '#10b981', fillColor: '#10b981', fillOpacity: 0.2, weight: 3 };
        }
        // Default: Crimson
        return { color: '#dc2626', fillColor: '#dc2626', fillOpacity: 0.15, weight: 2 };
    };

    return (
        <div className="relative h-full w-full">
            <MapContainer
                center={[20.5937, 78.9629]}
                zoom={5}
                style={{ height: '100%', width: '100%' }}
                zoomControl={true}
            >
                <TileLayer
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    attribution='Tiles &copy; Esri'
                    maxZoom={18}
                />

                <FlyToNewObservation />
                <FlyToTarget flyTarget={flyTarget} />
                {children}

                {/* Search location marker */}
                {flyTarget && (
                    <Circle
                        center={[flyTarget.lat, flyTarget.lng]}
                        radius={200}
                        pathOptions={{
                            color: '#00F2FF',
                            fillColor: '#00F2FF',
                            fillOpacity: 0.15,
                            weight: 2,
                            dashArray: '6 4',
                        }}
                    />
                )}

                {/* Mission Polygons */}
                {missions.map((mission) => {
                    if (!mission.geometry || !mission.geometry.coordinates) return null;
                    const positions = mission.geometry.coordinates[0].map(coord => [coord[1], coord[0]]);
                    const colors = getMissionColor(mission);
                    const isHighPriority = mission.bountyPoints >= 50;

                    return (
                        <Polygon
                            key={mission.id}
                            positions={positions}
                            pathOptions={colors}
                            eventHandlers={{
                                click: (e) => {
                                    L.DomEvent.stopPropagation(e);
                                    setActiveMission(mission);
                                },
                            }}
                            className={isHighPriority ? 'mission-pulse' : ''}
                        >
                            <Tooltip
                                direction="top"
                                offset={[0, -10]}
                                className="mission-tooltip"
                            >
                                <div style={{
                                    background: 'rgba(11,14,20,0.95)',
                                    backdropFilter: 'blur(12px)',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    borderRadius: '10px',
                                    padding: '10px 14px',
                                    minWidth: '160px',
                                }}>
                                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>
                                        {mission.title}
                                    </div>
                                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace' }}>
                                        🎯 {mission.bountyPoints} pts · {mission.userMissions?.length || 0} joined
                                    </div>
                                </div>
                            </Tooltip>
                            <Popup>
                                <div className="min-w-[200px] rounded-xl p-3" style={{ background: 'rgba(11,14,20,0.95)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                    <h4 className="mb-2 text-sm font-bold text-white">{mission.title}</h4>
                                    {mission.description && (
                                        <p className="mb-2 text-xs text-white/60">{mission.description}</p>
                                    )}
                                    <div className="mb-2 flex items-center gap-2 text-xs">
                                        <span className="rounded-full bg-[#00F2FF]/15 px-2 py-0.5 text-[#00F2FF] font-semibold">
                                            🎯 {mission.bountyPoints} pts
                                        </span>
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setActiveMission(mission); }}
                                        className="btn-glow w-full rounded-lg bg-gradient-to-r from-[#00F2FF] to-[#3b82f6] px-3 py-1.5 text-xs font-bold text-white"
                                    >
                                        View Details →
                                    </button>
                                </div>
                            </Popup>
                        </Polygon>
                    );
                })}

                {/* Clustered Observation Markers */}
                <MarkerClusterGroup
                    chunkedLoading
                    iconCreateFunction={createClusterIcon}
                    maxClusterRadius={60}
                    spiderfyOnMaxZoom={true}
                    showCoverageOnHover={false}
                >
                    {observations.map((obs) => (
                        <Marker
                            key={obs.id}
                            position={[obs.latitude, obs.longitude]}
                            icon={createCustomIcon(CATEGORY_COLORS[obs.category] || '#94a3b8')}
                        >
                            <Tooltip direction="top" offset={[0, -15]}>
                                <div style={{
                                    background: 'rgba(11,14,20,0.95)',
                                    backdropFilter: 'blur(12px)',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    borderRadius: '8px',
                                    padding: '6px 10px',
                                    fontFamily: 'monospace',
                                    fontSize: '10px',
                                    color: 'rgba(255,255,255,0.7)',
                                }}>
                                    📍 {obs.latitude.toFixed(4)}, {obs.longitude.toFixed(4)}
                                </div>
                            </Tooltip>
                            <Popup className="custom-popup">
                                <div className="min-w-[240px] rounded-xl p-4" style={{ background: 'rgba(11,14,20,0.95)', backdropFilter: 'blur(16px)', border: '1px solid rgba(0,242,255,0.15)' }}>
                                    <div className="mb-2 flex items-center justify-between">
                                        <span
                                            className="rounded-full px-2 py-0.5 text-xs font-bold text-white"
                                            style={{ backgroundColor: CATEGORY_COLORS[obs.category] || '#94a3b8' }}
                                        >
                                            {obs.category}
                                        </span>
                                        <span className="text-xs text-[#00F2FF]/60 font-mono">{formatTime(obs.createdAt)}</span>
                                    </div>

                                    {obs.imageUrl && (
                                        <div className="mb-2 overflow-hidden rounded-lg">
                                            <img src={obs.imageUrl} alt={obs.category} className="h-32 w-full object-cover" />
                                        </div>
                                    )}

                                    {obs.aiLabel && (
                                        <div className="mb-2 flex items-center gap-1 text-xs">
                                            <span className="text-[#9D50FF] font-semibold">AI:</span>
                                            <span className="text-white/80">{obs.aiLabel}</span>
                                            {obs.confidenceScore && (
                                                <span className="text-[#00F2FF] font-mono">
                                                    ({(obs.confidenceScore * 100).toFixed(0)}%)
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    {obs.notes && <p className="mb-1 text-xs text-white/60">{obs.notes}</p>}

                                    <div className="flex items-center gap-1 text-xs text-white/40 font-mono">
                                        <span>📍 {obs.latitude.toFixed(4)}, {obs.longitude.toFixed(4)}</span>
                                    </div>
                                    <div className="mt-1 text-xs text-[#00F2FF]/40">by {obs.userName}</div>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MarkerClusterGroup>
            </MapContainer>

            {/* Legend */}
            <div className="absolute bottom-4 left-4 z-[1000] flex flex-wrap gap-2">
                {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
                    <div
                        key={cat}
                        className="glass-surface flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs"
                    >
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}80` }} />
                        <span className="text-white/60">{cat}</span>
                    </div>
                ))}
            </div>

            {isInZone && geofenceMission && (
                <div
                    className="absolute top-4 left-1/2 z-[1000] -translate-x-1/2 rounded-full bg-emerald-500/90 px-4 py-2 text-sm font-bold text-white shadow-lg"
                    style={{ animation: 'pulseGlow 3s ease-in-out infinite' }}
                >
                    🎯 You&rsquo;re in the Mission Zone!
                </div>
            )}

            <style jsx global>{`
                @keyframes ping {
                    75%, 100% { transform: scale(2); opacity: 0; }
                }
                .leaflet-popup-content-wrapper {
                    background: transparent !important;
                    box-shadow: none !important;
                    padding: 0 !important;
                }
                .leaflet-popup-tip {
                    background: rgba(11, 14, 20, 0.95) !important;
                }
                .leaflet-popup-close-button {
                    color: #00F2FF !important;
                    font-size: 20px !important;
                    font-weight: bold !important;
                    padding: 4px 8px !important;
                }
                .leaflet-popup-close-button:hover {
                    color: #9D50FF !important;
                }
                .leaflet-container {
                    background: #0B0E14 !important;
                }
                .leaflet-tooltip {
                    background: transparent !important;
                    border: none !important;
                    box-shadow: none !important;
                    padding: 0 !important;
                }
                .leaflet-tooltip::before {
                    display: none !important;
                }
                .marker-cluster-custom {
                    background: transparent !important;
                }
                .mission-pulse {
                    animation: missionPulse 3s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
}
