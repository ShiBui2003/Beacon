import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "./auth";

export async function getTokenFromRequest(
    request: NextRequest
): Promise<string | null> {
    // Try to get token from Authorization header
    const authHeader = request.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
        return authHeader.substring(7);
    }

    // Try to get token from cookies
    const tokenCookie = request.cookies.get("auth-token");
    if (tokenCookie) {
        return tokenCookie.value;
    }

    return null;
}

export async function authenticateRequest(request: NextRequest) {
    const token = await getTokenFromRequest(request);

    if (!token) {
        return { user: null, error: "No token provided" };
    }

    const payload = await verifyToken(token);

    if (!payload) {
        return { user: null, error: "Invalid token" };
    }

    return {
        user: {
            id: payload.userId,
            email: payload.email,
            name: payload.name,
            role: payload.role,
        },
        error: null,
    };
}

export function requireAuth(
    handler: (request: NextRequest, user: any) => Promise<NextResponse>
) {
    return async (request: NextRequest) => {
        const { user, error } = await authenticateRequest(request);

        if (error || !user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        return handler(request, user);
    };
}

export function requireRole(role: "citizen" | "department_head" | "supervisor" | "field_worker" | "clerk_operator" | "technician") {
    return function (
        handler: (request: NextRequest, user: any) => Promise<NextResponse>
    ) {
        return async (request: NextRequest) => {
            const { user, error } = await authenticateRequest(request);

            if (error || !user) {
                return NextResponse.json(
                    { error: "Unauthorized" },
                    { status: 401 }
                );
            }

            if (user.role !== role) {
                return NextResponse.json(
                    { error: "Forbidden" },
                    { status: 403 }
                );
            }

            return handler(request, user);
        };
    };
}
