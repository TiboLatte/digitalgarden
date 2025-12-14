'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { useLibraryStore } from '@/store/useLibraryStore';
import { useRouter } from 'next/navigation';
import { Sparkles, ArrowRight, Loader2, Lock, Mail } from 'lucide-react';

export default function LoginPage() {
    const supabase = createClient();
    const router = useRouter();

    const [isSignUp, setIsSignUp] = useState(false);
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

    // Event-driven redirect to ensure session persistence
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session) {
                // Ensure store is synced BEFORE navigating
                if (loading) {
                    try {
                        // Force a timeout so we never hang indefinitely
                        const syncPromise = useLibraryStore.getState().syncWithCloud(session.user);
                        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Sync Timeout")), 4000));

                        await Promise.race([syncPromise, timeoutPromise]);
                    } catch (err) {
                        console.error("Login sync failed or timed out, proceeding anyway:", err);
                    } finally {
                        router.push('/');
                    }
                }
            }
        });

        return () => subscription.unsubscribe();
    }, [supabase, loading]);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                setError("Check your email for the confirmation link!");
                setLoading(false);
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                // No redirect here - we wait for the event listener above
            }
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F0F2E9] flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden relative">

                {/* Decoration */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-teal-500"></div>
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-100 rounded-full blur-3xl opacity-50"></div>

                <div className="p-8 pt-10 relative z-10">
                    <div className="flex justify-center mb-6">
                        <div className="p-4 bg-emerald-100/50 rounded-2xl text-emerald-600 animate-bounce-slow">
                            <Sparkles size={32} />
                        </div>
                    </div>

                    <h1 className="text-3xl font-serif font-bold text-center text-zinc-800 mb-2">
                        {isSignUp ? 'Plant Your Garden' : 'Enter the Garden'}
                    </h1>
                    <p className="text-center text-zinc-500 text-sm mb-8">
                        {isSignUp ? 'Start your digital reading journey.' : 'Welcome back, gardener.'}
                    </p>

                    <form onSubmit={handleAuth} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 pl-1">Email</label>
                            <div className="relative">
                                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-3 pl-12 pr-4 text-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                                    placeholder="you@example.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 pl-1">Password</label>
                            <div className="relative">
                                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-3 pl-12 pr-4 text-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm text-center font-medium border border-red-100">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-zinc-900 hover:bg-black text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed mt-4 shadow-lg shadow-zinc-200"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : (
                                <>
                                    {isSignUp ? 'Create Account' : 'Open Gate'} <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <button
                            onClick={() => setIsSignUp(!isSignUp)}
                            className="text-sm text-zinc-500 hover:text-emerald-600 font-medium transition-colors"
                        >
                            {isSignUp ? 'Already have a garden? Log in' : "No account yet? Plant one"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
