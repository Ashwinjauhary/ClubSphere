import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

interface AuthState {
    user: User | null;
    role: 'student' | 'admin' | 'dean' | 'super_admin' | null;
    managedClubId: string | null;
    loading: boolean;
    checkUser: () => Promise<void>;
    signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    role: null,
    managedClubId: null,
    loading: true,
    checkUser: async () => {
        try {
            set({ loading: true });
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                // 1. Fetch role
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single();

                const role = profile?.role || 'student';
                let managedClubId = null;

                // 2. If Admin, fetch their club
                if (role === 'admin') {
                    const { data: club } = await supabase
                        .from('clubs')
                        .select('id')
                        .eq('admin_id', user.id)
                        .maybeSingle(); // maybeSingle because they might be admin but not assigned a club yet

                    if (club) managedClubId = club.id;
                }

                set({ user, role, managedClubId });
            } else {
                set({ user: null, role: null, managedClubId: null });
            }
        } catch (error) {
            console.error('Auth check error:', error);
            set({ user: null, role: null, managedClubId: null });
        } finally {
            set({ loading: false });
        }
    },
    signOut: async () => {
        await supabase.auth.signOut();
        set({ user: null, role: null, managedClubId: null });
    }
}));
