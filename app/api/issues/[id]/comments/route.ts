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

        const { data: comments, error } = await (supabase as any)
            .from("comments")
            .select(
                `
        *,
        profiles:user_id(full_name, email)
      `
            )
            .eq("issue_id", issueId)
            .order("created_at", { ascending: true });

        if (error) {
            console.error("Error fetching comments:", error);
            return NextResponse.json(
                { error: "Failed to fetch comments" },
                { status: 500 }
            );
        }

        return NextResponse.json({ comments: comments || [] });
    } catch (error) {
        console.error("Error in GET /api/issues/[id]/comments:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function POST(
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
        const { content, is_admin = false } = body;
        const issueId = params.id;

        if (!content || content.trim().length === 0) {
            return NextResponse.json(
                { error: "Comment content is required" },
                { status: 400 }
            );
        }

        // Get issue details for notifications
        const { data: issue, error: issueError } = await (supabase as any)
            .from("issues")
            .select("title, user_id")
            .eq("id", issueId)
            .single();

        if (issueError || !issue) {
            return NextResponse.json(
                { error: "Issue not found" },
                { status: 404 }
            );
        }

        // Create the comment
        const { data: comment, error: commentError } = await (supabase as any)
            .from("comments")
            .insert({
                issue_id: issueId,
                user_id: user.id,
                content: content.trim(),
                is_admin,
            })
            .select(
                `
        *,
        profiles:user_id(full_name, email)
      `
            )
            .single();

        if (commentError) {
            console.error("Error creating comment:", commentError);
            return NextResponse.json(
                { error: "Failed to create comment" },
                { status: 500 }
            );
        }

        // Create notification for the issue owner (if not commenting on their own issue)
        if (issue.user_id !== user.id) {
            const commenterName = comment.profiles?.full_name || "Someone";
            const notificationTitle = is_admin
                ? "Staff Response"
                : "New Comment";
            const notificationMessage = `${commenterName} commented on your issue "${
                issue.title
            }": "${content.substring(0, 100)}${
                content.length > 100 ? "..." : ""
            }"`;

            await (supabase as any).from("notifications").insert({
                user_id: issue.user_id,
                title: notificationTitle,
                message: notificationMessage,
                link: `/citizen/issues/${issueId}`,
                issue_id: issueId,
            });
        }

        return NextResponse.json({ comment }, { status: 201 });
    } catch (error) {
        console.error("Error in POST /api/issues/[id]/comments:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
