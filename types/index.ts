export type BookStatus = 'tbr' | 'reading' | 'finished' | 'abandoned';

export interface Book {
    id: string;             // Unique UUID
    googleId?: string;      // ID from Google Books API
    title: string;
    author: string;
    coverUrl: string;       // URL to image
    pageCount: number;      // Total pages
    status: BookStatus;
    progress: number;       // Current page number (e.g., 42)
    rating?: number;        // 1-5 (Optional)
    dateStarted?: string;   // ISO Date
    dateFinished?: string;  // ISO Date
    tags: string[];         // e.g. ["Philosophy", "Design"]
    review?: string;        // User's written thoughts
    vibes?: string[];       // e.g. ["Dark", "Cozy", "Tense"]
    description?: string;   // Summary for AI Analysis
}

export interface Note {
    id: string;             // Unique UUID
    bookId: string;         // Link to the Book
    content: string;        // The text content (Markdown supported)
    type: 'quote' | 'thought';
    pageReference?: string; // e.g. "p. 102"
    createdAt: string;      // ISO Date
}

export interface User {
    name: string;
    email: string;
    bio: string;
    avatarUrl: string;
    themePreference: 'light' | 'dark' | 'sepia' | 'rose' | 'ocean' | 'latte' | 'berry' | 'midnight' | 'galaxy' | 'nebula' | 'sunrise' | 'paper' | 'fjord';
    joinedDate: string;
    location: string;
    isPro: boolean;
    readingGoal: number; // Books per year
    languagePreference: 'en' | 'fr' | 'es' | 'de';
}
