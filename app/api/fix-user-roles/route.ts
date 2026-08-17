import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST() {
    try {
        const supabase = createServerClient();

        // Get all profiles without role_id
        const { data: profilesWithoutRoles, error: fetchError } = await (
            supabase as any
        )
            .from("profiles")
            .select("id, email, full_name")
            .is("role_id", null);

        if (fetchError) {
            console.error("Error fetching profiles:", fetchError);
            return NextResponse.json(
                { error: "Failed to fetch profiles" },
                { status: 500 }
            );
        }

        // Get citizen role ID
        const { data: citizenRole, error: roleError } = await (supabase as any)
            .from("roles")
            .select("id")
            .eq("name", "Citizen")
            .single();

        if (roleError || !citizenRole) {
            console.error("Error fetching citizen role:", roleError);
            return NextResponse.json(
                { error: "Citizen role not found" },
                { status: 500 }
            );
        }

        // Update profiles to have citizen role
        const updates = [];
        for (const profile of profilesWithoutRoles || []) {
            const { error: updateError } = await (supabase as any)
                .from("profiles")
                .update({ role_id: citizenRole.id })
                .eq("id", profile.id);

            if (updateError) {
                console.error(
                    `Error updating profile ${profile.id}:`,
                    updateError
                );
                updates.push({ id: profile.id, error: updateError.message });
            } else {
                updates.push({ id: profile.id, success: true });
            }
        }

        return NextResponse.json({
            message: "Role assignment completed",
            profilesUpdated: profilesWithoutRoles?.length || 0,
            updates,
        });
    } catch (error) {
        console.error("Fix roles error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
