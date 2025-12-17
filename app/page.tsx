'use client';

import { useEffect, useState } from 'react';
import { useLibraryStore } from '@/store/useLibraryStore';
import { BookCard } from '@/components/BookCard';
import { SearchModal } from '@/components/SearchModal';
import { Sparkles, MoveRight, Plus, X, Maximize2 } from 'lucide-react';
import Link from 'next/link';
import { Note } from '@/types';

export default function Dashboard() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // ... (rest of state)
  const books = useLibraryStore((state) => state.books);
  const notes = useLibraryStore((state) => state.notes);
  const user = useLibraryStore((state) => state.user);
  const isLoading = useLibraryStore((state) => state.isLoading);
  const addBook = useLibraryStore((state) => state.addBook);
  const addNote = useLibraryStore((state) => state.addNote);

  useEffect(() => {
    setMounted(true);

    // Seed Data if empty
    const state = useLibraryStore.getState();
    if (state.books.length === 0) {
      // Seed
      const gatsbyId = crypto.randomUUID();
      state.addBook({
        id: gatsbyId,
        title: "The Great Gatsby",
        author: "F. Scott Fitzgerald",
        coverUrl: "https://upload.wikimedia.org/wikipedia/commons/7/7a/The_Great_Gatsby_Cover_1925_Retouched.jpg",
        pageCount: 180,
        status: 'finished',
        progress: 180,
        tags: ['Classic', 'Fiction'],
        dateStarted: new Date(Date.now() - 1000000000).toISOString(),
        dateFinished: new Date().toISOString()
      });
      state.addNote({
        bookId: gatsbyId,
        content: "So we beat on, boats against the current, borne back ceaselessly into the past.",
        type: "quote",
        pageReference: "p. 180"
      });
    }
  }, []);

  const readingBooks = books.filter(b => b.status === 'reading');

  // Serendipity Logic
  const finishedBooksIds = books.filter(b => b.status === 'finished').map(b => b.id);
  const eligibleNotes = notes
    .filter(n => finishedBooksIds.includes(n.bookId))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); // Newest first

  const displayedNotes = eligibleNotes.slice(0, 5);

  if (!mounted) return <div className="p-10 text-center">Loading Garden...</div>;




  return (
    <main className="flex-1 flex flex-col items-center bg-background min-h-screen pb-20">
      <div className="w-full max-w-5xl px-6 md:px-12 py-12 flex flex-col gap-12">

        {/* Header */}
        <section className="flex flex-col gap-4 text-center items-center relative">

          <div id="debug-info" className="bg-red-100 text-red-900 p-2 rounded text-xs">
            DEBUG: Email=[{user?.email}] Name=[{user?.name}] Loading=[{isLoading ? 'T' : 'F'}]
          </div>

          <h1 className="text-5xl md:text-6xl font-serif font-medium leading-tight tracking-tight text-text-main">
            Good Afternoon, {(user?.name && user.name !== "Guest") ? user.name.split(' ')[0] : (user?.email ? user.email.split('@')[0] : 'Reader')}
          </h1>
          <div className="flex items-center gap-2 text-text-muted">
            <Sparkles size={16} />
            <p className="text-lg font-normal">Your garden is growing beautifully.</p>
          </div>
        </section>

        {/* Currently Reading */}
        <section className="flex flex-col gap-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xl font-serif font-bold tracking-tight text-text-main">Currently Reading</h3>
            <Link href="/library" className="text-sm text-text-muted hover:text-text-main transition-colors flex items-center gap-1">
              View all <MoveRight size={16} />
            </Link>
          </div>

          {readingBooks.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-8">
              {readingBooks.map(book => (
                <BookCard key={book.id} book={book} />
              ))}

              {/* Add Book Card Placeholder */}
              <button
                onClick={() => setIsSearchOpen(true)}
                className="group flex flex-col items-center justify-center gap-3 aspect-[2/3] border-2 border-dashed border-card-border rounded-lg hover:border-accent hover:bg-accent/5 transition-all text-text-muted hover:text-text-main"
              >
                <Plus size={32} />
                <span className="font-serif font-medium">Add Book</span>
              </button>
            </div>
          ) : (
            <div className="text-center py-12 border border-dashed border-card-border rounded-lg bg-card/50">
              <p className="text-text-muted mb-4">You are not reading anything right now.</p>
              <button
                onClick={() => setIsSearchOpen(true)}
                className="px-4 py-2 bg-text-main text-card font-bold rounded-md hover:bg-text-main/90 transition shadow-sm"
              >
                Start a Book
              </button>
            </div>
          )}
        </section>

        {/* Serendipity */}
        {eligibleNotes.length > 0 && (
          <section className="mt-8 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-text-muted uppercase tracking-widest text-xs font-bold">
                <Sparkles size={14} /> Serendipity ({eligibleNotes.length})
              </div>

              {eligibleNotes.length > 5 && (
                <button
                  onClick={() => setIsExpanded(true)}
                  className="text-xs font-bold uppercase tracking-wider text-text-muted hover:text-accent transition-colors flex items-center gap-1"
                >
                  Expand <Maximize2 size={12} />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedNotes.map((note) => {
                const book = books.find(b => b.id === note.bookId);
                if (!book) return null;
                return (
                  <div key={note.id} className="group flex flex-col justify-between p-6 rounded-xl border border-card-border bg-card shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
                    <blockquote className={`leading-relaxed text-text-main mb-4 ${note.type === 'quote'
                      ? 'font-serif italic text-lg'
                      : 'font-sans not-italic text-base opacity-90'
                      }`}>
                      {note.type === 'quote' ? `"${note.content}"` : note.content}
                    </blockquote>

                    <div className="flex flex-col gap-1 border-t border-card-border pt-4">
                      <cite className="text-text-main font-bold not-italic text-xs tracking-wide truncate">{book.title}</cite>
                      <span className="text-text-muted text-[10px] uppercase tracking-wider">{book.author}</span>
                      <span className="text-[10px] text-zinc-400 mt-1">{new Date(note.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            {eligibleNotes.length === 0 && (
              <div className="text-center p-8 text-text-muted italic">
                Not enough notes to spark serendipity yet. Read and annotate more!
              </div>
            )}

            {/* Expanded Modal Overlay */}
            {isExpanded && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-300" onClick={(e) => {
                if (e.target === e.currentTarget) setIsExpanded(false);
              }}>
                <div className="bg-card w-full max-w-5xl h-[85vh] rounded-2xl shadow-2xl border border-card-border flex flex-col relative animate-in zoom-in-95 duration-300">
                  <div className="p-6 border-b border-card-border flex items-center justify-between bg-card rounded-t-2xl z-10 sticky top-0">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-accent/10 rounded-full text-accent">
                        <Sparkles size={20} />
                      </div>
                      <h2 className="text-xl font-serif font-bold text-text-main">All Serendipity Notes</h2>
                      <span className="bg-zinc-100 dark:bg-zinc-800 text-text-muted text-xs font-bold px-2 py-1 rounded-full">{eligibleNotes.length} notes</span>
                    </div>
                    <button onClick={() => setIsExpanded(false)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors text-text-muted hover:text-text-main">
                      <X size={20} />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 align-start content-start">
                    {eligibleNotes.map((note) => {
                      const book = books.find(b => b.id === note.bookId);
                      if (!book) return null;
                      return (
                        <div key={note.id} className="flex flex-col justify-between p-6 rounded-xl border border-card-border bg-card/50 shadow-sm hover:border-accent/50 transition-colors h-fit break-inside-avoid">
                          <blockquote className={`leading-relaxed text-text-main mb-4 ${note.type === 'quote'
                            ? 'font-serif italic text-lg'
                            : 'font-sans not-italic text-base opacity-90'
                            }`}>                       {note.type === 'quote' ? `"${note.content}"` : note.content}
                          </blockquote>

                          <div className="flex flex-col gap-1 border-t border-card-border pt-4 mt-auto">
                            <cite className="text-text-main font-bold not-italic text-xs tracking-wide truncate">{book.title}</cite>
                            <span className="text-text-muted text-[10px] uppercase tracking-wider">{book.author}</span>
                            <span className="text-[10px] text-zinc-400 mt-1">{new Date(note.createdAt).toLocaleDateString()} {new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

      </div>


      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </main>
  );
}
