import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
                    response = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()

    // STRICT AUTHENTICATION LOGIC

    // 1. Unauthenticated users trying to access protected routes -> /login
    if (
        !user &&
        !request.nextUrl.pathname.startsWith('/login') &&
        !request.nextUrl.pathname.startsWith('/auth')
    ) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'

        const redirectResponse = NextResponse.redirect(url)
        // CRITICAL: Copy cookies to persist any state/clearing
        const allCookies = response.cookies.getAll()
        allCookies.forEach(cookie => redirectResponse.cookies.set(cookie))

        return redirectResponse
    }

    // 2. Authenticated users trying to access /login -> / (Dashboard)
    if (user && request.nextUrl.pathname.startsWith('/login')) {
        const url = request.nextUrl.clone()
        url.pathname = '/'

        const redirectResponse = NextResponse.redirect(url)
        // CRITICAL: Copy cookies to persist session
        const allCookies = response.cookies.getAll()
        allCookies.forEach(cookie => redirectResponse.cookies.set(cookie))

        return redirectResponse
    }

    return response
}
