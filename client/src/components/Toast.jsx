'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, X } from 'lucide-react';

export default function Toast({ message, show, onClose, duration = 3500 }) {
    useEffect(() => {
        if (show) {
            const timer = setTimeout(onClose, duration);
            return () => clearTimeout(timer);
        }
    }, [show, onClose, duration]);

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ y: -40, opacity: 0, scale: 0.95 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: -20, opacity: 0, scale: 0.95 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                    className="fixed top-6 left-1/2 z-[5000] -translate-x-1/2"
                >
                    <div
                        className="flex items-center gap-2.5 rounded-xl px-5 py-3 shadow-2xl"
                        style={{
                            background: 'rgba(21, 25, 33, 0.95)',
                            backdropFilter: 'blur(16px)',
                            border: '1px solid rgba(0, 242, 255, 0.15)',
                            boxShadow: '0 0 30px rgba(0, 242, 255, 0.1)',
                        }}
                    >
                        <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                        <span className="text-sm font-medium text-white">{message}</span>
                        <button
                            onClick={onClose}
                            className="ml-2 rounded p-0.5 text-white/30 hover:text-white/60"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
