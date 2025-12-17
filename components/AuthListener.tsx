'use client';

import { useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useLibraryStore } from '@/store/useLibraryStore';
import { useRouter } from 'next/navigation';

export function AuthListener() {
    const supabase = createClient();
    const syncWithCloud = useLibraryStore((state) => state.syncWithCloud);
    const router = useRouter();

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session) {
                console.log("AuthListener: SIGNED_IN", session.user.email);
                // Trigger Store Sync
                await syncWithCloud(session.user);
            } else if (event === 'SIGNED_OUT') {
                console.log("AuthListener: SIGNED_OUT");
                // Hard redirect to login to ensure clean state
                window.location.href = '/login';
            }
        });

        // Initial Check
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                console.log("AuthListener: Initial Session Found", session.user.email);
                syncWithCloud(session.user);
            }
        });

        return () => subscription.unsubscribe();
    }, [supabase, syncWithCloud, router]);

    return null; // Invisible Component
}
