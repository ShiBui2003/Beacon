import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/middleware";

export async function GET(request: NextRequest) {
    const { user, error } = await authenticateRequest(request);

    if (error || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ user });
}
