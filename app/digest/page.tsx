'use client';

import { Sparkles, BookOpen, PenTool, Mountain, Quote, Trophy, Library, Palette, TrendingUp, Timer, Activity, Sun, Sunrise, Moon } from 'lucide-react';
import { useLibraryStore } from '@/store/useLibraryStore';

export default function MonthlyRewindPage() {
    const books = useLibraryStore((state) => state.books);
    const notes = useLibraryStore((state) => state.notes);

    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    // --- DATA GATHERING ---

    const finishedThisMonth = books.filter(b =>
        b.status === 'finished' &&
        b.dateFinished &&
        new Date(b.dateFinished) > oneMonthAgo
    );

    const startedThisMonth = books.filter(b =>
        b.dateStarted &&
        new Date(b.dateStarted) > oneMonthAgo
    );

    const notesThisMonth = notes.filter(n =>
        new Date(n.createdAt) > oneMonthAgo
    );

    // --- TREND ANALYSIS ---
    const pagesConquered = finishedThisMonth.reduce((acc, book) => acc + (book.pageCount || 0), 0);

    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

    const finishedLastMonth = books.filter(b =>
        b.status === 'finished' &&
        b.dateFinished &&
        new Date(b.dateFinished) > twoMonthsAgo &&
        new Date(b.dateFinished) <= oneMonthAgo
    );

    const pagesLastMonth = finishedLastMonth.reduce((acc, book) => acc + (book.pageCount || 0), 0);
    const trendDiff = pagesConquered - pagesLastMonth;
    const trendPercent = pagesLastMonth > 0 ? Math.round((trendDiff / pagesLastMonth) * 100) : 100;

    // --- TIME INVESTMENT ---
    const readingSpeedMinPerPage = 2; // Average speed
    const totalMinutes = pagesConquered * readingSpeedMinPerPage;
    const hoursInvested = Math.floor(totalMinutes / 60);
    const minutesInvested = totalMinutes % 60;

    // --- WORDS CONSUMED ---
    const wordsPerBookPage = 275;
    const wordsConsumed = pagesConquered * wordsPerBookPage;

    // --- DAILY RHYTHM ---
    const noteTimes = notesThisMonth.map(n => new Date(n.createdAt).getHours());

    let morning = 0, afternoon = 0, evening = 0;
    noteTimes.forEach(h => {
        if (h >= 5 && h < 12) morning++;
        else if (h >= 12 && h < 18) afternoon++;
        else evening++;
    });

    let rhythm = "Balanced Reader";
    let rhythmIcon = Activity;
    if (morning > afternoon && morning > evening) {
        rhythm = "Early Bird";
        rhythmIcon = Sunrise;
    } else if (afternoon > morning && afternoon > evening) {
        rhythm = "Daydreamer";
        rhythmIcon = Sun;
    } else if (evening > morning && evening > afternoon) {
        rhythm = "Night Owl";
        rhythmIcon = Moon;
    }



    // --- STATS CALCULATIONS ---

    const dailyVelocity = Math.round(pagesConquered / 30);

    // Deepest Dive (Longest Book)
    const deepestDive = [...finishedThisMonth].sort((a, b) => (b.pageCount || 0) - (a.pageCount || 0))[0];

    // Style Profile (Tags)
    const readingBooks = books.filter(b => b.status === 'reading');
    const sourceBooks = [...finishedThisMonth, ...readingBooks];

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

    // Generate colors for mood ring
    const moodColors = [
        'bg-rose-400', 'bg-orange-400', 'bg-amber-400', 'bg-green-400', 'bg-emerald-400',
        'bg-teal-400', 'bg-cyan-400', 'bg-sky-400', 'bg-indigo-400', 'bg-purple-400'
    ];


    return (
        <div className="flex-1 min-h-screen bg-background p-4 md:p-10 pb-20">
            <div className="max-w-4xl mx-auto bg-card rounded-[2rem] shadow-sm border border-card-border overflow-hidden transition-colors duration-500">

                {/* --- HEADER --- */}
                <div className="relative p-10 pb-6 text-center overflow-hidden bg-card">
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent/10 via-transparent to-transparent opacity-50"></div>

                    <div className="relative z-10 flex flex-col items-center gap-4">
                        <div className="bg-gradient-to-tr from-accent to-accent/50 p-4 rounded-3xl shadow-lg text-white mb-2 animate-bounce-slow">
                            <Sparkles size={32} />
                        </div>
                        <h2 className="text-4xl md:text-5xl font-serif font-black text-text-main tracking-tight">Monthly Rewind</h2>
                        <p className="text-text-muted font-medium tracking-widest text-sm uppercase">
                            {oneMonthAgo.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                        </p>


                    </div>
                </div>

                {/* --- BENTO GRID --- */}
                <div className="p-8 pt-0 grid grid-cols-1 md:grid-cols-6 gap-6">

                    {/* 1. TOTAL VOLUME (Large Card) */}
                    <div className="md:col-span-4 bg-gradient-to-br from-accent to-accent/70 text-card p-8 rounded-3xl shadow-lg relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-32 bg-white/20 rounded-full blur-3xl -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-700"></div>
                        <div className="relative z-10 flex flex-col h-full justify-between">
                            <div className="flex items-center justify-between opacity-80 font-bold uppercase tracking-wider text-xs">
                                <div className="flex items-center gap-2">
                                    <Mountain size={18} /> Total Volume
                                </div>
                                {trendDiff !== 0 && (
                                    <div className="flex items-center gap-1 bg-white/20 px-2 py-1 rounded-lg">
                                        <TrendingUp size={14} className={trendDiff < 0 ? 'rotate-180' : ''} />
                                        <span>{trendDiff > 0 ? '+' : ''}{trendPercent}%</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-baseline gap-2 mt-4">
                                <span className="text-6xl md:text-7xl font-serif font-bold">{pagesConquered}</span>
                                <span className="text-xl opacity-80 font-medium">pages</span>
                            </div>
                            <div className="mt-4 pt-4 border-t border-black/10 flex gap-4 text-sm font-medium opacity-90">
                                <span>Avg. <strong>{dailyVelocity}</strong> pages/day</span>
                                <span>•</span>
                                <span><strong>{finishedThisMonth.length}</strong> books finished</span>
                            </div>
                        </div>
                    </div>

                    {/* 2. TIME INVESTED (New Card) */}
                    <div className="md:col-span-2 bg-card p-6 rounded-3xl border border-card-border flex flex-col justify-between group hover:border-accent/50 transition-colors">
                        <div className="flex items-center gap-2 text-accent font-bold uppercase tracking-wider text-xs">
                            <Timer size={16} /> Time Invested
                        </div>
                        <div className="flex flex-col mt-4">
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-bold text-text-main">{hoursInvested}</span>
                                <span className="text-sm text-text-muted font-bold">hrs</span>
                                <span className="text-4xl font-bold text-text-main ml-2">{minutesInvested}</span>
                                <span className="text-sm text-text-muted font-bold">min</span>
                            </div>
                            <p className="text-xs text-text-muted mt-2">
                                Based on avg speed. That's {(totalMinutes / 60 / 24 / 30 * 100).toFixed(1)}% of your month!
                            </p>
                        </div>
                    </div>

                    {/* 3. FRESH STARTS (Tall Card) */}
                    <div className="md:col-span-2 md:row-span-2 bg-card p-6 rounded-3xl flex flex-col items-center justify-center text-center gap-4 border border-card-border group hover:border-accent transition-colors">
                        <div className="p-4 bg-accent/10 text-accent rounded-full group-hover:scale-110 transition-transform duration-300">
                            <Activity size={32} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-5xl font-bold text-text-main">{startedThisMonth.length}</span>
                            <span className="text-text-muted text-xs font-bold uppercase tracking-widest mt-2">Fresh Starts</span>
                        </div>
                        <div className="w-full flex flex-col gap-2 mt-2">
                            {startedThisMonth.slice(0, 3).map(b => (
                                <div key={b.id} className="text-xs text-text-muted truncate px-3 py-1 bg-accent/5 rounded-lg shadow-sm">
                                    {b.title}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 4. WORDS CONSUMED (New Card) */}
                    <div className="md:col-span-2 bg-text-main text-card p-6 rounded-3xl border border-card-border flex flex-col justify-between group hover:scale-[1.02] transition-transform">
                        <div className="flex items-center gap-2 opacity-80 font-bold uppercase tracking-wider text-xs">
                            <PenTool size={16} /> Words Consumed
                        </div>
                        <div className="flex flex-col mt-4">
                            <span className="text-4xl md:text-5xl font-serif font-bold">
                                {(wordsConsumed / 1000).toFixed(1)}k
                            </span>
                            <span className="text-xs opacity-70 mt-1 uppercase tracking-widest font-bold">Estimated Words</span>
                        </div>
                    </div>

                    {/* 5. DAILY RHYTHM (New Card) */}
                    <div className="md:col-span-2 bg-card p-6 rounded-3xl border border-card-border flex flex-col justify-between group hover:border-accent/50 transition-colors">
                        <div className="flex items-center gap-2 text-accent font-bold uppercase tracking-wider text-xs">
                            <Activity size={16} /> Daily Rhythm
                        </div>
                        <div className="flex flex-col items-center py-2">
                            {/* Icon rendered dynamically */}
                            <div className="p-3 bg-accent/10 text-accent rounded-full mb-2">
                                {/* We treat rhythmIcon as a component */}
                                {/* Direct usage like <rhythmIcon /> won't work easily in basic JSX without assignment, so let's simplify */}
                                {rhythm === "Early Bird" && <Sunrise size={32} />}
                                {rhythm === "Daydreamer" && <Sun size={32} />}
                                {rhythm === "Night Owl" && <Moon size={32} />}
                                {rhythm === "Balanced Reader" && <Activity size={32} />}
                            </div>
                            <span className="text-xl font-bold text-text-main">{rhythm}</span>
                            <span className="text-xs text-text-muted">Most active time</span>
                        </div>
                    </div>

                    {/* 6. STYLE PROFILE (Restored) */}
                    <div className="md:col-span-2 bg-card p-6 rounded-3xl border border-card-border flex flex-col justify-between hover:border-accent/50 transition-colors">
                        <div className="flex items-center gap-2 text-accent font-bold uppercase tracking-wider text-xs mb-2">
                            <Palette size={16} /> Style Profile
                        </div>
                        <div className="flex flex-wrap gap-2 content-start">
                            {topStyles.length > 0 ? topStyles.map((item, i) => (
                                <div key={item.tag} className="group relative cursor-help">
                                    <span className={`px-3 py-1.5 rounded-lg text-sm font-bold capitalize inline-block ${i === 0 ? 'bg-accent/20 text-accent' :
                                        'bg-accent/5 text-text-muted'
                                        }`}>
                                        {item.tag}
                                    </span>
                                    {/* Tooltip */}
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[200px] hidden group-hover:block z-50 pointer-events-none">
                                        <div className="bg-card border border-card-border text-text-main text-xs p-2 rounded shadow-xl text-center">
                                            {item.titles.slice(0, 5).join(', ')}
                                            {item.titles.length > 5 && ` +${item.titles.length - 5} more`}
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <span className="text-text-muted italic text-sm">No distinct styles yet...</span>
                            )}
                        </div>
                    </div>

                    {/* 4. DEEPEST DIVE (Card) */}
                    <div className="md:col-span-2 bg-card p-6 rounded-3xl border border-card-border flex flex-col justify-between overflow-hidden relative hover:border-accent/50 transition-colors">
                        <div className="flex items-center gap-2 text-accent font-bold uppercase tracking-wider text-xs relative z-10">
                            <Trophy size={16} /> Deepest Dive
                        </div>
                        {deepestDive ? (
                            <div className="relative z-10 mt-2">
                                <h4 className="font-serif font-bold text-lg text-text-main line-clamp-1">{deepestDive.title}</h4>
                                <p className="text-sm text-text-muted">{deepestDive.pageCount} pages</p>
                            </div>
                        ) : (
                            <div className="relative z-10 mt-2 text-text-muted italic text-sm">No long reads this month.</div>
                        )}
                        <div className="absolute right-0 bottom-0 opacity-5 pointer-events-none transform translate-x-1/4 translate-y-1/4 text-text-main">
                            <BookOpen size={120} />
                        </div>
                    </div>

                    {/* 5. THE GALLERY (Full Width) */}
                    <div className="md:col-span-6 bg-accent text-card p-8 rounded-3xl shadow-xl flex flex-col gap-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 opacity-95 font-bold uppercase tracking-wider text-xs">
                                <Library size={18} /> The End ({finishedThisMonth.length})
                            </div>
                        </div>

                        {finishedThisMonth.length > 0 ? (
                            <div className="flex gap-6 overflow-x-auto pb-4 snap-x">
                                {finishedThisMonth.map(book => (
                                    <div key={book.id} className="flex-shrink-0 w-32 flex flex-col gap-3 group snap-start">
                                        <div className="aspect-[2/3] w-full bg-card/10 rounded-xl overflow-hidden shadow-md relative transform transition-transform group-hover:-translate-y-2 duration-300 border border-white/20">
                                            {book.coverUrl ? (
                                                <img src={book.coverUrl} className="w-full h-full object-cover" alt={book.title} />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-card/50">
                                                    <BookOpen />
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-center group-hover:opacity-100 opacity-80 transition-opacity">
                                            <p className="text-xs font-bold truncate text-card">{book.title}</p>
                                            <p className="text-[10px] text-card/70 truncate">{book.author}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-8 text-center text-card/80 italic">
                                Your gallery stands empty. Finish a book to hang it here.
                            </div>
                        )}
                    </div>

                    {/* 6. MONTHLY NOTE (Wide) */}
                    {notesThisMonth.length > 0 && (
                        <div className="md:col-span-6 bg-accent/10 p-8 rounded-3xl border border-accent/20 flex flex-col md:flex-row gap-6 items-start md:items-center">
                            <div className="p-4 bg-accent/20 text-accent rounded-full flex-shrink-0">
                                <Quote size={24} />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-xs font-bold text-accent uppercase tracking-widest mb-2">Quote of the Month</h4>
                                <p className="font-serif text-xl md:text-2xl text-text-main italic leading-relaxed">
                                    "{notesThisMonth[0].content}"
                                </p>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
