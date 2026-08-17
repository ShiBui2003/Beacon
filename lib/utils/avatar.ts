import { User } from "@supabase/supabase-js";

/**
 * Get user avatar URL from various sources
 * Priority: profile.avatar_url > user_metadata.avatar_url > user_metadata.picture > identities
 */
export function getUserAvatarUrl(
    user: User | null,
    profile?: { avatar_url?: string | null }
): string | null {
    if (!user) return null;

    // 1. Check profile table avatar_url (highest priority)
    if (profile?.avatar_url) {
        return profile.avatar_url;
    }

    // 2. Check user metadata for avatar_url (Google OAuth)
    if (user.user_metadata?.avatar_url) {
        return user.user_metadata.avatar_url;
    }

    // 3. Check user metadata for picture (alternative Google field)
    if (user.user_metadata?.picture) {
        return user.user_metadata.picture;
    }

    // 4. Check identities for avatar_url (OAuth provider data)
    if (user.identities && user.identities.length > 0) {
        for (const identity of user.identities) {
            if (identity.identity_data?.avatar_url) {
                return identity.identity_data.avatar_url;
            }
            if (identity.identity_data?.picture) {
                return identity.identity_data.picture;
            }
        }
    }

    return null;
}

/**
 * Get user initials for avatar fallback
 */
export function getUserInitials(
    user: User | null,
    profile?: { full_name?: string | null }
): string {
    if (!user) return "U";

    // Try profile full_name first
    if (profile?.full_name) {
        return profile.full_name
            .split(" ")
            .map((name) => name[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    }

    // Try user metadata full_name
    if (user.user_metadata?.full_name) {
        return user.user_metadata.full_name
            .split(" ")
            .map((name: string) => name[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    }

    // Try user metadata name
    if (user.user_metadata?.name) {
        return user.user_metadata.name
            .split(" ")
            .map((name: string) => name[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    }

    // Try email
    if (user.email) {
        return user.email[0].toUpperCase();
    }

    return "U";
}

/**
 * Get user display name
 */
export function getUserDisplayName(
    user: User | null,
    profile?: { full_name?: string | null }
): string {
    if (!user) return "User";

    // Try profile full_name first
    if (profile?.full_name) {
        return profile.full_name;
    }

    // Try user metadata full_name
    if (user.user_metadata?.full_name) {
        return user.user_metadata.full_name;
    }

    // Try user metadata name
    if (user.user_metadata?.name) {
        return user.user_metadata.name;
    }

    // Try email
    if (user.email) {
        return user.email.split("@")[0];
    }

    return "User";
}
