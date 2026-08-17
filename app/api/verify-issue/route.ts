import { getAllCategories } from "@/lib/departments";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { title, category, description, imageBase64 } = await req.json();

        // Prompt for verifying issue legitimacy
        const verifyPrompt = `
You are verifying a civic issue report. Analyze if this is a legitimate civic issue that requires municipal attention.

Issue Title: "${title}"
Description: "${description}"

Check if:
1. The issue is a genuine civic problem (potholes, streetlights, garbage, water leakage, traffic signals, road damage, etc.)
2. The description matches the selected category
3. The description is reasonable and not spam/fake
4. If an image is provided, it should match the description

Only respond with exactly "Yes" or "No".
- "Yes" if it's a legitimate civic issue
- "No" if it's spam, fake, irrelevant, or doesn't match the category
`;

        // Prompt for validating / correcting the category
        const categoryPrompt = `
You are a helpful assistant analyzing the category of a civic issue report.
You will be given the title, category, and description of an issue.
Your job is to analyze them and determine the most appropriate category.

Issue Title: "${title}"
Category: "${category}"
Description: "${description}"

The available categories are: ${(await getAllCategories()).join(", ")}

Return only the category that best matches the issue. match the result word to word with the available categories.
`;

        // === Build request bodies ===
        const requestBody: any = {
            contents: [
                {
                    parts: [{ text: verifyPrompt }],
                },
            ],
            generationConfig: {
                temperature: 0.1,
                maxOutputTokens: 10,
            },
        };

        const categoryRequestBody: any = {
            contents: [
                {
                    parts: [{ text: categoryPrompt }],
                },
            ],
        };

        // === Handle image if provided ===
        if (imageBase64) {
            // Extract mime type & raw base64
            const matches = imageBase64.match(
                /^data:(image\/\w+);base64,(.+)$/
            );
            let mimeType = "image/jpeg";
            let base64Data = imageBase64;

            if (matches) {
                mimeType = matches[1];
                base64Data = matches[2];
            } else if (imageBase64.includes(",")) {
                base64Data = imageBase64.split(",")[1];
            }

            const inlineImage = {
                inline_data: {
                    mime_type: mimeType,
                    data: base64Data,
                },
            };

            // Add image to both requests
            requestBody.contents[0].parts.push(inlineImage);
            categoryRequestBody.contents[0].parts.push(inlineImage);
        }

        // === Call Gemini APIs ===
        const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

        const [categoryResponse, verifyResponse] = await Promise.all([
            fetch(GEMINI_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(categoryRequestBody),
            }),
            fetch(GEMINI_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestBody),
            }),
        ]);

        if (!verifyResponse.ok) {
            console.error(
                "Gemini API verification error:",
                verifyResponse.status,
                await verifyResponse.text()
            );
            return NextResponse.json({ decision: "No" });
        }

        if (!categoryResponse.ok) {
            console.error(
                "Gemini API category error:",
                categoryResponse.status,
                await categoryResponse.text()
            );
        }

        // === Parse responses ===
        const verifyData = await verifyResponse.json();
        const categoryData = await categoryResponse.json();

        const verifyText =
            verifyData?.candidates?.[0]?.content?.parts?.[0]?.text || "No";
        const categoryText =
            categoryData?.candidates?.[0]?.content?.parts?.[0]?.text ||
            category;

        const decision = verifyText.trim().toLowerCase().includes("yes")
            ? "Yes"
            : "No";

        console.log("=== GEMINI VERIFICATION RESULT ===");
        console.log("Title:", title);
        console.log("Category (user):", category);
        console.log("Category (AI):", categoryText.trim());
        console.log("Description:", description);
        console.log("Has Image:", !!imageBase64);
        console.log("Gemini Verify Response:", verifyText.trim());
        console.log("Final Decision:", decision);
        console.log(
            "Available Categories:",
            (await getAllCategories()).join(", ")
        );
        console.log("=====================================");
        return NextResponse.json({ decision, category: categoryText.trim() });
    } catch (error) {
        console.error("Gemini verification error:", error);
        return NextResponse.json({ decision: "No" });
    }
}
