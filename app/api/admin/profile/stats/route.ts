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

        // Check if user has admin-type role using the proper roles system
        const { data: profile, error: profileError } = await (supabase as any)
            .from("profiles")
            .select(
                `
        role_id,
        department_id,
        role,
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

        console.log("=== ROLE CHECK DEBUG ===");
        console.log("User ID:", user.id);
        console.log("Profile error:", profileError);
        console.log("Profile data:", JSON.stringify(profile, null, 2));

        // Determine if user is admin based on role level
        // Citizens have level 0, all admin-type roles have level > 0
        let isAdmin = false;

        if (profile) {
            const p = profile as any; // Type assertion to bypass TypeScript issues

            // Method 1: Check via roles table (preferred)
            if (p.roles && p.roles.level > 0) {
                isAdmin = true;
                console.log(
                    "Access granted via roles table - Role:",
                    p.roles.name,
                    "Level:",
                    p.roles.level
                );
            }
            // Method 2: Fallback to profile.role field
            else if (p.role && p.role !== "citizen") {
                isAdmin = true;
                console.log(
                    "Access granted via profile.role field - Role:",
                    p.role
                );
            }
            // Method 3: Fallback to user metadata
            else if (
                user.user_metadata?.role &&
                user.user_metadata.role !== "citizen"
            ) {
                isAdmin = true;
                console.log(
                    "Access granted via user metadata - Role:",
                    user.user_metadata.role
                );
            }
        }

        console.log("Final admin check result:", isAdmin);
        console.log("=======================");

        if (!isAdmin) {
            const p = profile as any;
            return NextResponse.json(
                {
                    error: "Admin access required. Only users with admin-type roles can access this endpoint.",
                    userRole: p?.roles ? p.roles.name : p?.role || "Unknown",
                },
                { status: 403 }
            );
        }

        // Get admin-specific statistics
        const [
            issuesManagedResult,
            issuesResolvedResult,
            usersManagedResult,
            departmentsResult,
            notificationsResult,
            reportsResult,
            adminActionsResult,
        ] = await Promise.all([
            // Issues managed by this admin
            (supabase as any)
                .from("issue_assignments")
                .select("id", { count: "exact", head: true })
                .eq("user_id", user.id)
                .is("ended_at", null),

            // Issues resolved by this admin
            (supabase as any)
                .from("issues")
                .select("id", { count: "exact", head: true })
                .eq("status", "resolved")
                .filter(
                    "id",
                    "in",
                    `(
                    select issue_id from issue_assignments ia
                    where ia.user_id = '${user.id}' and ia.ended_at is null
                )`
                ),

            // Users managed (total users in system)
            supabase
                .from("profiles")
                .select("id", { count: "exact", head: true }),

            // Departments managed
            supabase
                .from("departments")
                .select("id", { count: "exact", head: true }),

            // Notifications sent by this admin
            supabase
                .from("admin_notifications")
                .select("id", { count: "exact", head: true })
                .eq("created_by", user.id),

            // Reports generated (placeholder - you might have a reports table)
            (supabase as any)
                .from("issue_assignments")
                .select("id", { count: "exact", head: true })
                .eq("user_id", user.id)
                .gte(
                    "created_at",
                    new Date(
                        Date.now() - 30 * 24 * 60 * 60 * 1000
                    ).toISOString()
                ), // Last 30 days

            // Admin actions (issues updated by this admin)
            supabase
                .from("issue_updates")
                .select("id", { count: "exact", head: true })
                .eq("updated_by", user.id),
        ]);

        // Calculate success rate
        const issuesManaged = issuesManagedResult.count || 0;
        const issuesResolved = issuesResolvedResult.count || 0;
        const successRate =
            issuesManaged > 0
                ? Math.round((issuesResolved / issuesManaged) * 100)
                : 0;

        // Get last login from user metadata
        const lastLogin = user.last_sign_in_at
            ? new Date(user.last_sign_in_at).toLocaleDateString()
            : "Unknown";

        const stats = {
            issues_managed: issuesManaged,
            issues_resolved: issuesResolved,
            users_managed: usersManagedResult.count || 0,
            departments_managed: departmentsResult.count || 0,
            notifications_sent: notificationsResult.count || 0,
            reports_generated: reportsResult.count || 0,
            system_uptime: "99.9%", // This could be calculated from system logs
            last_login: lastLogin,
            total_admin_actions: adminActionsResult.count || 0,
            success_rate: successRate,
        };

        return NextResponse.json({ stats });
    } catch (error) {
        console.error("Error in GET /api/admin/profile/stats:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
