export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
    try {
        const supabase = createServerClient();
        const {
            data: { user },
            error: authError,
        } = await (supabase as any).auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const formData = await request.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json(
                { error: "No file provided" },
                { status: 400 }
            );
        }

        // Validate file type
        if (!file.type.startsWith("image/")) {
            return NextResponse.json(
                { error: "File must be an image" },
                { status: 400 }
            );
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json(
                { error: "File size must be less than 5MB" },
                { status: 400 }
            );
        }

        // Generate unique filename
        const fileExt = file.name.split(".").pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await (
            supabase as any
        ).storage
            .from("avatars")
            .upload(fileName, file, {
                cacheControl: "3600",
                upsert: false,
            });

        if (uploadError) {
            console.error("Error uploading avatar:", uploadError);
            return NextResponse.json(
                { error: "Failed to upload avatar" },
                { status: 500 }
            );
        }

        // Get public URL
        const {
            data: { publicUrl },
        } = supabase.storage.from("avatars").getPublicUrl(fileName);

        // Update user profile with new avatar URL
        const { error: updateError } = await (supabase as any)
            .from("profiles")
            .upsert({
                id: user.id,
                avatar_url: publicUrl,
                updated_at: new Date().toISOString(),
            });

        if (updateError) {
            console.error("Error updating profile with avatar:", updateError);
            // Don't fail the request, avatar was uploaded successfully
        }

        return NextResponse.json({
            url: publicUrl,
            message: "Avatar uploaded successfully",
        });
    } catch (error) {
        console.error("Error in POST /api/upload/avatar:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
