export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

// GET all updates for an issue (ordered oldest -> newest)
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = createServerClient();
        const { id } = params;

        const { data: updates, error } = await (supabase as any)
            .from("issue_updates")
            .select(`*, profiles:user_id(full_name, email)`) // author profile
            .eq("issue_id", id)
            .order("created_at", { ascending: true });

        if (error) {
            console.error("Error fetching updates:", error);
            return NextResponse.json(
                { error: "Failed to fetch updates" },
                { status: 500 }
            );
        }

        return NextResponse.json({ updates: updates || [] });
    } catch (error) {
        console.error("Error in GET /api/issues/[id]/updates:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// POST create a new timeline update. Admins may optionally update issue status and assignment.
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

        const { id } = params;
        const body = await request.json();
        const { status, comment, assign_to } = body as {
            status?: string;
            comment?: string;
            assign_to?: string | null;
        };

        // Verify issue exists
        const { data: issue, error: issueError } = await (supabase as any)
            .from("issues")
            .select("id")
            .eq("id", id)
            .single();

        if (issueError || !issue) {
            return NextResponse.json(
                { error: "Issue not found" },
                { status: 404 }
            );
        }

        const userRole = user.user_metadata?.role || user.role || "citizen";
        const isAdmin = userRole !== "citizen";

        // Insert timeline update first
        const { data: update, error: insError } = await (supabase as any)
            .from("issue_updates")
            .insert({
                issue_id: id,
                user_id: user.id,
                status: status ?? null,
                comment: (comment || "").trim() || null,
            })
            .select(`*, profiles:user_id(full_name, email)`) // author profile
            .single();

        if (insError) {
            console.error("Error inserting update:", insError);
            return NextResponse.json(
                { error: "Failed to create update" },
                { status: 500 }
            );
        }

        // If admin, optionally update issue status and assignment
        let updatedIssue: any = null;
        if (isAdmin && (status !== undefined || assign_to !== undefined)) {
            // If assignment provided, handle via mapping first
            if (assign_to !== undefined) {
                const nowIso = new Date().toISOString();
                await (supabase as any)
                    .from("issue_assignments")
                    .update({ ended_at: nowIso })
                    .eq("issue_id", id)
                    .is("ended_at", null);
                if (assign_to) {
                    await (supabase as any).from("issue_assignments").insert({
                        issue_id: id,
                        user_id: assign_to,
                        assigned_by: user.id,
                        assigned_at: nowIso,
                    });
                }
            }

            const patch: any = {};
            if (status !== undefined) patch.status = status;
            const { data: afterIssue, error: updErr } = await (supabase as any)
                .from("issues")
                .update(patch)
                .eq("id", id)
                .select(`*, profiles:user_id(full_name, email)`) // join POC only
                .single();

            if (updErr) {
                console.error("Error updating issue from update:", updErr);
                // Not fatal to the timeline insert; return the update but with warning
            } else {
                // Attach assigned_profile
                let assigned_profile: {
                    full_name: string | null;
                    email: string;
                } | null = null;
                const { data: active } = await (supabase as any)
                    .from("issue_assignments")
                    .select("user_id")
                    .eq("issue_id", id)
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
                updatedIssue = { ...(afterIssue as any), assigned_profile };
            }
        }

        return NextResponse.json(
            { update, issue: updatedIssue },
            { status: 201 }
        );
    } catch (error) {
        console.error("Error in POST /api/issues/[id]/updates:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
