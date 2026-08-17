import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
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

        const body = await request.json();
        const { status } = body;
        const issueId = params.id;

        if (!status) {
            return NextResponse.json(
                { error: "Status is required" },
                { status: 400 }
            );
        }

        console.log("Updating issue:", { issueId, status });

        // First check if issue exists
        const { data: existingIssue, error: fetchError } = await (
            supabase as any
        )
            .from("issues")
            .select("id, user_id, title, status")
            .eq("id", issueId)
            .single();

        if (fetchError || !existingIssue) {
            console.error("Issue not found:", fetchError);
            return NextResponse.json(
                { error: "Issue not found" },
                { status: 404 }
            );
        }

        console.log("Found existing issue:", existingIssue);

        // Prepare update data
        const updateData: any = {
            status,
            updated_at: new Date().toISOString(),
        };

        // Automatically set completion date when marking as resolved
        if (status === "resolved") {
            updateData.completed_at = new Date().toISOString();
        }

        // Simple update - status, timestamp, and completion date if resolved
        const { data: updatedIssues, error: updateError } = await (
            supabase as any
        )
            .from("issues")
            .update(updateData)
            .eq("id", issueId)
            .select("*");

        if (updateError) {
            console.error("Error updating issue:", updateError);
            return NextResponse.json(
                {
                    error: "Failed to update issue",
                    details: updateError.message,
                },
                { status: 500 }
            );
        }

        if (!updatedIssues || updatedIssues.length === 0) {
            console.error("No rows updated - possible RLS policy issue");
            return NextResponse.json(
                {
                    error: "Failed to update issue - no rows affected",
                    details: "This might be a permissions issue",
                },
                { status: 500 }
            );
        }

        const updatedIssue = updatedIssues[0];

        console.log("Successfully updated issue:", updatedIssue);

        // Try to send a simple notification
        if (existingIssue.status !== status) {
            try {
                const { error: notifError } = await (supabase as any)
                    .from("notifications")
                    .insert({
                        user_id: existingIssue.user_id,
                        title: "Issue Status Updated",
                        message: `Your issue "${
                            existingIssue.title
                        }" status has been updated to ${status.replace(
                            "_",
                            " "
                        )}.`,
                        created_at: new Date().toISOString(),
                    });

                if (notifError) {
                    console.warn("Could not create notification:", notifError);
                } else {
                    console.log("Notification sent successfully");
                }
            } catch (notificationError) {
                console.warn("Notification failed:", notificationError);
            }
        }

        return NextResponse.json({
            issue: updatedIssue,
            message: "Issue updated successfully",
        });
    } catch (error) {
        console.error("Error in simple status update:", error);
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
