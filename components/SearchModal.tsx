'use client';

import { useState, useEffect } from 'react';
import { X, Search, Plus, Check, Loader2 } from 'lucide-react';
import { useLibraryStore } from '@/store/useLibraryStore';
import { Book } from '@/types';

interface SearchModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const addBook = useLibraryStore((state) => state.addBook);
    const books = useLibraryStore((state) => state.books);

    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (query.trim().length > 2) {
                setLoading(true);
                try {
                    const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=10`);
                    const data = await res.json();
                    setResults(data.items || []);
                } catch (error) {
                    console.error("Failed to fetch books", error);
                    setResults([]);
                } finally {
                    setLoading(false);
                }
            } else {
                setResults([]);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [query]);

    if (!isOpen) return null;

    const getHighResUrl = (link?: string) => {
        if (!link) return '';
        // Remove zoom=1 and edge=curl to try and get a clean, larger image
        return link.replace('http:', 'https:').replace('&zoom=1', '').replace('&edge=curl', '');
    };

    const handleAddBook = (item: any) => {
        const volumeInfo = item.volumeInfo;
        const newBook: Book = {
            id: crypto.randomUUID(),
            googleId: item.id,
            title: volumeInfo.title || 'Unknown Title',
            author: volumeInfo.authors ? volumeInfo.authors[0] : 'Unknown Author',
            coverUrl: getHighResUrl(volumeInfo.imageLinks?.thumbnail || volumeInfo.imageLinks?.smallThumbnail),
            pageCount: volumeInfo.pageCount || 0,
            status: 'tbr',
            progress: 0,
            tags: volumeInfo.categories || [],
            description: volumeInfo.description // Pass description for AI
        };
        addBook(newBook);
    };

    const isBookInLibrary = (googleId: string) => {
        return books.some(b => b.googleId === googleId);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4 bg-background/80 backdrop-blur-sm transition-all duration-300">
            <div className="w-full max-w-2xl flex flex-col bg-card rounded-2xl shadow-2xl ring-1 ring-black/5 overflow-hidden">
                {/* Header */}
                <div className="relative flex items-center px-6 py-5 border-b border-card-border">
                    <Search className="text-text-muted mr-4" size={24} />
                    <input
                        autoFocus
                        className="w-full bg-transparent border-none p-0 text-2xl placeholder:text-gray-300 text-text-main font-medium focus:ring-0 font-serif italic outline-none"
                        placeholder="Find your next adventure..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    <button onClick={onClose} className="absolute right-6 p-2 text-text-muted hover:text-text-main">
                        <X size={20} />
                    </button>
                </div>

                {/* Results */}
                <div className="flex flex-col max-h-[50vh] overflow-y-auto bg-card">
                    {loading && (
                        <div className="flex items-center justify-center p-8 text-text-muted">
                            <Loader2 className="animate-spin mr-2" /> Searching...
                        </div>
                    )}

                    {!loading && results.map((item) => {
                        const added = isBookInLibrary(item.id);
                        const volume = item.volumeInfo;
                        const cover = volume.imageLinks?.thumbnail?.replace('http:', 'https:');

                        return (
                            <div key={item.id} className="group relative flex items-start gap-4 px-6 py-4 transition-colors hover:bg-accent/5 border-l-4 border-transparent hover:border-accent">
                                <div className="shrink-0 w-12 h-16 rounded shadow-md overflow-hidden bg-card">
                                    {cover ? (
                                        <img src={cover} alt={volume.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-accent/10" />
                                    )}
                                </div>
                                <div className="flex flex-col flex-1 justify-center min-h-[64px]">
                                    <h3 className="text-lg font-bold text-text-main leading-tight line-clamp-1">{volume.title}</h3>
                                    <p className="text-sm text-text-muted italic mt-0.5">{volume.authors?.join(', ') || 'Unknown'} • {volume.publishedDate?.substring(0, 4)}</p>
                                </div>

                                <div className="flex items-center self-center">
                                    {added ? (
                                        <span className="flex items-center gap-1 text-green-600 text-sm font-medium px-3 py-1.5">
                                            <Check size={16} /> Added
                                        </span>
                                    ) : (
                                        <button
                                            onClick={() => handleAddBook(item)}
                                            className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border border-card-border text-text-main text-sm font-medium shadow-sm hover:border-accent hover:text-accent transition-all"
                                        >
                                            <Plus size={16} /> Add
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {!loading && query.length > 2 && results.length === 0 && (
                        <div className="p-8 text-center text-text-muted">No books found.</div>
                    )}
                </div>
            </div>
        </div>
    );
}
