import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
    try {
        const supabase = createServerClient();

        // Check if departments table exists and has data
        const { data: departments, error: deptError } = await (supabase as any)
            .from("departments")
            .select("id, name, email, is_active")
            .eq("is_active", true);

        // Check if issues table has department_id column by trying to select it
        const { data: sampleIssue, error: issueError } = await (supabase as any)
            .from("issues")
            .select("id, title, department_id")
            .limit(1)
            .single();

        // Check if we can find the specific issue from the error
        const issueId = "a40c44f0-8795-431d-9b11-2b61d3ab185a"; // From the error log
        const { data: specificIssue, error: specificError } = await (
            supabase as any
        )
            .from("issues")
            .select("id, title, department_id, user_id")
            .eq("id", issueId)
            .single();

        return NextResponse.json({
            departments: {
                count: departments?.length || 0,
                data: departments,
                error: deptError?.message,
            },
            issues: {
                hasDepartmentColumn: !issueError || issueError.code !== "42703", // Column doesn't exist error
                sampleIssue: sampleIssue,
                issueError: issueError?.message,
            },
            specificIssue: {
                found: !!specificIssue,
                data: specificIssue,
                error: specificError?.message,
            },
        });
    } catch (error) {
        console.error("Database debug error:", error);
        return NextResponse.json(
            {
                error: "Failed to check database status",
                details:
                    error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}
