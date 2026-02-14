'use client';

import { useEffect } from 'react';
import { io } from 'socket.io-client';
import useObservationStore from '../store/useObservationStore';
import useMissionStore from '../store/useMissionStore';

let socket = null;

export function getSocket() {
    if (!socket) {
        socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000', {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
        });
    }
    return socket;
}

export default function SocketProvider({ children }) {
    const addObservation = useObservationStore((s) => s.addObservation);
    const removeObservation = useObservationStore((s) => s.removeObservation);
    const setConnected = useObservationStore((s) => s.setConnected);
    const setClientCount = useObservationStore((s) => s.setClientCount);
    const addMission = useMissionStore((s) => s.addMission);

    useEffect(() => {
        const s = getSocket();

        s.on('connect', () => {
            setConnected(true);
        });

        s.on('disconnect', () => {
            setConnected(false);
        });

        s.on('new-observation', (observation) => {
            addObservation(observation);
        });

        s.on('delete-observation', (id) => {
            removeObservation(id);
        });

        s.on('client-count', (count) => {
            setClientCount(count);
        });

        s.on('new-mission', (mission) => {
            addMission(mission);
        });

        return () => {
            s.off('connect');
            s.off('disconnect');
            s.off('new-observation');
            s.off('delete-observation');
            s.off('client-count');
            s.off('new-mission');
        };
    }, [addObservation, removeObservation, setConnected, setClientCount, addMission]);

    return children;
}
