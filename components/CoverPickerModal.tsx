'use client';

import { useState, useEffect } from 'react';
import { X, Search, Link as LinkIcon, Check, Loader2 } from 'lucide-react';

interface CoverPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (url: string) => void;
    initialQuery: string;
}

export default function CoverPickerModal({ isOpen, onClose, onSelect, initialQuery }: CoverPickerModalProps) {
    const [query, setQuery] = useState(initialQuery);
    const [results, setResults] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [manualUrl, setManualUrl] = useState('');
    const [activeTab, setActiveTab] = useState<'search' | 'url'>('search');

    useEffect(() => {
        if (isOpen && initialQuery) {
            setQuery(initialQuery);
            handleSearch(initialQuery);
            setActiveTab('search');
        }
    }, [isOpen, initialQuery]);

    const handleSearch = async (q: string) => {
        if (!q.trim()) return;
        setIsLoading(true);
        try {
            const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=12`);
            const data = await res.json();

            const images: string[] = [];
            if (data.items) {
                data.items.forEach((item: any) => {
                    const links = item.volumeInfo?.imageLinks;
                    if (links?.thumbnail || links?.smallThumbnail) {
                        let url = links.thumbnail || links.smallThumbnail;
                        // Upgrade to higher res if possible
                        url = url.replace('http:', 'https:').replace('&zoom=1', '&zoom=2');
                        images.push(url);
                    }
                });
            }
            setResults(images);
        } catch (error) {
            console.error('Failed to search covers', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-card border border-card-border rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="p-4 border-b border-card-border flex items-center justify-between bg-card text-text-main">
                    <h3 className="font-serif font-bold text-xl">Choose Cover</h3>
                    <button onClick={onClose} className="p-1 hover:bg-accent/10 rounded-full transition-colors text-text-muted hover:text-text-main">
                        <X size={24} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-card-border">
                    <button
                        onClick={() => setActiveTab('search')}
                        className={`flex-1 p-3 text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === 'search' ? 'bg-accent/10 text-text-main border-b-2 border-accent' : 'text-text-muted hover:bg-accent/5'}`}
                    >
                        Search
                    </button>
                    <button
                        onClick={() => setActiveTab('url')}
                        className={`flex-1 p-3 text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === 'url' ? 'bg-accent/10 text-text-main border-b-2 border-accent' : 'text-text-muted hover:bg-accent/5'}`}
                    >
                        Paste URL
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 bg-background">

                    {activeTab === 'search' && (
                        <div className="flex flex-col gap-4">
                            <form
                                onSubmit={(e) => { e.preventDefault(); handleSearch(query); }}
                                className="flex gap-2"
                            >
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                                    <input
                                        type="text"
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        placeholder="Search by title, author, or ISBN..."
                                        className="w-full pl-10 pr-4 py-2 bg-card border border-card-border rounded-lg text-text-main focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all placeholder:text-gray-400"
                                        autoFocus
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="px-4 py-2 bg-text-main text-card font-bold rounded-lg hover:bg-text-main/90 disabled:opacity-50 transition-colors"
                                >
                                    {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Search'}
                                </button>
                            </form>

                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                {isLoading ? (
                                    // Skeletons
                                    Array.from({ length: 8 }).map((_, i) => (
                                        <div key={i} className="aspect-[2/3] bg-card-border/20 rounded-md animate-pulse" />
                                    ))
                                ) : results.length > 0 ? (
                                    results.map((url, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => onSelect(url)}
                                            className="group relative aspect-[2/3] rounded-md overflow-hidden border border-card-border hover:border-accent hover:shadow-lg transition-all"
                                        >
                                            <img src={url} alt="Cover option" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                                <span className="bg-accent text-white px-2 py-1 rounded text-xs font-bold shadow-sm transform scale-95 group-hover:scale-100 transition-transform">Select</span>
                                            </div>
                                        </button>
                                    ))
                                ) : (
                                    <div className="col-span-full py-10 text-center text-text-muted">
                                        No covers found. Try a different search term.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'url' && (
                        <div className="flex flex-col gap-4 py-10 items-center justify-center">
                            <div className="w-full max-w-md flex flex-col gap-4">
                                <label className="text-sm font-bold text-text-muted uppercase tracking-wider">Image Link</label>
                                <div className="flex gap-2">
                                    <input
                                        type="url"
                                        value={manualUrl}
                                        onChange={(e) => setManualUrl(e.target.value)}
                                        placeholder="https://example.com/cover.jpg"
                                        className="flex-1 px-4 py-2 bg-card border border-card-border rounded-lg text-text-main focus:border-accent focus:ring-1 focus:ring-accent outline-none"
                                    />
                                </div>

                                {manualUrl && (
                                    <div className="mt-4 flex flex-col items-center gap-2">
                                        <p className="text-xs text-text-muted font-medium">Preview</p>
                                        <div className="w-32 aspect-[2/3] rounded-md overflow-hidden border border-card-border shadow-md">
                                            <img
                                                src={manualUrl}
                                                alt="Preview"
                                                className="w-full h-full object-cover"
                                                onError={(e) => (e.currentTarget.style.display = 'none')}
                                            />
                                        </div>
                                    </div>
                                )}

                                <button
                                    disabled={!manualUrl}
                                    onClick={() => onSelect(manualUrl)}
                                    className="mt-4 w-full py-3 bg-accent text-white font-bold rounded-lg hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md flex items-center justify-center gap-2"
                                >
                                    <Check size={18} />
                                    Use this Cover
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
