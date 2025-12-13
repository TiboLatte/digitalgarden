'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLibraryStore } from '@/store/useLibraryStore';
import { ProgressBar } from '@/components/ProgressBar';
import { NoteStream } from '@/components/NoteStream';
import { ArrowLeft, BookOpen, Clock, Calendar, Save, Image as ImageIcon, Star, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { BookStatus } from '@/types';
import CoverPickerModal from '@/components/CoverPickerModal';
import { ReviewModal } from '@/components/ReviewModal';

export default function BookDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [isCoverPickerOpen, setIsCoverPickerOpen] = useState(false);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

    // Note Input State
    const [noteContent, setNoteContent] = useState('');
    const [noteType, setNoteType] = useState<'thought' | 'quote'>('thought');
    const [pageRef, setPageRef] = useState('');

    const books = useLibraryStore((state) => state.books);
    const allNotes = useLibraryStore((state) => state.notes);

    const book = books.find((b) => b.id === id);
    const notes = allNotes.filter((n) => n.bookId === id);

    const updateProgress = useLibraryStore((state) => state.updateProgress);
    const setBookStatus = useLibraryStore((state) => state.setBookStatus);
    const addNote = useLibraryStore((state) => state.addNote);
    const removeNote = useLibraryStore((state) => state.removeNote);
    const updateBook = useLibraryStore((state) => state.updateBook);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (mounted && !book) {
            router.push('/library');
        }
    }, [mounted, book, router]);

    if (!mounted || !book) return null;

    const handleNoteSubmit = () => {
        if (!noteContent.trim()) return;

        addNote({
            bookId: book.id,
            content: noteContent,
            type: noteType,
            pageReference: pageRef || undefined,
        });

        setNoteContent('');
        setPageRef('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            handleNoteSubmit();
        }
    };

    const statusOptions: BookStatus[] = ['tbr', 'reading', 'finished', 'abandoned'];

    const handleCoverUpdate = (newUrl: string) => {
        if (book) {
            updateBook(book.id, { coverUrl: newUrl });
            setIsCoverPickerOpen(false);
        }
    };

    const handleReviewSave = (data: { rating: number; review: string; vibes: string[] }) => {
        if (book) {
            updateBook(book.id, {
                status: 'finished',
                dateFinished: new Date().toISOString(),
                ...data
            });
            setIsReviewModalOpen(false);
        }
    };

    const handleStatusChange = (newStatus: BookStatus) => {
        if (newStatus === 'finished') {
            setIsReviewModalOpen(true);
        } else {
            setBookStatus(book.id, newStatus);
        }
    };

    return (
        <div className="min-h-screen bg-background pb-20">
            <CoverPickerModal
                isOpen={isCoverPickerOpen}
                onClose={() => setIsCoverPickerOpen(false)}
                onSelect={handleCoverUpdate}
                initialQuery={book.title}
            />
            {book && (
                <ReviewModal
                    isOpen={isReviewModalOpen}
                    onClose={() => setIsReviewModalOpen(false)}
                    onSave={handleReviewSave}
                    bookTitle={book.title}
                    initialData={{
                        rating: book.rating,
                        review: book.review,
                        vibes: book.vibes
                    }}
                />
            )}

            {/* Top Bar */}
            <div className="px-6 py-4 border-b border-card-border bg-card/50 backdrop-blur-sm sticky top-0 z-40 flex items-center gap-4">
                <button
                    onClick={() => router.back()}
                    className="text-text-muted hover:text-text-main transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-lg font-serif font-bold text-text-main truncate line-clamp-1 flex-1">
                    {book.title}
                </h1>
            </div>

            <div className="max-w-5xl mx-auto w-full px-6 py-8 grid grid-cols-1 md:grid-cols-3 gap-12">

                {/* Left Column: Book Info */}
                <div className="flex flex-col gap-6">
                    <div className="aspect-[2/3] w-full max-w-[240px] mx-auto md:mx-0 rounded-lg shadow-lg bg-card border-4 border-card-border overflow-hidden relative group cursor-pointer" onClick={() => setIsCoverPickerOpen(true)}>
                        {book.coverUrl ? (
                            <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center p-4 text-center bg-accent/10 text-text-muted font-serif italic">
                                <BookOpen size={48} className="mb-2 opacity-50" />
                                <span className="text-xs font-bold uppercase tracking-wide block">No Cover</span>
                            </div>
                        )}

                        {/* Edit Overlay */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-2 backdrop-blur-[1px]">
                            <ImageIcon size={24} />
                            <span className="text-xs font-bold uppercase tracking-wider">Change Cover</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <h2 className="text-2xl font-serif font-bold leading-tight">{book.title}</h2>
                        <p className="text-text-muted font-medium">{book.author}</p>
                    </div>

                    {/* Rating & Review Trigger */}
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                    key={star}
                                    size={20}
                                    className={`${(book.rating || 0) >= star ? 'fill-yellow-400 text-yellow-500' : 'text-card-border fill-transparent'}`}
                                />
                            ))}
                            {book.rating ? (
                                <span className="text-xs font-bold text-text-muted ml-2">({book.rating}/5)</span>
                            ) : (
                                <span className="text-xs text-text-muted ml-2 italic">Not rated</span>
                            )}
                        </div>
                        <button
                            onClick={() => setIsReviewModalOpen(true)}
                            className="text-xs font-bold uppercase tracking-wider text-emerald-600 hover:text-emerald-700 transition-colors text-left flex items-center gap-1"
                        >
                            <Sparkles size={14} /> {book.review ? 'Edit Review' : 'Add Review'}
                        </button>
                    </div>

                    {/* Status */}
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Status</label>
                        <select
                            value={book.status}
                            onChange={(e) => handleStatusChange(e.target.value as BookStatus)}
                            className="w-full p-2 rounded-lg bg-card border border-card-border text-text-main font-medium focus:ring-1 focus:ring-accent outline-none"
                        >
                            {statusOptions.map(opt => (
                                <option key={opt} value={opt} className="capitalize">{opt === 'tbr' ? 'To Be Read' : opt}</option>
                            ))}
                        </select>
                    </div>

                    {/* Stats */}
                    <div className="flex flex-col gap-3 py-4 border-t border-card-border">
                        <div className="flex items-center gap-3 text-sm text-text-muted">
                            <BookOpen size={16} />
                            <span>{book.pageCount} pages</span>
                        </div>
                        {book.dateStarted && (
                            <div className="flex items-center gap-3 text-sm text-text-muted">
                                <Calendar size={16} />
                                <span>Started {new Date(book.dateStarted).toLocaleDateString()}</span>
                            </div>
                        )}
                        {book.dateFinished && (
                            <div className="flex items-center gap-3 text-sm text-text-muted">
                                <Clock size={16} />
                                <span>Finished {new Date(book.dateFinished).toLocaleDateString()}</span>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => {
                            if (confirm('Are you sure you want to remove this book from your library?')) {
                                useLibraryStore.getState().removeBook(book.id);
                                router.push('/library');
                            }
                        }}
                        className="text-red-500 text-sm font-bold uppercase tracking-wider hover:text-red-600 transition-colors text-left flex items-center gap-2"
                    >
                        Remove Book
                    </button>
                </div>

                {/* Right Column: Active Reading */}
                <div className="md:col-span-2 flex flex-col gap-10">

                    {/* Progress */}
                    <div className="bg-card p-6 rounded-xl border border-card-border shadow-sm flex flex-col gap-4">
                        <h3 className="text-lg font-bold font-serif">Current Progress</h3>
                        <ProgressBar
                            value={book.progress}
                            max={book.pageCount}
                            onChange={(val) => updateProgress(book.id, val)}
                        />
                        {book.status === 'reading' && book.progress === book.pageCount && (
                            <button
                                onClick={() => setIsReviewModalOpen(true)}
                                className="w-full py-4 mt-4 bg-emerald-600 text-white rounded-xl shadow-lg hover:bg-emerald-700 hover:shadow-xl hover:scale-[1.02] transition-all transform flex items-center justify-center gap-3 text-lg font-bold animate-pulse group"
                            >
                                <span className="text-2xl group-hover:rotate-12 transition-transform">🎉</span>
                                <span>The End! Do you want to mark it as finished?</span>
                            </button>
                        )}
                    </div>

                    {/* Add Note */}
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold font-serif">Insights & Notes</h3>
                            <div className="flex bg-card rounded-lg border border-card-border p-1">
                                <button
                                    onClick={() => setNoteType('thought')}
                                    className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${noteType === 'thought' ? 'bg-text-main text-card' : 'text-text-muted hover:bg-accent/10'}`}
                                >
                                    Thought
                                </button>
                                <button
                                    onClick={() => setNoteType('quote')}
                                    className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${noteType === 'quote' ? 'bg-text-main text-card' : 'text-text-muted hover:bg-accent/10'}`}
                                >
                                    Quote
                                </button>
                            </div>
                        </div>

                        <div className="bg-card p-4 rounded-xl border border-card-border shadow-sm focus-within:ring-2 focus-within:ring-black/5 transition-all">
                            <textarea
                                value={noteContent}
                                onChange={(e) => setNoteContent(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder={noteType === 'quote' ? 'Paste a quote here...' : 'What are you thinking?'}
                                className={`w-full bg-transparent border-none outline-none resize-none min-h-[100px] ${noteType === 'quote' ? 'font-serif italic text-lg' : 'font-sans'}`}
                            />
                            <div className="flex items-center justify-between mt-4 border-t border-card-border pt-3">
                                <input
                                    type="text"
                                    value={pageRef}
                                    onChange={(e) => setPageRef(e.target.value)}
                                    placeholder="Page (e.g. 42)"
                                    className="text-xs bg-transparent outline-none text-text-muted w-32"
                                />
                                <button
                                    onClick={handleNoteSubmit}
                                    disabled={!noteContent.trim()}
                                    className="flex items-center gap-2 px-4 py-2 bg-text-main text-card rounded-lg hover:bg-text-main/90 transition disabled:opacity-50 disabled:cursor-not-allowed text-xs font-bold uppercase tracking-wider"
                                >
                                    <Save size={16} /> Save Note
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Note Stream */}
                    <NoteStream
                        notes={notes}
                        onDelete={(noteId) => {
                            if (confirm('Delete this note?')) {
                                removeNote(noteId);
                            }
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
