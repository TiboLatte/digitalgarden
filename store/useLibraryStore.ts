import { create } from 'zustand';
import { Book, Note, BookStatus, User } from '../types';
import { createClient } from '@/lib/supabase';

const supabase = createClient();

interface LibraryState {
    books: Book[];
    notes: Note[];
    dislikedBooks: Book[]; // The "Graveyard" for AI Training
    activeBookId: string | null;
    user: User;
    isLoading: boolean;

    // Actions
    syncWithCloud: (confirmedUser?: any) => Promise<void>;
    addBook: (book: Book) => void;
    markAsDisliked: (book: Book) => void; // New Action
    updateBook: (id: string, updates: Partial<Book>) => void;
    removeBook: (id: string) => void;
    updateProgress: (id: string, page: number) => void;
    addNote: (note: Omit<Note, 'id' | 'createdAt'>) => void;
    removeNote: (id: string) => void;
    setBookStatus: (id: string, status: BookStatus) => void;
    setActiveBook: (id: string | null) => void;
    updateUser: (user: Partial<User>) => void;

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
            set({ isLoading: true });

            let user = confirmedSessionUser;
            if (!user) {
                const { data } = await supabase.auth.getUser();
                user = data.user;
            }

            if (!user) {
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

            // 1. Fetch Books
            const { data: books, error: booksError } = await supabase.from('books').select('*');

            // 2. Fetch Notes
            const { data: notes, error: notesError } = await supabase.from('notes').select('*');

            // 3. Fetch Profile
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (booksError || notesError || profileError) {
                console.error("Sync failed", booksError, notesError, profileError);
                set({ isLoading: false });
                return;
            }

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
                googleId: undefined
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
                } : {})
            };

            set({
                books: mappedBooks,
                notes: mappedNotes,
                user: mergedUser,
                isLoading: false
            });
        },

        updateUser: async (updates) => {
            // Optimistic Update
            set((state) => ({ user: { ...state.user, ...updates } }));

            // Cloud Sync
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const dbUpdates: any = {};
                if (updates.name !== undefined) dbUpdates.full_name = updates.name; // Mapping name -> full_name
                if (updates.bio !== undefined) dbUpdates.bio = updates.bio;
                if (updates.location !== undefined) dbUpdates.location = updates.location;
                if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;
                if (updates.themePreference !== undefined) dbUpdates.theme_preference = updates.themePreference;
                if (updates.readingGoal !== undefined) dbUpdates.reading_goal = updates.readingGoal;
                if (updates.languagePreference !== undefined) dbUpdates.language_preference = updates.languagePreference;

                if (Object.keys(dbUpdates).length > 0) {
                    const { error } = await supabase
                        .from('profiles')
                        .update(dbUpdates)
                        .eq('id', user.id);

                    if (error) console.error("Failed to update profile", error);
                }
            }
        },

        addBook: async (newBook) => {
            // Optimistic
            set((state) => {
                const exists = state.books.some(b => b.id === newBook.id);
                if (exists) return state;
                return { books: [newBook, ...state.books] };
            });

            // Cloud
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
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
                    description: newBook.description
                });

                if (error) {
                    console.error("🔥 FAILED to save book:", error);
                    // Revert Optimistic Update
                    set((state) => ({
                        books: state.books.filter(b => b.id !== newBook.id)
                    }));
                    alert(`Failed to save book: ${error.message}`);
                } else {
                    console.log("✅ Book saved to Cloud:", newBook.title);
                }
            } else {
                console.warn("⚠️ User not logged in. Book saved LOCALLY only.");
            }
        },

        markAsDisliked: async (book) => {
            // Optimistic
            set((state) => ({
                dislikedBooks: [...state.dislikedBooks, { ...book, status: 'tbr' }] // Store locally, status irrelevant but needed for type
            }));

            // TODO: Persist "Dislikes" to DB?
            // For MVP, we might only keep them in local storage or add a 'disliked' status to the books table.
            // Let's add them to the 'books' table with status 'abandoned' + rating -1? 
            // Or just a clean specific table 'dislikes'?
            // Simplest path: books table, status='abandoned', rating=1, review='[Auto-Dislike]'.

            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await supabase.from('books').insert({
                    id: book.id,
                    user_id: user.id,
                    title: book.title,
                    author: book.author,
                    cover_url: book.coverUrl,
                    page_count: book.pageCount,
                    status: 'abandoned', // Treat as abandoned
                    rating: 1, // Hated it
                    date_finished: new Date().toISOString(), // "Finished" (rejected) today
                    tags: book.tags,
                    description: book.description,
                    review: 'One-Swipe Dislike' // Marker
                });
            }
        },

        updateBook: async (id, updates) => {
            // Optimistic
            set((state) => ({
                books: state.books.map((b) => b.id === id ? { ...b, ...updates } : b)
            }));

            // Cloud
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                // Map camel to snake for specific updates
                const dbUpdates: any = {};
                if (updates.progress !== undefined) dbUpdates.progress = updates.progress;
                if (updates.status !== undefined) dbUpdates.status = updates.status;
                if (updates.rating !== undefined) dbUpdates.rating = updates.rating;
                if (updates.dateStarted !== undefined) dbUpdates.date_started = updates.dateStarted;
                if (updates.dateFinished !== undefined) dbUpdates.date_finished = updates.dateFinished;
                if (updates.review !== undefined) dbUpdates.review = updates.review;
                if (updates.vibes !== undefined) dbUpdates.vibes = updates.vibes;
                if (updates.description !== undefined) dbUpdates.description = updates.description;

                if (Object.keys(dbUpdates).length > 0) {
                    await supabase.from('books').update(dbUpdates).eq('id', id);
                }
            }
        },

        removeBook: async (id) => {
            // Optimistic
            set((state) => ({
                books: state.books.filter((b) => b.id !== id),
                notes: state.notes.filter((n) => n.bookId !== id)
            }));

            // Cloud
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await supabase.from('books').delete().eq('id', id);
            }
        },

        updateProgress: (id, page) => {
            // Re-use updateBook logic? No, specific implementation in old store was complex with auto-start.
            // call internal helper or duplicate logic.
            // Let's call get().updateBook to reuse cloud logic?

            const state = get();
            const book = state.books.find(b => b.id === id);
            if (!book) return;

            const updates: Partial<Book> = { progress: page };
            if (page > 0 && book.status === 'tbr') {
                updates.status = 'reading';
                updates.dateStarted = new Date().toISOString();
            }

            // Apply logic locally then standard cloud sync via updateBook
            // But we can't easily call get().updateBook inside set().
            // We will execute the logic:

            get().updateBook(id, updates);
        },

        addNote: async (noteData) => {
            const newNote: Note = {
                ...noteData,
                id: crypto.randomUUID(),
                createdAt: new Date().toISOString(),
            };

            set((state) => ({ notes: [newNote, ...state.notes] }));

            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await supabase.from('notes').insert({
                    id: newNote.id,
                    user_id: user.id,
                    book_id: newNote.bookId,
                    content: newNote.content,
                    type: newNote.type,
                    page_reference: newNote.pageReference,
                    created_at: newNote.createdAt
                });
            }
        },

        removeNote: async (id) => {
            set((state) => ({
                notes: state.notes.filter((n) => n.id !== id)
            }));

            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await supabase.from('notes').delete().eq('id', id);
            }
        },

        setBookStatus: (id, status) => {
            const state = get();
            const book = state.books.find(b => b.id === id);
            if (!book) return;

            const updates: Partial<Book> = { status };
            if (status === 'reading' && !book.dateStarted) updates.dateStarted = new Date().toISOString();
            if (status === 'finished' && !book.dateFinished) {
                updates.dateFinished = new Date().toISOString();
                updates.progress = book.pageCount;
            }

            get().updateBook(id, updates);
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
