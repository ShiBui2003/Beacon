import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
    try {
        const supabase = createServerClient();

        // Try to fetch roles from database first
        const { data: roles, error } = await (supabase as any)
            .from("roles")
            .select("*")
            .order("level", { ascending: true });

        if (error) {
            console.log(
                "Roles table not found, using hardcoded roles:",
                error.message
            );

            // Fallback to hardcoded roles if table doesn't exist
            const hardcodedRoles = [
                {
                    id: "1",
                    name: "Citizen",
                    description: "Standard user, can report and track issues",
                    level: 0,
                },
                {
                    id: "2",
                    name: "Department Head",
                    description:
                        "Manages a department, full administrative access within department",
                    level: 5,
                },
                {
                    id: "3",
                    name: "Supervisor",
                    description:
                        "Oversees field workers and clerks, manages issue assignments",
                    level: 4,
                },
                {
                    id: "4",
                    name: "Field Worker",
                    description:
                        "Resolves issues on-site, updates issue status",
                    level: 3,
                },
                {
                    id: "5",
                    name: "Clerk / Operator",
                    description:
                        "Handles administrative tasks, data entry, initial issue triage",
                    level: 2,
                },
                {
                    id: "6",
                    name: "Technician",
                    description:
                        "Specialized worker for specific technical issues",
                    level: 3,
                },
            ];

            return NextResponse.json({
                roles: hardcodedRoles,
            });
        }

        return NextResponse.json({
            roles: roles || [],
        });
    } catch (error) {
        console.error("Error in roles API:", error);
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
