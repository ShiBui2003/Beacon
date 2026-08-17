export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

export async function GET() {
    const diagnostics: any = {
        timestamp: new Date().toISOString(),
        env_check: {
            HF_TOKEN_exists: !!process.env.HF_TOKEN,
            HF_TOKEN_prefix: process.env.HF_TOKEN
                ? process.env.HF_TOKEN.slice(0, 10) + "..."
                : "NOT SET",
            NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        },
        test_results: null as any,
    };

    try {
        if (!process.env.HF_TOKEN) {
            return NextResponse.json(
                {
                    ...diagnostics,
                    error: "HF_TOKEN environment variable is not set",
                    fix: "Add HF_TOKEN to your deployment platform environment variables",
                },
                { status: 500 }
            );
        }

        console.log("Testing HF API from deployment...");
        const startTime = Date.now();

        const response = await fetch(
            "https://router.huggingface.co/hf-inference/models/facebook/bart-large-mnli",
            {
                headers: {
                    Authorization: `Bearer ${process.env.HF_TOKEN}`,
                    "Content-Type": "application/json",
                },
                method: "POST",
                body: JSON.stringify({
                    inputs: "Severe pothole causing accidents. Category: Roads",
                    parameters: {
                        candidate_labels: [
                            "high urgency",
                            "medium urgency",
                            "low urgency",
                        ],
                    },
                }),
            }
        );

        const elapsed = Date.now() - startTime;
        const responseText = await response.text();

        let parsedResult;
        try {
            parsedResult = JSON.parse(responseText);
        } catch {
            parsedResult = responseText;
        }

        diagnostics.test_results = {
            status: response.status,
            statusText: response.statusText,
            elapsed_ms: elapsed,
            response: parsedResult,
        };

        if (!response.ok) {
            return NextResponse.json(
                {
                    ...diagnostics,
                    error: `HF API returned ${response.status}`,
                    possible_causes: [
                        response.status === 401 ? "Invalid HF_TOKEN" : null,
                        response.status === 503
                            ? "Model is loading (wait 30s and retry)"
                            : null,
                        response.status === 429 ? "Rate limit exceeded" : null,
                    ].filter(Boolean),
                },
                { status: response.status }
            );
        }

        return NextResponse.json({
            ...diagnostics,
            success: true,
            message: "HF API is working correctly!",
        });
    } catch (error: any) {
        console.error("HF test error:", error);
        return NextResponse.json(
            {
                ...diagnostics,
                error: error.message,
                stack: error.stack,
                type: error.name,
            },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    try {
        const { title, description, category } = await req.json();

        if (!process.env.HF_TOKEN) {
            return NextResponse.json({
                error: "HF_TOKEN not configured",
                urgency: "medium",
                confidence: 0.0,
            });
        }

        const inputText = `${title}. ${description}. Category: ${category}`;

        console.log("Testing with custom input:", inputText.slice(0, 100));

        const response = await fetch(
            "https://router.huggingface.co/hf-inference/models/facebook/bart-large-mnli",
            {
                headers: {
                    Authorization: `Bearer ${process.env.HF_TOKEN}`,
                    "Content-Type": "application/json",
                },
                method: "POST",
                body: JSON.stringify({
                    inputs: inputText,
                    parameters: {
                        candidate_labels: [
                            "high urgency",
                            "medium urgency",
                            "low urgency",
                        ],
                    },
                }),
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error("HF API error:", response.status, errorText);
            return NextResponse.json({
                error: `HF API error: ${response.status}`,
                details: errorText,
                urgency: "medium",
                confidence: 0.0,
            });
        }

        const result = await response.json();

        let urgency = "medium";
        let confidence = 0.0;

        if (Array.isArray(result) && result.length > 0) {
            const best = result[0];
            confidence = best.score;

            if (best.label.toLowerCase().includes("high")) urgency = "high";
            else if (best.label.toLowerCase().includes("low")) urgency = "low";
            else urgency = "medium";
        }

        return NextResponse.json({
            success: true,
            urgency,
            confidence,
            rawResponse: result,
        });
    } catch (error: any) {
        console.error("Test error:", error);
        return NextResponse.json(
            {
                error: error.message,
                urgency: "medium",
                confidence: 0.0,
            },
            { status: 500 }
        );
    }
}
