import { createBrowserClient } from '@supabase/ssr'

export const createClient = () =>
    createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookieOptions: {
                name: 'sb-digital-garden-auth-token',
                maxAge: 60 * 60 * 24 * 365,
                domain: '',
                path: '/',
                sameSite: 'lax',
                secure: process.env.NODE_ENV === 'production',
            },
        }
    )
