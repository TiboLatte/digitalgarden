'use client';

import { useState, useEffect } from 'react';
import { useLibraryStore } from '@/store/useLibraryStore';
import { BookCard } from '@/components/BookCard';
import { SearchModal } from '@/components/SearchModal';
import { Plus, ArrowUpDown, Search } from 'lucide-react';
import { BookStatus } from '@/types';

type SortOption = 'date-added-desc' | 'date-added-asc' | 'name-asc' | 'name-desc';

export default function LibraryPage() {
    const [mounted, setMounted] = useState(false);
    const [filterStatus, setFilterStatus] = useState<BookStatus | 'all'>('all');
    const [sortBy, setSortBy] = useState<SortOption>('date-added-desc');
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const books = useLibraryStore((state) => state.books);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const filteredBooks = books.filter(book => {
        const matchesStatus = filterStatus === 'all' || book.status === filterStatus;
        const matchesSearch = searchQuery.trim() === '' ||
            book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            book.author.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesStatus && matchesSearch;
    });

    // Sort books
    const sortedBooks = [...filteredBooks].sort((a, b) => {
        switch (sortBy) {
            case 'date-added-desc':
                return (b.addedAt || 0) - (a.addedAt || 0);
            case 'date-added-asc':
                return (a.addedAt || 0) - (b.addedAt || 0);
            case 'name-asc':
                return a.title.localeCompare(b.title);
            case 'name-desc':
                return b.title.localeCompare(a.title);
            default:
                return 0;
        }
    });

    return (
        <div className="flex flex-col min-h-screen bg-background pb-20">
            <header className="px-6 py-6 border-b border-card-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <h1 className="text-3xl font-serif font-bold text-text-main">Library</h1>
                    <button
                        onClick={() => setIsSearchOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-text-main text-card font-bold rounded-lg hover:bg-text-main/90 transition shadow-sm"
                    >
                        <Plus size={18} /> Add Book
                    </button>
                </div>
            </header>

            <div className="max-w-7xl mx-auto w-full px-6 py-8 flex flex-col gap-8">
                {/* Search, Filters and Sort */}
                <div className="flex flex-col gap-6">
                    {/* Search Bar */}
                    <div className="relative">
                        <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                        <input
                            type="text"
                            placeholder="Search your library..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 rounded-xl bg-card border border-card-border text-text-main placeholder:text-text-muted focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all shadow-sm"
                        />
                    </div>

                    <div className="flex flex-col md:flex-row justify-between gap-4">
                        <div className="flex flex-wrap gap-2">
                            {['all', 'reading', 'finished', 'tbr', 'abandoned'].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setFilterStatus(status as any)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all capitalize ${filterStatus === status
                                        ? 'bg-text-main text-card shadow-md'
                                        : 'bg-card border border-card-border text-text-muted hover:border-accent hover:text-text-main'
                                        }`}
                                >
                                    {status === 'tbr' ? 'To Be Read' : status}
                                </button>
                            ))}
                        </div>

                        {/* Sort Dropdown */}
                        <div className="flex items-center gap-2">
                            <ArrowUpDown size={16} className="text-text-muted" />
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as SortOption)}
                                className="px-4 py-2 rounded-lg text-sm font-medium bg-card border border-card-border text-text-main hover:border-accent transition-colors cursor-pointer"
                            >
                                <option value="date-added-desc">Newest First</option>
                                <option value="date-added-asc">Oldest First</option>
                                <option value="name-asc">A → Z</option>
                                <option value="name-desc">Z → A</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Grid */}
                {sortedBooks.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                        {sortedBooks.map(book => (
                            <BookCard key={book.id} book={book} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 text-text-muted">
                        <p>No books found matching your search.</p>
                    </div>
                )}
            </div>

            <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
        </div>
    );
}
