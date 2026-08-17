export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

// GET /api/departments/[id]/users
// Returns profiles that belong to the given department (id)
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = createServerClient();

        // Ensure requester is authenticated (RLS will further restrict if configured)
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

        const departmentId = params.id;
        if (!departmentId) {
            return NextResponse.json(
                { error: "Department id is required" },
                { status: 400 }
            );
        }

        const { data, error } = await (supabase as any)
            .from("profiles")
            .select("id, full_name, email")
            .eq("department_id", departmentId)
            .order("full_name", { ascending: true });

        if (error) {
            console.error("Error fetching department users:", error);
            return NextResponse.json(
                { error: "Failed to fetch department users" },
                { status: 500 }
            );
        }

        return NextResponse.json({ users: data ?? [] });
    } catch (err) {
        console.error("GET /api/departments/[id]/users error:", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
