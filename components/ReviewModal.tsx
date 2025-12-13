'use client';

import { useState, useMemo } from 'react';
import { X, Star, Sparkles, Hash } from 'lucide-react';

interface ReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: { rating: number; review: string; vibes: string[] }) => void;
    bookTitle: string;
    initialData?: { rating?: number; review?: string; vibes?: string[] };
}

const VIBE_OPTIONS = [
    { label: "Dark", emoji: "🌑" },
    { label: "Cozy", emoji: "☕" },
    { label: "Tense", emoji: "⚡" },
    { label: "Inspiring", emoji: "✨" },
    { label: "Fast-Paced", emoji: "🏎️" },
    { label: "Slow Burn", emoji: "🕯️" },
    { label: "Emotional", emoji: "🥹" },
    { label: "Funny", emoji: "😂" },
    { label: "Educational", emoji: "🧠" },
    { label: "Escapist", emoji: "🚀" },
    { label: "Wholesome", emoji: "🥰" },
    { label: "Surreal", emoji: "🌀" }
];

export function ReviewModal({ isOpen, onClose, onSave, bookTitle, initialData }: ReviewModalProps) {
    const [rating, setRating] = useState(initialData?.rating || 0);
    const [review, setReview] = useState(initialData?.review || '');
    const [vibes, setVibes] = useState<string[]>(initialData?.vibes || []);
    const [hoverRating, setHoverRating] = useState(0);

    // Reset when opening fresh if needed, but logic is handled by parent passing initialData

    if (!isOpen) return null;

    const toggleVibe = (vibe: string) => {
        if (vibes.includes(vibe)) {
            setVibes(prev => prev.filter(v => v !== vibe));
        } else {
            if (vibes.length < 5) {
                setVibes(prev => [...prev, vibe]);
            }
        }
    };

    const handleSave = () => {
        onSave({ rating, review, vibes });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-card w-full max-w-lg rounded-2xl shadow-2xl border border-card-border flex flex-col overflow-hidden max-h-[90vh]">

                {/* Header */}
                <div className="p-4 border-b border-card-border flex items-center justify-between bg-accent/5">
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Reviewing</span>
                        <h3 className="text-lg font-serif font-bold text-text-main line-clamp-1">{bookTitle}</h3>
                    </div>
                    <button onClick={onClose} className="text-text-muted hover:text-text-main transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex flex-col gap-6">

                    {/* Rating */}
                    <div className="flex flex-col items-center gap-2">
                        <label className="text-sm font-bold text-text-muted uppercase tracking-wider">Your Rating</label>
                        <div className="flex gap-1" onMouseLeave={() => setHoverRating(0)}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    className="transition-transform hover:scale-110 active:scale-95 focus:outline-none"
                                    onMouseEnter={() => setHoverRating(star)}
                                    onClick={() => setRating(star)}
                                >
                                    <Star
                                        size={32}
                                        className={`${(hoverRating || rating) >= star ? 'fill-yellow-400 text-yellow-500' : 'text-card-border fill-transparent'} transition-colors duration-150`}
                                        strokeWidth={1.5}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Review Text */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-bold text-text-muted uppercase tracking-wider">Thoughts & Opinions</label>
                        <textarea
                            value={review}
                            onChange={(e) => setReview(e.target.value)}
                            placeholder="What did you think? What was memorable?"
                            className="w-full min-h-[120px] p-4 rounded-xl bg-card border border-card-border focus:border-accent focus:ring-1 focus:ring-accent outline-none font-medium resize-none text-text-main placeholder:text-text-muted/50 transition-all"
                        />
                    </div>

                    {/* Vibes */}
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
                                <Sparkles size={14} /> The Vibe <span className="text-xs font-normal opacity-70">(Max 5)</span>
                            </label>
                            <span className="text-xs font-bold text-text-muted">{vibes.length}/5</span>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {VIBE_OPTIONS.map((opt) => {
                                const isSelected = vibes.includes(opt.label);
                                return (
                                    <button
                                        key={opt.label}
                                        onClick={() => toggleVibe(opt.label)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all flex items-center gap-1.5 ${isSelected
                                                ? 'bg-accent text-card border-accent shadow-sm scale-105'
                                                : 'bg-card border-card-border text-text-muted hover:border-accent/50 hover:bg-accent/5'
                                            }`}
                                    >
                                        <span>{opt.emoji}</span>
                                        <span>{opt.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="p-4 border-t border-card-border bg-card flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-text-muted hover:text-text-main transition-colors">
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-6 py-2 bg-text-main text-card rounded-lg text-sm font-bold shadow-md hover:bg-text-main/90 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={rating === 0}
                    >
                        Save Review
                    </button>
                </div>
            </div>
        </div>
    );
}
