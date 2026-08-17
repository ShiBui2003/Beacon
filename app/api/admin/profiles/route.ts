import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
    try {
        const supabase = createServerClient();
        const {
            data: { user },
            error: authError,
        } = await (supabase as any).auth.getUser();
        if (authError || !user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }
        // Check if user has admin-type role using roles table
        const { data: profile } = await (supabase as any)
            .from("profiles")
            .select(
                `
        role_id,
        department_id,
        roles:role_id (
          id,
          name,
          level,
          permissions
        )
      `
            )
            .eq("id", user.id)
            .single();

        // Admin-type roles have level > 0 (citizens have level 0)
        const isAdmin =
            profile &&
            (profile as any).roles &&
            (profile as any).roles.level > 0;

        if (!isAdmin) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const q = (searchParams.get("q") || "").trim();
        let query = supabase
            .from("profiles")
            .select("id, full_name, email")
            .limit(20);
        if (q) {
            // simple ilike on name or email
            query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%`);
        }
        const { data, error } = await query;
        if (error) {
            console.error("Error searching profiles:", error);
            return NextResponse.json(
                { error: "Failed to search" },
                { status: 500 }
            );
        }
        return NextResponse.json({ profiles: data || [] });
    } catch (error) {
        console.error("Error in GET /api/admin/profiles:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
