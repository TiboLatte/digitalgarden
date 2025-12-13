'use client';

interface RecCardProps {
    book: {
        title: string;
        author: string;
        coverUrl?: string;
        description?: string;
        matchScore?: number; // 0-1 (from vector engine)
        rating?: number;
    };
    onAdd: () => void;
}

export function RecommendationCard({ book, onAdd }: RecCardProps) {
    const score = Math.round((book.matchScore || 0) * 100);

    // Determine color based on score
    const scoreColor = score > 80 ? 'text-emerald-500' : score > 60 ? 'text-yellow-500' : 'text-zinc-400';

    return (
        <div className="group relative flex flex-col bg-card border border-card-border rounded-xl shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 h-full">
            <div className="aspect-[2/3] w-full overflow-hidden bg-zinc-100 relative rounded-t-xl">
                {/* Match Badge */}
                {book.matchScore !== undefined && (
                    <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-md text-white text-xs font-bold px-2 py-1 rounded-full z-10 flex items-center gap-1 shadow-lg border border-white/10">
                        <span className={scoreColor}>●</span> {score}%
                    </div>
                )}

                {book.coverUrl ? (
                    <img
                        src={book.coverUrl}
                        alt={book.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-text-muted text-xs p-4 text-center">
                        No Cover
                    </div>
                )}

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4">
                    <button
                        onClick={onAdd}
                        className="bg-white text-black font-bold py-2 px-6 rounded-full transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 shadow-xl"
                    >
                        Add to Library
                    </button>
                </div>
            </div>

            <div className="p-4 flex flex-col gap-1 flex-1">
                <h3 className="font-serif font-bold text-text-main line-clamp-2 leading-tight" title={book.title}>{book.title}</h3>
                <p className="text-xs text-text-muted uppercase tracking-wider truncate">{book.author}</p>
                {book.description && (
                    <p className="text-xs text-text-muted/80 line-clamp-2 mt-2 leading-relaxed">
                        {book.description}
                    </p>
                )}

                {book.rating && (
                    <div className="flex items-center gap-1 mt-auto pt-2 text-xs font-bold text-amber-500/90">
                        <span className="text-[10px]">⭐</span> {book.rating} / 5
                    </div>
                )}
            </div>
        </div>
    );
}
