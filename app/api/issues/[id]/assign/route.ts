export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

// PATCH /api/issues/[id]/assign
// Body: { assigned_to: string }
export async function PATCH(
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
        const body = await request.json();
        const { assigned_to } = body as { assigned_to?: string | null };

        if (!issueId) {
            return NextResponse.json(
                { error: "Issue id is required" },
                { status: 400 }
            );
        }

        // Fetch the issue to get department, ensure exists
        const { data: issue, error: issueErr } = await (supabase as any)
            .from("issues" as any)
            .select("id, department_id")
            .eq("id", issueId)
            .single();
        if (issueErr || !issue) {
            return NextResponse.json(
                { error: "Issue not found" },
                { status: 404 }
            );
        }

        // End any current active assignment for this issue
        const nowIso = new Date().toISOString();
        await (supabase as any)
            .from("issue_assignments")
            .update({ ended_at: nowIso })
            .eq("issue_id", issueId)
            .is("ended_at", null);

        if (assigned_to) {
            // Validate assignee belongs to department (if issue has a dept)
            if (issue.department_id) {
                const { data: profile, error: profErr } = await (
                    supabase as any
                )
                    .from("profiles" as any)
                    .select("id, department_id")
                    .eq("id", assigned_to)
                    .single();
                if (profErr || !profile) {
                    return NextResponse.json(
                        { error: "Target user not found" },
                        { status: 404 }
                    );
                }
                if (profile.department_id !== issue.department_id) {
                    return NextResponse.json(
                        {
                            error: "User must belong to the same department as the issue",
                        },
                        { status: 400 }
                    );
                }
            }

            // Insert new active assignment
            const { error: insErr } = await (supabase as any)
                .from("issue_assignments")
                .insert({
                    issue_id: issueId,
                    user_id: assigned_to,
                    assigned_by: user.id,
                    assigned_at: nowIso,
                });
            if (insErr) {
                console.error("Failed to insert assignment:", insErr);
                return NextResponse.json(
                    { error: "Failed to assign user" },
                    { status: 500 }
                );
            }
        }

        // Re-fetch issue and include current assignment from mapping
        const { data: updated, error: fetchErr } = await (supabase as any)
            .from("issues")
            .select(
                `
                    *,
                    profiles:user_id(full_name, email),
                    department:department_id(id, name, email)
                `
            )
            .eq("id", issueId)
            .single();

        // Derive assigned_profile from active assignment
        let assigned_profile: {
            full_name: string | null;
            email: string;
        } | null = null;
        const { data: activeAssign } = await (supabase as any)
            .from("issue_assignments")
            .select("user_id")
            .eq("issue_id", issueId)
            .is("ended_at", null)
            .maybeSingle();

        if (activeAssign?.user_id) {
            const { data: prof } = await (supabase as any)
                .from("profiles")
                .select("full_name, email")
                .eq("id", activeAssign.user_id)
                .single();
            if (prof) {
                assigned_profile = {
                    full_name: prof.full_name || null,
                    email: prof.email,
                };
            }
        }

        return NextResponse.json({
            issue: { ...updated, assigned_profile },
            message: "Assigned successfully",
        });
    } catch (err) {
        console.error("PATCH /api/issues/[id]/assign error:", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
