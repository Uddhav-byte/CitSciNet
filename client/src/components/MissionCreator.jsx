'use client';

import { useCallback, useRef, useState } from 'react';
import { FeatureGroup } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import {
    Target, X, Droplets, Bird, Wind, Leaf, ChevronRight, ChevronLeft,
    Camera, FileText, Layers, Sparkles, Loader2, Check, Beaker, ListChecks,
    Zap, Info, Mic
} from 'lucide-react';
import useMissionStore from '../store/useMissionStore';
import useAuthStore from '../store/authStore';
import Toast from './Toast';
import 'leaflet-draw/dist/leaflet.draw.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const MISSION_TYPES = [
    { value: 'Wildlife', label: 'Wildlife', icon: Bird, color: '#a855f7', desc: 'Track animals, nesting sites, migration patterns' },
    { value: 'Water', label: 'Water', icon: Droplets, color: '#3b82f6', desc: 'Water quality, river health, aquatic life' },
    { value: 'Air', label: 'Air Quality', icon: Wind, color: '#f59e0b', desc: 'Air pollution, pollen, atmospheric conditions' },
    { value: 'Plant', label: 'Plant', icon: Leaf, color: '#10b981', desc: 'Flora surveys, invasive species, vegetation health' },
];

const DATA_REQUIREMENTS = [
    { value: 'image', label: 'Photo Required', icon: Camera, color: '#00F2FF', desc: 'Citizens must upload a photo as evidence' },
    { value: 'text', label: 'Text Data Only', icon: FileText, color: '#9D50FF', desc: 'Written observations, measurements, readings' },
    { value: 'both', label: 'Photo + Text', icon: Layers, color: '#10b981', desc: 'Both photo evidence and written data needed' },
    { value: 'audio', label: 'Audio Only', icon: Mic, color: '#f472b6', desc: 'Record bird calls, river sounds, or environmental noise' },
    { value: 'all', label: 'Photo + Text + Audio', icon: Sparkles, color: '#f59e0b', desc: 'Complete data package including all media' },
];

const STEP_LABELS = ['Area', 'Basics', 'Science', 'Review'];

export default function MissionCreator({ onMissionCreated }) {
    const [showModal, setShowModal] = useState(false);
    const [missionData, setMissionData] = useState(null);
    const [step, setStep] = useState(0);

    // Form fields
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [bountyPoints, setBountyPoints] = useState(10);
    const [missionType, setMissionType] = useState('Wildlife');
    const [scientificGoal, setScientificGoal] = useState('');
    const [dataProtocol, setDataProtocol] = useState('');
    const [dataRequirement, setDataRequirement] = useState('both');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const featureGroupRef = useRef(null);
    const addMission = useMissionStore((s) => s.addMission);
    const user = useAuthStore((s) => s.user);

    const handleCreated = useCallback((e) => {
        const { layer } = e;
        const geoJSON = layer.toGeoJSON();
        setMissionData({ geometry: geoJSON.geometry, layer });
        setStep(1);
        setShowModal(true);
    }, []);

    const handleSubmit = async () => {
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
                    missionType,
                    scientificGoal: scientificGoal || null,
                    dataProtocol: dataProtocol || null,
                    dataRequirement,
                    createdBy: user?.name || 'Researcher',
                }),
            });

            if (!res.ok) throw new Error('Failed to create mission');

            const mission = await res.json();
            setShowModal(false);
            resetForm();

            if (featureGroupRef.current && missionData.layer) {
                featureGroupRef.current.removeLayer(missionData.layer);
            }

            addMission(mission);
            setShowToast(true);
            onMissionCreated?.(mission);
        } catch (err) {
            console.error('Failed to create mission:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setBountyPoints(10);
        setMissionType('Wildlife');
        setScientificGoal('');
        setDataProtocol('');
        setDataRequirement('both');
        setMissionData(null);
        setStep(0);
    };

    const handleCancel = () => {
        if (featureGroupRef.current && missionData?.layer) {
            featureGroupRef.current.removeLayer(missionData.layer);
        }
        setShowModal(false);
        resetForm();
    };

    const canProceed = () => {
        if (step === 1) return title.length > 0;
        if (step === 2) return true;
        return true;
    };

    const selectedType = MISSION_TYPES.find(t => t.value === missionType);
    const selectedReq = DATA_REQUIREMENTS.find(r => r.value === dataRequirement);

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
                                color: '#dc2626',
                                fillColor: '#dc2626',
                                fillOpacity: 0.3,
                                weight: 3,
                            },
                        },
                    }}
                    edit={{ edit: false, remove: false }}
                />
            </FeatureGroup>

            <Toast message="Mission Published! 🚀" show={showToast} onClose={() => setShowToast(false)} />

            {showModal && (
                <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div
                        className="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
                        style={{
                            background: 'rgba(21, 25, 33, 0.97)',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            animation: 'fadeSlideIn 0.3s ease both',
                        }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#dc2626]/15">
                                    <Target className="h-5 w-5 text-[#dc2626]" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-white">Create Research Mission</h3>
                                    <p className="text-[10px] text-white/30">Step {step} of 3 — {STEP_LABELS[step]}</p>
                                </div>
                            </div>
                            <button onClick={handleCancel} className="rounded-lg p-1.5 text-white/30 hover:bg-white/[0.06] hover:text-white">
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Progress bar */}
                        <div className="flex gap-1 px-6 py-2">
                            {[1, 2, 3].map(s => (
                                <div key={s} className="h-1 flex-1 rounded-full overflow-hidden bg-white/[0.06]">
                                    <div
                                        className="h-full rounded-full transition-all duration-500"
                                        style={{
                                            width: step >= s ? '100%' : '0%',
                                            background: step >= s ? 'linear-gradient(90deg, #00F2FF, #3b82f6)' : 'transparent',
                                        }}
                                    />
                                </div>
                            ))}
                        </div>

                        {/* Step Content */}
                        <div className="px-6 py-4 max-h-[60vh] overflow-y-auto" style={{ animation: 'fadeSlideIn 0.2s ease both' }}>
                            {step === 1 && (
                                <div className="space-y-4">
                                    {/* Mission Type */}
                                    <div>
                                        <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-white/40">
                                            Research Category
                                        </label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {MISSION_TYPES.map((t) => (
                                                <button
                                                    key={t.value}
                                                    type="button"
                                                    onClick={() => setMissionType(t.value)}
                                                    className={`flex items-center gap-3 rounded-xl border p-3 transition-all text-left ${missionType === t.value
                                                        ? 'border-[#00F2FF]/30 bg-[#00F2FF]/5 shadow-[0_0_15px_rgba(0,242,255,0.08)]'
                                                        : 'border-white/[0.06] bg-white/[0.02] hover:border-white/10'
                                                        }`}
                                                >
                                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${t.color}15` }}>
                                                        <t.icon className="h-4 w-4" style={{ color: t.color }} />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className={`text-xs font-bold ${missionType === t.value ? 'text-white' : 'text-white/60'}`}>
                                                            {t.label}
                                                        </div>
                                                        <div className="text-[10px] text-white/25 truncate">{t.desc}</div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Title */}
                                    <div>
                                        <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-white/40">
                                            Mission Title *
                                        </label>
                                        <input
                                            type="text"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            placeholder="e.g., Survey Bird Species in Eco Park"
                                            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-[#00F2FF] focus:ring-1 focus:ring-[#00F2FF]/30"
                                            required
                                        />
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-white/40">
                                            Briefing for Citizens
                                        </label>
                                        <textarea
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder="What should observers look for in this zone? Be specific about what data you need..."
                                            rows={3}
                                            className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-[#00F2FF] focus:ring-1 focus:ring-[#00F2FF]/30"
                                        />
                                    </div>

                                    {/* Bounty */}
                                    <div>
                                        <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-white/40">
                                            Bounty Points <span className="text-white/20">(reward for contributors)</span>
                                        </label>
                                        <div className="flex items-center gap-2">
                                            {[5, 10, 25, 50, 100].map(b => (
                                                <button
                                                    key={b}
                                                    type="button"
                                                    onClick={() => setBountyPoints(b)}
                                                    className={`rounded-full px-3 py-1 text-xs font-bold transition-all ${bountyPoints === b
                                                        ? 'bg-[#f59e0b]/15 text-[#f59e0b] shadow-[0_0_10px_rgba(245,158,11,0.1)]'
                                                        : 'text-white/30 hover:text-white/60'
                                                        }`}
                                                >
                                                    {b} <Zap className="inline h-2.5 w-2.5" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="space-y-5">
                                    {/* Data Requirement */}
                                    <div>
                                        <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-white/40">
                                            <Camera className="inline h-3 w-3 mr-1 -mt-0.5" />
                                            What Data Do You Need?
                                        </label>
                                        <div className="space-y-2">
                                            {DATA_REQUIREMENTS.map((r) => (
                                                <button
                                                    key={r.value}
                                                    type="button"
                                                    onClick={() => setDataRequirement(r.value)}
                                                    className={`flex w-full items-center gap-3 rounded-xl border p-3 transition-all text-left ${dataRequirement === r.value
                                                        ? `border-opacity-30 bg-opacity-5 shadow-lg`
                                                        : 'border-white/[0.06] bg-white/[0.02] hover:border-white/10'
                                                        }`}
                                                    style={dataRequirement === r.value ? {
                                                        borderColor: `${r.color}50`,
                                                        backgroundColor: `${r.color}08`,
                                                    } : {}}
                                                >
                                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${r.color}15` }}>
                                                        <r.icon className="h-4 w-4" style={{ color: r.color }} />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className={`text-xs font-bold ${dataRequirement === r.value ? 'text-white' : 'text-white/60'}`}>
                                                            {r.label}
                                                        </div>
                                                        <div className="text-[10px] text-white/25">{r.desc}</div>
                                                    </div>
                                                    {dataRequirement === r.value && (
                                                        <Check className="h-4 w-4 shrink-0" style={{ color: r.color }} />
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Scientific Goal */}
                                    <div>
                                        <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-white/40">
                                            <Beaker className="inline h-3 w-3 mr-1 -mt-0.5" />
                                            Scientific Goal <span className="text-white/20">(optional)</span>
                                        </label>
                                        <textarea
                                            value={scientificGoal}
                                            onChange={(e) => setScientificGoal(e.target.value)}
                                            placeholder="What hypothesis or research question does this mission address? e.g. 'Determine the population density of native butterfly species in urban green corridors'"
                                            rows={3}
                                            className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-[#9D50FF] focus:ring-1 focus:ring-[#9D50FF]/30"
                                        />
                                    </div>

                                    {/* Data Protocol */}
                                    <div>
                                        <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-white/40">
                                            <ListChecks className="inline h-3 w-3 mr-1 -mt-0.5" />
                                            Data Collection Protocol <span className="text-white/20">(optional)</span>
                                        </label>
                                        <textarea
                                            value={dataProtocol}
                                            onChange={(e) => setDataProtocol(e.target.value)}
                                            placeholder={"Step-by-step instructions for citizens:\n1. Approach the specimen from 2m distance\n2. Take a clear photo showing the full body\n3. Note the habitat type (grassland, forest, wetland)\n4. Record the approximate size"}
                                            rows={5}
                                            className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-[#9D50FF] focus:ring-1 focus:ring-[#9D50FF]/30 font-mono text-xs"
                                        />
                                        <div className="mt-1 flex items-center gap-1 text-[10px] text-white/20">
                                            <Info className="h-3 w-3" />
                                            Citizens will see these instructions when submitting data for this mission
                                        </div>
                                    </div>
                                </div>
                            )}

                            {step === 3 && (
                                <div className="space-y-3">
                                    <div className="text-center mb-4">
                                        <Sparkles className="h-6 w-6 text-[#00F2FF] mx-auto mb-2" />
                                        <h4 className="text-sm font-bold text-white">Review Your Mission</h4>
                                        <p className="text-[10px] text-white/30">Confirm everything looks correct before publishing</p>
                                    </div>

                                    {/* Summary cards */}
                                    <div className="glass-card p-3">
                                        <div className="flex items-center gap-2 mb-2">
                                            {selectedType && <selectedType.icon className="h-4 w-4" style={{ color: selectedType.color }} />}
                                            <h4 className="text-sm font-bold text-white">{title || 'Untitled'}</h4>
                                        </div>
                                        {description && <p className="text-xs text-white/50 mb-2">{description}</p>}
                                        <div className="flex flex-wrap gap-2">
                                            <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ backgroundColor: `${selectedType?.color}15`, color: selectedType?.color }}>
                                                {missionType}
                                            </span>
                                            <span className="rounded-full bg-[#f59e0b]/10 px-2 py-0.5 text-[10px] font-bold text-[#f59e0b]">
                                                {bountyPoints} pts
                                            </span>
                                            {selectedReq && (
                                                <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ backgroundColor: `${selectedReq.color}15`, color: selectedReq.color }}>
                                                    {selectedReq.label}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {scientificGoal && (
                                        <div className="glass-card p-3">
                                            <div className="flex items-center gap-1 mb-1">
                                                <Beaker className="h-3 w-3 text-[#9D50FF]" />
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">Scientific Goal</span>
                                            </div>
                                            <p className="text-xs text-white/60">{scientificGoal}</p>
                                        </div>
                                    )}

                                    {dataProtocol && (
                                        <div className="glass-card p-3">
                                            <div className="flex items-center gap-1 mb-1">
                                                <ListChecks className="h-3 w-3 text-[#10b981]" />
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">Data Protocol</span>
                                            </div>
                                            <p className="text-xs text-white/60 whitespace-pre-wrap font-mono">{dataProtocol}</p>
                                        </div>
                                    )}

                                    {/* AI Validation notice */}
                                    <div className="flex items-start gap-2 rounded-xl bg-[#9D50FF]/[0.06] border border-[#9D50FF]/10 p-3">
                                        <Sparkles className="h-3.5 w-3.5 text-[#9D50FF] shrink-0 mt-0.5" />
                                        <div className="text-[10px] text-white/50">
                                            <span className="text-[#9D50FF] font-bold">AI Validation Enabled:</span> All submissions will be validated by Groq AI.
                                            Observations with ≥80% relevance are auto-approved; others are sent to the review queue.
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer Navigation */}
                        <div className="flex items-center gap-2 border-t border-white/[0.06] px-6 py-4">
                            {step > 1 && (
                                <button
                                    type="button"
                                    onClick={() => setStep(step - 1)}
                                    className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-medium text-white/60 transition hover:bg-white/10"
                                >
                                    <ChevronLeft className="h-3 w-3" />
                                    Back
                                </button>
                            )}
                            <div className="flex-1" />
                            {step < 3 ? (
                                <button
                                    type="button"
                                    onClick={() => setStep(step + 1)}
                                    disabled={!canProceed()}
                                    className="flex items-center gap-1 rounded-lg bg-gradient-to-r from-[#00F2FF] to-[#3b82f6] px-5 py-2.5 text-xs font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Next
                                    <ChevronRight className="h-3 w-3" />
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={isSubmitting || !title}
                                    className="btn-glow flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#00F2FF] to-[#3b82f6] px-6 py-2.5 text-xs font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {isSubmitting ? (
                                        <><Loader2 className="h-4 w-4 animate-spin" /> Publishing...</>
                                    ) : (
                                        <><Target className="h-4 w-4" /> Publish Mission</>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
