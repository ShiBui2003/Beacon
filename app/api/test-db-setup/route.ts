export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
    try {
        const supabase = createServerClient();

        const results = {
            rolesTable: false,
            profilesColumns: false,
            rolesData: 0,
            departmentsData: 0,
        };

        // Test 1: Check if roles table exists and has data
        try {
            const { data: roles, error: rolesError } = await (supabase as any)
                .from("roles")
                .select("*");

            if (!rolesError && roles) {
                results.rolesTable = true;
                results.rolesData = roles.length;
            }
        } catch (error) {
            console.log("Roles table not found");
        }

        // Test 2: Check if profiles table has role_id and department_id columns
        try {
            const { data: profiles, error: profilesError } = await (
                supabase as any
            )
                .from("profiles")
                .select("role_id, department_id")
                .limit(1);

            if (!profilesError) {
                results.profilesColumns = true;
            }
        } catch (error) {
            console.log("Profiles columns not found");
        }

        // Test 3: Check departments data
        try {
            const { data: departments, error: deptError } = await (
                supabase as any
            )
                .from("departments")
                .select("*");

            if (!deptError && departments) {
                results.departmentsData = departments.length;
            }
        } catch (error) {
            console.log("Departments table error");
        }

        const isComplete =
            results.rolesTable &&
            results.profilesColumns &&
            results.rolesData > 0;

        return NextResponse.json({
            setupComplete: isComplete,
            details: results,
            message: isComplete
                ? "Database setup is complete! Roles and departments are stored in profiles table."
                : "Database setup is incomplete. Please run the SQL commands in MANUAL_DATABASE_SETUP.md",
        });
    } catch (error) {
        console.error("Database setup test error:", error);
        return NextResponse.json(
            {
                error: "Internal server error",
                message:
                    error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}
