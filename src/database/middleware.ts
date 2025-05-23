import { createServerClient } from "@supabase/ssr"
import { type NextRequest, NextResponse } from "next/server"

export const updateSession = async (request: NextRequest) => {
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
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    )
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

    // This will refresh session if expired - required for Server Components
    // https://supabase.com/docs/guides/auth/server-side/nextjs
    const user = await supabase.auth.getUser()
    // protected routes

    response.headers.set("x-user-id-cache", user.data.user?.id ?? "null")

    if (request.nextUrl.pathname === "/" && !user.error) {
        return NextResponse.redirect(new URL("/home", request.url))
    }

    if (request.nextUrl.pathname.startsWith("/home") && user.error) {
        return NextResponse.redirect(new URL("/", request.url))
    }

    return response
}
