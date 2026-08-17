export const dynamic = "force-dynamic";
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

        // Get user profile from profiles table
        const { data: profile, error: profileError } = await (supabase as any)
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();

        if (profileError && profileError.code !== "PGRST116") {
            console.error("Error fetching profile:", profileError);
            return NextResponse.json(
                { error: "Failed to fetch profile" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            profile: profile || {
                id: user.id,
                email: user.email,
                full_name: user.user_metadata?.full_name || "",
                created_at: user.created_at,
            },
        });
    } catch (error) {
        console.error("Error in GET /api/profile:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
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
        console.log("=== PROFILE API DEBUG ===");
        console.log("Received body:", JSON.stringify(body, null, 2));
        console.log(
            "department_id in body:",
            body.department_id || "not provided"
        );

        const {
            full_name,
            phone,
            bio,
            location,
            location_coordinates,
            avatar_url,
            email_notifications,
            push_notifications,
            privacy_public_profile,
            department_id,
        } = body;

        // Prepare update data
        const updateData: any = {
            id: user.id,
            email: user.email,
            full_name,
            phone,
            bio,
            location,
            location_coordinates: location_coordinates
                ? JSON.stringify(location_coordinates)
                : null,
            avatar_url,
            email_notifications,
            push_notifications,
            privacy_public_profile,
            updated_at: new Date().toISOString(),
        };

        // Resolve department_id with fallbacks and normalization
        // 1) Use explicit body value when provided (allow null to clear)
        // 2) Fallback to user metadata (department or department_id)
        // 3) Normalize empty strings to null
        let resolvedDepartmentId: string | null | undefined =
            department_id || null;
        if (resolvedDepartmentId === undefined) {
            // fallback to metadata
            const metaDept =
                (user.user_metadata as any)?.department_id ||
                (user.user_metadata as any)?.department;
            resolvedDepartmentId = metaDept ?? undefined;
        }
        if (resolvedDepartmentId === "") {
            resolvedDepartmentId = null;
        }
        if (resolvedDepartmentId !== undefined) {
            updateData.department_id = resolvedDepartmentId;
        }

        console.log("Profile update data (final):", updateData);

        // Update or insert profile
        const { data: profile, error: profileError } = await (supabase as any)
            .from("profiles")
            // on_conflict by primary key id (Supabase will match on id for upsert)
            .upsert(updateData, { onConflict: "id" })
            .select()
            .single();

        if (profileError) {
            console.error("Error updating profile:", profileError);
            return NextResponse.json(
                { error: "Failed to update profile" },
                { status: 500 }
            );
        }

        console.log("Profile updated successfully:", profile);

        return NextResponse.json({ profile });
    } catch (error) {
        console.error("Error in PUT /api/profile:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
