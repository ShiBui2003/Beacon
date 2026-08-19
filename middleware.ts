import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const publicRoutes = [
    "/",
    "/auth",
    "/login",
    "/signup",
    "/admin/login",
    "/admin/signup",
    "/citizen/login",
    "/citizen/signup",
    "/auth/callback",
    "/api/auth",
    "/api/roles",
    "/api/departments",
    "/api/transcribe",
    "/api/translate",
    "/api/verify-issue",
    "/api/analyze-photo",
    "/_next",
    "/favicon.ico",
];

const isPublicRoute = (pathname: string) => {
    return publicRoutes.some(
        (route) =>
            pathname === route ||
            pathname.startsWith(`${route}/`) ||
            pathname.startsWith("/_next/") ||
            pathname.startsWith("/api/auth/")
    );
};

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    console.log("MIDDLEWARE HIT:", pathname);

    // Skip middleware for public routes & assets
    if (
        isPublicRoute(pathname) ||
        pathname.startsWith("/_next/") ||
        pathname.includes("/ai-urgency")
    ) {
        return NextResponse.next();
    }

    try {
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return request.cookies.get(name)?.value;
                    },
                },
            }
        );

        const {
            data: { user },
            error,
        } = await supabase.auth.getUser();

        console.log("USER:", user, "ERROR:", error);

        if (user && !error) {
            const role = user?.user_metadata?.role || user?.role || "citizen";
            const isStaff = role !== "citizen";

            // Redirect authenticated users away from auth pages
            if (
                pathname === "/auth" ||
                pathname === "/login" ||
                pathname === "/signup" ||
                pathname === "/admin/login" ||
                pathname === "/admin/signup" ||
                pathname === "/citizen/login" ||
                pathname === "/citizen/signup"
            ) {
                const dashboardPath = isStaff
                    ? "/admin/dashboard"
                    : "/citizen/dashboard";
                return NextResponse.redirect(
                    new URL(dashboardPath, request.url)
                );
            }

            // Role-based access control
            if (pathname.startsWith("/admin") && !isStaff) {
                return NextResponse.redirect(
                    new URL("/citizen/dashboard", request.url)
                );
            }

            if (pathname.startsWith("/citizen") && isStaff) {
                return NextResponse.redirect(
                    new URL("/admin/dashboard", request.url)
                );
            }

            return NextResponse.next();
        }

        // Unauthenticated users
        if (!user || error) {
            if (
                pathname === "/auth" ||
                pathname === "/login" ||
                pathname === "/signup" ||
                pathname === "/admin/login" ||
                pathname === "/admin/signup" ||
                pathname === "/citizen/login" ||
                pathname === "/citizen/signup"
            ) {
                return NextResponse.next();
            }

            const redirectUrl = new URL("/auth", request.url);
            if (pathname !== "/") {
                redirectUrl.searchParams.set("redirectedFrom", pathname);
            }
            return NextResponse.redirect(redirectUrl);
        }

        return NextResponse.next();
    } catch (err) {
        console.error("MIDDLEWARE ERROR:", err);
        const redirectUrl = new URL("/", request.url);
        redirectUrl.searchParams.set("error", "authentication_error");
        return NextResponse.redirect(redirectUrl);
    }
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
