export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

interface VapiToolCall {
    id: string;
    function?: {
        name?: string;
        arguments?: string | Record<string, unknown>;
    };
}

function extractToolCalls(body: any): VapiToolCall[] {
    const message = body?.message ?? body;
    return (
        message?.toolCallList ??
        message?.toolCalls ??
        message?.tool_calls ??
        []
    );
}

function parseArguments(
    raw: string | Record<string, unknown> | undefined
): Record<string, any> {
    if (!raw) return {};
    if (typeof raw === "string") {
        try {
            return JSON.parse(raw);
        } catch {
            return {};
        }
    }
    return raw;
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export async function POST(request: NextRequest) {
    const configuredSecret = process.env.VAPI_WEBHOOK_SECRET;
    if (configuredSecret) {
        const provided = request.headers.get("x-vapi-secret");
        if (provided !== configuredSecret) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
    }

    let body: any;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ results: [] });
    }

    const toolCalls = extractToolCalls(body);
    if (toolCalls.length === 0) {
        return NextResponse.json({ results: [] });
    }

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const results = await Promise.all(
        toolCalls.map(async (call) => {
            const args = parseArguments(call.function?.arguments);
            const { title, description, category, lat, lng, userId } = args;

            if (!userId) {
                return {
                    toolCallId: call.id,
                    result:
                        "I couldn't submit that because you're not signed in. Please log in to the app and try again.",
                };
            }
            if (!title || !description || !category) {
                return {
                    toolCallId: call.id,
                    result:
                        "I'm missing some details — I need a title, description, and category before I can submit this.",
                };
            }

            const verifyResponse = await fetch(`${SITE_URL}/api/verify-issue`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, category, description }),
            }).catch(() => null);
            const verifyData = verifyResponse
                ? await verifyResponse.json().catch(() => null)
                : null;

            if (!verifyData || verifyData.decision !== "Yes") {
                return {
                    toolCallId: call.id,
                    result:
                        "That doesn't sound like a civic issue I can submit — I can report things like potholes, streetlights, garbage, or water leaks.",
                };
            }

            const finalCategory = verifyData.category || category;
            const latNum = Number(lat);
            const lngNum = Number(lng);

            const { data: departments } = await supabase
                .from("departments")
                .select("id, name")
                .eq("name", finalCategory);
            const departmentId =
                departments && departments.length > 0
                    ? (departments[0] as any).id
                    : null;

            const { data: issue, error } = await supabase
                .from("issues")
                .insert({
                    title,
                    description,
                    category: finalCategory,
                    priority: "medium",
                    location_address:
                        Number.isFinite(latNum) && Number.isFinite(lngNum)
                            ? `${latNum}, ${lngNum}`
                            : "Reported via voice — location unavailable",
                    location_lat: Number.isFinite(latNum) ? latNum : null,
                    location_lng: Number.isFinite(lngNum) ? lngNum : null,
                    user_id: userId,
                    department_id: departmentId,
                })
                .select("id")
                .single();

            if (error || !issue) {
                console.error("Vapi webhook: failed to insert issue", error);
                return {
                    toolCallId: call.id,
                    result:
                        "Something went wrong saving that report — please try again in a moment.",
                };
            }

            fetch(`${SITE_URL}/api/issues/${(issue as any).id}/ai-urgency`, {
                method: "POST",
            }).catch((err) =>
                console.error("Vapi webhook: failed to trigger AI urgency", err)
            );

            return {
                toolCallId: call.id,
                result: `Got it — I've submitted "${title}" under ${finalCategory}. Thanks for reporting it!`,
            };
        })
    );

    return NextResponse.json({ results });
}
