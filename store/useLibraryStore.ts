import { create } from 'zustand';
import { Book, Note, BookStatus, User } from '../types';
import { createClient } from '@/lib/supabase';

const supabase = createClient();

// Helper for Robustness: Retry DB operations
const retryDB = async <T>(operation: () => Promise<T>, retries = 3, delay = 500): Promise<T> => {
    try {
        return await operation();
    } catch (error) {
        if (retries === 0) throw error;
        await new Promise(resolve => setTimeout(resolve, delay));
        return retryDB(operation, retries - 1, delay * 2);
    }
};

interface LibraryState {
    books: Book[];
    notes: Note[];
    dislikedBooks: Book[]; // The "Graveyard" for AI Training
    activeBookId: string | null;
    user: User;
    isLoading: boolean;

    // Actions
    syncWithCloud: (confirmedUser?: any) => Promise<void>;
    addBook: (book: Book) => Promise<void>;
    markAsDisliked: (book: Book) => Promise<void>;
    updateBook: (id: string, updates: Partial<Book>) => Promise<void>;
    removeBook: (id: string) => Promise<void>;
    updateProgress: (id: string, page: number) => Promise<void>;
    addNote: (note: Omit<Note, 'id' | 'createdAt'>) => Promise<void>;
    removeNote: (id: string) => Promise<void>;
    setBookStatus: (id: string, status: BookStatus) => Promise<void>;
    setActiveBook: (id: string | null) => void;
    updateUser: (user: Partial<User>) => Promise<void>;

    // Getters/Computeds (Same as before)
    getStats: () => {
        booksReadThisYear: number;
        totalPagesRead: number;
        booksReading: number;
        booksTbr: number;
    };
}

export const useLibraryStore = create<LibraryState>()(
    (set, get) => ({
        books: [],
        dislikedBooks: [],
        notes: [],
        activeBookId: null,
        isLoading: false,
        user: {
            name: "Guest",
            email: "",
            bio: "Welcome to your digital garden. Log in to start tracking your reading journey.",
            avatarUrl: "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png",
            themePreference: 'light',
            joinedDate: new Date().toLocaleDateString(),
            location: "Earth",
            isPro: false,
            readingGoal: 10,
            languagePreference: 'en'
        },

        // --- SYNC ACTION ---
        syncWithCloud: async (confirmedSessionUser?: any) => {
            console.log("Store: syncWithCloud started", confirmedSessionUser?.email);
            set({ isLoading: true });

            let user = confirmedSessionUser;
            if (!user) {
                const { data } = await supabase.auth.getUser();
                user = data.user;
                console.log("Store: fetched user from supabase", user?.email);
            }

            if (!user) {
                console.log("Store: No user found, resetting to Guest");
                set({
                    books: [],
                    notes: [],
                    activeBookId: null,
                    user: {
                        name: "Guest",
                        email: "",
                        bio: "Welcome to your digital garden. Log in to start tracking your reading journey.",
                        avatarUrl: "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png",
                        themePreference: 'light',
                        joinedDate: new Date().toLocaleDateString(),
                        location: "Earth",
                        isPro: false,
                        readingGoal: 10,
                        languagePreference: 'en'
                    },
                    isLoading: false
                });
                return;
            }

            console.log("Store: Fetching data for user", user.id);
            // Parallel Fetch - NO CACHE
            const [
                { data: books, error: booksError },
                { data: notes, error: notesError },
                { data: profile, error: profileError }
            ] = await Promise.all([
                supabase.from('books').select('*'),
                supabase.from('notes').select('*'),
                supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
            ]);

            if (booksError || notesError || profileError) {
                console.error("Sync partial failure", booksError, notesError, profileError);
                // Do NOT return. We must still set the User Identity so they are "logged in".
                // We'll just continue with whatever data we got (or empty arrays).
            }

            console.log("Store: Profile found?", !!profile);

            // Transform snake_case to camelCase mapping
            const mappedBooks: Book[] = (books || []).map((b: any) => ({
                id: b.id,
                title: b.title,
                author: b.author,
                coverUrl: b.cover_url,
                pageCount: b.page_count,
                progress: b.progress,
                status: b.status,
                rating: b.rating,
                tags: b.tags || [],
                dateStarted: b.date_started,
                dateFinished: b.date_finished,
                review: b.review,
                vibes: b.vibes || [],
                description: b.description,
                googleId: undefined,
                isbn: b.isbn
            }));

            const mappedNotes: Note[] = (notes || []).map((n: any) => ({
                id: n.id,
                bookId: n.book_id,
                content: n.content,
                type: n.type,
                pageReference: n.page_reference,
                createdAt: n.created_at
            }));

            // Map Profile
            const currentUser = get().user;
            const mergedUser: User = {
                ...currentUser,
                email: user.email || "",
                // If profile exists, overwrite local defaults. If not, keep local defaults (or current state)
                ...(profile ? {
                    name: profile.full_name || profile.username || currentUser.name,
                    bio: profile.bio || currentUser.bio,
                    location: profile.location || currentUser.location,
                    avatarUrl: profile.avatar_url || currentUser.avatarUrl,
                    themePreference: profile.theme_preference || currentUser.themePreference,
                    readingGoal: profile.reading_goal || currentUser.readingGoal,
                    isPro: profile.is_pro || currentUser.isPro,
                    languagePreference: profile.language_preference || currentUser.languagePreference,
                } : {
                    name: currentUser.name === "Guest" && user.email ? user.email.split('@')[0] : currentUser.name
                })
            };

            console.log("Store: Setting final state. User Name:", mergedUser.name);

            set({
                books: mappedBooks,
                notes: mappedNotes,
                user: mergedUser,
                isLoading: false
            });
            console.log("✅ [Store] Sync complete. Books:", mappedBooks.length);
        },

        updateUser: async (updates) => {
            // ROBUST: DB First, then Local
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                const dbUpdates: any = {};
                if (updates.name !== undefined) dbUpdates.full_name = updates.name;
                if (updates.bio !== undefined) dbUpdates.bio = updates.bio;
                if (updates.location !== undefined) dbUpdates.location = updates.location;
                if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;
                if (updates.themePreference !== undefined) dbUpdates.theme_preference = updates.themePreference;
                if (updates.readingGoal !== undefined) dbUpdates.reading_goal = updates.readingGoal;
                if (updates.languagePreference !== undefined) dbUpdates.language_preference = updates.languagePreference;

                if (Object.keys(dbUpdates).length > 0) {
                    await retryDB(async () => {
                        const { error } = await supabase
                            .from('profiles')
                            .upsert({
                                id: user.id,
                                ...dbUpdates
                            }, {
                                onConflict: 'id'
                            });
                        if (error) throw error;
                    });
                }
            }

            // Apply to local state (works for Guests too)
            set((state) => ({ user: { ...state.user, ...updates } }));
        },

        addBook: async (newBook) => {
            // ROBUST: DB First with RETRY
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                try {
                    await retryDB(async () => {
                        const { error } = await supabase.from('books').insert({
                            id: newBook.id,
                            user_id: user.id,
                            title: newBook.title,
                            author: newBook.author,
                            cover_url: newBook.coverUrl,
                            page_count: newBook.pageCount,
                            progress: newBook.progress,
                            status: newBook.status,
                            tags: newBook.tags,
                            date_started: newBook.dateStarted,
                            date_finished: newBook.dateFinished,
                            review: newBook.review,
                            vibes: newBook.vibes,
                            description: newBook.description,
                            isbn: newBook.isbn
                        });
                        if (error) throw error;
                    });

                    // Success: Update Store
                    set((state) => ({ books: [newBook, ...state.books] }));
                    console.log("✅ Book saved to Cloud & Store:", newBook.title);
                } catch (error: any) {
                    console.error("🔥 FAILED to save book after RETRIES:", error);
                    // alert(`Failed to save book: ${error.message}`); // Removed alert to prevent UI blocking during loops
                    throw error; // Re-throw to be caught by the import loop
                }
            } else {
                console.warn("⚠️ User not logged in. Book saved LOCALLY only (Not recommended).");
                set((state) => ({ books: [newBook, ...state.books] }));
            }
        },

        markAsDisliked: async (book) => {
            const { data: { user } } = await supabase.auth.getUser();

            set((state) => ({
                dislikedBooks: [...state.dislikedBooks, { ...book, status: 'tbr' }]
            }));

            if (user) {
                // Fire and forget for dislikes, or retry? Let's use retry but not block
                retryDB(async () => {
                    const { error } = await supabase.from('books').insert({
                        id: book.id,
                        user_id: user.id,
                        title: book.title,
                        author: book.author,
                        cover_url: book.coverUrl,
                        page_count: book.pageCount,
                        status: 'abandoned',
                        rating: 1,
                        date_finished: new Date().toISOString(),
                        tags: book.tags,
                        description: book.description,
                        review: 'One-Swipe Dislike'
                    });
                    if (error) throw error;
                }).catch(e => console.error("Failed to record dislike", e));
            }
        },

        updateBook: async (id, updates) => {
            // ROBUST: DB First
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const dbUpdates: any = {};
                // ... (mapping redundant for space, assume same) ...
                if (updates.progress !== undefined) dbUpdates.progress = updates.progress;
                if (updates.status !== undefined) dbUpdates.status = updates.status;
                if (updates.rating !== undefined) dbUpdates.rating = updates.rating;
                if (updates.dateStarted !== undefined) dbUpdates.date_started = updates.dateStarted;
                if (updates.dateFinished !== undefined) dbUpdates.date_finished = updates.dateFinished;
                if (updates.review !== undefined) dbUpdates.review = updates.review;
                if (updates.vibes !== undefined) dbUpdates.vibes = updates.vibes;
                if (updates.description !== undefined) dbUpdates.description = updates.description;
                if (updates.isbn !== undefined) dbUpdates.isbn = updates.isbn;
                if (updates.tags !== undefined) dbUpdates.tags = updates.tags;

                if (Object.keys(dbUpdates).length > 0) {
                    await retryDB(async () => {
                        const { error } = await supabase.from('books').update(dbUpdates).eq('id', id);
                        if (error) throw error;
                    });
                }
            }

            // Success: Update Local
            set((state) => ({
                books: state.books.map((b) => b.id === id ? { ...b, ...updates } : b)
            }));
        },

        removeBook: async (id) => {
            // ROBUST: DB First
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await retryDB(async () => {
                    const { error } = await supabase.from('books').delete().eq('id', id);
                    if (error) throw error;
                });
            }

            set((state) => ({
                books: state.books.filter((b) => b.id !== id),
                notes: state.notes.filter((n) => n.bookId !== id)
            }));
        },

        updateProgress: async (id, page) => {
            const state = get();
            const book = state.books.find(b => b.id === id);
            if (!book) return;

            const updates: Partial<Book> = { progress: page };
            if (page > 0 && book.status === 'tbr') {
                updates.status = 'reading';
                updates.dateStarted = new Date().toISOString();
            }

            await get().updateBook(id, updates);
        },

        addNote: async (noteData) => {
            const newNote: Note = {
                ...noteData,
                id: crypto.randomUUID(),
                createdAt: new Date().toISOString(),
            };

            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await retryDB(async () => {
                    const { error } = await supabase.from('notes').insert({
                        id: newNote.id,
                        user_id: user.id,
                        book_id: newNote.bookId,
                        content: newNote.content,
                        type: newNote.type,
                        page_reference: newNote.pageReference,
                        created_at: newNote.createdAt
                    });
                    if (error) throw error;
                });
            }

            set((state) => ({ notes: [newNote, ...state.notes] }));
        },

        removeNote: async (id) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await retryDB(async () => {
                    const { error } = await supabase.from('notes').delete().eq('id', id);
                    if (error) throw error;
                });
            }

            set((state) => ({
                notes: state.notes.filter((n) => n.id !== id)
            }));
        },

        setBookStatus: async (id, status) => {
            const state = get();
            const book = state.books.find(b => b.id === id);
            if (!book) return;

            const updates: Partial<Book> = { status };
            if (status === 'reading' && !book.dateStarted) updates.dateStarted = new Date().toISOString();
            if (status === 'finished' && !book.dateFinished) {
                updates.dateFinished = new Date().toISOString();
                updates.progress = book.pageCount;
            }

            await get().updateBook(id, updates);
        },

        setActiveBook: (id) => set({ activeBookId: id }),

        getStats: () => {
            const { books } = get();
            const now = new Date();
            const currentYear = now.getFullYear();

            const finishedBooks = books.filter(b => b.status === 'finished');
            const booksReadThisYear = finishedBooks.filter(b => {
                if (!b.dateFinished) return false;
                return new Date(b.dateFinished).getFullYear() === currentYear;
            }).length;

            const totalPagesRead = books.reduce((acc, book) => acc + (book.progress || 0), 0);

            return {
                booksReadThisYear,
                totalPagesRead,
                booksReading: books.filter(b => b.status === 'reading').length,
                booksTbr: books.filter(b => b.status === 'tbr').length
            };
        }
    })
);
