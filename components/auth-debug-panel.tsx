"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    RefreshCw,
    Cookie,
    User,
    AlertCircle,
    CheckCircle,
    Eye,
    EyeOff,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { createClient } from "@/lib/supabase/client";

interface AuthDebugInfo {
    user: any;
    session: any;
    cookies: Record<string, string>;
    localStorage: Record<string, string>;
    sessionStorage: Record<string, string>;
    timestamp: string;
}

export default function AuthDebugPanel() {
    const [debugInfo, setDebugInfo] = useState<AuthDebugInfo | null>(null);
    const [showSensitive, setShowSensitive] = useState(false);
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();

    const collectDebugInfo = async () => {
        setLoading(true);
        try {
            const supabase = createClient();

            // Get current session
            const {
                data: { session },
                error,
            } = await (supabase as any).auth.getSession();

            // Get cookies
            const cookies: Record<string, string> = {};
            if (typeof document !== "undefined") {
                document.cookie.split(";").forEach((cookie) => {
                    const [name, value] = cookie.trim().split("=");
                    if (name) cookies[name] = value || "";
                });
            }

            // Get localStorage
            const localStorage: Record<string, string> = {};
            if (typeof window !== "undefined" && window.localStorage) {
                for (let i = 0; i < window.localStorage.length; i++) {
                    const key = window.localStorage.key(i);
                    if (key) {
                        localStorage[key] =
                            window.localStorage.getItem(key) || "";
                    }
                }
            }

            // Get sessionStorage
            const sessionStorage: Record<string, string> = {};
            if (typeof window !== "undefined" && window.sessionStorage) {
                for (let i = 0; i < window.sessionStorage.length; i++) {
                    const key = window.sessionStorage.key(i);
                    if (key) {
                        sessionStorage[key] =
                            window.sessionStorage.getItem(key) || "";
                    }
                }
            }

            setDebugInfo({
                user: user || null,
                session: session || null,
                cookies,
                localStorage,
                sessionStorage,
                timestamp: new Date().toISOString(),
            });
        } catch (error) {
            console.error("Error collecting debug info:", error);
        } finally {
            setLoading(false);
        }
    };

    const clearAllAuth = async () => {
        if (typeof window !== "undefined") {
            // Clear localStorage
            Object.keys(window.localStorage).forEach((key) => {
                if (key.includes("supabase") || key.includes("sb-")) {
                    window.localStorage.removeItem(key);
                }
            });

            // Clear sessionStorage
            Object.keys(window.sessionStorage).forEach((key) => {
                if (key.includes("supabase") || key.includes("sb-")) {
                    window.sessionStorage.removeItem(key);
                }
            });

            // Clear cookies
            const cookies = [
                "sb-access-token",
                "sb-refresh-token",
                "sb-provider-token",
            ];
            cookies.forEach((name) => {
                document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; domain=${window.location.hostname}`;
                document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
            });
        }

        // Sign out from Supabase
        const supabase = createClient();
        await (supabase as any).auth.signOut();

        // Refresh debug info
        await collectDebugInfo();
    };

    const maskSensitiveValue = (value: string, show: boolean = false) => {
        if (show || value.length < 20) return value;
        return (
            value.substring(0, 10) + "..." + value.substring(value.length - 10)
        );
    };

    useEffect(() => {
        collectDebugInfo();
    }, [user]);

    if (!debugInfo) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" />
                        Auth Debug Panel
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Button onClick={collectDebugInfo} disabled={loading}>
                        <RefreshCw
                            className={`w-4 h-4 mr-2 ${
                                loading ? "animate-spin" : ""
                            }`}
                        />
                        Load Debug Info
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <User className="w-5 h-5" />
                            Auth Debug Panel
                        </CardTitle>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowSensitive(!showSensitive)}
                            >
                                {showSensitive ? (
                                    <EyeOff className="w-4 h-4" />
                                ) : (
                                    <Eye className="w-4 h-4" />
                                )}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={collectDebugInfo}
                                disabled={loading}
                            >
                                <RefreshCw
                                    className={`w-4 h-4 ${
                                        loading ? "animate-spin" : ""
                                    }`}
                                />
                            </Button>
                        </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Last updated:{" "}
                        {new Date(debugInfo.timestamp).toLocaleString()}
                    </p>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Auth Status */}
                    <div>
                        <h3 className="font-medium mb-2 flex items-center gap-2">
                            {debugInfo.user ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                                <AlertCircle className="w-4 h-4 text-red-500" />
                            )}
                            Authentication Status
                        </h3>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="text-sm">User:</span>
                                <Badge
                                    variant={
                                        debugInfo.user
                                            ? "default"
                                            : "destructive"
                                    }
                                >
                                    {debugInfo.user
                                        ? "Authenticated"
                                        : "Not Authenticated"}
                                </Badge>
                            </div>
                            {debugInfo.user && (
                                <div className="text-sm space-y-1">
                                    <p>
                                        <strong>ID:</strong> {debugInfo.user.id}
                                    </p>
                                    <p>
                                        <strong>Email:</strong>{" "}
                                        {debugInfo.user.email}
                                    </p>
                                    <p>
                                        <strong>Role:</strong>{" "}
                                        {debugInfo.user.user_metadata?.role ||
                                            "Not set"}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Session Info */}
                    <div>
                        <h3 className="font-medium mb-2 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            Session Info
                        </h3>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="text-sm">Session:</span>
                                <Badge
                                    variant={
                                        debugInfo.session
                                            ? "default"
                                            : "destructive"
                                    }
                                >
                                    {debugInfo.session
                                        ? "Active"
                                        : "No Session"}
                                </Badge>
                            </div>
                            {debugInfo.session && (
                                <div className="text-sm space-y-1">
                                    <p>
                                        <strong>Expires:</strong>{" "}
                                        {new Date(
                                            debugInfo.session.expires_at * 1000
                                        ).toLocaleString()}
                                    </p>
                                    <p>
                                        <strong>Token Type:</strong>{" "}
                                        {debugInfo.session.token_type}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Cookies */}
                    <div>
                        <h3 className="font-medium mb-2 flex items-center gap-2">
                            <Cookie className="w-4 h-4" />
                            Cookies ({Object.keys(debugInfo.cookies).length})
                        </h3>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                            {Object.entries(debugInfo.cookies).map(
                                ([name, value]) => (
                                    <div key={name} className="text-xs">
                                        <strong>{name}:</strong>{" "}
                                        {maskSensitiveValue(
                                            value,
                                            showSensitive
                                        )}
                                    </div>
                                )
                            )}
                            {Object.keys(debugInfo.cookies).length === 0 && (
                                <p className="text-sm text-muted-foreground">
                                    No cookies found
                                </p>
                            )}
                        </div>
                    </div>

                    {/* LocalStorage */}
                    <div>
                        <h3 className="font-medium mb-2">
                            LocalStorage (
                            {Object.keys(debugInfo.localStorage).length})
                        </h3>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                            {Object.entries(debugInfo.localStorage)
                                .filter(
                                    ([name]) =>
                                        name.includes("supabase") ||
                                        name.includes("sb-")
                                )
                                .map(([name, value]) => (
                                    <div key={name} className="text-xs">
                                        <strong>{name}:</strong>{" "}
                                        {maskSensitiveValue(
                                            value,
                                            showSensitive
                                        )}
                                    </div>
                                ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-4 border-t">
                        <h3 className="font-medium mb-2">Debug Actions</h3>
                        <div className="flex gap-2">
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={clearAllAuth}
                            >
                                Clear All Auth Data
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.location.reload()}
                            >
                                Reload Page
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
