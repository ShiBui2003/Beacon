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

        const issueId = params.id;
        const { department_id } = await request.json();

        if (!department_id) {
            return NextResponse.json(
                { error: "Department ID is required" },
                { status: 400 }
            );
        }

        // First, check if the issue exists
        const { data: existingIssue, error: fetchError } = await (
            supabase as any
        )
            .from("issues")
            .select("id, user_id, title")
            .eq("id", issueId)
            .single();

        if (fetchError || !existingIssue) {
            console.error("Issue not found:", fetchError);
            return NextResponse.json(
                { error: "Issue not found" },
                { status: 404 }
            );
        }

        // Check if the department exists
        const { data: department, error: deptError } = await (supabase as any)
            .from("departments")
            .select("id, name, email")
            .eq("id", department_id)
            .single();

        if (deptError || !department) {
            console.error("Department not found:", deptError);
            return NextResponse.json(
                { error: "Department not found" },
                { status: 404 }
            );
        }

        // Update the issue with the assigned department
        const { data: updatedIssue, error: updateError } = await (
            supabase as any
        )
            .from("issues")
            .update({
                department_id: department_id,
                updated_at: new Date().toISOString(),
            })
            .eq("id", issueId)
            .select(
                `
        *,
        profiles:user_id(full_name, email),
        department:department_id(id, name, email)
      `
            )
            .single();

        if (updateError) {
            console.error("Error updating issue department:", updateError);
            return NextResponse.json(
                {
                    error: "Failed to assign department",
                    details: updateError.message,
                },
                { status: 500 }
            );
        }

        // Create a notification for the citizen
        try {
            const departmentName =
                typeof updatedIssue.department === "object" &&
                updatedIssue.department
                    ? updatedIssue.department.name
                    : "the assigned department";

            await (supabase as any).from("notifications").insert({
                user_id: updatedIssue.user_id,
                title: "Issue Assigned to Department",
                message: `Your issue "${updatedIssue.title}" has been assigned to ${departmentName} for review.`,
                type: "issue_assigned",
                related_issue_id: issueId,
                created_at: new Date().toISOString(),
            });
        } catch (notificationError) {
            console.error("Error creating notification:", notificationError);
            // Don't fail the request if notification fails
        }

        // Create admin notification record
        try {
            await (supabase as any).from("admin_notifications").insert({
                admin_id: user.id,
                issue_id: issueId,
                action: "department_assigned",
                details: {
                    department_id,
                    department_name: updatedIssue.department?.name,
                },
                created_at: new Date().toISOString(),
            });
        } catch (adminNotificationError) {
            console.error(
                "Error creating admin notification:",
                adminNotificationError
            );
            // Don't fail the request if admin notification fails
        }

        return NextResponse.json({
            message: "Department assigned successfully",
            issue: updatedIssue,
        });
    } catch (error) {
        console.error(
            "Error in PUT /api/issues/[id]/assign-department:",
            error
        );
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
