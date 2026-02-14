'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
    persist(
        (set, get) => ({
            user: null,
            users: [], // mock user database

            isAuthenticated: () => !!get().user,

            signup: (email, password, role, name) => {
                const { users } = get();
                const exists = users.find((u) => u.email === email);
                if (exists) {
                    return { success: false, error: 'Email already registered' };
                }

                const newUser = {
                    id: crypto.randomUUID(),
                    email,
                    password,
                    role,
                    name: name || email.split('@')[0],
                    createdAt: new Date().toISOString(),
                };

                set({
                    users: [...users, newUser],
                    user: { id: newUser.id, email: newUser.email, role: newUser.role, name: newUser.name },
                });

                return { success: true };
            },

            login: (email, password) => {
                const { users } = get();
                const found = users.find(
                    (u) => u.email === email && u.password === password
                );

                if (!found) {
                    return { success: false, error: 'Invalid email or password' };
                }

                set({
                    user: { id: found.id, email: found.email, role: found.role, name: found.name },
                });

                return { success: true, role: found.role };
            },

            logout: () => {
                set({ user: null });
            },
        }),
        {
            name: 'citsci-auth',
            partialize: (state) => ({
                user: state.user,
                users: state.users,
            }),
        }
    )
);

export default useAuthStore;
