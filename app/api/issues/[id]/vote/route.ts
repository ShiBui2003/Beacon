export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

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

        // Handle empty request body
        let body;
        try {
            const text = await request.text();
            if (!text.trim()) {
                return NextResponse.json(
                    { error: "Request body is required" },
                    { status: 400 }
                );
            }
            body = JSON.parse(text);
        } catch (parseError) {
            console.error("JSON parse error:", parseError);
            return NextResponse.json(
                { error: "Invalid JSON in request body" },
                { status: 400 }
            );
        }

        const { vote_type } = body; // 'up', 'down', or 'dispute'
        const issueId = params.id;

        if (!vote_type || !["up", "down", "dispute"].includes(vote_type)) {
            return NextResponse.json(
                { error: "Valid vote_type is required (up, down, dispute)" },
                { status: 400 }
            );
        }

        // Check if user already voted
        const { data: existingVote, error: voteCheckError } = await (
            supabase as any
        )
            .from("issue_votes")
            .select("*")
            .eq("issue_id", issueId)
            .eq("user_id", user.id)
            .single();

        if (voteCheckError && voteCheckError.code !== "PGRST116") {
            console.error("Error checking existing vote:", voteCheckError);
            return NextResponse.json(
                { error: "Failed to check existing vote" },
                { status: 500 }
            );
        }

        if (existingVote) {
            // Update existing vote
            const { data: updatedVote, error: updateError } = await (
                supabase as any
            )
                .from("issue_votes")
                .update({ vote_type })
                .eq("id", existingVote.id)
                .select()
                .single();

            if (updateError) {
                console.error("Error updating vote:", updateError);

                // If vote_type column doesn't exist, try without it for backward compatibility
                if (
                    updateError.code === "42703" ||
                    updateError.message?.includes("vote_type")
                ) {
                    return NextResponse.json(
                        {
                            error: "Database schema needs to be updated. Please apply migrations.",
                        },
                        { status: 503 }
                    );
                }

                return NextResponse.json(
                    { error: "Failed to update vote" },
                    { status: 500 }
                );
            }

            return NextResponse.json({
                vote: updatedVote,
                message: "Vote updated successfully",
            });
        } else {
            // Create new vote
            const { data: newVote, error: createError } = await (
                supabase as any
            )
                .from("issue_votes")
                .insert({
                    issue_id: issueId,
                    user_id: user.id,
                    vote_type,
                })
                .select()
                .single();

            if (createError) {
                console.error("Error creating vote:", createError);

                // If vote_type column doesn't exist, provide helpful error
                if (
                    createError.code === "42703" ||
                    createError.message?.includes("vote_type")
                ) {
                    return NextResponse.json(
                        {
                            error: "Database schema needs to be updated. Please apply migrations.",
                        },
                        { status: 503 }
                    );
                }

                return NextResponse.json(
                    { error: "Failed to create vote" },
                    { status: 500 }
                );
            }

            // If it's a dispute vote, create notification for admins
            if (vote_type === "dispute") {
                const { data: issue, error: issueError } = await (
                    supabase as any
                )
                    .from("issues")
                    .select("title")
                    .eq("id", issueId)
                    .single();

                if (!issueError && issue) {
                    await (supabase as any).from("admin_notifications").insert({
                        title: "⚠️ Issue Status Disputed",
                        message: `A citizen has disputed the status update for issue "${issue.title}". Please review the issue and comments.`,
                        type: "urgent",
                        link: `/admin/issues/${issueId}`,
                        issue_id: issueId,
                    });
                }
            }

            return NextResponse.json(
                { vote: newVote, message: "Vote created successfully" },
                { status: 201 }
            );
        }
    } catch (error) {
        console.error("Error in POST /api/issues/[id]/vote:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = createServerClient();
        const {
            data: { user },
            error: authError,
        } = await (supabase as any).auth.getUser();
        const issueId = params.id;

        // Get vote counts - try with vote_type first, fallback if column doesn't exist
        let votes, error;

        try {
            const result = await (supabase as any)
                .from("issue_votes")
                .select("vote_type, user_id")
                .eq("issue_id", issueId);
            votes = result.data;
            error = result.error;
        } catch (selectError: any) {
            // If vote_type column doesn't exist, fall back to basic count
            if (
                selectError?.code === "42703" ||
                selectError?.message?.includes("vote_type")
            ) {
                const result = await (supabase as any)
                    .from("issue_votes")
                    .select("user_id")
                    .eq("issue_id", issueId);
                votes =
                    result.data?.map((v: any) => ({ ...v, vote_type: "up" })) ||
                    [];
                error = result.error;
            } else {
                throw selectError;
            }
        }

        if (error) {
            console.error("Error fetching votes:", error);
            return NextResponse.json(
                { error: "Failed to fetch votes" },
                { status: 500 }
            );
        }

        const voteCounts = {
            up: votes?.filter((v: any) => v.vote_type === "up").length || 0,
            down: votes?.filter((v: any) => v.vote_type === "down").length || 0,
            dispute:
                votes?.filter((v: any) => v.vote_type === "dispute").length ||
                0,
            total: votes?.length || 0,
        };

        // Check if current user has voted
        const userVote = user
            ? votes?.find((v: any) => v.user_id === user.id)
            : null;

        return NextResponse.json({
            votes: voteCounts,
            votesCount: voteCounts.up, // For backward compatibility
            hasVoted: !!userVote,
            userVoteType: userVote?.vote_type || null,
        });
    } catch (error) {
        console.error("Error in GET /api/issues/[id]/vote:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function DELETE(
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

        // Delete user's vote
        const { error: deleteError } = await (supabase as any)
            .from("issue_votes")
            .delete()
            .eq("issue_id", issueId)
            .eq("user_id", user.id);

        if (deleteError) {
            console.error("Error deleting vote:", deleteError);
            return NextResponse.json(
                { error: "Failed to delete vote" },
                { status: 500 }
            );
        }

        return NextResponse.json({ message: "Vote deleted successfully" });
    } catch (error) {
        console.error("Error in DELETE /api/issues/[id]/vote:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
