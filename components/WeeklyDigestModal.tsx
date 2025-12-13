'use client';

import { X, Sparkles, BookOpen, PenTool, Flame, Mountain, Quote, Trophy, Library, Palette } from 'lucide-react';
import { useLibraryStore } from '@/store/useLibraryStore';

interface WeeklyDigestModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function WeeklyDigestModal({ isOpen, onClose }: WeeklyDigestModalProps) {
    const books = useLibraryStore((state) => state.books);
    const notes = useLibraryStore((state) => state.notes);

    if (!isOpen) return null;

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // --- DATA GATHERING ---

    const finishedThisWeek = books.filter(b =>
        b.status === 'finished' &&
        b.dateFinished &&
        new Date(b.dateFinished) > oneWeekAgo
    );

    const startedThisWeek = books.filter(b =>
        b.dateStarted &&
        new Date(b.dateStarted) > oneWeekAgo
    );

    const notesThisWeek = notes.filter(n =>
        new Date(n.createdAt) > oneWeekAgo
    );

    // --- STATS CALCULATIONS ---

    const pagesConquered = finishedThisWeek.reduce((acc, book) => acc + (book.pageCount || 0), 0);
    const dailyVelocity = Math.round(pagesConquered / 7);

    // Deepest Dive (Longest Book)
    const deepestDive = [...finishedThisWeek].sort((a, b) => (b.pageCount || 0) - (a.pageCount || 0))[0];

    // Style Profile (Tags)
    const readingBooks = books.filter(b => b.status === 'reading');
    const sourceBooks = [...finishedThisWeek, ...readingBooks];

    const tagData = sourceBooks.reduce((acc, book) => {
        (book.tags || []).forEach(t => {
            const tag = t.toLowerCase();
            if (!acc[tag]) {
                acc[tag] = { count: 0, titles: new Set<string>() };
            }
            acc[tag].count += 1;
            acc[tag].titles.add(book.title);
        });
        return acc;
    }, {} as Record<string, { count: number, titles: Set<string> }>);

    const topStyles = Object.entries(tagData)
        .sort(([, a], [, b]) => b.count - a.count)
        .slice(0, 10)
        .map(([tag, data]) => ({
            tag,
            count: data.count,
            titles: Array.from(data.titles)
        }));


    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md transition-all animate-in fade-in duration-500"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-[#FAFAFA] dark:bg-zinc-900 rounded-[2rem] shadow-2xl border border-white/20 relative animate-in zoom-in-95 slide-in-from-bottom-4 duration-500 scrollbar-hide">

                {/* --- HEADER --- */}
                <div className="relative p-10 pb-6 text-center overflow-hidden bg-white dark:bg-zinc-900">
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent/10 via-transparent to-transparent opacity-50"></div>

                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 p-2 text-text-muted hover:text-text-main z-30 bg-white/80 dark:bg-black/20 backdrop-blur-md rounded-full hover:bg-white dark:hover:bg-black/40 transition-all hover:scale-110 shadow-sm"
                    >
                        <X size={24} />
                    </button>

                    <div className="relative z-10 flex flex-col items-center gap-4">
                        <div className="bg-gradient-to-tr from-accent to-purple-400 p-4 rounded-3xl shadow-lg text-white mb-2 animate-bounce-slow">
                            <Sparkles size={32} />
                        </div>
                        <h2 className="text-4xl md:text-5xl font-serif font-black text-text-main tracking-tight">Weekly Rewind</h2>
                        <p className="text-text-muted font-medium tracking-widest text-sm uppercase">
                            {oneWeekAgo.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} — {new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </p>
                    </div>
                </div>

                {/* --- BENTO GRID --- */}
                <div className="p-8 pt-0 grid grid-cols-1 md:grid-cols-6 gap-6">

                    {/* 1. TOTAL VOLUME (Large Card) */}
                    <div className="md:col-span-4 bg-gradient-to-br from-indigo-500 to-blue-600 text-white p-8 rounded-3xl shadow-lg relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-700"></div>
                        <div className="relative z-10 flex flex-col h-full justify-between">
                            <div className="flex items-center gap-3 opacity-80 font-bold uppercase tracking-wider text-xs">
                                <Mountain size={18} /> Total Volume
                            </div>
                            <div className="flex items-baseline gap-2 mt-4">
                                <span className="text-6xl md:text-7xl font-serif font-bold">{pagesConquered}</span>
                                <span className="text-xl opacity-80 font-medium">pages</span>
                            </div>
                            <div className="mt-4 pt-4 border-t border-white/20 flex gap-4 text-sm font-medium opacity-90">
                                <span>Avg. <strong>{dailyVelocity}</strong> pages/day</span>
                                <span>•</span>
                                <span><strong>{finishedThisWeek.length}</strong> books finished</span>
                            </div>
                        </div>
                    </div>

                    {/* 2. FRESH STARTS (Tall Card) */}
                    <div className="md:col-span-2 md:row-span-2 bg-zinc-100 dark:bg-zinc-800 p-6 rounded-3xl flex flex-col items-center justify-center text-center gap-4 border border-zinc-200 dark:border-zinc-700 group hover:border-orange-300 transition-colors">
                        <div className="p-4 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-full group-hover:scale-110 transition-transform duration-300">
                            <Flame size={32} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-5xl font-bold text-text-main">{startedThisWeek.length}</span>
                            <span className="text-text-muted text-xs font-bold uppercase tracking-widest mt-2">Fresh Starts</span>
                        </div>
                        <div className="w-full flex flex-col gap-2 mt-2">
                            {startedThisWeek.slice(0, 3).map(b => (
                                <div key={b.id} className="text-xs text-text-muted truncate px-3 py-1 bg-white dark:bg-zinc-900 rounded-lg shadow-sm">
                                    {b.title}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 3. STYLE PROFILE (Wide Card) */}
                    <div className="md:col-span-2 bg-white dark:bg-zinc-800 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-700 flex flex-col justify-between">
                        <div className="flex items-center gap-2 text-pink-500 font-bold uppercase tracking-wider text-xs mb-2">
                            <Palette size={16} /> Style Profile
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {topStyles.length > 0 ? topStyles.map((item, i) => (
                                <div key={item.tag} className="group relative cursor-help">
                                    <span className={`px-3 py-1.5 rounded-lg text-sm font-bold capitalize inline-block ${i === 0 ? 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300' :
                                        'bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300'
                                        }`}>
                                        {item.tag}
                                    </span>

                                    {/* Tooltip */}
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[200px] hidden group-hover:block z-50 pointer-events-none">
                                        <div className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs p-2 rounded shadow-xl text-center">
                                            {item.titles.slice(0, 5).join(', ')}
                                            {item.titles.length > 5 && ` +${item.titles.length - 5} more`}
                                        </div>
                                        {/* Arrow */}
                                        <div className="w-2 h-2 bg-zinc-900 dark:bg-zinc-100 rotate-45 absolute left-1/2 -translate-x-1/2 -bottom-1"></div>
                                    </div>
                                </div>
                            )) : (
                                <span className="text-text-muted italic text-sm">No distinct styles yet...</span>
                            )}
                        </div>
                    </div>

                    {/* 4. DEEPEST DIVE (Card) */}
                    <div className="md:col-span-2 bg-white dark:bg-zinc-800 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-700 flex flex-col justify-between overflow-hidden relative">
                        <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 font-bold uppercase tracking-wider text-xs relative z-10">
                            <Trophy size={16} /> Deepest Dive
                        </div>
                        {deepestDive ? (
                            <div className="relative z-10 mt-2">
                                <h4 className="font-serif font-bold text-lg text-text-main line-clamp-1">{deepestDive.title}</h4>
                                <p className="text-sm text-text-muted">{deepestDive.pageCount} pages</p>
                            </div>
                        ) : (
                            <div className="relative z-10 mt-2 text-text-muted italic text-sm">No long reads this week.</div>
                        )}
                        <div className="absolute right-0 bottom-0 opacity-5 dark:opacity-10 pointer-events-none transform translate-x-1/4 translate-y-1/4">
                            <BookOpen size={120} />
                        </div>
                    </div>

                    {/* 5. THE GALLERY (Full Width) */}
                    <div className="md:col-span-6 bg-zinc-900 dark:bg-black text-white p-8 rounded-3xl shadow-xl flex flex-col gap-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 opacity-80 font-bold uppercase tracking-wider text-xs">
                                <Library size={18} /> The Gallery ({finishedThisWeek.length})
                            </div>
                        </div>

                        {finishedThisWeek.length > 0 ? (
                            <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide snap-x">
                                {finishedThisWeek.map(book => (
                                    <div key={book.id} className="flex-shrink-0 w-32 flex flex-col gap-3 group snap-start">
                                        <div className="aspect-[2/3] w-full bg-zinc-800 rounded-xl overflow-hidden shadow-md relative transform transition-transform group-hover:-translate-y-2 duration-300">
                                            {book.coverUrl ? (
                                                <img src={book.coverUrl} className="w-full h-full object-cover" alt={book.title} />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-zinc-600">
                                                    <BookOpen />
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-center group-hover:opacity-100 opacity-80 transition-opacity">
                                            <p className="text-xs font-bold truncate text-white">{book.title}</p>
                                            <p className="text-[10px] text-zinc-400 truncate">{book.author}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-8 text-center text-zinc-500 italic">
                                Your gallery stands empty. Finish a book to hang it here.
                            </div>
                        )}
                    </div>

                    {/* 6. WEEKLY NOTE (Wide) */}
                    {notesThisWeek.length > 0 && (
                        <div className="md:col-span-6 bg-[#fffbe8] dark:bg-yellow-900/10 p-8 rounded-3xl border border-yellow-200 dark:border-yellow-900/30 flex flex-col md:flex-row gap-6 items-start md:items-center">
                            <div className="p-4 bg-yellow-400/20 text-yellow-700 dark:text-yellow-400 rounded-full flex-shrink-0">
                                <Quote size={24} />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-xs font-bold text-yellow-800 dark:text-yellow-500 uppercase tracking-widest mb-2">Quote of the Week</h4>
                                <p className="font-serif text-xl md:text-2xl text-yellow-900 dark:text-yellow-100 italic leading-relaxed">
                                    "{notesThisWeek[0].content}"
                                </p>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
