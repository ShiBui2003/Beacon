import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json(
                { error: "Email and password are required" },
                { status: 400 }
            );
        }

        const supabase = createClient();
        const { data, error } = await (supabase as any).auth.signInWithPassword(
            {
                email,
                password,
            }
        );

        if (error || !data.session || !data.user) {
            return NextResponse.json(
                { error: error?.message || "Invalid credentials" },
                { status: 401 }
            );
        }

        // Enforce admin-only for this endpoint
        const isAdmin =
            (data.user.user_metadata?.role &&
                data.user.user_metadata.role !== "citizen") ||
            (data.user.role && data.user.role !== "citizen");
        if (!isAdmin) {
            return NextResponse.json(
                { error: "You are not an admin." },
                { status: 403 }
            );
        }

        const response = NextResponse.json({
            user: {
                id: data.user.id,
                email: data.user.email,
                role:
                    data.user.user_metadata?.role ||
                    data.user.role ||
                    "citizen",
            },
        });

        // Persist Supabase session tokens as HTTP-only cookies for middleware
        response.cookies.set("sb-access-token", data.session.access_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24,
        });
        if (data.session.refresh_token) {
            response.cookies.set(
                "sb-refresh-token",
                data.session.refresh_token,
                {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === "production",
                    sameSite: "lax",
                    path: "/",
                    maxAge: 60 * 60 * 24,
                }
            );
        }

        return response;
    } catch (error) {
        console.error("Login error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
