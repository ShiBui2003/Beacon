import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
    try {
        // Use service role key to bypass RLS
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

        if (!supabaseServiceKey) {
            return NextResponse.json(
                {
                    error: "Service role key not configured",
                },
                { status: 500 }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const { issueId, status } = await request.json();

        console.log("Direct update attempt:", { issueId, status });

        // Direct update bypassing RLS
        const { data: updatedIssues, error: updateError } = await (
            supabase as any
        )
            .from("issues")
            .update({
                status,
                updated_at: new Date().toISOString(),
            })
            .eq("id", issueId)
            .select("*");

        console.log("Direct update result:", { updatedIssues, updateError });

        if (updateError) {
            return NextResponse.json(
                {
                    error: "Direct update failed",
                    details: updateError,
                },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            updatedCount: updatedIssues?.length || 0,
            updatedIssue: updatedIssues?.[0],
        });
    } catch (error) {
        console.error("Direct update error:", error);
        return NextResponse.json(
            {
                error: "Internal server error",
                details:
                    error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}
