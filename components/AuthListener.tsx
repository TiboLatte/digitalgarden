import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useLibraryStore } from '@/store/useLibraryStore';
import { useRouter } from 'next/navigation';

export function AuthListener() {
    const [supabase] = useState(() => createClient());
    const syncWithCloud = useLibraryStore((state) => state.syncWithCloud);
    const router = useRouter();

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log(`AuthListener: Event [${event}]`);
            if (event === 'SIGNED_IN' && session) {
                console.log("AuthListener: SIGNED_IN", session.user.email);
                await syncWithCloud(session.user);
            } else if (event === 'SIGNED_OUT') {
                console.log("AuthListener: SIGNED_OUT");
                window.location.href = '/login';
            } else if (event === 'INITIAL_SESSION' && session) {
                // Enhanced check for initial session
                console.log("AuthListener: INITIAL_SESSION", session.user.email);
                await syncWithCloud(session.user);
            }
        });

        // Manual Initial Check (Fallback)
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                console.log("AuthListener: Manual GetSession Found", session.user.email);
                syncWithCloud(session.user);
            } else {
                console.log("AuthListener: Manual GetSession returned NO session");
            }
        });

        return () => subscription.unsubscribe();
    }, [supabase, syncWithCloud, router]);

    return null;
}
