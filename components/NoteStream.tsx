import { Note } from '@/types';
import { Trash2 } from 'lucide-react';

interface NoteStreamProps {
    notes: Note[];
    onDelete?: (id: string) => void;
}

export function NoteStream({ notes, onDelete }: NoteStreamProps) {
    if (notes.length === 0) {
        return <div className="text-center text-text-muted py-8 italic">No notes yet. Start writing...</div>;
    }

    // Sort notes by date descending
    const sortedNotes = [...notes].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return (
        <div className="flex flex-col gap-6">
            {sortedNotes.map(note => (
                <div key={note.id} className="group flex flex-col gap-2 p-6 bg-card border border-card-border rounded-lg shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300 relative">
                    <div className="flex items-center justify-between text-xs text-text-muted uppercase tracking-wider font-bold">
                        <span className={`px-2 py-0.5 rounded-full ${note.type === 'quote' ? 'bg-accent/20 text-text-main' : 'bg-accent/5 text-text-muted'}`}>
                            {note.type}
                        </span>
                        <div className="flex items-center gap-3">
                            <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                            {onDelete && (
                                <button
                                    onClick={() => onDelete(note.id)}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-600 p-1"
                                    title="Delete Note"
                                >
                                    <Trash2 size={14} />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className={`whitespace-pre-wrap leading-relaxed ${note.type === 'quote' ? 'font-serif text-lg italic text-text-main' : 'font-sans text-base text-text-muted'}`}>
                        {note.type === 'quote' ? `"${note.content}"` : note.content}
                    </div>

                    {note.pageReference && (
                        <div className="mt-2 text-xs text-text-muted font-medium">
                            Ref: {note.pageReference}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
