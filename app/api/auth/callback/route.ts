import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");
    const userType = requestUrl.searchParams.get("user_type") as
        | "department_head"
        | "supervisor"
        | "field_worker"
        | "clerk_operator"
        | "technician"
        | "citizen"
        | null;

    if (code) {
        const supabase = createServerClient();
        const { error } = await (supabase as any).auth.exchangeCodeForSession(
            code
        );

        if (!error) {
            // Get the user's session
            const {
                data: { session },
            } = await (supabase as any).auth.getSession();

            if (session?.user) {
                // Update user metadata with role if not set
                const {
                    data: { user },
                    error: userError,
                } = await (supabase as any).auth.getUser();

                if (!userError && user) {
                    // Only update if role is not already set
                    if (!user.user_metadata?.role && userType) {
                        await (supabase as any).auth.updateUser({
                            data: { role: userType },
                        });
                    }
                }
            }

            // Redirect based on user type or default to citizen dashboard
            const redirectPath =
                userType && userType !== "citizen"
                    ? "/admin/dashboard"
                    : "/citizen/dashboard";
            return NextResponse.redirect(new URL(redirectPath, request.url));
        } else {
            console.error("Error exchanging code for session:", error);
            console.error("Error in OAuth callback:", error);
        }
    }

    // If there's an error or no code, redirect to home
    return NextResponse.redirect(new URL("/", request.url));
}
