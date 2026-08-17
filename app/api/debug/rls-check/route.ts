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

        const issueId = "a40c44f0-8795-431d-9b11-2b61d3ab185a";

        // Test 1: Can we read the issue?
        const { data: readIssue, error: readError } = await (supabase as any)
            .from("issues")
            .select("*")
            .eq("id", issueId)
            .single();

        // Test 2: Can we update the issue without .single()?
        const { data: updateTest, error: updateError } = await (supabase as any)
            .from("issues")
            .update({ updated_at: new Date().toISOString() })
            .eq("id", issueId)
            .select("*");

        // Test 3: Try a simple update with .single()
        const { data: updateSingle, error: updateSingleError } = await (
            supabase as any
        )
            .from("issues")
            .update({ updated_at: new Date().toISOString() })
            .eq("id", issueId)
            .select("*")
            .single();

        // Test 4: Check user info
        const { data: profile, error: profileError } = await (supabase as any)
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();

        return NextResponse.json({
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
            },
            profile: {
                data: profile,
                error: profileError?.message,
            },
            tests: {
                read: {
                    success: !!readIssue,
                    data: readIssue,
                    error: readError?.message,
                },
                updateArray: {
                    success: !!updateTest,
                    count: updateTest?.length || 0,
                    data: updateTest,
                    error: updateError?.message,
                },
                updateSingle: {
                    success: !!updateSingle,
                    data: updateSingle,
                    error: updateSingleError?.message,
                },
            },
        });
    } catch (error) {
        console.error("RLS check error:", error);
        return NextResponse.json(
            {
                error: "Failed to check RLS",
                details:
                    error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}
