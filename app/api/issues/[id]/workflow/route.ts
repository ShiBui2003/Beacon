export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = createServerClient();
        const issueId = params.id;

        // Get workflow history for the issue
        const { data: workflow, error } = await (supabase as any)
            .from("issue_workflow_states")
            .select(
                `
        *,
        department:department_id(name),
        created_by_user:created_by(full_name, email)
      `
            )
            .eq("issue_id", issueId)
            .order("created_at", { ascending: true });

        if (error) {
            console.error("Error fetching workflow:", error);
            return NextResponse.json(
                { error: "Failed to fetch workflow" },
                { status: 500 }
            );
        }

        // Also get issue updates for additional context
        const { data: updates, error: updatesError } = await (supabase as any)
            .from("issue_updates")
            .select(
                `
        *,
        profiles:user_id(full_name, email)
      `
            )
            .eq("issue_id", issueId)
            .order("created_at", { ascending: true });

        if (updatesError) {
            console.error("Error fetching issue updates:", updatesError);
        }

        return NextResponse.json({
            workflow: workflow || [],
            updates: updates || [],
        });
    } catch (error) {
        console.error("Error in GET /api/issues/[id]/workflow:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
