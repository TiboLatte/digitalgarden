'use client';

import { useEffect, useState } from 'react';
import { useLibraryStore } from '@/store/useLibraryStore';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const theme = useLibraryStore((state) => state.user.themePreference);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;

        const root = document.documentElement;
        root.classList.remove('light', 'dark', 'sepia', 'rose', 'ocean', 'latte', 'berry', 'midnight', 'galaxy', 'nebula', 'sunrise', 'paper', 'fjord');
        root.classList.add(theme);
    }, [theme, mounted]);

    // Prevent hydration mismatch by rendering children only or handling initial state carefully
    // Since we rely on client store, initial render might be default (light).
    // To avoid flash, we could check localStorage in a script, but for now this is fine.

    return <>{children}</>;
}
