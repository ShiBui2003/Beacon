export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
    try {
        const supabase = createServerClient();

        const { data: departments, error } = await (supabase as any)
            .from("departments")
            .select(
                `
        *,
        head:head_id(full_name, email)
      `
            )
            .eq("is_active", true)
            .order("name");

        if (error) {
            console.error("Error fetching departments:", error);
            return NextResponse.json(
                { error: "Failed to fetch departments" },
                { status: 500 }
            );
        }

        return NextResponse.json({ departments: departments || [] });
    } catch (error) {
        console.error("Error in GET /api/departments:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
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

        // Check if user is admin (you might want to add role checking here)
        const body = await request.json();
        const { name, description, email, phone, head_id } = body;

        if (!name) {
            return NextResponse.json(
                { error: "Department name is required" },
                { status: 400 }
            );
        }

        const { data: department, error } = await (supabase as any)
            .from("departments")
            .insert({
                name,
                description,
                email,
                phone,
                head_id,
            })
            .select(
                `
        *,
        head:head_id(full_name, email)
      `
            )
            .single();

        if (error) {
            console.error("Error creating department:", error);
            return NextResponse.json(
                { error: "Failed to create department" },
                { status: 500 }
            );
        }

        return NextResponse.json({ department }, { status: 201 });
    } catch (error) {
        console.error("Error in POST /api/departments:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
