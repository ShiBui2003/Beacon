import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
    try {
        console.log("Password reset request received");

        const body = await request.json();
        console.log("Request body:", {
            newPassword: body.newPassword ? "***" : "missing",
        });

        const { newPassword } = body;

        if (!newPassword) {
            console.log("Error: New password is missing");
            return NextResponse.json(
                { error: "New password is required" },
                { status: 400 }
            );
        }

        if (newPassword.length < 6) {
            console.log("Error: Password too short");
            return NextResponse.json(
                { error: "New password must be at least 6 characters long" },
                { status: 400 }
            );
        }

        const supabase = createClient();

        // Get the current user
        const {
            data: { user },
            error: userError,
        } = await (supabase as any).auth.getUser();

        if (userError || !user) {
            console.log("Error: User not authenticated", userError);
            return NextResponse.json(
                { error: "User not authenticated" },
                { status: 401 }
            );
        }

        console.log(`Updating password for user: ${user.id}`);

        // Update the user's password
        const { error: updateError } = await (supabase as any).auth.updateUser({
            password: newPassword,
        });

        if (updateError) {
            console.error("Password update error:", updateError);
            return NextResponse.json(
                { error: updateError.message || "Failed to update password" },
                { status: 400 }
            );
        }

        console.log("Password updated successfully");
        return NextResponse.json({
            message: "Password updated successfully",
        });
    } catch (error) {
        console.error("Password reset error:", error);
        return NextResponse.json(
            {
                error: `Internal server error: ${
                    error instanceof Error ? error.message : "Unknown error"
                }`,
            },
            { status: 500 }
        );
    }
}
