"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const router = useRouter();

    useEffect(() => {
        // Redirect to unified auth page
        router.replace("/auth");
    }, [router]);

    return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="text-center">
                <h2 className="text-lg font-semibold">Redirecting to unified authentication...</h2>
                <p className="text-muted-foreground mt-2">Please wait while we redirect you.</p>
            </div>
        </div>
    );
}
