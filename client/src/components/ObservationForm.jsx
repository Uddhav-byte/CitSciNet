'use client';

import { useState, useMemo } from 'react';
import { Droplets, Bird, Wind, Leaf, AlertTriangle, CheckCircle } from 'lucide-react';

const MISSION_PROTOCOLS = {
    Water: {
        icon: Droplets,
        color: '#3b82f6',
        fields: [
            { name: 'ph', label: 'pH Level', type: 'number', min: 0, max: 14, step: 0.1, unit: 'pH', required: true },
            { name: 'turbidity', label: 'Turbidity', type: 'select', options: ['Clear', 'Slightly Cloudy', 'Cloudy', 'Very Cloudy', 'Opaque'], required: true },
            { name: 'temperature', label: 'Water Temp', type: 'number', min: -5, max: 50, step: 0.5, unit: '°C' },
            { name: 'waterBodyType', label: 'Water Body', type: 'select', options: ['River', 'Lake', 'Pond', 'Stream', 'Wetland', 'Ocean', 'Other'], required: true },
            { name: 'depth', label: 'Depth (if applicable)', type: 'number', min: 0, max: 1000, step: 0.1, unit: 'm', dependsOn: { field: 'waterBodyType', notValues: ['Wetland'] } },
            { name: 'dissolvedOxygen', label: 'Dissolved Oxygen', type: 'number', min: 0, max: 20, step: 0.1, unit: 'mg/L' },
            { name: 'wildlife', label: 'Wildlife Observed', type: 'text', placeholder: 'e.g., Fish, Frogs, Birds nearby' },
        ],
    },
    Wildlife: {
        icon: Bird,
        color: '#a855f7',
        fields: [
            { name: 'speciesName', label: 'Species Name', type: 'text', placeholder: 'Common or scientific name', required: true },
            { name: 'count', label: 'Count', type: 'number', min: 1, max: 10000, step: 1, required: true },
            { name: 'behavior', label: 'Behavior', type: 'select', options: ['Feeding', 'Resting', 'Flying', 'Nesting', 'Calling', 'Moving', 'Other'], required: true },
            { name: 'habitat', label: 'Habitat', type: 'select', options: ['Forest', 'Grassland', 'Wetland', 'Urban', 'Agricultural', 'Aquatic', 'Coastal', 'Mountain'] },
            { name: 'healthStatus', label: 'Health', type: 'select', options: ['Healthy', 'Injured', 'Dead', 'Unknown'] },
            { name: 'age', label: 'Age Class', type: 'select', options: ['Juvenile', 'Sub-adult', 'Adult', 'Unknown'] },
        ],
    },
    Air: {
        icon: Wind,
        color: '#f59e0b',
        fields: [
            { name: 'airQualityIndex', label: 'AQI (if known)', type: 'number', min: 0, max: 500, step: 1 },
            { name: 'visibility', label: 'Visibility', type: 'select', options: ['Excellent (>10km)', 'Good (5-10km)', 'Moderate (2-5km)', 'Poor (1-2km)', 'Very Poor (<1km)'], required: true },
            { name: 'odor', label: 'Odor', type: 'select', options: ['None', 'Slight', 'Moderate', 'Strong', 'Overwhelming'] },
            { name: 'smokeSources', label: 'Smoke/Pollution Sources', type: 'text', placeholder: 'e.g., Factory, Traffic, Burning' },
            { name: 'windSpeed', label: 'Wind', type: 'select', options: ['Calm', 'Light Breeze', 'Moderate', 'Strong', 'Gale'] },
            { name: 'cloudCover', label: 'Cloud Cover', type: 'select', options: ['Clear', '25%', '50%', '75%', 'Overcast'] },
        ],
    },
    Plant: {
        icon: Leaf,
        color: '#10b981',
        fields: [
            { name: 'speciesName', label: 'Species Name', type: 'text', placeholder: 'Common or scientific name', required: true },
            { name: 'growthStage', label: 'Growth Stage', type: 'select', options: ['Seed/Seedling', 'Vegetative', 'Flowering', 'Fruiting', 'Dormant', 'Dead'], required: true },
            { name: 'height', label: 'Height', type: 'number', min: 0, max: 200, step: 0.1, unit: 'm' },
            { name: 'canopyCover', label: 'Canopy Cover', type: 'select', options: ['<25%', '25-50%', '50-75%', '>75%'] },
            { name: 'healthStatus', label: 'Health', type: 'select', options: ['Healthy', 'Stressed', 'Diseased', 'Dead'] },
            { name: 'invasive', label: 'Potentially Invasive?', type: 'select', options: ['No', 'Possibly', 'Yes', 'Unknown'] },
            { name: 'soilType', label: 'Soil Type', type: 'select', options: ['Sandy', 'Clay', 'Loam', 'Rocky', 'Organic/Peat', 'Unknown'] },
        ],
    },
};

function validateField(field, value, formData) {
    if (field.required && (value === '' || value === null || value === undefined)) {
        return `${field.label} is required`;
    }

    if (field.type === 'number' && value !== '' && value !== null && value !== undefined) {
        const num = parseFloat(value);
        if (isNaN(num)) return `${field.label} must be a number`;
        if (field.min !== undefined && num < field.min) return `${field.label} must be ≥ ${field.min}`;
        if (field.max !== undefined && num > field.max) return `${field.label} must be ≤ ${field.max}`;
    }

    // Cross-field checks
    if (field.dependsOn) {
        const depValue = formData[field.dependsOn.field];
        if (field.dependsOn.notValues && field.dependsOn.notValues.includes(depValue) && value) {
            return `${field.label} not applicable for ${depValue}`;
        }
    }

    return null;
}

export default function ObservationForm({ missionType = 'Wildlife', onSubmit, onCancel }) {
    const protocol = MISSION_PROTOCOLS[missionType];
    const [formData, setFormData] = useState({});
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});

    const activeFields = useMemo(() => {
        if (!protocol) return [];
        return protocol.fields.filter(field => {
            if (!field.dependsOn) return true;
            const depValue = formData[field.dependsOn.field];
            if (field.dependsOn.notValues) {
                return !field.dependsOn.notValues.includes(depValue);
            }
            return true;
        });
    }, [protocol, formData]);

    const handleChange = (fieldName, value) => {
        setFormData(prev => ({ ...prev, [fieldName]: value }));
        setTouched(prev => ({ ...prev, [fieldName]: true }));

        // Live validate
        const field = protocol?.fields.find(f => f.name === fieldName);
        if (field) {
            const error = validateField(field, value, { ...formData, [fieldName]: value });
            setErrors(prev => ({ ...prev, [fieldName]: error }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Validate all
        const newErrors = {};
        let hasErrors = false;
        activeFields.forEach(field => {
            const error = validateField(field, formData[field.name], formData);
            if (error) {
                newErrors[field.name] = error;
                hasErrors = true;
            }
        });
        setErrors(newErrors);
        setTouched(Object.fromEntries(activeFields.map(f => [f.name, true])));

        if (hasErrors) return;
        onSubmit?.({ missionType, protocolData: formData });
    };

    if (!protocol) {
        return <p className="text-xs text-white/40">Unknown mission type: {missionType}</p>;
    }

    const Icon = protocol.icon;

    return (
        <form onSubmit={handleSubmit} className="space-y-3">
            {/* Protocol header */}
            <div className="flex items-center gap-2 mb-4">
                <div
                    className="flex h-8 w-8 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${protocol.color}15` }}
                >
                    <Icon className="h-4 w-4" style={{ color: protocol.color }} />
                </div>
                <div>
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: protocol.color }}>
                        {missionType} Protocol
                    </span>
                    <p className="text-[10px] text-white/30">{activeFields.length} required fields</p>
                </div>
            </div>

            {/* Fields */}
            {activeFields.map((field) => {
                const error = touched[field.name] ? errors[field.name] : null;
                return (
                    <div key={field.name}>
                        <label className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-white/40">
                            {field.label}
                            {field.required && <span className="text-red-400">*</span>}
                            {field.unit && <span className="text-[#00F2FF]/50">({field.unit})</span>}
                        </label>

                        {field.type === 'select' ? (
                            <select
                                value={formData[field.name] || ''}
                                onChange={(e) => handleChange(field.name, e.target.value)}
                                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none transition-colors focus:border-[#00F2FF] focus:ring-1 focus:ring-[#00F2FF]/30"
                            >
                                <option value="">Select...</option>
                                {field.options.map(opt => (
                                    <option key={opt} value={opt} className="bg-[#151921] text-white">{opt}</option>
                                ))}
                            </select>
                        ) : field.type === 'number' ? (
                            <input
                                type="number"
                                value={formData[field.name] || ''}
                                onChange={(e) => handleChange(field.name, e.target.value)}
                                min={field.min}
                                max={field.max}
                                step={field.step}
                                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none transition-colors focus:border-[#00F2FF] focus:ring-1 focus:ring-[#00F2FF]/30 font-mono"
                                placeholder={field.min !== undefined ? `${field.min} — ${field.max}` : ''}
                            />
                        ) : (
                            <input
                                type="text"
                                value={formData[field.name] || ''}
                                onChange={(e) => handleChange(field.name, e.target.value)}
                                placeholder={field.placeholder || ''}
                                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none transition-colors focus:border-[#00F2FF] focus:ring-1 focus:ring-[#00F2FF]/30"
                            />
                        )}

                        {error && (
                            <div className="mt-1 flex items-center gap-1 text-[10px] text-red-400">
                                <AlertTriangle className="h-3 w-3" />
                                {error}
                            </div>
                        )}
                    </div>
                );
            })}

            {/* Buttons */}
            <div className="flex gap-2 pt-2">
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="flex-1 rounded-lg border border-white/10 bg-white/5 py-2 text-xs font-medium text-white/60 transition hover:bg-white/10"
                    >
                        Cancel
                    </button>
                )}
                <button
                    type="submit"
                    className="btn-glow flex-1 rounded-lg bg-gradient-to-r from-[#00F2FF] to-[#3b82f6] py-2 text-xs font-bold text-white transition"
                >
                    Submit Protocol Data
                </button>
            </div>
        </form>
    );
}

export { MISSION_PROTOCOLS };
