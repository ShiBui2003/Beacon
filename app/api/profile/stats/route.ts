export const dynamic = "force-dynamic";
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

        // Get issue statistics for the user
        const { data: issues, error: issuesError } = await (supabase as any)
            .from("issues")
            .select("status")
            .eq("user_id", user.id);

        if (issuesError) {
            console.error("Error fetching issue stats:", issuesError);
            return NextResponse.json(
                { error: "Failed to fetch statistics" },
                { status: 500 }
            );
        }

        // Calculate statistics
        const stats = {
            reported: issues?.length || 0,
            resolved:
                issues?.filter((issue: any) => issue.status === "resolved")
                    .length || 0,
            in_progress:
                issues?.filter((issue: any) => issue.status === "in_progress")
                    .length || 0,
            submitted:
                issues?.filter((issue: any) => issue.status === "submitted")
                    .length || 0,
            assigned:
                issues?.filter((issue: any) => issue.status === "assigned")
                    .length || 0,
            closed:
                issues?.filter((issue: any) => issue.status === "closed")
                    .length || 0,
        };

        return NextResponse.json({ stats });
    } catch (error) {
        console.error("Error in GET /api/profile/stats:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
