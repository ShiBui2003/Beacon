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

        // Get comprehensive timeline data
        const timelineEvents = [];

        // 1. Get issue creation event
        const { data: issue, error: issueError } = await (supabase as any)
            .from("issues")
            .select(
                `
        id,
        title,
        status,
        created_at,
        updated_at,
        department_id,
        estimated_completion,
        profiles:user_id(full_name, email),
        department:department_id(id, name, email, description),
        
      `
            )
            .eq("id", issueId)
            .single();

        if (issueError || !issue) {
            return NextResponse.json(
                { error: "Issue not found" },
                { status: 404 }
            );
        }

        // Add issue creation event
        timelineEvents.push({
            id: `created-${issue.id}`,
            type: "created",
            status: "submitted",
            title: "Issue Submitted",
            description:
                "Your issue has been submitted and is awaiting review by our team.",
            created_at: issue.created_at,
            user: issue.profiles,
            metadata: {
                issue_title: issue.title,
            },
        });

        // 2. Get issue updates from issue_updates table
        try {
            const { data: updates } = await (supabase as any)
                .from("issue_updates")
                .select(
                    `
          *,
          profiles:user_id(full_name, email)
        `
                )
                .eq("issue_id", issueId)
                .order("created_at", { ascending: true });

            if (updates) {
                (updates as any[]).forEach((update: any) => {
                    let title = "Status Updated";
                    let description = `Issue status changed to ${update.status?.replace(
                        "_",
                        " "
                    )}`;

                    switch (update.status) {
                        case "assigned":
                            title = "✅ Issue Accepted";
                            description =
                                "Great news! Your issue has been accepted and assigned to a department for resolution.";
                            break;
                        case "in_progress":
                            title = "🔧 Work Started";
                            description =
                                "Our team has started working on your issue. We'll keep you updated on the progress.";
                            break;
                        case "resolved":
                            title = "🎉 Issue Resolved";
                            description =
                                "Your issue has been resolved! Please check if the problem has been fixed.";
                            break;
                        case "closed":
                            title = "Issue Closed";
                            description = "This issue has been closed.";
                            break;
                    }

                    timelineEvents.push({
                        id: update.id,
                        type: "status_update",
                        status: update.status,
                        title,
                        description,
                        comment: update.comment,
                        created_at: update.created_at,
                        user: update.profiles,
                        metadata: {},
                    });
                });
            }
        } catch (error) {
            console.warn("Could not fetch issue updates:", error);
        }

        // Attach current assigned_profile from mapping
        let assigned_profile: any = null;
        try {
            const { data: active } = await (supabase as any)
                .from("issue_assignments")
                .select("user_id")
                .eq("issue_id", issueId)
                .is("ended_at", null)
                .maybeSingle();
            if (active?.user_id) {
                const { data: prof } = await (supabase as any)
                    .from("profiles")
                    .select("full_name, email")
                    .eq("id", active.user_id)
                    .single();
                if (prof)
                    assigned_profile = {
                        full_name: prof.full_name || null,
                        email: prof.email,
                    };
            }
        } catch {}

        // 3. Get workflow states for detailed tracking
        try {
            const { data: workflowStates } = await (supabase as any)
                .from("workflow_states")
                .select(
                    `
          *,
          profiles:created_by(full_name, email),
          department:department_id(name, email)
        `
                )
                .eq("issue_id", issueId)
                .order("created_at", { ascending: true });

            if (workflowStates) {
                (workflowStates as any[]).forEach((state: any) => {
                    if (state.notes || state.estimated_completion) {
                        timelineEvents.push({
                            id: `workflow-${state.id}`,
                            type: "workflow_update",
                            status: state.status,
                            title: "Additional Details Added",
                            description:
                                "Admin has provided additional information about your issue.",
                            comment: state.notes,
                            created_at: state.created_at,
                            user: state.profiles,
                            metadata: {
                                estimated_completion:
                                    state.estimated_completion,
                                department: state.department,
                                assigned_to: state.assigned_to,
                            },
                        });
                    }
                });
            }
        } catch (error) {
            console.warn("Could not fetch workflow states:", error);
        }

        // 4. Get admin notifications for this issue
        try {
            const { data: adminNotifications } = await (supabase as any)
                .from("admin_notifications")
                .select(
                    `
          *,
          profiles:admin_id(full_name, email)
        `
                )
                .eq("issue_id", issueId)
                .order("created_at", { ascending: true });

            if (adminNotifications) {
                (adminNotifications as any[]).forEach((notification: any) => {
                    let title = "Admin Action";
                    let description =
                        "An admin has taken action on your issue.";

                    switch (notification.action) {
                        case "department_assigned":
                            title = "🏢 Department Assigned";
                            description = `Your issue has been assigned to ${
                                notification.details?.department_name ||
                                "a department"
                            }.`;
                            break;
                        case "priority_changed":
                            title = "⚡ Priority Updated";
                            description = `Issue priority has been updated to ${
                                notification.details?.priority || "updated"
                            }.`;
                            break;
                        case "assigned_to_user":
                            title = "👤 Assigned to Team Member";
                            description = `Your issue has been assigned to a specific team member for handling.`;
                            break;
                    }

                    timelineEvents.push({
                        id: `admin-${notification.id}`,
                        type: "admin_action",
                        status: notification.action,
                        title,
                        description,
                        created_at: notification.created_at,
                        user: notification.profiles,
                        metadata: notification.details || {},
                    });
                });
            }
        } catch (error) {
            console.warn("Could not fetch admin notifications:", error);
        }

        // Sort all events by creation date (newest first for display)
        timelineEvents.sort(
            (a, b) =>
                new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime()
        );

        // Add current status if different from latest event
        const latestEvent = timelineEvents[0];
        if (latestEvent && latestEvent.status !== issue.status) {
            let title = "Current Status";
            let description = `Issue is currently ${issue.status?.replace(
                "_",
                " "
            )}`;

            switch (issue.status) {
                case "assigned":
                    title = "📋 Currently Assigned";
                    description =
                        "Your issue is currently assigned and awaiting action.";
                    break;
                case "in_progress":
                    title = "⚙️ Work in Progress";
                    description =
                        "Our team is actively working on resolving your issue.";
                    break;
                case "resolved":
                    title = "✅ Resolved";
                    description = "Your issue has been resolved.";
                    break;
                case "closed":
                    title = "📁 Closed";
                    description = "This issue has been closed.";
                    break;
            }

            timelineEvents.unshift({
                id: `current-${issue.id}`,
                type: "current_status",
                status: issue.status,
                title,
                description,
                created_at: issue.updated_at,
                user: null,
                metadata: {
                    department: issue.department,
                    assigned_profile,
                    estimated_completion: issue.estimated_completion,
                },
            });
        }

        return NextResponse.json({
            timeline: timelineEvents,
            issue: {
                id: issue.id,
                title: issue.title,
                status: issue.status,
                department: issue.department,
                assigned_profile,
                estimated_completion: issue.estimated_completion,
            },
        });
    } catch (error) {
        console.error("Error fetching issue timeline:", error);
        return NextResponse.json(
            {
                error: "Failed to fetch timeline",
                details:
                    error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}
