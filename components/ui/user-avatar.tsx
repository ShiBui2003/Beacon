"use client";

import { User } from "@supabase/supabase-js";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getUserAvatarUrl, getUserInitials } from "@/lib/utils/avatar";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
    user: User | null;
    profile?: {
        full_name?: string | null;
        avatar_url?: string | null;
    };
    className?: string;
    size?: "sm" | "md" | "lg" | "xl";
}

const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
    xl: "w-20 h-20",
};

export function UserAvatar({
    user,
    profile,
    className,
    size = "md",
}: UserAvatarProps) {
    const avatarUrl = getUserAvatarUrl(user, profile);
    const initials = getUserInitials(user, profile);

    return (
        <Avatar className={cn(sizeClasses[size], className)}>
            {avatarUrl && (
                <AvatarImage
                    src={avatarUrl}
                    alt={profile?.full_name || user?.email || "User"}
                />
            )}
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                {initials}
            </AvatarFallback>
        </Avatar>
    );
}
