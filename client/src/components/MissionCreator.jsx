'use client';

import { useCallback, useRef, useState } from 'react';
import { FeatureGroup } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import { Target, X } from 'lucide-react';
import useMissionStore from '../store/useMissionStore';
import Toast from './Toast';
import 'leaflet-draw/dist/leaflet.draw.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function MissionCreator({ onMissionCreated }) {
    const [showModal, setShowModal] = useState(false);
    const [missionData, setMissionData] = useState(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [bountyPoints, setBountyPoints] = useState(10);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const featureGroupRef = useRef(null);
    const addMission = useMissionStore((s) => s.addMission);

    const handleCreated = useCallback((e) => {
        const { layer } = e;
        const geoJSON = layer.toGeoJSON();

        setMissionData({
            geometry: geoJSON.geometry,
            layer
        });
        setShowModal(true);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!missionData || !title) return;

        setIsSubmitting(true);
        try {
            const res = await fetch(`${API_URL}/api/missions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    description,
                    bountyPoints: parseInt(bountyPoints),
                    geometry: missionData.geometry,
                    createdBy: 'Researcher'
                })
            });

            if (!res.ok) throw new Error('Failed to create mission');

            const mission = await res.json();
            setShowModal(false);
            setTitle('');
            setDescription('');
            setBountyPoints(10);
            setMissionData(null);

            // Remove the drawn layer
            if (featureGroupRef.current && missionData.layer) {
                featureGroupRef.current.removeLayer(missionData.layer);
            }

            // Add to global store
            addMission(mission);

            // Show toast
            setShowToast(true);

            onMissionCreated?.(mission);
        } catch (err) {
            console.error('Failed to create mission:', err);
            alert('Failed to create mission');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        if (featureGroupRef.current && missionData?.layer) {
            featureGroupRef.current.removeLayer(missionData.layer);
        }
        setShowModal(false);
        setMissionData(null);
        setTitle('');
        setDescription('');
        setBountyPoints(10);
    };

    return (
        <>
            <FeatureGroup ref={featureGroupRef}>
                <EditControl
                    position="topright"
                    onCreated={handleCreated}
                    draw={{
                        rectangle: false,
                        circle: false,
                        circlemarker: false,
                        marker: false,
                        polyline: false,
                        polygon: {
                            allowIntersection: false,
                            shapeOptions: {
                                color: '#ef4444',
                                fillColor: '#ef4444',
                                fillOpacity: 0.3,
                                weight: 3
                            }
                        }
                    }}
                    edit={{
                        edit: false,
                        remove: false
                    }}
                />
            </FeatureGroup>

            <Toast
                message="Mission Published! 🚀"
                show={showToast}
                onClose={() => setShowToast(false)}
            />

            {showModal && (
                <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/70 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl border border-cyan-500/30 bg-gray-900/95 p-6 shadow-2xl">
                        <div className="mb-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Target className="h-5 w-5 text-cyan-400" />
                                <h3 className="text-lg font-bold text-white">Create Mission</h3>
                            </div>
                            <button
                                onClick={handleCancel}
                                className="text-white/60 hover:text-white"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-cyan-400">
                                    Mission Title *
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g., Survey Bird Species in Park"
                                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30"
                                    required
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-cyan-400">
                                    Description
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="What should observers look for in this zone?"
                                    rows={3}
                                    className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-cyan-400">
                                    Bounty Points
                                </label>
                                <input
                                    type="number"
                                    value={bountyPoints}
                                    onChange={(e) => setBountyPoints(e.target.value)}
                                    min="1"
                                    max="1000"
                                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30"
                                />
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    className="flex-1 rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !title}
                                    className="flex-1 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-cyan-500/25 transition-all duration-300 hover:shadow-cyan-500/40 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Creating...' : 'Create Mission'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
