'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useLibraryStore } from '@/store/useLibraryStore';
import { createClient } from '@/lib/supabase';
import { BookOpen, Calendar, MapPin, Library, Heart, Flag, Settings, ArrowUp, Moon, Sun, Coffee, Check, Mail, Award, TrendingUp, Upload, Star, Mountain, Feather, SunMedium, Sparkles, Flower2, Droplets, Zap, Save, Download, LogOut, LogIn, User as UserIcon } from 'lucide-react';
import { User, Book } from '@/types';
import { parseGoodreadsCSV } from '@/utils/csvParser';

type Tab = 'account' | 'goals' | 'preferences';

export default function ProfilePage() {
    const [mounted, setMounted] = useState(false);
    const [activeTab, setActiveTab] = useState<Tab>('account');
    const [isSaving, setIsSaving] = useState(false);
    const [showSaved, setShowSaved] = useState(false);
    // Modal States
    const [showGenreModal, setShowGenreModal] = useState(false);
    const [showPagesModal, setShowPagesModal] = useState(false);

    // Import State
    const [isImporting, setIsImporting] = useState(false);
    const [importCount, setImportCount] = useState(0);
    const [enrichmentTotal, setEnrichmentTotal] = useState(0);
    const [currentEnrichingTitle, setCurrentEnrichingTitle] = useState('');
    const [importError, setImportError] = useState<string | null>(null);

    // Store Data
    const books = useLibraryStore((state) => state.books);
    const user = useLibraryStore((state) => state.user);
    const updateUser = useLibraryStore((state) => state.updateUser);

    // Local Form State
    const [formData, setFormData] = useState<Partial<User>>({});
    const supabase = createClient();

    useEffect(() => {
        setMounted(true);
        if (user) {
            setFormData(user);
        }
    }, [user]);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        window.location.href = '/';
    };

    if (!mounted || !user) return null;

    // Stats Logic
    const booksCollected = books.length;
    const pagesRead = books.reduce((acc, book) => acc + (book.progress || 0), 0);
    const finishedBooksCount = books.filter(b => b.status === 'finished').length;
    const currentYear = new Date().getFullYear();
    const booksReadThisYear = books.filter(b => b.status === 'finished' && b.dateFinished && new Date(b.dateFinished).getFullYear() === currentYear).length;


    const genreCounts: Record<string, number> = {};
    const tagMapping: Record<string, string> = {}; // map normalized -> display

    books.forEach(book => {
        book.tags?.forEach(tag => {
            // Simple normalization (Capitalize first letter) or keep original if already tracked
            // We want to merge "fiction" and "Fiction" into "Fiction"
            const trimmed = tag.trim();
            const normalized = trimmed.toLowerCase();

            // If we haven't seen this normalized tag, decide on display name (prefer Title Case or existing)
            if (!tagMapping[normalized]) {
                // Heuristic: if current tag starts with uppercase, prefer it
                if (trimmed[0] === trimmed[0].toUpperCase()) {
                    tagMapping[normalized] = trimmed;
                } else {
                    // Force title case for display if we only see lowercase
                    tagMapping[normalized] = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
                }
            } else {
                // If we have a mapping, but current tag looks "better" (e.g. Fiction vs fiction), upgrade it
                if (trimmed[0] === trimmed[0].toUpperCase() && tagMapping[normalized][0] !== tagMapping[normalized][0].toUpperCase()) {
                    tagMapping[normalized] = trimmed;
                }
            }

            const key = tagMapping[normalized];
            genreCounts[key] = (genreCounts[key] || 0) + 1;
        });
    });

    let topGenre = 'Undecided';
    let topGenreCount = 0;

    Object.entries(genreCounts).forEach(([genre, count]) => {
        if (count > topGenreCount) {
            topGenre = genre;
            topGenreCount = count;
        }
    });

    // All genres sorted for modal
    const allGenresSorted = Object.entries(genreCounts)
        .sort(([, a], [, b]) => b - a)
        .map(([genre, count]) => ({
            genre,
            count,
            books: books.filter(b => b.tags?.some(t => tagMapping[t.trim().toLowerCase()] === genre))
        }));

    // Books sorted by page count for modal
    const booksByPages = [...books]
        .filter(b => b.pageCount && b.pageCount > 0)
        .sort((a, b) => (b.pageCount || 0) - (a.pageCount || 0));

    // Badge Logic
    const badges = [];
    if (booksCollected >= 1) badges.push({ label: 'Seedling', color: 'bg-green-100 text-green-700 border-green-200', desc: 'Collected your first book' });
    if (booksCollected >= 5) badges.push({ label: 'Sprout', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', desc: 'Collected 5+ books' });
    if (booksCollected >= 10) badges.push({ label: 'Bloom', color: 'bg-teal-100 text-teal-700 border-teal-200', desc: 'Collected 10+ books' });
    if (booksCollected >= 25) badges.push({ label: 'Garden', color: 'bg-cyan-100 text-cyan-700 border-cyan-200', desc: 'Collected 25+ books' });
    if (booksCollected >= 50) badges.push({ label: 'Orchard', color: 'bg-blue-100 text-blue-700 border-blue-200', desc: 'Collected 50+ books' });
    if (booksCollected >= 100) badges.push({ label: 'Forest', color: 'bg-indigo-100 text-indigo-700 border-indigo-200', desc: 'Collected 100+ books' });
    if (booksCollected >= 200) badges.push({ label: 'Ecosystem', color: 'bg-violet-100 text-violet-700 border-violet-200', desc: 'Collected 200+ books' });
    if (booksCollected >= 500) badges.push({ label: 'Library of Alexandria', color: 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200', desc: 'Collected 500+ books!' });

    if (pagesRead >= 1000) badges.push({ label: 'Bookworm', color: 'bg-pink-100 text-pink-700 border-pink-200', desc: 'Read over 1,000 pages' });
    if (pagesRead >= 5000) badges.push({ label: 'Scholar', color: 'bg-rose-100 text-rose-700 border-rose-200', desc: 'Read over 5,000 pages' });
    if (pagesRead >= 10000) badges.push({ label: 'Sage', color: 'bg-orange-100 text-orange-700 border-orange-200', desc: 'Read over 10,000 pages' });
    if (pagesRead >= 25000) badges.push({ label: 'Oracle', color: 'bg-amber-100 text-amber-700 border-amber-200', desc: 'Read over 25,000 pages' });
    if (pagesRead >= 50000) badges.push({ label: 'Timeless', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', desc: 'Read over 50,000 pages!' });

    if (booksReadThisYear >= (user.readingGoal || 25)) badges.push({ label: 'Goal Crusher', color: 'bg-lime-100 text-lime-700 border-lime-200', desc: `Met your ${currentYear} goal` });

    if (badges.length === 0) badges.push({ label: 'New Reader', color: 'bg-gray-100 text-gray-600 border-gray-200', desc: 'Start adding books to grow!' });

    // Handlers
    const handleInputChange = (field: keyof User, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // Helper: Levenshtein Distance for Similarity Score (0 to 1)
    const calculateSimilarity = (s1: string, s2: string): number => {
        const longer = s1.length > s2.length ? s1 : s2;
        const shorter = s1.length > s2.length ? s2 : s1;
        const longerLength = longer.length;
        if (longerLength === 0) return 1.0;

        const editDistance = (a: string, b: string) => {
            const costs = new Array();
            for (let i = 0; i <= a.length; i++) {
                let lastValue = i;
                for (let j = 0; j <= b.length; j++) {
                    if (i == 0) costs[j] = j;
                    else {
                        if (j > 0) {
                            let newValue = costs[j - 1];
                            if (a.charAt(i - 1) != b.charAt(j - 1)) newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
                            costs[j - 1] = lastValue;
                            lastValue = newValue;
                        }
                    }
                }
                if (i > 0) costs[b.length] = lastValue;
            }
            return costs[b.length];
        }

        return (longerLength - editDistance(longer, shorter)) / longerLength;
    };

    const fetchGoogleBook = async (isbn?: string, title?: string, author?: string): Promise<{ coverUrl: string; description?: string; categories?: string[]; foundTitle?: string; foundAuthor?: string }> => {
        const getInfoFromQuery = async (q: string) => {
            try {
                // Debugging Log
                console.log(`🔍 [GoogleBooks] Visual-First Search: ${q} (Lang: ${user.languagePreference})`);

                const langParam = user.languagePreference ? `&langRestrict=${user.languagePreference}` : '';

                // Add Timeout to prevent hangs
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

                try {
                    const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=10${langParam}`, {
                        signal: controller.signal
                    });
                    clearTimeout(timeoutId);

                    if (!res.ok) throw new Error(`Google API Error: ${res.status}`);
                    const data = await res.json();

                    if (data.items) {
                        let bestMatch = null;
                        let bestScore = 0;

                        // "Human Eye" Filter
                        for (const item of data.items) {
                            const volume = item.volumeInfo;
                            const links = volume?.imageLinks;

                            // CRITICAL: Must have a cover
                            if (!links) continue;

                            // RELEVANCE CHECK
                            const foundTitleClean = normalizeText(volume.title || '');
                            const foundAuthorClean = normalizeText(volume.authors ? volume.authors[0] : '');
                            const inputTitleClean = normalizeText(title || '');
                            const inputAuthorClean = normalizeText(author || '');

                            const titleScore = calculateSimilarity(foundTitleClean, inputTitleClean);

                            // Threshold passed?
                            const isRelevant = titleScore > 0.4 || (inputTitleClean.includes(foundTitleClean) || foundTitleClean.includes(inputTitleClean));



                            if (isRelevant) {
                                // STRATEGY: Construct High-Res "FIFE" URL
                                // Research shows this is the most reliable way to get a real cover and avoid "Image Not Available"
                                // Format: https://books.google.com/books/publisher/content/images/frontcover/{id}?fife=w400-h600&source=gbs_api
                                let url = `https://books.google.com/books/publisher/content/images/frontcover/${item.id}?fife=w400-h600&source=gbs_api`;

                                // Fallback to standard links if for some reason the ID-based one isn't desired (though it should be primary)
                                if (!url) {
                                    url = links.extraLarge || links.large || links.medium || links.thumbnail || links.smallThumbnail;
                                    if (url && url.startsWith('http:')) url = url.replace('http:', 'https:');
                                }

                                if (url) {
                                    // SCORE THE MATCH QUALITY
                                    // Boost for Description (Rich metadata usually = real cover)
                                    // Boost for exact title match
                                    let qualityScore = titleScore;
                                    if (volume.description) qualityScore += 0.2; // Huge boost for having description
                                    if (volume.categories) qualityScore += 0.1;

                                    console.log(`👉 Candidate: "${volume.title}" | Sim: ${titleScore.toFixed(2)} | Qual: ${qualityScore.toFixed(2)}`);

                                    if (qualityScore > bestScore) {
                                        bestScore = qualityScore;
                                        bestMatch = {
                                            coverUrl: url,
                                            description: volume.description,
                                            categories: volume.categories,
                                            foundTitle: volume.title,
                                            foundAuthor: volume.authors ? volume.authors[0] : undefined
                                        };
                                    }
                                }
                            }
                        }

                        if (bestMatch) {
                            console.log(`✅ [GoogleBooks] WINNER: "${bestMatch.foundTitle}"`);
                            return bestMatch;
                        }
                        console.log(`⚠️ [GoogleBooks] Items found but NONE passed validity checks.`);
                        console.log(`❌ [GoogleBooks] No items found for: ${q}`);
                    }
                } catch (fetchErr) {
                    // Handle AbortError or Network Error
                    if (fetchErr instanceof Error && fetchErr.name === 'AbortError') {
                        throw new Error("Request Timeout (8s)");
                    }
                    throw fetchErr;
                }

            } catch (e) {
                console.error("Failed to fetch info for query:", q, e);
            }
            return null;
        };

        // Custom Normalization
        const normalizeText = (text: string) => {
            if (!text) return '';
            let t = text.toLowerCase();
            t = t.replace(/œ/g, 'oe').replace(/æ/g, 'ae').replace(/ß/g, 'ss');
            return t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/'/g, ' ').replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
        };

        const safeTitle = title ? normalizeText(title) : '';
        const safeAuthor = author ? normalizeText(author) : '';

        // STRATEGY 1: The "Human Mimic" (Broad Search)
        // Just "Title Author" - Let Google rank them. We verify.
        const broadQuery = `${safeTitle} ${safeAuthor}`.trim();
        if (broadQuery) {
            const info = await getInfoFromQuery(broadQuery);
            if (info) return info;
        }

        // STRATEGY 2: Open Library Backup (If ISBN exists)
        // If Google failed us completely, we try to at least get a cover URL from Open Library
        if (isbn && isbn.length >= 10) {
            console.log(`⚠️ [System] Google failed. Trying Open Library for ISBN: ${isbn}`);
            return {
                coverUrl: `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`,
                foundTitle: title, // Keep original
                foundAuthor: author
            };
        }

        return { coverUrl: '' };
    };

    // Helper: Smart Genre Refinement
    const refineGenres = (rawCategories: string[] | undefined): string[] => {
        if (!rawCategories || rawCategories.length === 0) return [];

        const BLOCKLIST = ['fiction', 'general', 'books', 'literature', 'novels', 'stories', 'literary'];
        const refined = new Set<string>();

        rawCategories.forEach(cat => {
            // Split "Fiction / Fantasy / Epic" -> ["Fiction", "Fantasy", "Epic"]
            const parts = cat.split('/').map(s => s.trim());

            parts.forEach(p => {
                const lower = p.toLowerCase();
                // Filter out boring words unless it's the ONLY thing we have? 
                // Actually, if we have "Fantasy", we don't need "Fiction".
                if (!BLOCKLIST.includes(lower)) {
                    // Capitalize nicely (Title Case)
                    const niceName = p.charAt(0).toUpperCase() + p.slice(1);
                    refined.add(niceName);
                }
            });
        });

        // If we filtered EVERYTHING out (e.g. only had "Fiction"), put "Fiction" back
        if (refined.size === 0 && rawCategories.some(c => c.toLowerCase().includes('fiction'))) {
            return ['Fiction'];
        }

        return Array.from(refined);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        setImportCount(0);
        setEnrichmentTotal(0);

        const reader = new FileReader();
        reader.onload = async (event) => {
            const text = event.target?.result as string;
            if (text) {
                const parsedBooks = parseGoodreadsCSV(text);
                const store = useLibraryStore.getState();

                // Filter duplicates first to know real total
                const toAdd = parsedBooks.filter(b => {
                    return !store.books.some(ex => ex.title === b.title && ex.author === b.author);
                });

                console.log(`[Import Debug] Total parsed: ${parsedBooks.length}. New to add: ${toAdd.length}`);

                if (toAdd.length === 0) {
                    alert("⚠️ No new books found. All books in this CSV are already in your library.");
                    setIsImporting(false);
                    return;
                }

                setEnrichmentTotal(toAdd.length);

                // --- RATE LIMITED QUEUE IMPLEMENTATION ---
                // Config: Concurrency 1, Interval 250ms
                const processInQueue = async <T,>(items: T[], fn: (item: T) => Promise<void>) => {
                    for (const item of items) {
                        try {
                            await fn(item);
                        } catch (e) {
                            console.error("Queue item crashed:", e);
                        }
                        // Delay to prevent 429s (simple throttle)
                        await new Promise(resolve => setTimeout(resolve, 250));
                    }
                };

                await processInQueue(toAdd, async (b) => {
                    try {
                        console.log(`[Import Debug] Processing: ${b.title}`);
                        // Update UI
                        setCurrentEnrichingTitle(b.title || 'Processing...');

                        const { coverUrl, description, categories, foundTitle, foundAuthor } = await fetchGoogleBook(b.isbn, b.title, b.author);

                        // Use fetched categories if no tags exist from CSV
                        // APPLY SMART GENRE FILTERING
                        let finalTags = (b.tags && b.tags.length > 0) ? b.tags : (categories || []);
                        if (!b.tags || b.tags.length === 0) {
                            finalTags = refineGenres(categories);
                        }

                        const newBook: Book = {
                            ...b,
                            id: crypto.randomUUID(),
                            title: foundTitle || b.title || 'Unknown Title',
                            author: foundAuthor || b.author || 'Unknown Author',
                            tags: finalTags,
                            status: b.status || 'tbr',
                            progress: b.progress || 0,
                            pageCount: b.pageCount || 0,
                            coverUrl: coverUrl || '', // Google Url
                            description: description,
                            isbn: b.isbn
                        } as Book;

                        await store.addBook(newBook);
                        setImportCount(prev => prev + 1);
                    } catch (err: any) {
                        console.error(`❌ Failed to import "${b.title}":`, err);
                        setImportError(err.message || JSON.stringify(err));
                        // Continue queue...
                    }
                });

                setIsImporting(false);
                setEnrichmentTotal(0);
                setCurrentEnrichingTitle('');
            }
        };
        reader.readAsText(file);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 600));

        updateUser(formData);
        setIsSaving(false);
        setShowSaved(true);

        setTimeout(() => setShowSaved(false), 3000);
    };

    const handleExport = () => {
        const store = useLibraryStore.getState();
        const exportData = {
            user: store.user,
            books: store.books,
            notes: store.notes,
            exportedAt: new Date().toISOString(),
            version: '1.0.0'
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `digital-garden-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="flex flex-col min-h-screen bg-background pb-20">

            {/* Profile Header */}
            <div className="px-4 md:px-10 lg:px-40 py-8">
                <div className="max-w-[960px] mx-auto flex flex-col gap-8">

                    <section className="bg-card rounded-xl shadow-sm border border-card-border p-8 relative overflow-hidden transition-all duration-500">
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-accent/20 rounded-full blur-3xl pointer-events-none"></div>

                        <div className="flex flex-col md:flex-row gap-8 items-center md:items-start relative z-10">
                            <div className="flex flex-col gap-4 items-center shrink-0">
                                <div className="relative group">
                                    <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-32 shadow-md border-4 border-card"
                                        style={{ backgroundImage: `url("${user.avatarUrl}")` }}>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2 justify-center max-w-[200px]">
                                    {badges.map((badge, i) => (
                                        <div key={i} className="group relative cursor-help">
                                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${badge.color} inline-block`}>
                                                {badge.label}
                                            </span>

                                            {/* Tooltip */}
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[150px] hidden group-hover:block z-50 pointer-events-none animate-in fade-in zoom-in duration-200">
                                                <div className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs p-2 rounded shadow-xl text-center font-medium">
                                                    {badge.desc}
                                                </div>
                                                <div className="w-2 h-2 bg-zinc-900 dark:bg-zinc-100 rotate-45 absolute left-1/2 -translate-x-1/2 -bottom-1"></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-col flex-1 items-center md:items-start text-center md:text-left w-full">
                                <h1 className="text-text-main text-4xl font-serif font-bold leading-tight tracking-tight mb-2">{user.name}</h1>
                                <p className="text-text-muted text-lg font-normal mb-4 italic">"{user.bio}"</p>

                                <div className="flex flex-wrap justify-center md:justify-start gap-4 mb-6 text-sm text-text-muted">
                                    <div className="flex items-center gap-1.5">
                                        <Calendar size={16} />
                                        <span>Joined {user.joinedDate}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <MapPin size={16} />
                                        <span>{user.location}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Stats Row */}
                    <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="flex flex-col gap-2 rounded-xl p-6 bg-card shadow-sm border border-card-border relative group overflow-hidden hover:shadow-md transition-shadow">
                            <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity text-text-main">
                                <Library size={64} />
                            </div>
                            <p className="text-text-muted text-sm font-bold uppercase tracking-wider">Books Collected</p>
                            <p className="text-text-main text-4xl font-bold leading-tight tabular-nums">{booksCollected}</p>
                            <p className="text-xs text-text-muted mt-1 flex items-center gap-1">
                                <span className="text-green-600 font-bold flex items-center"><ArrowUp size={14} /> 12%</span> vs last year
                            </p>
                        </div>

                        <button
                            onClick={() => setShowPagesModal(true)}
                            className="flex flex-col gap-2 rounded-xl p-6 bg-card shadow-sm border border-card-border relative group overflow-hidden hover:shadow-md hover:border-accent/50 transition-all cursor-pointer text-left w-full"
                        >
                            <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity text-text-main">
                                <BookOpen size={64} />
                            </div>
                            <p className="text-text-muted text-sm font-bold uppercase tracking-wider">Pages Turned</p>
                            <p className="text-text-main text-4xl font-bold leading-tight tabular-nums">{pagesRead.toLocaleString()}</p>
                            <p className="text-xs text-text-muted mt-1">
                                Click to see book rankings
                            </p>
                        </button>

                        <button
                            onClick={() => setShowGenreModal(true)}
                            className="flex flex-col gap-2 rounded-xl p-6 bg-card shadow-sm border border-card-border relative group overflow-hidden hover:shadow-md hover:border-accent/50 transition-all cursor-pointer text-left w-full"
                        >
                            <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity text-text-main">
                                <Heart size={64} />
                            </div>
                            <p className="text-text-muted text-sm font-bold uppercase tracking-wider">Top Genre</p>
                            <p className="text-text-main text-3xl font-bold leading-tight truncate" title={topGenre}>{topGenre}</p>
                            <p className="text-xs text-text-muted mt-1">
                                Click to see all genres
                            </p>
                        </button>
                    </section>

                    {/* Navigation Tabs */}
                    <nav className="border-b border-card-border mt-4">
                        <div className="flex gap-8 overflow-x-auto">
                            <button
                                onClick={() => setActiveTab('account')}
                                className={`group flex items-center gap-2 border-b-[3px] pb-3 pt-2 px-1 cursor-pointer transition-colors ${activeTab === 'account' ? 'border-text-main' : 'border-transparent hover:border-card-border'}`}
                            >
                                <Settings size={20} className={activeTab === 'account' ? 'text-text-main' : 'text-text-muted group-hover:text-text-main'} />
                                <span className={`${activeTab === 'account' ? 'text-text-main' : 'text-text-muted group-hover:text-text-main'} text-sm font-bold tracking-wide`}>Account Details</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('goals')}
                                className={`group flex items-center gap-2 border-b-[3px] pb-3 pt-2 px-1 cursor-pointer transition-colors ${activeTab === 'goals' ? 'border-text-main' : 'border-transparent hover:border-card-border'}`}
                            >
                                <Flag size={20} className={activeTab === 'goals' ? 'text-text-main' : 'text-text-muted group-hover:text-text-main'} />
                                <span className={`${activeTab === 'goals' ? 'text-text-main' : 'text-text-muted group-hover:text-text-main'} text-sm font-bold tracking-wide`}>Reading Goals</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('preferences')}
                                className={`group flex items-center gap-2 border-b-[3px] pb-3 pt-2 px-1 cursor-pointer transition-colors ${activeTab === 'preferences' ? 'border-text-main' : 'border-transparent hover:border-card-border'}`}
                            >
                                <Settings size={20} className={activeTab === 'preferences' ? 'text-text-main' : 'text-text-muted group-hover:text-text-main'} />
                                <span className={`${activeTab === 'preferences' ? 'text-text-main' : 'text-text-muted group-hover:text-text-main'} text-sm font-bold tracking-wide`}>Preferences</span>
                            </button>
                        </div>
                    </nav>

                    {/* Content Section */}
                    <section className="bg-card rounded-xl border border-card-border p-8 animate-in fade-in duration-300">

                        {activeTab === 'account' && (
                            <>
                                <form className="flex flex-col gap-8" onSubmit={handleSave}>
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-text-main text-2xl font-bold font-serif flex items-center gap-3">
                                            Personal Information
                                        </h3>
                                        {showSaved && <span className="text-green-600 font-bold flex items-center gap-1 animate-in fade-in"><Check size={16} /> Saved!</span>}
                                    </div>

                                    <div className="flex flex-col md:flex-row gap-8 items-start">
                                        {/* Image Preview */}
                                        <div className="shrink-0 flex flex-col items-center gap-4 mx-auto md:mx-0">
                                            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-card-border shadow-md relative group bg-card">
                                                {formData.avatarUrl ? (
                                                    <img
                                                        src={formData.avatarUrl}
                                                        alt="Avatar"
                                                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).src = "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png";
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-accent/20 flex items-center justify-center text-accent">
                                                        <UserIcon size={48} />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="text-center">
                                                <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Preview</p>
                                            </div>
                                        </div>

                                        {/* Inputs */}
                                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
                                            <div className="flex flex-col gap-2 group">
                                                <label className="text-sm font-bold text-text-muted uppercase tracking-wider group-focus-within:text-text-main transition-colors">Full Name</label>
                                                <input
                                                    className="w-full bg-transparent border-0 border-b border-card-border focus:border-text-main focus:ring-0 px-0 py-2 text-text-main text-lg font-medium placeholder:text-gray-300 transition-colors outline-none"
                                                    type="text"
                                                    value={formData.name || ''}
                                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                                />
                                            </div>
                                            <div className="flex flex-col gap-2 group">
                                                <label className="text-sm font-bold text-text-muted uppercase tracking-wider group-focus-within:text-text-main transition-colors">Email Address</label>
                                                <input
                                                    className="w-full bg-transparent border-0 border-b border-card-border focus:border-text-main focus:ring-0 px-0 py-2 text-text-main text-lg font-medium placeholder:text-gray-300 transition-colors outline-none"
                                                    type="email"
                                                    value={formData.email || ''}
                                                    onChange={(e) => handleInputChange('email', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2 group">
                                        <label className="text-sm font-bold text-text-muted uppercase tracking-wider group-focus-within:text-text-main transition-colors">Avatar URL</label>
                                        <input
                                            className="w-full bg-transparent border-0 border-b border-card-border focus:border-text-main focus:ring-0 px-0 py-2 text-text-main text-lg font-medium placeholder:text-gray-300 transition-colors outline-none"
                                            type="text"
                                            placeholder="https://..."
                                            value={formData.avatarUrl || ''}
                                            onChange={(e) => handleInputChange('avatarUrl', e.target.value)}
                                        />
                                        <p className="text-xs text-text-muted text-right">Paste a link to an image</p>
                                    </div>

                                    <div className="flex flex-col gap-2 group">
                                        <label className="text-sm font-bold text-text-muted uppercase tracking-wider group-focus-within:text-text-main transition-colors">Reader's Bio</label>
                                        <textarea
                                            className="w-full bg-transparent border border-card-border rounded-lg focus:border-text-main focus:ring-0 px-4 py-3 text-text-main text-base leading-relaxed resize-none transition-colors outline-none focus:shadow-sm"
                                            rows={3}
                                            value={formData.bio || ''}
                                            onChange={(e) => handleInputChange('bio', e.target.value)}
                                        />
                                        <p className="text-xs text-text-muted text-right">Visible on your public profile</p>
                                    </div>

                                    <div className="flex flex-col gap-2 group">
                                        <label className="text-sm font-bold text-text-muted uppercase tracking-wider group-focus-within:text-text-main transition-colors">Location</label>
                                        <input
                                            className="w-full bg-transparent border-0 border-b border-card-border focus:border-text-main focus:ring-0 px-0 py-2 text-text-main text-lg font-medium placeholder:text-gray-300 transition-colors outline-none"
                                            type="text"
                                            value={formData.location || ''}
                                            onChange={(e) => handleInputChange('location', e.target.value)}
                                        />
                                    </div>

                                    <div className="h-px w-full bg-card-border my-2"></div>

                                    <div className="flex justify-end pt-4">
                                        <button type="button" onClick={() => setFormData(user)} className="text-text-muted font-bold px-6 py-2.5 hover:text-text-main transition-colors mr-2">Reset</button>
                                        <button type="submit" disabled={isSaving} className="bg-text-main hover:bg-text-main/90 text-card font-bold px-8 py-2.5 rounded-lg shadow-md transition-all active:scale-95 flex items-center gap-2 disabled:opacity-70 disabled:cursor-wait">
                                            {isSaving ? 'Saving...' : <><Save size={16} /> Save Changes</>}
                                        </button>
                                    </div>
                                </form>

                                {/* DANGER ZONE / ACCOUNT ACTIONS */}
                                <div className="mt-8 pt-8 border-t-2 border-dashed border-card-border">
                                    <h3 className="text-xl font-bold font-serif text-text-main flex items-center gap-2 mb-4">
                                        <LogOut size={20} className="text-text-muted" /> Account Actions
                                    </h3>

                                    <div className="p-6 bg-card border border-card-border rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                        <div>
                                            <p className="font-bold text-text-main">Session Management</p>
                                            <p className="text-xs text-text-muted">Securely log out of your account on this device.</p>
                                        </div>

                                        {user.email ? (
                                            <button
                                                onClick={handleSignOut}
                                                className="flex items-center gap-2 bg-red-50 text-red-600 border border-red-200 px-6 py-2.5 rounded-lg font-bold hover:bg-red-100 transition-colors w-full md:w-auto justify-center"
                                            >
                                                <LogOut size={16} /> Disconnect
                                            </button>
                                        ) : (
                                            <Link
                                                href="/login"
                                                className="flex items-center gap-2 bg-emerald-50 text-emerald-600 border border-emerald-200 px-6 py-2.5 rounded-lg font-bold hover:bg-emerald-100 transition-colors w-full md:w-auto justify-center"
                                            >
                                                <LogIn size={16} /> Log In
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}

                        {activeTab === 'goals' && (
                            <div className="flex flex-col gap-8 md:px-12 py-4">
                                <div className="text-center mb-4">
                                    <h3 className="text-2xl font-serif font-bold text-text-main">Your {currentYear} Challenge</h3>
                                    <p className="text-text-muted">Set a target for how many books you want to read this year.</p>
                                </div>

                                <div className="p-8 border border-accent/20 bg-accent/5 rounded-2xl flex flex-col items-center gap-6">
                                    <div className="relative w-48 h-48 flex items-center justify-center">
                                        {/* Simple Circular Progress using conic-gradient */}
                                        <div
                                            className="absolute inset-0 rounded-full"
                                            style={{
                                                background: `conic-gradient(var(--color-accent) ${Math.min((booksReadThisYear / (formData.readingGoal || 25)) * 100, 100)}%, transparent 0)`
                                            }}
                                        ></div>
                                        <div className="absolute inset-2 bg-card rounded-full flex flex-col items-center justify-center">
                                            <span className="text-5xl font-bold font-serif text-text-main">{booksReadThisYear}</span>
                                            <span className="text-sm font-bold text-text-muted uppercase tracking-wider">of {formData.readingGoal} books</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2 w-full max-w-xs">
                                        <label className="text-sm font-bold text-text-muted uppercase tracking-wider text-center">Update your Goal</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="number"
                                                min="1"
                                                max="365"
                                                value={formData.readingGoal || 25}
                                                onChange={(e) => handleInputChange('readingGoal', parseInt(e.target.value))}
                                                className="w-full bg-card border border-card-border p-3 text-center rounded-lg font-bold text-lg outline-none focus:border-accent"
                                            />
                                            <button
                                                onClick={handleSave}
                                                disabled={isSaving || formData.readingGoal === user.readingGoal}
                                                className="bg-text-main text-card p-3 rounded-lg hover:bg-text-main/90 disabled:opacity-50"
                                            >
                                                <Save size={20} />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                                    <div className="flex flex-col gap-1 p-4 bg-card border border-card-border rounded-lg text-center">
                                        <span className="text-2xl font-bold text-text-main">{booksReadThisYear}</span>
                                        <span className="text-xs font-bold text-text-muted uppercase">Read</span>
                                    </div>
                                    <div className="flex flex-col gap-1 p-4 bg-card border border-card-border rounded-lg text-center">
                                        <span className="text-2xl font-bold text-text-main">{(formData.readingGoal || 25) - booksReadThisYear}</span>
                                        <span className="text-xs font-bold text-text-muted uppercase">To Go</span>
                                    </div>
                                    <div className="flex flex-col gap-1 p-4 bg-card border border-card-border rounded-lg text-center">
                                        <span className="text-2xl font-bold text-text-main">{Math.round((booksReadThisYear / (formData.readingGoal || 25)) * 100)}%</span>
                                        <span className="text-xs font-bold text-text-muted uppercase">Progress</span>
                                    </div>
                                    <div className="flex flex-col gap-1 p-4 bg-card border border-card-border rounded-lg text-center">
                                        <span className="text-2xl font-bold text-text-main">365</span>
                                        <span className="text-xs font-bold text-text-muted uppercase">Days Left</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'preferences' && (
                            <div className="flex flex-col gap-8">
                                <h3 className="text-text-main text-2xl font-bold font-serif">App Preferences</h3>

                                <div className="flex flex-col gap-10">
                                    {/* Full Width Theme Library */}
                                    <div className="flex flex-col gap-8">
                                        <div className="flex flex-col gap-2">
                                            <h3 className="text-xl font-bold text-text-main font-serif">Theme Library</h3>
                                            <p className="text-text-muted text-sm">Customize your reading environment. Choose a style that fits your mood.</p>
                                        </div>

                                        {/* Day Collection */}
                                        <div className="flex flex-col gap-4">
                                            <div className="flex items-center gap-2 text-text-muted px-1">
                                                <SunMedium size={18} />
                                                <span className="text-xs font-bold uppercase tracking-wider">Day Collection</span>
                                            </div>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                {[
                                                    { id: 'light', label: 'Botanical', desc: 'Fresh & Green', icon: Sun, color: 'text-green-600', bg: 'bg-green-50' },
                                                    { id: 'rose', label: 'Sakura', desc: 'Soft & Floral', icon: Flower2, color: 'text-pink-500', bg: 'bg-pink-50' },
                                                    { id: 'latte', label: 'Latte', desc: 'Warm Coffee', icon: Coffee, color: 'text-amber-700', bg: 'bg-orange-50' },
                                                    { id: 'ocean', label: 'Ocean', desc: 'Deep Blue', icon: Droplets, color: 'text-cyan-600', bg: 'bg-cyan-50' },
                                                    { id: 'sunrise', label: 'Sunrise', desc: 'Energetic Orange', icon: SunMedium, color: 'text-orange-500', bg: 'bg-orange-50' },
                                                    { id: 'berry', label: 'Berry', desc: 'Rich Ruby', icon: Award, color: 'text-rose-700', bg: 'bg-rose-50' },
                                                    { id: 'paper', label: 'Paper', desc: 'High Contrast', icon: Feather, color: 'text-gray-800', bg: 'bg-gray-50' },
                                                    { id: 'fjord', label: 'Fjord', desc: 'Cool Sky', icon: Mountain, color: 'text-sky-700', bg: 'bg-sky-50' },
                                                ].map((theme) => (
                                                    <button
                                                        key={theme.id}
                                                        onClick={() => {
                                                            const val = theme.id as any;
                                                            handleInputChange('themePreference', val);
                                                            updateUser({ themePreference: val });
                                                        }}
                                                        className={`relative flex flex-col items-start gap-3 p-4 rounded-xl border transition-all duration-300 group text-left
                                                            ${(formData.themePreference === theme.id || (theme.id === 'rose' && formData.themePreference === 'sepia'))
                                                                ? 'border-accent bg-card shadow-md ring-1 ring-accent scale-[1.02]'
                                                                : 'border-card-border bg-card hover:bg-accent/5 hover:border-accent/50 hover:-translate-y-1'}`}
                                                    >
                                                        <div className={`p-3 rounded-lg ${theme.bg} ${theme.color} transition-transform group-hover:scale-110`}>
                                                            <theme.icon size={24} />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-text-main text-sm">{theme.label}</span>
                                                            <span className="text-xs text-text-muted">{theme.desc}</span>
                                                        </div>
                                                        {(formData.themePreference === theme.id || (theme.id === 'rose' && formData.themePreference === 'sepia')) && (
                                                            <div className="absolute top-4 right-4 text-accent animate-in zoom-in duration-200">
                                                                <Check size={18} />
                                                            </div>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Night Collection */}
                                        <div className="flex flex-col gap-4">
                                            <div className="flex items-center gap-2 text-text-muted px-1">
                                                <Moon size={18} />
                                                <span className="text-xs font-bold uppercase tracking-wider">Night Collection</span>
                                            </div>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                {[
                                                    { id: 'dark', label: 'Cosmic', desc: 'Dark Purple', icon: Moon, color: 'text-purple-400', bg: 'bg-purple-900/10' },
                                                    { id: 'midnight', label: 'Midnight', desc: 'Slate Blue', icon: Moon, color: 'text-slate-400', bg: 'bg-slate-800/10' },
                                                    { id: 'galaxy', label: 'Galaxy', desc: 'Deep Indigo', icon: Star, color: 'text-indigo-400', bg: 'bg-indigo-900/10' },
                                                    { id: 'nebula', label: 'Nebula', desc: 'Teal Void', icon: Zap, color: 'text-teal-400', bg: 'bg-teal-900/10' },
                                                ].map((theme) => (
                                                    <button
                                                        key={theme.id}
                                                        onClick={() => {
                                                            const val = theme.id as any;
                                                            handleInputChange('themePreference', val);
                                                            updateUser({ themePreference: val });
                                                        }}
                                                        className={`relative flex flex-col items-start gap-3 p-4 rounded-xl border transition-all duration-300 group text-left
                                                            ${formData.themePreference === theme.id
                                                                ? 'border-accent bg-card shadow-md ring-1 ring-accent scale-[1.02]'
                                                                : 'border-card-border bg-card hover:bg-accent/5 hover:border-accent/50 hover:-translate-y-1'}`}
                                                    >
                                                        <div className={`p-3 rounded-lg ${theme.bg} ${theme.color} transition-transform group-hover:scale-110`}>
                                                            <theme.icon size={24} />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-text-main text-sm">{theme.label}</span>
                                                            <span className="text-xs text-text-muted">{theme.desc}</span>
                                                        </div>
                                                        {formData.themePreference === theme.id && (
                                                            <div className="absolute top-4 right-4 text-accent animate-in zoom-in duration-200">
                                                                <Check size={18} />
                                                            </div>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-4">
                                        <h4 className="text-sm font-bold text-text-muted uppercase tracking-wider">Book Language</h4>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            {[
                                                { id: 'en', label: 'English', flag: '🇬🇧' },
                                                { id: 'fr', label: 'Français', flag: '🇫🇷' },
                                                { id: 'es', label: 'Español', flag: '🇪🇸' },
                                                { id: 'de', label: 'Deutsch', flag: '🇩🇪' },
                                            ].map((lang) => (
                                                <button
                                                    key={lang.id}
                                                    onClick={() => {
                                                        const val = lang.id as any;
                                                        handleInputChange('languagePreference', val);
                                                        updateUser({ languagePreference: val });
                                                    }}
                                                    className={`p-4 rounded-xl border transition-all duration-300 flex items-center gap-3 text-left
                                                        ${formData.languagePreference === lang.id
                                                            ? 'border-accent bg-card shadow-md ring-1 ring-accent scale-[1.02]'
                                                            : 'border-card-border bg-card hover:bg-accent/5 hover:border-accent/50'}`}
                                                >
                                                    <span className="text-2xl">{lang.flag}</span>
                                                    <span className="font-bold text-text-main text-sm">{lang.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-card-border">
                                        <div className="flex flex-col gap-4">
                                            <h4 className="text-sm font-bold text-text-muted uppercase tracking-wider">Notifications</h4>
                                            <div className="flex items-center justify-between p-4 border border-card-border rounded-xl bg-card hover:bg-accent/5 transition-colors group cursor-pointer">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-accent/10 rounded-lg text-accent group-hover:bg-accent/20 transition-colors">
                                                        <Mail size={20} />
                                                    </div>
                                                    <span className="font-medium text-text-main">Weekly Digest</span>
                                                </div>
                                                <div className="w-11 h-6 bg-accent rounded-full relative shadow-inner">
                                                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-4">
                                            <h4 className="text-sm font-bold text-text-muted uppercase tracking-wider">Data Management</h4>
                                            <div className="p-4 border border-card-border rounded-xl bg-card hover:bg-accent/5 transition-colors flex flex-col gap-3">
                                                <div className="flex items-center gap-3 text-text-main font-medium">
                                                    <div className="p-2 bg-accent/10 rounded-lg text-accent">
                                                        <Library size={20} />
                                                    </div>
                                                    <span>Import from Goodreads</span>
                                                </div>

                                                <label className="cursor-pointer bg-card border-2 border-dashed border-card-border hover:border-accent rounded-lg p-6 flex flex-col items-center justify-center gap-2 group transition-all">
                                                    <Upload size={24} className="text-text-muted group-hover:text-accent transition-colors" />
                                                    <span className="text-sm font-bold text-text-muted group-hover:text-text-main">
                                                        {isImporting ? 'Importing...' : 'Click to select CSV'}
                                                    </span>
                                                    {isImporting && (
                                                        <div className="w-full max-w-[200px] mt-2">
                                                            <div className="flex justify-between text-xs text-text-muted mb-1">
                                                                <span>{importCount} / {enrichmentTotal}</span>
                                                                <span>{Math.round((importCount / (enrichmentTotal || 1)) * 100)}%</span>
                                                            </div>
                                                            <div className="w-full h-1.5 bg-card-border rounded-full overflow-hidden">
                                                                <div className="h-full bg-accent transition-all duration-300" style={{ width: `${(importCount / (enrichmentTotal || 1)) * 100}%` }}></div>
                                                            </div>
                                                            <p className="text-[10px] text-text-muted mt-1 truncate animate-pulse">{currentEnrichingTitle}</p>
                                                        </div>
                                                    )}
                                                    {importError && (
                                                        <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-500 max-w-full break-words">
                                                            Error: {importError}
                                                        </div>
                                                    )}
                                                    <input
                                                        type="file"
                                                        accept=".csv"
                                                        className="hidden"
                                                        onChange={handleFileUpload}
                                                        disabled={isImporting}
                                                    />
                                                </label>
                                                {isImporting && enrichmentTotal > 0 && (
                                                    <div className="flex flex-col gap-2 w-full animate-in fade-in">
                                                        <div className="flex justify-between text-xs text-text-muted">
                                                            <span className="truncate max-w-[200px]">Checking: {currentEnrichingTitle}</span>
                                                            <span>{importCount} / {enrichmentTotal}</span>
                                                        </div>
                                                        <div className="h-1.5 w-full bg-card-border rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-accent transition-all duration-300 ease-out"
                                                                style={{ width: `${(importCount / enrichmentTotal) * 100}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                )}
                                                {!isImporting && importCount > 0 && (
                                                    <div className="text-xs text-center font-bold text-green-600 animate-in fade-in">
                                                        Done! Enriching complete. Added {importCount} books.
                                                    </div>
                                                )}
                                            </div>

                                            <div className="p-4 border border-card-border rounded-xl bg-card hover:bg-accent/5 transition-colors flex flex-col gap-3">
                                                <div className="flex items-center gap-3 text-text-main font-medium">
                                                    <div className="p-2 bg-accent/10 rounded-lg text-accent">
                                                        <Download size={20} />
                                                    </div>
                                                    <span>Export Garden Data</span>
                                                </div>
                                                <p className="text-xs text-text-muted">Download a backup of your entire library and notes as a JSON file.</p>

                                                <button
                                                    onClick={handleExport}
                                                    className="w-full py-3 border-2 border-dashed border-card-border hover:border-accent rounded-lg text-sm font-bold text-text-muted hover:text-text-main transition-colors flex items-center justify-center gap-2 group"
                                                >
                                                    <Download size={18} className="group-hover:scale-110 transition-transform" />
                                                    Download Backup
                                                </button>
                                            </div>
                                        </div>
                                    </div>



                                    <div className="flex justify-end pt-4">
                                        <button onClick={handleSave} className="bg-text-main hover:bg-text-main/90 text-card font-bold px-8 py-2.5 rounded-lg shadow-md transition-all active:scale-95 flex items-center gap-2">
                                            <Save size={16} /> Save Preferences
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                    </section>
                </div>
            </div>

            {/* Genre Modal */}
            {
                showGenreModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowGenreModal(false)}>
                        <div className="bg-card rounded-2xl shadow-2xl border border-card-border max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
                            <div className="p-6 border-b border-card-border flex items-center justify-between bg-accent/5">
                                <div>
                                    <h2 className="text-2xl font-serif font-bold text-text-main flex items-center gap-2">
                                        <Heart size={24} className="text-accent" />
                                        All Genres
                                    </h2>
                                    <p className="text-sm text-text-muted mt-1">{allGenresSorted.length} genre{allGenresSorted.length !== 1 ? 's' : ''} in your library</p>
                                </div>
                                <button onClick={() => setShowGenreModal(false)} className="text-text-muted hover:text-text-main transition-colors">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-6">
                                <div className="space-y-6">
                                    {allGenresSorted.map(({ genre, count, books: genreBooks }) => (
                                        <div key={genre} className="border border-card-border rounded-xl p-4 hover:border-accent/50 transition-colors">
                                            <div className="flex items-center justify-between mb-3">
                                                <h3 className="text-lg font-bold text-text-main capitalize">{genre}</h3>
                                                <span className="text-sm font-bold text-accent bg-accent/10 px-3 py-1 rounded-full">{count} book{count !== 1 ? 's' : ''}</span>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {genreBooks.map(book => (
                                                    <div key={book.id} className="text-xs bg-card-border/50 text-text-muted px-2 py-1 rounded truncate max-w-[200px]" title={book.title}>
                                                        {book.title}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Pages Modal */}
            {
                showPagesModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowPagesModal(false)}>
                        <div className="bg-card rounded-2xl shadow-2xl border border-card-border max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
                            <div className="p-6 border-b border-card-border flex items-center justify-between bg-accent/5">
                                <div>
                                    <h2 className="text-2xl font-serif font-bold text-text-main flex items-center gap-2">
                                        <BookOpen size={24} className="text-accent" />
                                        Books by Page Count
                                    </h2>
                                    <p className="text-sm text-text-muted mt-1">Ranked from longest to shortest</p>
                                </div>
                                <button onClick={() => setShowPagesModal(false)} className="text-text-muted hover:text-text-main transition-colors">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-6">
                                <div className="space-y-3">
                                    {booksByPages.map((book, index) => (
                                        <div key={book.id} className="flex items-center gap-4 p-4 border border-card-border rounded-xl hover:border-accent/50 hover:bg-accent/5 transition-all group">
                                            <div className="text-2xl font-bold text-text-muted/30 w-8 text-center group-hover:text-accent transition-colors">
                                                #{index + 1}
                                            </div>
                                            {book.coverUrl && (
                                                <img src={book.coverUrl} alt={book.title} className="w-12 h-16 object-cover rounded shadow-sm" />
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-text-main truncate">{book.title}</h3>
                                                <p className="text-sm text-text-muted truncate">{book.author}</p>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-2xl font-bold text-accent">{book.pageCount?.toLocaleString()}</div>
                                                <div className="text-xs text-text-muted uppercase tracking-wider">pages</div>
                                            </div>
                                        </div>
                                    ))}
                                    {booksByPages.length === 0 && (
                                        <div className="text-center py-12 text-text-muted">
                                            <BookOpen size={48} className="mx-auto mb-4 opacity-30" />
                                            <p>No books with page count data yet.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
