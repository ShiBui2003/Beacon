export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

/**
 * POST /api/analyze-photo
 * Analyzes a photo and extracts civic issue details using Gemini AI
 */
export async function POST(req: Request) {
    try {
        const { imageBase64 } = await req.json();

        if (!imageBase64) {
            return NextResponse.json(
                { error: "Image is required" },
                { status: 400 }
            );
        }

        if (!process.env.GEMINI_API_KEY) {
            console.error("GEMINI_API_KEY not configured");
            return NextResponse.json(
                { error: "AI service not configured" },
                { status: 500 }
            );
        }

        // Prepare the prompt for comprehensive analysis
        const analysisPrompt = `Analyze this image of a civic/municipal issue and provide detailed information.

Extract and provide the following in a structured format:

1. TITLE: A clear, concise title (5-10 words) describing the issue
2. DESCRIPTION: A detailed description (2-3 sentences) of what you see, the severity, and potential impact
3. CATEGORY: Choose EXACTLY ONE from this list (use exact spelling):
   - Road Maintenance (potholes, cracks, road damage, street repairs)
   - Electrical Services (streetlights, traffic signals, power lines)
   - Sanitation (garbage, waste, trash, cleanliness, litter)
   - Water & Sewage (water leaks, drainage, flooding, sewage issues)
   - Traffic Management (traffic signals, road signs, parking)
   - Parks & Recreation (parks, playgrounds, green spaces, recreation facilities)
   
4. URGENCY: Rate as "low", "medium", or "high" based on severity and immediate risk
5. CONFIDENCE: Your confidence level (0.0-1.0) in this classification

Format your response EXACTLY as JSON:
{
  "title": "...",
  "description": "...",
  "category": "Road Maintenance|Electrical Services|Sanitation|Water & Sewage|Traffic Management|Parks & Recreation",
  "urgency": "low|medium|high",
  "confidence": 0.0-1.0
}

If this is NOT a civic issue (e.g., personal photo, unrelated content), return:
{
  "title": "Not a civic issue",
  "description": "This image does not appear to show a municipal or civic issue that requires government attention.",
  "category": "Road Maintenance",
  "urgency": "low",
  "confidence": 0.0
}`;

        // Parse base64 image
        let mimeType = "image/jpeg";
        let base64Data = imageBase64;

        const matches = imageBase64.match(/^data:(.+);base64,(.+)$/);
        if (matches) {
            mimeType = matches[1];
            base64Data = matches[2];
        } else if (imageBase64.includes(",")) {
            base64Data = imageBase64.split(",")[1];
        }

        const requestBody = {
            contents: [
                {
                    parts: [
                        { text: analysisPrompt },
                        {
                            inline_data: {
                                mime_type: mimeType,
                                data: base64Data,
                            },
                        },
                    ],
                },
            ],
        };

        const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

        console.log("[Analyze Photo] Calling Gemini API...");
        const startTime = Date.now();

        const response = await fetch(GEMINI_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
        });

        const elapsed = Date.now() - startTime;
        console.log(`[Analyze Photo] Gemini responded in ${elapsed}ms`);

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Gemini API error:", response.status, errorText);
            return NextResponse.json(
                {
                    error: "AI analysis failed",
                    details: errorText,
                    // Fallback response
                    title: "Issue Report",
                    description:
                        "Unable to analyze image automatically. Please provide details manually.",
                    category: "Road Maintenance",
                    urgency: "medium",
                    confidence: 0.0,
                },
                { status: 200 } // Return 200 with fallback so frontend doesn't break
            );
        }

        const data = await response.json();

        // Extract the AI response text
        const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        console.log("[Analyze Photo] AI Response:", aiText);

        if (!aiText) {
            return NextResponse.json({
                title: "Issue Report",
                description:
                    "Image analysis incomplete. Please provide details manually.",
                category: "Road Maintenance",
                urgency: "medium",
                confidence: 0.0,
            });
        }

        // Parse JSON from AI response
        let result;
        try {
            // Try to extract JSON from markdown code blocks if present
            const jsonMatch =
                aiText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/) ||
                aiText.match(/(\{[\s\S]*?\})/);

            if (jsonMatch) {
                result = JSON.parse(jsonMatch[1]);
            } else {
                throw new Error("No JSON found in response");
            }
        } catch (parseError) {
            console.error("[Analyze Photo] JSON parse error:", parseError);
            console.error("Raw AI text:", aiText);

            // Fallback: try to extract fields manually
            return NextResponse.json({
                title: "Civic Issue Detected",
                description: aiText.slice(0, 200),
                category: "Road Maintenance",
                urgency: "medium",
                confidence: 0.5,
                rawResponse: aiText,
            });
        }

        // Validate and normalize the response
        const normalizedResult = {
            title: result.title || "Issue Report",
            description: result.description || "Issue detected in image",
            category: result.category || "Road Maintenance", // Default to most common
            urgency: ["low", "medium", "high"].includes(
                result.urgency?.toLowerCase()
            )
                ? result.urgency.toLowerCase()
                : "medium",
            confidence:
                typeof result.confidence === "number" ? result.confidence : 0.8,
            rawResponse: aiText,
        };

        console.log("[Analyze Photo] Normalized result:", normalizedResult);

        return NextResponse.json(normalizedResult);
    } catch (error: any) {
        console.error("[Analyze Photo] Error:", error);
        return NextResponse.json(
            {
                error: "Internal server error",
                message: error.message,
                // Fallback
                title: "Issue Report",
                description:
                    "An error occurred during analysis. Please provide details manually.",
                category: "Road Maintenance",
                urgency: "medium",
                confidence: 0.0,
            },
            { status: 200 } // Return 200 with fallback
        );
    }
}
