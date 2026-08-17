"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

type UserRole =
    | "citizen"
    | "department_head"
    | "supervisor"
    | "field_worker"
    | "clerk_operator"
    | "technician"
    | "admin";

type AuthContextType = {
    user: User | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<{ error?: Error }>;
    signUp: (
        email: string,
        password: string,
        fullName: string,
        role?: UserRole,
        department?: string,
        departmentId?: string
    ) => Promise<{ error?: Error }>;
    signOut: () => Promise<{ error?: Error }>;
    signInWithGoogle: (
        userType?: UserRole,
        callbackUrl?: string,
        departmentId?: string
    ) => Promise<{ error?: Error }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [hasRedirected, setHasRedirected] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const supabase = createClient();

        // Check active sessions and sets the user
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
            setUser(session?.user ?? null);

            // Only set loading to false on initial load or when we have a definitive state
            if (loading) {
                setLoading(false);
            }

            // Get the current path to prevent unnecessary redirects
            const currentPath = window.location.pathname;

            // Handle auth state changes
            if (event === "SIGNED_IN" && session?.user) {
                const role =
                    session.user.user_metadata?.role ||
                    session.user.role ||
                    "citizen";

                // Only redirect if not already on a valid route or on auth callback
                if (currentPath === "/auth/callback") {
                    return;
                }

                // Only redirect if not already on a valid route and haven't redirected yet
                if (!hasRedirected) {
                    if (
                        role !== "citizen" &&
                        !currentPath.startsWith("/admin")
                    ) {
                        setHasRedirected(true);
                        router.replace("/admin/dashboard");
                    } else if (
                        role === "citizen" &&
                        !currentPath.startsWith("/citizen")
                    ) {
                        setHasRedirected(true);
                        router.replace("/citizen/dashboard");
                    }
                }
            } else if (event === "SIGNED_OUT") {
                setHasRedirected(false); // Reset redirect flag on sign out
                // Only redirect if not already on a public route
                if (
                    !["/citizen/login", "/admin/login", "/", "/auth"].includes(
                        currentPath
                    )
                ) {
                    router.replace("/");
                }
            }
        });

        // Check active session on initial load
        const getSession = async () => {
            try {
                const {
                    data: { session },
                    error,
                } = await (supabase as any).auth.getSession();

                if (error) throw error;

                setUser(session?.user ?? null);

                // Don't handle redirects here for auth callback routes - let the callback page handle them
                // This prevents conflicts during OAuth flows
                const currentPath = window.location.pathname;
                if (currentPath === "/auth/callback") {
                    return;
                }

                // Handle initial redirect based on session and role for other routes
                if (session?.user) {
                    const role =
                        session.user.user_metadata?.role ||
                        session.user.role ||
                        "citizen";

                    // Don't redirect if already on a valid route for the user's role and haven't redirected yet
                    if (!hasRedirected) {
                        if (
                            role !== "citizen" &&
                            !currentPath.startsWith("/admin")
                        ) {
                            setHasRedirected(true);
                            router.replace("/admin/dashboard");
                        } else if (
                            (role === "citizen" || !role) &&
                            !currentPath.startsWith("/citizen") &&
                            currentPath !== "/auth"
                        ) {
                            setHasRedirected(true);
                            router.replace("/citizen/dashboard");
                        }
                    }
                }
            } catch (error) {
                console.error("Error getting session:", error);
            } finally {
                setLoading(false);
            }
        };

        getSession();

        return () => {
            subscription?.unsubscribe();
        };
    }, [router]);

    const signIn = async (email: string, password: string) => {
        try {
            const supabase = createClient();
            const { data, error } = await (
                supabase as any
            ).auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                return { error: new Error(error.message) };
            }

            // Check if this is a first-time sign-in (no profile exists)
            if (data.user) {
                const { data: profile } = await (supabase as any)
                    .from("profiles")
                    .select("id")
                    .eq("id", data.user.id)
                    .single();

                // If no profile exists, this is a first-time user
                if (!profile) {
                    // Redirect to signup to complete profile setup
                    if (typeof window !== "undefined") {
                        window.location.href =
                            "/auth?mode=signup&firstTime=true&email=" +
                            encodeURIComponent(email);
                    }
                }
            }

            return { error: undefined };
        } catch (error) {
            return { error: error as Error };
        }
    };

    const signUp = async (
        email: string,
        password: string,
        fullName: string,
        role: UserRole = "citizen",
        department?: string
    ) => {
        try {
            const supabase = createClient();
            const { error } = await (supabase as any).auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                        role: role,
                        department: department,
                        admin_level: role === "admin" ? "senior" : undefined, // Set default admin level for admins
                    },
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                },
            });
            return { error: error ? new Error(error.message) : undefined };
        } catch (error) {
            return { error: error as Error };
        }
    };

    const signOut = async () => {
        try {
            const supabase = createClient();

            // Clear all auth-related cookies first
            if (typeof document !== "undefined") {
                document.cookie =
                    "sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
                document.cookie =
                    "sb-refresh-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
                document.cookie =
                    "sb-provider-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
            }

            // Sign out from Supabase
            const { error } = await (supabase as any).auth.signOut();

            // Force a hard redirect to signup page after signout
            if (typeof window !== "undefined") {
                window.location.href = "/auth?mode=signup";
                // Prevent any further execution after redirect
                await new Promise(() => {});
            }

            return { error: error ? new Error(error.message) : undefined };
        } catch (error) {
            console.error("Error during sign out:", error);
            // Even if there's an error, try to redirect to signup
            if (typeof window !== "undefined") {
                window.location.href = "/auth?mode=signup";
            }
            return { error: error as Error };
        }
    };

    const signInWithGoogle = async (
        userType: UserRole = "citizen",
        callbackUrl?: string,
        departmentId?: string
    ) => {
        try {
            const supabase = createClient();

            // Use custom redirect URL if provided, otherwise use default
            const redirectTo =
                callbackUrl || `${window.location.origin}/auth/callback`;

            console.log("Google OAuth redirect URL:", redirectTo);

            const { data, error } = await (
                supabase as any
            ).auth.signInWithOAuth({
                provider: "google",
                options: {
                    redirectTo,
                    queryParams: {
                        access_type: "offline",
                        prompt: "consent",
                    },
                },
            });

            if (error) throw error;
            return { error: undefined };
        } catch (error) {
            console.error("Error signing in with Google:", error);
            return { error: error as Error };
        }
    };

    const value = {
        user,
        loading,
        signIn,
        signUp,
        signOut,
        signInWithGoogle,
    };

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
