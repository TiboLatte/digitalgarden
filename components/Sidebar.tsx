'use client';

import { createClient } from '@/lib/supabase';
import { useLibraryStore } from '@/store/useLibraryStore';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LayoutGrid, Library, User, BookOpen, Calendar, LogOut, LogIn } from 'lucide-react';

export function Sidebar() {
    const router = useRouter();
    const supabase = createClient();
    const user = useLibraryStore((state) => state.user);
    // Derived state: guest user has empty email
    const isLoggedIn = !!user.email;

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        // Force reload to clear persisted store state and reset to Guest
        window.location.href = '/';
    };

    return (
        <aside className="w-64 border-r border-card-border bg-card hidden md:flex flex-col p-6 gap-6 sticky top-0 h-screen shrink-0 text-text-main">
            <div className="flex items-center gap-2 text-text-main mb-4">
                <BookOpen className="text-text-main" size={24} />
                <h1 className="font-serif font-bold text-xl tracking-tight">Digital Garden</h1>
            </div>

            <nav className="flex flex-col gap-2 flex-1">
                <Link href="/" className="flex items-center gap-3 px-3 py-2 rounded-lg text-text-muted hover:bg-accent/10 hover:text-text-main transition-colors">
                    <LayoutGrid size={20} />
                    <span className="text-sm font-medium">Dashboard</span>
                </Link>
                <Link href="/library" className="flex items-center gap-3 px-3 py-2 rounded-lg text-text-muted hover:bg-accent/10 hover:text-text-main transition-colors">
                    <Library size={20} />
                    <span className="text-sm font-medium">Library</span>
                </Link>

                <Link href="/digest" className="flex items-center gap-3 px-3 py-2 rounded-lg text-text-muted hover:bg-accent/10 hover:text-text-main transition-colors">
                    <Calendar size={20} />
                    <span className="text-sm font-medium">Rewind</span>
                </Link>

                <Link href="/profile" className="flex items-center gap-3 px-3 py-2 rounded-lg text-text-muted hover:bg-accent/10 hover:text-text-main transition-colors">
                    <User size={20} />
                    <span className="text-sm font-medium">Profile</span>
                </Link>
            </nav>

            <div className="pt-4 border-t border-card-border">
                {isLoggedIn ? (
                    <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors text-left font-medium"
                    >
                        <LogOut size={20} />
                        <span className="text-sm">Disconnect</span>
                    </button>
                ) : (
                    <Link
                        href="/login"
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors font-medium"
                    >
                        <LogIn size={20} />
                        <span className="text-sm">Log In</span>
                    </Link>
                )}
            </div>
        </aside>
    );
}
