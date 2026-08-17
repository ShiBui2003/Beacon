import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(request: NextRequest) {
    try {
        const { password } = await request.json();

        if (!password) {
            return NextResponse.json(
                { error: "Password is required to delete account" },
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
            return NextResponse.json(
                { error: "User not authenticated" },
                { status: 401 }
            );
        }

        // Verify the password by attempting to sign in
        const { error: signInError } = await (
            supabase as any
        ).auth.signInWithPassword({
            email: user.email!,
            password: password,
        });

        if (signInError) {
            console.error("Password verification failed:", signInError.message);
            return NextResponse.json(
                { error: "Invalid password" },
                { status: 401 }
            );
        }

        console.log(
            `Password verified for user ${user.id}, proceeding with data deletion...`
        );

        // Delete all user data from the database
        const { error: profileError } = await (supabase as any)
            .from("profiles")
            .delete()
            .eq("id", user.id);

        if (profileError) {
            console.error("Error deleting profile:", profileError);
            return NextResponse.json(
                { error: `Failed to delete profile: ${profileError.message}` },
                { status: 400 }
            );
        }

        // Delete all issues created by the user
        const { error: issuesError } = await (supabase as any)
            .from("issues")
            .delete()
            .eq("user_id", user.id);

        if (issuesError) {
            console.error("Error deleting issues:", issuesError);
            // Continue with other deletions even if issues fail
        }

        // Delete all comments made by the user
        const { error: commentsError } = await (supabase as any)
            .from("comments")
            .delete()
            .eq("user_id", user.id);

        if (commentsError) {
            console.error("Error deleting comments:", commentsError);
            // Continue with other deletions even if comments fail
        }

        // Delete all votes made by the user
        const { error: votesError } = await (supabase as any)
            .from("issue_votes")
            .delete()
            .eq("user_id", user.id);

        if (votesError) {
            console.error("Error deleting votes:", votesError);
            // Continue with other deletions even if votes fail
        }

        // Delete all notifications for the user
        const { error: notificationsError } = await (supabase as any)
            .from("notifications")
            .delete()
            .eq("user_id", user.id);

        if (notificationsError) {
            console.error("Error deleting notifications:", notificationsError);
            // Continue with other deletions even if notifications fail
        }

        // Delete all admin notifications for the user
        const { error: adminNotificationsError } = await (supabase as any)
            .from("admin_notifications")
            .delete()
            .eq("admin_id", user.id);

        if (adminNotificationsError) {
            console.error(
                "Error deleting admin notifications:",
                adminNotificationsError
            );
            // Continue with other deletions even if admin notifications fail
        }

        // Delete all issue updates by the user
        const { error: issueUpdatesError } = await (supabase as any)
            .from("issue_updates")
            .delete()
            .eq("user_id", user.id);

        if (issueUpdatesError) {
            console.error("Error deleting issue updates:", issueUpdatesError);
            // Continue with other deletions even if issue updates fail
        }

        // Delete the user from Supabase Auth using service role
        let authDeletionSuccess = false;

        if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
            try {
                const { createClient } = await import("@supabase/supabase-js");

                const supabaseAdmin = createClient(
                    process.env.NEXT_PUBLIC_SUPABASE_URL!,
                    process.env.SUPABASE_SERVICE_ROLE_KEY!,
                    {
                        auth: {
                            autoRefreshToken: false,
                            persistSession: false,
                        },
                    }
                );

                const { error: deleteUserError } =
                    await supabaseAdmin.auth.admin.deleteUser(user.id);

                if (deleteUserError) {
                    console.error(
                        "Error deleting user from auth:",
                        deleteUserError
                    );
                    console.log(
                        `User ${user.id} data cleared but auth account deletion failed.`
                    );
                } else {
                    console.log(
                        `User ${user.id} completely deleted from system.`
                    );
                    authDeletionSuccess = true;
                }
            } catch (error) {
                console.error("Error in auth deletion process:", error);
                console.log(
                    `User ${user.id} data cleared but auth account deletion failed.`
                );
            }
        } else {
            console.warn(
                "SUPABASE_SERVICE_ROLE_KEY not found. User data cleared but auth account remains."
            );
            console.log(
                "To enable complete account deletion, add SUPABASE_SERVICE_ROLE_KEY to your environment variables."
            );
        }

        // Clear all cookies
        const response = NextResponse.json({
            message: authDeletionSuccess
                ? "Account completely deleted successfully"
                : "Account data cleared successfully (auth account may still exist)",
        });

        // Clear auth cookies
        response.cookies.set("sb-access-token", "", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 0,
        });
        response.cookies.set("sb-refresh-token", "", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 0,
        });
        response.cookies.set("sb-provider-token", "", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 0,
        });

        return response;
    } catch (error) {
        console.error("Account deletion error:", error);
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
