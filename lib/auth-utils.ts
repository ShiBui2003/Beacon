import { createClient } from "@/lib/supabase/client";
import { redirect } from "next/navigation";

export async function signOut(redirectPath: string = "/") {
    try {
        const supabase = createClient();

        // Sign out from Supabase
        const { error } = await (supabase as any).auth.signOut();

        // Clear all auth-related cookies
        if (typeof document !== "undefined") {
            document.cookie =
                "sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
            document.cookie =
                "sb-refresh-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
            document.cookie =
                "sb-provider-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

            // Force a hard redirect to ensure all state is cleared
            window.location.href = redirectPath;

            // Prevent any further execution after redirect
            await new Promise(() => {});
        } else {
            // For server-side, return a redirect response
            const response = new Response(null, {
                status: 302,
                headers: {
                    Location: redirectPath,
                    "Set-Cookie": [
                        "sb-access-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT",
                        "sb-refresh-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT",
                        "sb-provider-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT",
                    ].join(", "),
                },
            });

            return response;
        }

        return { error: error || null };
    } catch (error) {
        console.error("Unexpected error during sign out:", error);

        // Even if there's an error, try to redirect
        if (typeof window !== "undefined") {
            window.location.href = redirectPath;
        }

        return { error: error as Error };
    }
}

export async function getUserSession() {
    const supabase = createClient();
    const {
        data: { session },
        error,
    } = await (supabase as any).auth.getSession();

    if (error) {
        console.error("Error getting user session:", error);
        return { session: null, error };
    }

    return { session, error: null };
}
