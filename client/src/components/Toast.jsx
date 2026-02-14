'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';

export default function Toast({ message, show, onClose, duration = 3000 }) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (show) {
            setVisible(true);
            const timer = setTimeout(() => {
                setVisible(false);
                setTimeout(() => onClose?.(), 300);
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [show, duration, onClose]);

    if (!show && !visible) return null;

    return (
        <div
            className={`fixed top-6 left-1/2 z-[9999] -translate-x-1/2 transition-all duration-300 ${visible
                    ? 'translate-y-0 opacity-100'
                    : '-translate-y-4 opacity-0'
                }`}
        >
            <div className="flex items-center gap-3 rounded-2xl border border-green-500/30 bg-gray-900/95 px-5 py-3 shadow-2xl shadow-green-500/10 backdrop-blur-xl">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/20">
                    <CheckCircle2 className="h-4 w-4 text-green-400" />
                </div>
                <span className="text-sm font-medium text-white">{message}</span>
                <button
                    onClick={() => {
                        setVisible(false);
                        setTimeout(() => onClose?.(), 300);
                    }}
                    className="ml-2 rounded-lg p-1 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
                >
                    <X className="h-3.5 w-3.5" />
                </button>
            </div>
        </div>
    );
}
