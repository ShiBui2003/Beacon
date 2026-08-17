export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string; commentId: string } }
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

        const { commentId } = params;

        // First, check if the comment exists and get its details
        const { data: comment, error: fetchError } = await (supabase as any)
            .from("comments")
            .select("id, user_id, content")
            .eq("id", commentId)
            .single();

        if (fetchError || !comment) {
            return NextResponse.json(
                { error: "Comment not found" },
                { status: 404 }
            );
        }

        // Check if the user is the owner of the comment
        if (comment.user_id !== user.id) {
            return NextResponse.json(
                {
                    error: "Forbidden - You can only delete your own comments",
                },
                { status: 403 }
            );
        }

        // Delete the comment
        const { error: deleteError } = await (supabase as any)
            .from("comments")
            .delete()
            .eq("id", commentId)
            .eq("user_id", user.id); // Double-check ownership

        if (deleteError) {
            console.error("Error deleting comment:", deleteError);
            return NextResponse.json(
                { error: "Failed to delete comment" },
                { status: 500 }
            );
        }

        return NextResponse.json({ message: "Comment deleted successfully" });
    } catch (error) {
        console.error(
            "Error in DELETE /api/issues/[id]/comments/[commentId]:",
            error
        );
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string; commentId: string } }
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
        const { content } = body;
        const { commentId } = params;

        if (!content || content.trim().length === 0) {
            return NextResponse.json(
                { error: "Comment content is required" },
                { status: 400 }
            );
        }

        // First, check if the comment exists and get its details
        const { data: comment, error: fetchError } = await (supabase as any)
            .from("comments")
            .select("id, user_id")
            .eq("id", commentId)
            .single();

        if (fetchError || !comment) {
            return NextResponse.json(
                { error: "Comment not found" },
                { status: 404 }
            );
        }

        // Check if the user is the owner of the comment
        if (comment.user_id !== user.id) {
            return NextResponse.json(
                {
                    error: "Forbidden - You can only edit your own comments",
                },
                { status: 403 }
            );
        }

        // Update the comment
        const { data: updatedComment, error: updateError } = await (
            supabase as any
        )
            .from("comments")
            .update({
                content: content.trim(),
                updated_at: new Date().toISOString(),
            })
            .eq("id", commentId)
            .eq("user_id", user.id) // Double-check ownership
            .select(
                `
        *,
        profiles:user_id(full_name, email)
      `
            )
            .single();

        if (updateError) {
            console.error("Error updating comment:", updateError);
            return NextResponse.json(
                { error: "Failed to update comment" },
                { status: 500 }
            );
        }

        return NextResponse.json({ comment: updatedComment });
    } catch (error) {
        console.error(
            "Error in PUT /api/issues/[id]/comments/[commentId]:",
            error
        );
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
