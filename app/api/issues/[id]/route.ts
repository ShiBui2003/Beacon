export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

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

        const body = await request.json();
        const { priority, assigned_to } = body as {
            priority?: string;
            assigned_to?: string | null;
        };
        const issueId = params.id;

        if (!priority && assigned_to === undefined) {
            return NextResponse.json(
                { error: "Priority or assigned_to is required" },
                { status: 400 }
            );
        }

        // Update the issue
        const updateData: any = {
            updated_at: new Date().toISOString(),
        };

        if (priority) {
            updateData.priority = priority;
        }

        // Handle assignment via mapping if provided
        if (assigned_to !== undefined) {
            const nowIso = new Date().toISOString();
            // End any current active assignment
            await (supabase as any)
                .from("issue_assignments")
                .update({ ended_at: nowIso })
                .eq("issue_id", issueId)
                .is("ended_at", null);
            // If assigning to a user id (truthy), create new row
            if (assigned_to) {
                const { error: insErr } = await (supabase as any)
                    .from("issue_assignments")
                    .insert({
                        issue_id: issueId,
                        user_id: assigned_to,
                        assigned_by: user.id,
                        assigned_at: nowIso,
                    });
                if (insErr) {
                    console.error("Failed to assign user:", insErr);
                    return NextResponse.json(
                        { error: "Failed to assign user" },
                        { status: 500 }
                    );
                }
            }
        }

        const { data: updatedIssue, error: updateError } = await (
            supabase as any
        )
            .from("issues")
            .update(updateData)
            .eq("id", issueId)
            .select(
                `
        *,
        profiles:user_id(full_name, email),
        department:department_id(name, email)
      `
            )
            .single();

        if (updateError) {
            console.error("Error updating issue:", updateError);
            return NextResponse.json(
                { error: "Failed to update issue" },
                { status: 500 }
            );
        }

        // Compute assigned_profile from mapping
        let assigned_profile: {
            full_name: string | null;
            email: string;
        } | null = null;
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

        return NextResponse.json({
            issue: { ...(updatedIssue as any), assigned_profile },
            message: "Issue updated successfully",
        });
    } catch (error) {
        console.error("Error in PATCH /api/issues/[id]:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
