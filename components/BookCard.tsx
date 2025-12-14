import { Book } from '@/types';
import Link from 'next/link';
import { getSecureCoverUrl } from '@/utils/imageUtils';
import { useState } from 'react';

interface BookCardProps {
    book: Book;
}

export function BookCard({ book }: BookCardProps) {
    const [imgError, setImgError] = useState(false);
    const percent = book.pageCount > 0 ? Math.round((book.progress / book.pageCount) * 100) : 0;

    // Helper to upgrade image quality on the fly
    const secureCoverUrl = getSecureCoverUrl(book.coverUrl);

    const getDisplayUrl = () => {
        if (imgError) {
            // Fallback 1: Open Library
            if (book.isbn) {
                return `https://covers.openlibrary.org/b/isbn/${book.isbn}-L.jpg`;
            }
            // Fallback 2: Placeholder
            return 'https://placehold.co/400x600/e2e8f0/475569?text=No+Cover';
        }
        return secureCoverUrl || (book.isbn ? `https://covers.openlibrary.org/b/isbn/${book.isbn}-L.jpg` : 'https://placehold.co/400x600/e2e8f0/475569?text=No+Cover');
    };

    return (
        <Link href={`/book/${book.id}`} className="group flex flex-col gap-3 transition-all duration-300 hover:-translate-y-1">
            <div className="relative w-full aspect-[2/3] shadow-md group-hover:shadow-xl rounded-r-md rounded-l-sm bg-card-border overflow-hidden transition-shadow duration-300">
                <div className="absolute inset-y-0 left-0 w-1.5 bg-black/5 z-10 mix-blend-multiply"></div>

                {/* Image Logic */}
                <img
                    src={getDisplayUrl()}
                    alt={book.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => {
                        const target = e.currentTarget;
                        // Prevent infinite loop if fallback also fails
                        if (target.src.includes('placehold.co')) return;
                        setImgError(true);
                    }}
                />

                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300"></div>
            </div>

            <div className="space-y-2">
                <div>
                    <h3 className="text-lg font-serif font-semibold leading-tight group-hover:text-text-muted transition-colors line-clamp-1">{book.title}</h3>
                    <p className="text-text-muted text-sm font-normal">{book.author}</p>
                </div>

                {book.status === 'reading' && (
                    <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between text-xs text-text-muted">
                            <span>Progress</span>
                            <span>{percent}%</span>
                        </div>
                        <div className="w-full bg-card-border h-1 rounded-full overflow-hidden">
                            <div className="bg-accent h-full rounded-full transition-all duration-300" style={{ width: `${percent}%` }}></div>
                        </div>
                    </div>
                )}
                {book.status === 'finished' && (
                    <div className="flex items-center gap-1">
                        <span className="inline-block w-2 h-2 rounded-full bg-accent"></span>
                        <span className="text-xs text-text-muted font-medium uppercase tracking-wider">Finished</span>
                    </div>
                )}
            </div>
        </Link>
    );
}
