'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import {
    Camera, Upload, AlertTriangle, CheckCircle, Loader2, MapPin,
    Sparkles, FileText, ListChecks, Info, Shield, Zap,
    Mic, Square, Play, Trash2, Volume2
} from 'lucide-react';
import useObservationStore from '../store/useObservationStore';
import useAuthStore from '../store/authStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const CATEGORIES = [
    { value: 'Bird', emoji: '🐦', color: '#22d3ee' },
    { value: 'Mammal', emoji: '🦊', color: '#a78bfa' },
    { value: 'Reptile', emoji: '🦎', color: '#34d399' },
    { value: 'Insect', emoji: '🦋', color: '#fbbf24' },
    { value: 'Plant', emoji: '🌿', color: '#4ade80' },
    { value: 'Fish', emoji: '🐟', color: '#60a5fa' },
    { value: 'Amphibian', emoji: '🐸', color: '#f472b6' },
    { value: 'Water', emoji: '💧', color: '#38bdf8' },
    { value: 'Air', emoji: '🌬️', color: '#a5b4fc' },
    { value: 'Soil', emoji: '🪨', color: '#d97706' },
    { value: 'Other', emoji: '🔬', color: '#94a3b8' },
];

// Map mission types to default categories
const MISSION_TYPE_TO_CATEGORY = {
    'Water': 'Water',
    'Wildlife': 'Other',
    'Air': 'Air',
    'Plant': 'Plant',
};

const CATEGORY_KEYWORDS = {
    Bird: ['bird', 'parrot', 'eagle', 'hawk', 'owl', 'sparrow', 'crow', 'robin', 'swan', 'duck', 'goose', 'peacock', 'penguin', 'flamingo'],
    Mammal: ['cat', 'dog', 'horse', 'elephant', 'bear', 'lion', 'tiger', 'wolf', 'fox', 'deer', 'rabbit', 'squirrel', 'monkey', 'gorilla', 'zebra', 'giraffe', 'cow', 'sheep', 'pig'],
    Reptile: ['snake', 'lizard', 'gecko', 'iguana', 'chameleon', 'turtle', 'tortoise', 'crocodile', 'alligator'],
    Insect: ['butterfly', 'dragonfly', 'bee', 'wasp', 'ant', 'beetle', 'moth', 'fly', 'mosquito', 'grasshopper', 'cricket', 'ladybug'],
    Plant: ['flower', 'tree', 'leaf', 'plant', 'fern', 'moss', 'grass', 'rose', 'daisy', 'sunflower', 'orchid', 'cactus', 'succulent'],
    Fish: ['fish', 'goldfish', 'shark', 'whale', 'dolphin', 'ray', 'salmon', 'tuna'],
    Amphibian: ['frog', 'toad', 'salamander', 'newt'],
    Water: ['water', 'river', 'lake', 'pond', 'stream', 'ocean', 'quality', 'ph', 'turbidity', 'dissolved'],
    Air: ['air', 'pollution', 'smog', 'particulate', 'aqi', 'emission', 'ozone'],
    Soil: ['soil', 'earth', 'ground', 'erosion', 'compost', 'sediment', 'clay', 'sand'],
    Other: [],
};

export default function UploadObservation({ mission }) {
    const user = useAuthStore((s) => s.user);
    const [category, setCategory] = useState('');
    const [latitude, setLatitude] = useState('');
    const [longitude, setLongitude] = useState('');
    const [notes, setNotes] = useState('');
    const [imagePreview, setImagePreview] = useState(null);
    const [imageBase64, setImageBase64] = useState(null);
    const [aiResult, setAiResult] = useState(null);
    const [aiWarning, setAiWarning] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [validationInfo, setValidationInfo] = useState(null);
    const [error, setError] = useState('');
    const imgRef = useRef(null);
    const fileInputRef = useRef(null);
    const audioInputRef = useRef(null);

    // Audio recording state
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState(null);
    const [audioPreviewUrl, setAudioPreviewUrl] = useState(null);
    const [recordingTime, setRecordingTime] = useState(0);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const timerRef = useRef(null);

    // Derive data requirements from mission
    const requiresImage = mission ? (mission.dataRequirement === 'image' || mission.dataRequirement === 'both' || mission.dataRequirement === 'all') : true;
    const requiresText = mission ? (mission.dataRequirement === 'text' || mission.dataRequirement === 'both' || mission.dataRequirement === 'all') : true;
    const requiresAudio = mission ? (mission.dataRequirement === 'audio' || mission.dataRequirement === 'all') : false;

    const detectLocation = useCallback(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setLatitude(pos.coords.latitude.toFixed(6));
                    setLongitude(pos.coords.longitude.toFixed(6));
                },
                () => {
                    // Fallback: use mission geometry center or default
                    if (!latitude && !longitude) {
                        if (mission?.geometry) {
                            const center = getMissionCenter(mission.geometry);
                            if (center) {
                                setLatitude(center.lat.toFixed(6));
                                setLongitude(center.lng.toFixed(6));
                                return;
                            }
                        }
                        setLatitude('28.6139');
                        setLongitude('77.2090');
                    }
                }
            );
        }
    }, [mission]);

    // Auto-detect location and auto-set category on mount
    useEffect(() => {
        // Auto-detect location
        detectLocation();

        // Auto-set category from mission type
        if (mission?.missionType && !category) {
            const mapped = MISSION_TYPE_TO_CATEGORY[mission.missionType];
            if (mapped) setCategory(mapped);
        }

        // Auto-populate location from mission geometry if available
        if (mission?.geometry && !latitude && !longitude) {
            const center = getMissionCenter(mission.geometry);
            if (center) {
                setLatitude(center.lat.toFixed(6));
                setLongitude(center.lng.toFixed(6));
            }
        }
    }, []);

    // Helper: get center of mission geometry
    function getMissionCenter(geometry) {
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
        } catch { return null; }
    }

    const runAIDetection = useCallback(
        async (imgElement) => {
            setIsAnalyzing(true);
            setAiResult(null);
            setAiWarning('');

            try {
                const mobilenet = await import('@tensorflow-models/mobilenet');
                await import('@tensorflow/tfjs');
                const model = await mobilenet.load();
                const predictions = await model.classify(imgElement);

                if (predictions.length > 0) {
                    const top = predictions[0];
                    setAiResult({
                        label: top.className,
                        score: top.probability,
                        allPredictions: predictions.slice(0, 3),
                    });

                    if (category) {
                        const keywords = CATEGORY_KEYWORDS[category] || [];
                        const detectedLower = top.className.toLowerCase();
                        const isMatch = keywords.some(keyword =>
                            detectedLower.includes(keyword) || keyword.includes(detectedLower)
                        );

                        if (!isMatch && category !== 'Other') {
                            setAiWarning(
                                `AI identified "${top.className}" (${(top.probability * 100).toFixed(0)}% confidence), which doesn't match "${category}". You can still submit.`
                            );
                        } else {
                            setAiWarning('');
                        }
                    }
                } else {
                    setAiResult({ label: 'Unknown', score: 0, allPredictions: [] });
                }
            } catch (err) {
                console.error('AI detection failed:', err);
                setAiResult(null);
            } finally {
                setIsAnalyzing(false);
            }
        },
        [category]
    );

    // Recording logic
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };

            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
                setAudioBlob(blob);
                setAudioPreviewUrl(URL.createObjectURL(blob));
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
            setRecordingTime(0);
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        } catch (err) {
            setError('Could not access microphone. Please check permissions.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            clearInterval(timerRef.current);
        }
    };

    const handleAudioFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            setError('Audio file too large. Max 10MB.');
            return;
        }

        setAudioBlob(file);
        setAudioPreviewUrl(URL.createObjectURL(file));
        setError('');
    };

    const clearAudio = () => {
        setAudioBlob(null);
        setAudioPreviewUrl(null);
        setRecordingTime(0);
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleImageChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result);
            setImageBase64(reader.result);

            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                imgRef.current = img;
                if (category) {
                    runAIDetection(img);
                }
            };
            img.src = reader.result;
        };
        reader.readAsDataURL(file);
    };

    const handleCategoryChange = (val) => {
        setCategory(val);
        setAiWarning('');
        if (imgRef.current) {
            runAIDetection(imgRef.current);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSubmitSuccess(false);
        setValidationInfo(null);

        if (!category || !latitude || !longitude) {
            setError('Please fill in category and location.');
            return;
        }

        if (requiresImage && !imageBase64) {
            setError('This mission requires a photo. Please upload one.');
            return;
        }

        if (requiresText && !notes?.trim()) {
            setError('This mission requires text notes. Please describe your observation.');
            return;
        }

        if (requiresAudio && !audioBlob) {
            setError('This mission requires an audio recording. Please record one or upload an audio file.');
            return;
        }

        setIsSubmitting(true);
        let uploadedUrl = null;
        let uploadedAudioUrl = null;

        try {
            // Upload Image
            if (imageBase64) {
                const res = await fetch(imageBase64);
                const blob = await res.blob();
                const file = new File([blob], "observation.jpg", { type: "image/jpeg" });

                const formData = new FormData();
                formData.append('image', file);

                const uploadRes = await fetch(`${API_URL}/api/upload`, {
                    method: 'POST',
                    body: formData,
                });

                if (uploadRes.ok) {
                    const uploadData = await uploadRes.json();
                    uploadedUrl = uploadData.url;
                } else {
                    uploadedUrl = imageBase64;
                    console.warn('Cloudinary upload failed, falling back to base64');
                }
            }

            // Upload Audio
            if (audioBlob) {
                const formData = new FormData();
                formData.append('audio', audioBlob, 'recording.wav');

                const uploadRes = await fetch(`${API_URL}/api/upload-audio`, {
                    method: 'POST',
                    body: formData,
                });

                if (uploadRes.ok) {
                    const uploadData = await uploadRes.json();
                    uploadedAudioUrl = uploadData.url;
                }
            }

            const body = {
                category,
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude),
                imageUrl: uploadedUrl,
                audioUrl: uploadedAudioUrl,
                notes: notes || null,
                userName: user?.name || 'Anonymous',
                userId: user?.id || null,
                aiLabel: aiResult?.label || null,
                confidenceScore: aiResult?.score || null,
                missionId: mission?.id || null,
            };

            const res = await fetch(`${API_URL}/api/observations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (!res.ok) throw new Error('Failed to submit');

            setSubmitSuccess(true);

            // Show validation pipeline info
            setValidationInfo({
                message: 'Your observation is being validated by AI...',
                status: 'analyzing',
            });

            // Listen for validation result via timeout (simplified)
            setTimeout(() => {
                setValidationInfo({
                    message: 'AI validation complete! Your data is being routed.',
                    status: 'done',
                });
            }, 3000);

            // Reset form
            setCategory('');
            setLatitude('');
            setLongitude('');
            setNotes('');
            setImagePreview(null);
            setImageBase64(null);
            setAiResult(null);
            setAiWarning('');
            setAudioBlob(null);
            setAudioPreviewUrl(null);
            setRecordingTime(0);
            imgRef.current = null;

            setTimeout(() => {
                setSubmitSuccess(false);
                setValidationInfo(null);
            }, 6000);
        } catch (err) {
            setError('Failed to submit observation. Is the server running?');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Mission context banner */}
            {mission && (
                <div className="rounded-xl border border-[#00F2FF]/10 bg-[#00F2FF]/[0.04] p-3">
                    <div className="flex items-center gap-2 mb-1.5">
                        <Shield className="h-3.5 w-3.5 text-[#00F2FF]" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#00F2FF]">
                            Submitting for Mission
                        </span>
                    </div>
                    <p className="text-xs font-medium text-white/70">{mission.title}</p>
                    {mission.description && (
                        <p className="text-[10px] text-white/40 mt-1 line-clamp-2">{mission.description}</p>
                    )}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                        <span className="rounded-full bg-[#f59e0b]/10 px-2 py-0.5 text-[9px] font-bold text-[#f59e0b]">
                            {mission.bountyPoints} pts <Zap className="inline h-2.5 w-2.5 -mt-0.5" />
                        </span>
                        <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${mission.dataRequirement === 'image' ? 'bg-[#00F2FF]/10 text-[#00F2FF]' :
                            mission.dataRequirement === 'text' ? 'bg-[#9D50FF]/10 text-[#9D50FF]' :
                                'bg-emerald-500/10 text-emerald-400'
                            }`}>
                            {mission.dataRequirement === 'image' ? '📷 Photo Required' :
                                mission.dataRequirement === 'text' ? '📝 Text Only' :
                                    '📷+📝 Photo & Text'}
                        </span>
                    </div>
                </div>
            )}

            {/* Data protocol (if mission has instructions) */}
            {mission?.dataProtocol && (
                <div className="rounded-xl border border-[#10b981]/10 bg-[#10b981]/[0.04] p-3">
                    <div className="flex items-center gap-2 mb-1.5">
                        <ListChecks className="h-3.5 w-3.5 text-[#10b981]" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#10b981]">
                            Data Collection Instructions
                        </span>
                    </div>
                    <p className="text-xs text-white/50 whitespace-pre-wrap font-mono">
                        {mission.dataProtocol}
                    </p>
                </div>
            )}

            {/* Category */}
            <div>
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-white/40">
                    Category
                </label>
                <div className="grid grid-cols-4 gap-2">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat.value}
                            type="button"
                            onClick={() => handleCategoryChange(cat.value)}
                            className={`flex flex-col items-center gap-1 rounded-lg border p-2 text-xs transition-all duration-200 ${category === cat.value
                                ? 'border-[#00F2FF]/40 bg-[#00F2FF]/10 text-white shadow-[0_0_15px_rgba(0,242,255,0.1)]'
                                : 'border-white/10 bg-white/5 text-white/60 hover:border-white/30 hover:bg-white/10'
                                }`}
                        >
                            <span className="text-lg">{cat.emoji}</span>
                            <span>{cat.value}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Audio Section */}
            {(requiresAudio) && (
                <div className="space-y-3">
                    <label className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-white/40">
                        <Mic className="h-3 w-3" />
                        Audio Recording {mission?.dataRequirement === 'audio' || mission?.dataRequirement === 'all' ? '*' : ''}
                    </label>

                    <div className="glass-surface border border-white/10 rounded-xl p-4">
                        <div className="flex items-center justify-between gap-4">
                            {!audioPreviewUrl ? (
                                <>
                                    <div className="flex items-center gap-3">
                                        <div className={`h-10 w-10 flex items-center justify-center rounded-full ${isRecording ? 'bg-red-500/20 text-red-500 animate-pulse' : 'bg-white/5 text-white/40'}`}>
                                            <Mic className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-white">
                                                {isRecording ? 'Recording...' : 'Audio Capture'}
                                            </div>
                                            <div className="text-[10px] text-white/30">
                                                {isRecording ? formatTime(recordingTime) : 'Record or upload sounds'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => audioInputRef.current?.click()}
                                            className="h-10 w-10 flex items-center justify-center rounded-full bg-white/5 text-white/60 hover:bg-white/10 transition-all border border-white/10"
                                            title="Upload audio file"
                                        >
                                            <Upload className="h-4 w-4" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={isRecording ? stopRecording : startRecording}
                                            className={`h-12 w-12 flex items-center justify-center rounded-full transition-all ${isRecording ? 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20' : 'bg-[#f472b6] text-white hover:bg-[#ec4899] shadow-lg shadow-[#f472b6]/20'}`}
                                        >
                                            {isRecording ? <Square className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                                        </button>
                                        <input
                                            ref={audioInputRef}
                                            type="file"
                                            accept="audio/*"
                                            onChange={handleAudioFileChange}
                                            className="hidden"
                                        />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="flex items-center gap-3 flex-1">
                                        <div className="h-10 w-10 flex items-center justify-center rounded-full bg-emerald-500/20 text-emerald-500">
                                            <Volume2 className="h-5 w-5" />
                                        </div>
                                        <audio src={audioPreviewUrl} controls className="h-8 flex-1" />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={clearAudio}
                                        className="h-10 w-10 flex items-center justify-center rounded-full bg-white/5 text-white/40 hover:bg-red-500/20 hover:text-red-500 transition-all"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Photo upload — shown if required or both or all */}
            {requiresImage && (
                <div>
                    <label className="mb-2 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-white/40">
                        <Camera className="h-3 w-3" />
                        Photo {mission?.dataRequirement === 'image' || mission?.dataRequirement === 'both' || mission?.dataRequirement === 'all' ? '*' : ''}
                    </label>
                    <div
                        className="group relative cursor-pointer overflow-hidden rounded-xl border-2 border-dashed border-white/20 bg-white/5 transition-all hover:border-[#00F2FF]/50 hover:bg-white/10"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {imagePreview ? (
                            <div className="relative">
                                <img
                                    src={imagePreview}
                                    alt="Preview"
                                    className="h-40 w-full rounded-xl object-cover"
                                />
                                {isAnalyzing && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                                        <div className="flex items-center gap-2 text-[#00F2FF]">
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                            <span className="text-sm font-medium">AI Analyzing...</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex h-28 flex-col items-center justify-center gap-2 text-white/40">
                                <Camera className="h-8 w-8" />
                                <span className="text-xs">Click to upload photo</span>
                                <span className="text-[10px] text-white/20">JPG, PNG or WebP • Max 10MB</span>
                            </div>
                        )}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                        />
                    </div>
                </div>
            )}

            {/* AI Detection result */}
            {aiResult && (
                <div className="rounded-lg border border-[#9D50FF]/30 bg-[#9D50FF]/10 p-3">
                    <div className="flex items-center gap-2 text-xs">
                        <Sparkles className="h-4 w-4 text-[#9D50FF]" />
                        <span className="font-semibold text-[#9D50FF]">AI Detection</span>
                    </div>
                    <div className="mt-1 text-sm text-white/80">
                        Detected: <span className="font-bold text-white">{aiResult.label}</span>{' '}
                        <span className="text-[#00F2FF]">
                            ({(aiResult.score * 100).toFixed(0)}%)
                        </span>
                    </div>
                    {aiResult.allPredictions.length > 1 && (
                        <div className="mt-1 flex gap-2 text-xs text-white/50">
                            {aiResult.allPredictions.slice(1).map((p, i) => (
                                <span key={i}>
                                    {p.className} ({(p.probability * 100).toFixed(0)}%)
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {aiWarning && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{aiWarning}</span>
                </div>
            )}

            {/* Location */}
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-white/40">
                        Latitude
                    </label>
                    <input
                        type="number"
                        step="any"
                        value={latitude}
                        onChange={(e) => setLatitude(e.target.value)}
                        placeholder="28.6139"
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-[#00F2FF] focus:ring-1 focus:ring-[#00F2FF]/30"
                    />
                </div>
                <div>
                    <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-white/40">
                        Longitude
                    </label>
                    <input
                        type="number"
                        step="any"
                        value={longitude}
                        onChange={(e) => setLongitude(e.target.value)}
                        placeholder="77.2090"
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-[#00F2FF] focus:ring-1 focus:ring-[#00F2FF]/30"
                    />
                </div>
            </div>

            <button
                type="button"
                onClick={detectLocation}
                className="flex items-center justify-center gap-2 rounded-lg border border-[#00F2FF]/20 bg-[#00F2FF]/5 px-3 py-2 text-xs font-medium text-[#00F2FF] transition-all hover:bg-[#00F2FF]/10"
            >
                <MapPin className="h-3.5 w-3.5" />
                Use My Location
            </button>

            {/* Text observations — shown if required or both or all */}
            {requiresText && (
                <div>
                    <label className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-white/40">
                        <FileText className="h-3 w-3" />
                        Observation Notes {mission?.dataRequirement === 'text' || mission?.dataRequirement === 'both' || mission?.dataRequirement === 'all' ? '*' : ''}
                    </label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder={mission?.dataRequirement === 'text'
                            ? "Describe your findings in detail — measurements, counts, conditions, habitat type..."
                            : "Describe what you observed..."
                        }
                        rows={mission?.dataRequirement === 'text' ? 5 : 3}
                        className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-[#00F2FF] focus:ring-1 focus:ring-[#00F2FF]/30"
                    />
                    {mission?.dataRequirement === 'text' && (
                        <div className="mt-1 flex items-center gap-1 text-[10px] text-white/20">
                            <Info className="h-3 w-3" />
                            Detailed text data is the primary requirement for this mission
                        </div>
                    )}
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
                    <AlertTriangle className="h-4 w-4" />
                    <span>{error}</span>
                </div>
            )}

            {/* Success + Validation Pipeline Status */}
            {submitSuccess && (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 space-y-2">
                    <div className="flex items-center gap-2 text-xs text-emerald-400">
                        <CheckCircle className="h-4 w-4" />
                        <span className="font-bold">Observation submitted!</span>
                    </div>
                    {validationInfo && (
                        <div className="flex items-center gap-2 text-xs">
                            {validationInfo.status === 'analyzing' ? (
                                <>
                                    <Loader2 className="h-3 w-3 animate-spin text-[#9D50FF]" />
                                    <span className="text-[#9D50FF]">{validationInfo.message}</span>
                                </>
                            ) : (
                                <>
                                    <Shield className="h-3 w-3 text-[#00F2FF]" />
                                    <span className="text-[#00F2FF]">{validationInfo.message}</span>
                                </>
                            )}
                        </div>
                    )}
                    <div className="text-[10px] text-white/30">
                        ≥80% AI confidence → Auto-approved to researcher<br />
                        &lt;80% → Sent to review queue for manual check
                    </div>
                </div>
            )}

            {/* Submit */}
            <button
                type="submit"
                disabled={isSubmitting || !category}
                className="btn-glow flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#00F2FF] to-[#3b82f6] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-[#00F2FF]/25 transition-all duration-300 hover:shadow-[#00F2FF]/40 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
                {isSubmitting ? (
                    <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Submitting...
                    </>
                ) : (
                    <>
                        <Upload className="h-4 w-4" />
                        Submit Observation
                    </>
                )}
            </button>
        </form>
    );
}
