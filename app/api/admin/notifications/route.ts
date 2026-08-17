import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
export const dynamic = "force-dynamic";

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
            return NextResponse.json(
                { error: "Admin access required" },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");
        const unreadOnly = searchParams.get("unreadOnly") === "true";

        let query = supabase
            .from("admin_notifications")
            .select(
                `
        *,
        issues:issue_id(title, id, category, status, location_address)
      `
            )
            .order("created_at", { ascending: false })
            .range((page - 1) * limit, page * limit - 1);

        if (unreadOnly) {
            query = query.eq("read", false);
        }

        const { data: notifications, error } = await query;

        if (error) {
            console.error("Error fetching admin notifications:", error);
            return NextResponse.json(
                { error: "Failed to fetch notifications" },
                { status: 500 }
            );
        }

        // Get unread count
        const { count: unreadCount } = await (supabase as any)
            .from("admin_notifications")
            .select("*", { count: "exact", head: true })
            .eq("read", false);

        return NextResponse.json({
            notifications: notifications || [],
            unreadCount: unreadCount || 0,
            pagination: {
                page,
                limit,
                hasMore: (notifications?.length || 0) === limit,
            },
        });
    } catch (error) {
        console.error("Error in GET /api/admin/notifications:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
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
        const { notificationIds, markAllAsRead } = body;

        if (markAllAsRead) {
            const { error } = await (supabase as any)
                .from("admin_notifications")
                .update({ read: true })
                .eq("read", false);

            if (error) {
                console.error(
                    "Error marking all admin notifications as read:",
                    error
                );
                return NextResponse.json(
                    { error: "Failed to mark notifications as read" },
                    { status: 500 }
                );
            }
        } else if (notificationIds && Array.isArray(notificationIds)) {
            const { error } = await (supabase as any)
                .from("admin_notifications")
                .update({ read: true })
                .in("id", notificationIds);

            if (error) {
                console.error(
                    "Error marking admin notifications as read:",
                    error
                );
                return NextResponse.json(
                    { error: "Failed to mark notifications as read" },
                    { status: 500 }
                );
            }
        }

        return NextResponse.json({
            message: "Admin notifications updated successfully",
        });
    } catch (error) {
        console.error("Error in PUT /api/admin/notifications:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
