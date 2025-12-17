import { create } from 'zustand';
import { Book, Note, BookStatus, User } from '../types';

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
            bio: "Welcome to your digital garden.",
            avatarUrl: "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png",
            themePreference: 'light',
            joinedDate: new Date().toLocaleDateString(),
            location: "Earth",
            isPro: false,
            readingGoal: 10,
            languagePreference: 'en'
        },

        // --- SYNC ACTION REMOVED ---
        syncWithCloud: async () => {
            console.log("Sync disabled (Local Only)");
        },

        updateUser: async (updates) => {
            // Local Only
            set((state) => ({ user: { ...state.user, ...updates } }));
        },

        addBook: async (newBook) => {
            // Local Only
            set((state) => ({ books: [newBook, ...state.books] }));
            console.log("✅ Book saved Locally:", newBook.title);
        },

        markAsDisliked: async (book) => {
            set((state) => ({
                dislikedBooks: [...state.dislikedBooks, { ...book, status: 'tbr' }]
            }));
        },

        updateBook: async (id, updates) => {
            // Local Only
            set((state) => ({
                books: state.books.map((b) => b.id === id ? { ...b, ...updates } : b)
            }));
        },

        removeBook: async (id) => {
            // Local Only
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

            set((state) => ({ notes: [newNote, ...state.notes] }));
        },

        removeNote: async (id) => {
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
