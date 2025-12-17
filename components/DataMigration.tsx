'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useLibraryStore } from '@/store/useLibraryStore';
import { Loader2, UploadCloud } from 'lucide-react';

export function DataMigration() {
    const supabase = createClient();
    const books = useLibraryStore(state => state.books);
    const notes = useLibraryStore(state => state.notes);
    const syncWithCloud = useLibraryStore(state => state.syncWithCloud);
    const [status, setStatus] = useState<'idle' | 'checking' | 'migrating' | 'done'>('idle');

    useEffect(() => {
        // 2. Listen for Auth Changes

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log(`DataMigration: Auth Event ${event}`);
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
                if (session?.user) {
                    console.log("DataMigration: Handling Auth Change Sync");
                    await handleSmartSync(session.user);
                }
            } else if (event === 'SIGNED_OUT') {
                console.log("DataMigration: Signed Out");
                syncWithCloud(); // Clears data via store logic
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const handleSmartSync = async (user: any) => {
        if (!user) return;

        // A. Fetch Cloud Data first
        // Pass the user object directly to bypass internal fetch issues
        await syncWithCloud(user);

        // B. Check if Cloud was empty but we have Old LocalStorage (Rescue Mission)
        const currentBooks = useLibraryStore.getState().books;
        if (currentBooks.length === 0) {
            const rawLocal = localStorage.getItem('digital-garden-storage');
            if (rawLocal) {
                try {
                    const parsed = JSON.parse(rawLocal);
                    const localBooks = parsed.state?.books || [];
                    const localNotes = parsed.state?.notes || [];

                    if (localBooks.length > 0) {
                        console.log("Found disconnected local data. Migrating to cloud...");
                        setStatus('migrating');
                        await uploadToCloud(user.id, localBooks, localNotes);
                        // Clear old storage to prevent re-migration
                        localStorage.removeItem('digital-garden-storage');
                        await syncWithCloud(); // Refresh with new cloud data
                        setStatus('done');
                    }
                } catch (e) {
                    console.error("Failed to parse old local storage", e);
                }
            }
        }
    };

    const uploadToCloud = async (userId: string, books: any[], notes: any[]) => {
        if (books.length > 0) {
            const booksPayload = books.map(b => ({
                id: b.id,
                user_id: userId,
                title: b.title,
                author: b.author,
                cover_url: b.coverUrl,
                page_count: b.pageCount,
                progress: b.progress,
                status: b.status,
                rating: b.rating,
                tags: b.tags,
                date_started: b.dateStarted,
                date_finished: b.dateFinished,
            }));
            const { error: bErr } = await supabase.from('books').insert(booksPayload);
            if (bErr) console.error("Book migration failed", bErr);
        }

        if (notes.length > 0) {
            const notesPayload = notes.map(n => ({
                id: n.id,
                user_id: userId,
                book_id: n.bookId,
                content: n.content,
                type: n.type,
                page_reference: n.pageReference,
                created_at: n.createdAt
            }));
            const { error: nErr } = await supabase.from('notes').insert(notesPayload);
            if (nErr) console.error("Note migration failed", nErr);
        }
    };

    if (status === 'migrating') {
        return (
            <div className="fixed bottom-4 right-4 bg-emerald-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-3 text-sm font-bold z-50 animate-in slide-in-from-bottom-5">
                <Loader2 size={16} className="animate-spin" />
                Rescuing your local garden & moving to cloud...
            </div>
        );
    }

    return null;
}
