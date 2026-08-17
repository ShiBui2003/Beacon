/**
 * AI Urgency Detection Module
 * Uses Hugging Face BART model for zero-shot classification
 */

export type AIUrgency = "low" | "medium" | "high";

export interface AIUrgencyResult {
    urgency: AIUrgency;
    confidence: number;
    rawResponse?: any;
}

export interface AIUrgencyRequest {
    title: string;
    description: string;
    category: string;
}

/**
 * Call Hugging Face API to detect urgency
 * @param issueData - Issue title, description, and category
 * @returns Promise<AIUrgencyResult> - AI urgency classification
 */
export async function detectAIUrgency(
    issueData: AIUrgencyRequest
): Promise<AIUrgencyResult> {
    try {
        // Prepare the input text for classification
        const inputText = `${issueData.title}. ${issueData.description}. Category: ${issueData.category}`;

        // Candidate labels for urgency classification
        const candidateLabels = [
            "high urgency",
            "medium urgency",
            "low urgency",
        ];

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
                    parameters: { candidate_labels: candidateLabels },
                }),
            }
        );

        if (!response.ok) {
            throw new Error(
                `HF API error: ${response.status} ${response.statusText}`
            );
        }

        const result = await response.json();

        // Parse the response - handle both array and object formats
        let labels: string[] = [];
        let scores: number[] = [];

        if (Array.isArray(result)) {
            // New format: [{ label: "...", score: 0.5 }, ...]
            labels = result.map((item: any) => item.label);
            scores = result.map((item: any) => item.score);
        } else if (result && result.labels && result.scores) {
            // Old format: { labels: [...], scores: [...] }
            labels = result.labels;
            scores = result.scores;
        }

        // Parse the response to extract urgency and confidence
        if (labels.length > 0 && scores.length > 0) {
            // Find the label with the highest score
            let maxScore = 0;
            let bestLabel = "";
            let bestScore = 0;

            for (let i = 0; i < labels.length; i++) {
                if (scores[i] > maxScore) {
                    maxScore = scores[i];
                    bestLabel = labels[i];
                    bestScore = scores[i];
                }
            }

            // Map HF labels to our urgency levels
            let urgency: AIUrgency = "medium"; // Default fallback

            if (bestLabel.toLowerCase().includes("high")) {
                urgency = "high";
            } else if (bestLabel.toLowerCase().includes("low")) {
                urgency = "low";
            } else if (bestLabel.toLowerCase().includes("medium")) {
                urgency = "medium";
            }

            return {
                urgency,
                confidence: bestScore,
                rawResponse: result,
            };
        }

        // Fallback if response format is unexpected
        return {
            urgency: "medium",
            confidence: 0.5,
            rawResponse: result,
        };
    } catch (error) {
        console.error("AI urgency detection failed:", error);

        // Graceful fallback - return medium urgency
        return {
            urgency: "medium",
            confidence: 0.0,
            rawResponse: null,
        };
    }
}

/**
 * Get urgency weight for ranking calculation
 * @param urgency - AI urgency level
 * @returns number - Weight for ranking (1-3)
 */
export function getUrgencyWeight(urgency: AIUrgency): number {
    switch (urgency) {
        case "high":
            return 3;
        case "medium":
            return 2;
        case "low":
            return 1;
        default:
            return 2; // Default to medium
    }
}

/**
 * Get urgency badge color for UI
 * @param urgency - AI urgency level
 * @returns string - CSS color class
 */
export function getUrgencyBadgeColor(urgency: AIUrgency): string {
    switch (urgency) {
        case "high":
            return "bg-red-100 text-red-800 border-red-200";
        case "medium":
            return "bg-yellow-100 text-yellow-800 border-yellow-200";
        case "low":
            return "bg-green-100 text-green-800 border-green-200";
        default:
            return "bg-gray-100 text-gray-800 border-gray-200";
    }
}

/**
 * Get urgency emoji for UI
 * @param urgency - AI urgency level
 * @returns string - Emoji representation
 */
export function getUrgencyEmoji(urgency: AIUrgency): string {
    switch (urgency) {
        case "high":
            return "🔴";
        case "medium":
            return "🟡";
        case "low":
            return "🟢";
        default:
            return "⚪";
    }
}

/**
 * Calculate combined ranking score
 * @param upvotes - Number of upvotes
 * @param urgency - AI urgency level
 * @returns number - Combined score for ranking
 */
export function calculateCombinedScore(
    upvotes: number,
    urgency: AIUrgency
): number {
    const urgencyWeight = getUrgencyWeight(urgency);
    const upvoteScore = Math.log(1 + upvotes);

    // Combined score: 0.7 * AI urgency + 0.3 * log(1 + upvotes)
    return 0.7 * urgencyWeight + 0.3 * upvoteScore;
}
