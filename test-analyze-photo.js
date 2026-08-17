// Test the analyze-photo endpoint
const fs = require("fs");
const path = require("path");

async function testAnalyzePhoto() {
    console.log("Testing /api/analyze-photo endpoint...\n");

    // Create a simple test with base64 (you can replace with actual image)
    const testImage =
        "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA//2Q==";

    try {
        const response = await fetch(
            "http://localhost:3000/api/analyze-photo",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    imageBase64: testImage,
                }),
            }
        );

        const result = await response.json();

        console.log("Status:", response.status);
        console.log("\nResponse:");
        console.log(JSON.stringify(result, null, 2));

        if (result.title && result.description) {
            console.log("\n✅ SUCCESS!");
            console.log("\nExtracted Details:");
            console.log("  Title:", result.title);
            console.log("  Description:", result.description);
            console.log("  Category:", result.category);
            console.log("  Urgency:", result.urgency);
            console.log("  Department:", result.department);
            console.log("  Confidence:", result.confidence);
        } else {
            console.log("\n⚠️ Unexpected response format");
        }
    } catch (error) {
        console.error("❌ Error:", error.message);
    }
}

testAnalyzePhoto();
