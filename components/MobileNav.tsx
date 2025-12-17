'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, Library, Calendar, User } from 'lucide-react';

import { useLibraryStore } from '@/store/useLibraryStore';
import { LogIn } from 'lucide-react';

export function MobileNav() {
    const pathname = usePathname();
    const user = useLibraryStore((state) => state.user);
    const isLoggedIn = !!user.email && user.name !== 'Guest';

    const tabs = [
        { href: '/', icon: LayoutGrid, label: 'Home' },
        { href: '/library', icon: Library, label: 'Library' },
        { href: '/digest', icon: Calendar, label: 'Rewind' },
        isLoggedIn
            ? { href: '/profile', icon: User, label: 'Profile' }
            : { href: '/login', icon: LogIn, label: 'Log In' },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/90 backdrop-blur-md border-t border-card-border p-2 pb-safe md:hidden transition-colors duration-500">
            <div className="flex items-center justify-around">
                {tabs.map((tab) => {
                    const isActive = pathname === tab.href;
                    return (
                        <Link
                            key={tab.href}
                            href={tab.href}
                            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300 w-full ${isActive ? 'text-accent' : 'text-text-muted hover:text-text-main'
                                }`}
                        >
                            <div className={`p-1.5 rounded-full transition-all ${isActive ? 'bg-accent/10 transform scale-110' : ''}`}>
                                <tab.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                            </div>
                            <span className={`text-[10px] font-bold tracking-wide ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                                {tab.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
