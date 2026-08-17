import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
    try {
        const supabase = createServerClient();

        // Get user from session
        const {
            data: { user },
            error: authError,
        } = await (supabase as any).auth.getUser();

        if (authError) {
            console.error("Auth error:", authError);
            return NextResponse.json(
                {
                    error: "Authentication failed",
                    details: authError.message,
                    cookies: Object.fromEntries(request.cookies),
                },
                { status: 401 }
            );
        }

        if (!user) {
            return NextResponse.json(
                {
                    error: "No user found",
                    cookies: Object.fromEntries(request.cookies),
                },
                { status: 401 }
            );
        }

        return NextResponse.json({
            user: {
                id: user.id,
                email: user.email,
                role: user.user_metadata?.role || "citizen",
            },
            cookies: Object.fromEntries(request.cookies),
        });
    } catch (error) {
        console.error("Error in debug auth:", error);
        return NextResponse.json(
            {
                error: "Internal server error",
                message:
                    error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}
