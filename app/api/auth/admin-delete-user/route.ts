import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@/lib/supabase/server";

// This endpoint uses the service role key to delete users.
// middleware.ts treats every /api/auth/* path as public, so this route must
// verify the caller itself — it cannot rely on middleware for protection.
export async function POST(request: NextRequest) {
    try {
        const { userId } = await request.json();

        if (!userId) {
            return NextResponse.json(
                { error: "User ID is required" },
                { status: 400 }
            );
        }

        // Verify the caller is authenticated and holds an admin-type role
        // (profiles.role_id -> roles.level > 0), the same check used to
        // gate admin-only issue visibility in GET /api/issues.
        const callerClient = createServerClient();
        const {
            data: { user: caller },
            error: callerError,
        } = await (callerClient as any).auth.getUser();

        if (callerError || !caller) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { data: callerProfile } = await (callerClient as any)
            .from("profiles")
            .select("roles:role_id (level)")
            .eq("id", caller.id)
            .single();

        const callerLevel = (callerProfile as any)?.roles?.level ?? 0;
        if (callerLevel <= 0) {
            return NextResponse.json(
                { error: "Forbidden" },
                { status: 403 }
            );
        }

        // Create admin client with service role key
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        );

        // Delete the user from Supabase Auth
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

        if (deleteError) {
            return NextResponse.json(
                { error: deleteError.message || "Failed to delete user account" },
                { status: 400 }
            );
        }

        return NextResponse.json({
            message: "User account deleted successfully"
        });

    } catch (error) {
        console.error('Admin delete user error:', error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
