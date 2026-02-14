import { create } from 'zustand';

const useMissionStore = create((set, get) => ({
    missions: [],
    activeMission: null,
    acceptedMissionIds: new Set(),

    setMissions: (missions) => set({ missions }),

    addMission: (mission) =>
        set((state) => ({
            missions: [mission, ...state.missions],
        })),

    setActiveMission: (mission) => set({ activeMission: mission }),

    clearActiveMission: () => set({ activeMission: null }),

    markAccepted: (missionId) =>
        set((state) => {
            const newSet = new Set(state.acceptedMissionIds);
            newSet.add(missionId);
            return { acceptedMissionIds: newSet };
        }),

    isAccepted: (missionId) => get().acceptedMissionIds.has(missionId),
}));

export default useMissionStore;
