'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useLibraryStore } from '@/store/useLibraryStore';

export function DebugStatus() {
    const [sessionEmail, setSessionEmail] = useState<string | null>('loading...');
    const storeUser = useLibraryStore((state) => state.user);
    const syncWithCloud = useLibraryStore((state) => state.syncWithCloud);
    const [supabase] = useState(() => createClient());

    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setSessionEmail(session?.user?.email || 'NO_SESSION');
        };

        checkSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSessionEmail(session?.user?.email || 'NO_SESSION');
        });

        return () => subscription.unsubscribe();
    }, [supabase]);

    const handleForceSync = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            await syncWithCloud(session.user);
        } else {
            alert("No session found in Supabase to sync from.");
        }
    };

    return (
        <div className="fixed bottom-20 left-4 z-50 bg-black/80 text-white p-4 rounded-xl text-xs font-mono max-w-xs backdrop-blur-md border border-white/10 shadow-2xl">
            <h3 className="font-bold text-emerald-400 mb-2 uppercase tracking-wider">Debug Status</h3>
            <div className="flex flex-col gap-1 mb-3">
                <div className="flex justify-between">
                    <span className="text-zinc-400">Supabase:</span>
                    <span className={sessionEmail === 'NO_SESSION' ? 'text-red-400' : 'text-emerald-300'}>
                        {sessionEmail}
                    </span>
                </div>
                <div className="flex justify-between">
                    <span className="text-zinc-400">Store:</span>
                    <span className={!storeUser.email ? 'text-red-400' : 'text-emerald-300'}>
                        {storeUser.email || 'EMPTY'}
                    </span>
                </div>
                <div className="flex justify-between">
                    <span className="text-zinc-400">Name:</span>
                    <span>{storeUser.name}</span>
                </div>
            </div>

            <button
                onClick={handleForceSync}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-lg font-bold transition-colors"
            >
                Force Sync Data
            </button>
        </div>
    );
}
