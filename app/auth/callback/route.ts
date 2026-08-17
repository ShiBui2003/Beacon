import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");
    const role = requestUrl.searchParams.get("role");
    const departmentId = requestUrl.searchParams.get("department");
    const isSignup = requestUrl.searchParams.get("signup") === "true";
    const next = requestUrl.searchParams.get("next") || "/";

    console.log("Server callback - params:", {
        code: !!code,
        role,
        departmentId,
        isSignup,
    });

    if (code) {
        const supabase = createServerClient();
        const { error, data } = await (
            supabase as any
        ).auth.exchangeCodeForSession(code);

        if (!error && data?.user) {
            console.log("Session established for user:", data.user.id);

            // If this is a signup with a specific role, update the user metadata and profile
            if (isSignup && role) {
                console.log(
                    "Updating user role to:",
                    role,
                    "and department to:",
                    departmentId
                );

                // Update user metadata
                const { error: updateError } = await (
                    supabase as any
                ).auth.updateUser({
                    data: {
                        role: role,
                        department_id: departmentId,
                    },
                });

                if (updateError) {
                    console.error("Error updating user metadata:", updateError);
                } else {
                    console.log("Successfully updated user metadata");
                }

                // Update profile with role and department
                if (role !== "citizen") {
                    try {
                        // Try to get role ID from database (if roles table exists)
                        const { data: roleData, error: roleError } = await (
                            supabase as any
                        )
                            .from("roles")
                            .select("id")
                            .eq(
                                "name",
                                role
                                    .replace("_", " ")
                                    .replace(/\b\w/g, (l) => l.toUpperCase())
                            )
                            .single();

                        if (roleData && !roleError) {
                            // Roles table exists, update with role_id
                            const { error: profileError } = await (
                                supabase as any
                            )
                                .from("profiles")
                                .update({
                                    role_id: (roleData as any).id,
                                    department_id: departmentId,
                                })
                                .eq("id", data.user.id);

                            if (profileError) {
                                console.error(
                                    "Error updating profile with role_id:",
                                    profileError
                                );
                            } else {
                                console.log(
                                    "Successfully updated profile with role_id and department"
                                );
                            }
                        } else {
                            // Roles table doesn't exist, just update department_id
                            console.log(
                                "Roles table not found, updating only department_id"
                            );
                            const { error: profileError } = await (
                                supabase as any
                            )
                                .from("profiles")
                                .update({
                                    department_id: departmentId,
                                })
                                .eq("id", data.user.id);

                            if (profileError) {
                                console.error(
                                    "Error updating profile with department_id:",
                                    profileError
                                );
                            } else {
                                console.log(
                                    "Successfully updated profile with department_id"
                                );
                            }
                        }
                    } catch (error) {
                        console.error("Error updating profile:", error);
                        // Continue anyway - the role is already in user metadata
                    }
                }

                // Redirect to client-side callback with role parameter
                const callbackUrl = new URL("/auth/callback", request.url);
                callbackUrl.searchParams.set("role", role);
                if (departmentId) {
                    callbackUrl.searchParams.set("department", departmentId);
                }
                callbackUrl.searchParams.set("updated", "true");

                return NextResponse.redirect(callbackUrl);
            }

            // For signin or if role update wasn't needed, redirect to client-side callback
            return NextResponse.redirect(
                new URL("/auth/callback", request.url)
            );
        }
    }

    // If there's an error or no code, redirect to auth page
    return NextResponse.redirect(new URL("/auth", request.url));
}
