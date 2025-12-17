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

    console.log("MW Debug: URL", request.nextUrl.pathname);
    console.log("MW Debug: Cookies Keys", request.cookies.getAll().map(c => c.name));
    console.log("MW Debug: User found?", !!user);

    // 1. If NO user and NOT on login page -> Redirect to Login
    if (!user && !request.nextUrl.pathname.startsWith('/login') && !request.nextUrl.pathname.startsWith('/auth')) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        const redirectResponse = NextResponse.redirect(url)

        // COPY COOKIES: Ensure the redirect doesn't drop any session clearing or updates
        const allCookies = response.cookies.getAll()
        allCookies.forEach((cookie) => {
            redirectResponse.cookies.set(cookie)
        })

        return redirectResponse
    }

    // 2. If User and IS on login page -> Redirect to Dashboard
    if (user && request.nextUrl.pathname.startsWith('/login')) {
        const url = request.nextUrl.clone()
        url.pathname = '/'
        const redirectResponse = NextResponse.redirect(url)

        // COPY COOKIES: Critical for persisting the session during the redirect
        const allCookies = response.cookies.getAll()
        allCookies.forEach((cookie) => {
            redirectResponse.cookies.set(cookie)
        })

        return redirectResponse
    }

    // Standard response if no redirect
    return response
}
