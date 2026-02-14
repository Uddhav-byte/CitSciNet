'use client';

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'citsci-offline-queue';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export function useOfflineQueue() {
    const [queue, setQueue] = useState([]);
    const [isOnline, setIsOnline] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);

    // Load queue from localStorage on mount
    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) setQueue(JSON.parse(saved));
        } catch { }
    }, []);

    // Persist queue changes
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
        } catch { }
    }, [queue]);

    // Track online/offline status
    useEffect(() => {
        const goOnline = () => setIsOnline(true);
        const goOffline = () => setIsOnline(false);

        setIsOnline(navigator.onLine);
        window.addEventListener('online', goOnline);
        window.addEventListener('offline', goOffline);

        return () => {
            window.removeEventListener('online', goOnline);
            window.removeEventListener('offline', goOffline);
        };
    }, []);

    // Enqueue an observation for later sync
    const enqueue = useCallback((observation) => {
        const entry = {
            ...observation,
            _offlineId: `offline-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            _queuedAt: new Date().toISOString(),
        };
        setQueue(prev => [...prev, entry]);
        return entry;
    }, []);

    // Sync all queued items
    const syncAll = useCallback(async () => {
        if (queue.length === 0 || isSyncing || !isOnline) return;

        setIsSyncing(true);
        const synced = [];

        for (const item of queue) {
            try {
                const { _offlineId, _queuedAt, ...data } = item;
                const res = await fetch(`${API_URL}/api/observations`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                });

                if (res.ok) {
                    synced.push(_offlineId);
                }
            } catch {
                // Stop on first failure to maintain order
                break;
            }
        }

        setQueue(prev => prev.filter(item => !synced.includes(item._offlineId)));
        setIsSyncing(false);

        return synced.length;
    }, [queue, isSyncing, isOnline]);

    // Auto-sync when coming back online
    useEffect(() => {
        if (isOnline && queue.length > 0) {
            const timer = setTimeout(syncAll, 2000);
            return () => clearTimeout(timer);
        }
    }, [isOnline, queue.length, syncAll]);

    const clearQueue = useCallback(() => {
        setQueue([]);
        localStorage.removeItem(STORAGE_KEY);
    }, []);

    return {
        queue,
        pendingCount: queue.length,
        isOnline,
        isSyncing,
        enqueue,
        syncAll,
        clearQueue,
    };
}
