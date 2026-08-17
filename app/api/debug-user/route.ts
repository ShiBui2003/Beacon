import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const supabase = createServerClient();
        const {
            data: { user },
            error: authError,
        } = await (supabase as any).auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: "Not authenticated" },
                { status: 401 }
            );
        }

        // Get user's profile information with role from roles table
        const { data: profile, error: profileError } = await (supabase as any)
            .from("profiles")
            .select(
                `
        *,
        roles:role_id (
          id,
          name,
          level,
          permissions
        ),
        departments:department_id (
          id,
          name,
          email
        )
      `
            )
            .eq("id", user.id)
            .single();

        return NextResponse.json({
            user: {
                id: user.id,
                email: user.email,
                user_metadata: user.user_metadata,
                role: user.role,
            },
            profile,
            profileError,
        });
    } catch (error) {
        console.error("Debug user error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
