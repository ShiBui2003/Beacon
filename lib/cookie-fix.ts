// Cookie fix utility for Supabase authentication issues

export const cookieFix = {
    // Clear all Supabase-related cookies
    clearSupabaseCookies: () => {
        if (typeof document === "undefined") return;

        const cookiesToClear = [
            "sb-access-token",
            "sb-refresh-token",
            "sb-provider-token",
            "supabase-auth-token",
            "supabase.auth.token",
        ];

        cookiesToClear.forEach((name) => {
            // Clear for current domain
            document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
            // Clear for parent domain
            document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; domain=${window.location.hostname}`;
            // Clear for localhost
            document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; domain=localhost`;
        });
    },

    // Clear all auth-related localStorage
    clearAuthStorage: () => {
        if (typeof window === "undefined") return;

        const keysToRemove: string[] = [];

        // Find all Supabase-related keys
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.includes("supabase") || key.includes("sb-"))) {
                keysToRemove.push(key);
            }
        }

        // Remove them
        keysToRemove.forEach((key) => localStorage.removeItem(key));

        // Also clear sessionStorage
        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key && (key.includes("supabase") || key.includes("sb-"))) {
                sessionStorage.removeItem(key);
            }
        }
    },

    // Fix cookie settings for better compatibility
    setSecureCookie: (name: string, value: string, options: any = {}) => {
        if (typeof document === "undefined") return;

        const isSecure = window.location.protocol === "https:";
        const domain = window.location.hostname;

        const cookieOptions = [
            `path=${options.path || "/"}`,
            options.maxAge ? `max-age=${options.maxAge}` : "",
            `SameSite=${options.sameSite || "lax"}`,
            isSecure ? "Secure" : "",
            // Don't set domain for localhost
            domain !== "localhost" && domain !== "127.0.0.1"
                ? `domain=${domain}`
                : "",
        ]
            .filter(Boolean)
            .join("; ");

        document.cookie = `${name}=${value}; ${cookieOptions}`;
    },

    // Check if cookies are working
    testCookies: () => {
        if (typeof document === "undefined") return false;

        const testName = "test-cookie";
        const testValue = "test-value";

        // Set test cookie
        document.cookie = `${testName}=${testValue}; path=/`;

        // Check if it was set
        const cookieExists = document.cookie.includes(
            `${testName}=${testValue}`
        );

        // Clean up
        document.cookie = `${testName}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;

        return cookieExists;
    },

    // Get all current cookies
    getAllCookies: () => {
        if (typeof document === "undefined") return {};

        const cookies: Record<string, string> = {};
        document.cookie.split(";").forEach((cookie) => {
            const [name, value] = cookie.trim().split("=");
            if (name) cookies[name] = value || "";
        });
        return cookies;
    },

    // Force refresh auth state
    refreshAuth: async () => {
        try {
            // Import dynamically to avoid SSR issues
            const { createClient } = await import("@/lib/supabase/client");
            const supabase = createClient();

            // Force refresh the session
            const { data, error } = await (
                supabase as any
            ).auth.refreshSession();

            if (error) {
                console.error("Auth refresh error:", error);
                return false;
            }

            return true;
        } catch (error) {
            console.error("Failed to refresh auth:", error);
            return false;
        }
    },

    // Complete auth reset
    resetAuth: async () => {
        try {
            // Clear all storage
            cookieFix.clearSupabaseCookies();
            cookieFix.clearAuthStorage();

            // Import and sign out
            const { createClient } = await import("@/lib/supabase/client");
            const supabase = createClient();
            await (supabase as any).auth.signOut();

            // Force page reload after a short delay
            setTimeout(() => {
                window.location.href = "/";
            }, 500);

            return true;
        } catch (error) {
            console.error("Failed to reset auth:", error);
            return false;
        }
    },
};

// Auto-fix common cookie issues on import
if (typeof window !== "undefined") {
    // Check if cookies are working
    if (!cookieFix.testCookies()) {
        console.warn("Cookies may not be working properly");
    }

    // Add to window for debugging
    (window as any).cookieFix = cookieFix;
}
