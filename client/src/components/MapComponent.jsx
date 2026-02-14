'use client';

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon, useMap } from 'react-leaflet';
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

function FlyToNewObservation() {
    const map = useMap();
    const observations = useObservationStore((s) => s.observations);
    const prevCountRef = useRef(0);

    useEffect(() => {
        if (observations.length > prevCountRef.current && observations.length > 0) {
            const latest = observations[0];
            map.flyTo([latest.latitude, latest.longitude], 15, {
                duration: 2,
            });
        }
        prevCountRef.current = observations.length;
    }, [observations, map]);

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

export default function MapComponent({ missions = [], userLocation, children }) {
    const observations = useObservationStore((s) => s.observations);
    const { isInZone, activeMission: geofenceMission } = useGeofence(missions, userLocation);
    const activeMission = useMissionStore((s) => s.activeMission);
    const setActiveMission = useMissionStore((s) => s.setActiveMission);

    const getMissionColor = (mission) => {
        const isActive = activeMission && activeMission.id === mission.id;
        const isGeoActive = geofenceMission && geofenceMission.id === mission.id;

        if (isActive) {
            return { color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: 0.4, weight: 4 };
        }
        if (isGeoActive) {
            return { color: '#22c55e', fillColor: '#22c55e', fillOpacity: 0.3, weight: 3 };
        }
        return { color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.2, weight: 2 };
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
                    attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                    maxZoom={18}
                />

                <FlyToNewObservation />
                {children}

                {/* Render Mission Polygons */}
                {missions.map((mission) => {
                    if (!mission.geometry || !mission.geometry.coordinates) return null;

                    const positions = mission.geometry.coordinates[0].map(coord => [coord[1], coord[0]]);
                    const colors = getMissionColor(mission);

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
                        >
                            <Popup>
                                <div className="min-w-[200px] rounded-xl bg-gray-900/95 p-3">
                                    <h4 className="mb-2 text-sm font-bold text-white">{mission.title}</h4>
                                    {mission.description && (
                                        <p className="mb-2 text-xs text-white/70">{mission.description}</p>
                                    )}
                                    <div className="mb-2 flex items-center gap-2 text-xs">
                                        <span className="rounded-full bg-yellow-500/20 px-2 py-0.5 text-yellow-400">
                                            🎯 {mission.bountyPoints} pts
                                        </span>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveMission(mission);
                                        }}
                                        className="w-full rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-3 py-1.5 text-xs font-bold text-white"
                                    >
                                        View Details →
                                    </button>
                                </div>
                            </Popup>
                        </Polygon>
                    );
                })}

                {/* Render Observation Markers */}
                {observations.map((obs) => (
                    <Marker
                        key={obs.id}
                        position={[obs.latitude, obs.longitude]}
                        icon={createCustomIcon(CATEGORY_COLORS[obs.category] || '#94a3b8')}
                    >
                        <Popup className="custom-popup">
                            <div className="min-w-[240px] rounded-xl bg-gray-900/95 p-4 backdrop-blur-md border border-cyan-500/20">
                                <div className="mb-2 flex items-center justify-between">
                                    <span
                                        className="rounded-full px-2 py-0.5 text-xs font-bold text-white"
                                        style={{
                                            backgroundColor: CATEGORY_COLORS[obs.category] || '#94a3b8',
                                        }}
                                    >
                                        {obs.category}
                                    </span>
                                    <span className="text-xs text-cyan-300/70">
                                        {formatTime(obs.createdAt)}
                                    </span>
                                </div>

                                {obs.imageUrl && (
                                    <div className="mb-2 overflow-hidden rounded-lg">
                                        <img
                                            src={obs.imageUrl}
                                            alt={obs.category}
                                            className="h-32 w-full object-cover"
                                        />
                                    </div>
                                )}

                                {obs.aiLabel && (
                                    <div className="mb-2 flex items-center gap-1 text-xs">
                                        <span className="text-purple-400">AI:</span>
                                        <span className="text-white/80">{obs.aiLabel}</span>
                                        {obs.confidenceScore && (
                                            <span className="text-cyan-400">
                                                ({(obs.confidenceScore * 100).toFixed(0)}%)
                                            </span>
                                        )}
                                    </div>
                                )}

                                {obs.notes && (
                                    <p className="mb-1 text-xs text-white/70">{obs.notes}</p>
                                )}

                                <div className="flex items-center gap-1 text-xs text-white/50">
                                    <span>📍</span>
                                    <span>
                                        {obs.latitude.toFixed(4)}, {obs.longitude.toFixed(4)}
                                    </span>
                                </div>
                                <div className="mt-1 text-xs text-cyan-300/50">
                                    by {obs.userName}
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>

            <div className="absolute bottom-4 left-4 z-[1000] flex flex-wrap gap-2">
                {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
                    <div
                        key={cat}
                        className="flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-xs backdrop-blur-sm border border-white/10"
                    >
                        <div
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: color }}
                        />
                        <span className="text-white/70">{cat}</span>
                    </div>
                ))}
            </div>

            {isInZone && geofenceMission && (
                <div className="absolute top-4 left-1/2 z-[1000] -translate-x-1/2 animate-pulse rounded-full bg-green-500/90 px-4 py-2 text-sm font-bold text-white shadow-lg">
                    🎯 You're in the Mission Zone!
                </div>
            )}

            <style jsx global>{`
        @keyframes ping {
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }
        .leaflet-popup-content-wrapper {
          background: transparent !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        .leaflet-popup-tip {
          background: rgba(17, 24, 39, 0.95) !important;
        }
        .leaflet-popup-close-button {
          color: #22d3ee !important;
          font-size: 20px !important;
          font-weight: bold !important;
          padding: 4px 8px !important;
        }
        .leaflet-popup-close-button:hover {
          color: #06b6d4 !important;
        }
        .leaflet-container {
          background: #0a0a0a !important;
        }
      `}</style>
        </div>
    );
}
