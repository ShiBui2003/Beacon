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

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const unreadOnly = searchParams.get("unreadOnly") === "true";

        let query = supabase
            .from("notifications")
            .select(
                `
        *,
        issues:issue_id(title, id)
      `
            )
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .range((page - 1) * limit, page * limit - 1);

        if (unreadOnly) {
            query = query.eq("read", false);
        }

        const { data: notifications, error } = await query;

        if (error) {
            console.error("Error fetching notifications:", error);
            return NextResponse.json(
                { error: "Failed to fetch notifications" },
                { status: 500 }
            );
        }

        // Get unread count
        const { count: unreadCount } = await (supabase as any)
            .from("notifications")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id)
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
        console.error("Error in GET /api/notifications:", error);
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
                .from("notifications")
                .update({ read: true })
                .eq("user_id", user.id)
                .eq("read", false);

            if (error) {
                console.error(
                    "Error marking all notifications as read:",
                    error
                );
                return NextResponse.json(
                    { error: "Failed to mark notifications as read" },
                    { status: 500 }
                );
            }
        } else if (notificationIds && Array.isArray(notificationIds)) {
            const { error } = await (supabase as any)
                .from("notifications")
                .update({ read: true })
                .eq("user_id", user.id)
                .in("id", notificationIds);

            if (error) {
                console.error("Error marking notifications as read:", error);
                return NextResponse.json(
                    { error: "Failed to mark notifications as read" },
                    { status: 500 }
                );
            }
        }

        return NextResponse.json({
            message: "Notifications updated successfully",
        });
    } catch (error) {
        console.error("Error in PUT /api/notifications:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
