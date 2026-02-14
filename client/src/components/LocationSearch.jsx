'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, MapPin, Loader2, X, Globe } from 'lucide-react';

export default function LocationSearch({ onLocationSelect }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const inputRef = useRef(null);
    const dropdownRef = useRef(null);
    const debounceRef = useRef(null);

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target) &&
                inputRef.current && !inputRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const searchPlace = useCallback(async (q) => {
        if (q.length < 3) { setResults([]); setOpen(false); return; }
        setLoading(true);
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=6&addressdetails=1`,
                { headers: { 'Accept-Language': 'en' } }
            );
            const data = await res.json();
            setResults(data.map(r => ({
                id: r.place_id,
                name: r.display_name,
                lat: parseFloat(r.lat),
                lng: parseFloat(r.lon),
                type: r.type,
                importance: r.importance,
            })));
            setOpen(true);
        } catch {
            setResults([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleInput = (e) => {
        const val = e.target.value;
        setQuery(val);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => searchPlace(val), 400);
    };

    const handleSelect = (result) => {
        setQuery(result.name.split(',').slice(0, 2).join(','));
        setOpen(false);
        onLocationSelect?.(result);
    };

    const clear = () => {
        setQuery('');
        setResults([]);
        setOpen(false);
        inputRef.current?.focus();
    };

    return (
        <div className="relative z-[1000]">
            {/* Search input */}
            <div
                className="flex items-center gap-2 rounded-xl border border-white/[0.08] px-3 py-2"
                style={{ background: 'rgba(11,14,20,0.9)', backdropFilter: 'blur(20px)' }}
            >
                {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-[#00F2FF]" />
                ) : (
                    <Search className="h-4 w-4 text-white/30" />
                )}
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={handleInput}
                    onFocus={() => results.length > 0 && setOpen(true)}
                    placeholder="Search any place... (e.g. 'Patna', 'River Ganga')"
                    className="flex-1 bg-transparent text-xs text-white/80 placeholder-white/25 outline-none"
                    style={{ minWidth: '220px' }}
                />
                {query && (
                    <button onClick={clear} className="text-white/20 hover:text-white/50">
                        <X className="h-3.5 w-3.5" />
                    </button>
                )}
            </div>

            {/* Dropdown results */}
            {open && results.length > 0 && (
                <div
                    ref={dropdownRef}
                    className="absolute top-full left-0 right-0 mt-1 overflow-hidden rounded-xl border border-white/[0.08]"
                    style={{
                        background: 'rgba(11,14,20,0.95)',
                        backdropFilter: 'blur(20px)',
                        animation: 'fadeSlideIn 0.2s ease both',
                        maxHeight: '280px',
                        overflowY: 'auto',
                    }}
                >
                    {results.map((r, i) => (
                        <button
                            key={r.id || i}
                            onClick={() => handleSelect(r)}
                            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-[#00F2FF]/[0.06]"
                        >
                            <MapPin className="h-3.5 w-3.5 shrink-0 text-[#00F2FF]/60" />
                            <div className="min-w-0 flex-1">
                                <div className="truncate text-xs text-white/70">{r.name}</div>
                                <div className="text-[10px] text-white/25 font-mono">
                                    {r.lat.toFixed(4)}, {r.lng.toFixed(4)}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
