import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { detectAIUrgency, type AIUrgencyRequest } from "@/lib/aiUrgency";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // Allow 60s for model loading

/**
 * POST /api/issues/[id]/ai-urgency
 * Detect AI urgency for an issue and update the database
 */
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Use service role key for server-side operations
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
        const issueId = params.id;

        // Get the issue data
        const { data: issue, error: issueError } = await (supabase as any)
            .from("issues")
            .select("id, title, description, category")
            .eq("id", issueId)
            .single();

        if (issueError || !issue) {
            return NextResponse.json(
                { error: "Issue not found" },
                { status: 404 }
            );
        }

        // Prepare data for AI detection
        const issueData: AIUrgencyRequest = {
            title: issue.title,
            description: issue.description,
            category: issue.category,
        };

        console.log(`[AI Urgency] Processing issue ${issueId}:`, issueData);

        // Detect AI urgency
        const aiResult = await detectAIUrgency(issueData);

        console.log(`[AI Urgency] Result for ${issueId}:`, aiResult);

        // Update the issue with AI urgency AND override priority
        const { error: updateError } = await (supabase as any)
            .from("issues")
            .update({
                ai_urgency: aiResult.urgency,
                ai_confidence: aiResult.confidence,
                priority: aiResult.urgency, // Override user priority with AI urgency
                updated_at: new Date().toISOString(),
            })
            .eq("id", issueId);

        if (updateError) {
            console.error("Error updating issue with AI urgency:", updateError);
            return NextResponse.json(
                { error: "Failed to update issue" },
                { status: 500 }
            );
        }

        console.log(
            `[AI Urgency] Successfully updated issue ${issueId} - urgency: ${aiResult.urgency}, priority overridden to: ${aiResult.urgency}`
        );

        return NextResponse.json({
            success: true,
            urgency: aiResult.urgency,
            confidence: aiResult.confidence,
            issueId,
        });
    } catch (error) {
        console.error("Error in AI urgency detection:", error);
        return NextResponse.json(
            {
                error: "Internal server error",
                details:
                    error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}

/**
 * GET /api/issues/[id]/ai-urgency
 * Get current AI urgency for an issue
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Use service role key for server-side operations
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
        const issueId = params.id;

        // Get the issue with AI urgency data
        const { data: issue, error } = await (supabase as any)
            .from("issues")
            .select("id, ai_urgency, ai_confidence")
            .eq("id", issueId)
            .single();

        if (error || !issue) {
            return NextResponse.json(
                { error: "Issue not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            urgency: issue.ai_urgency || "medium",
            confidence: issue.ai_confidence || 0,
            issueId,
        });
    } catch (error) {
        console.error("Error fetching AI urgency:", error);
        return NextResponse.json(
            {
                error: "Internal server error",
            },
            { status: 500 }
        );
    }
}
