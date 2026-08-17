# Citizen Map View Implementation

## ✅ **Complete Citizen Map View - Just Like Admin!**

I've created a comprehensive map view for citizens that mirrors the admin functionality but focuses on citizen needs and community engagement.

### 🗺️ **New Citizen Issues Map Page** (`/citizen/issues/map`)

#### **Key Features:**

1. **Google Maps Integration**

    - Real Google Maps with satellite/street view
    - Fallback map for development without API key
    - Interactive markers for all issues

2. **Location-Based Features**

    - **Auto-location detection** - finds user's current location
    - **Nearby issues priority** - shows issues within 5km radius first
    - **Smart map centering** - centers on user location or nearby issues
    - **Dynamic zoom levels** - street level (15) for user location, neighborhood (13) for nearby

3. **Advanced Filtering**

    - Filter by status (submitted, in-review, in-progress, resolved)
    - Filter by priority (high, medium, low)
    - Filter by category (pothole, streetlight, garbage, water-leakage)
    - Real-time filter updates

4. **Interactive Issue Details**

    - Click markers to view issue information
    - Detailed sidebar with issue description
    - Vote counts and comment counts
    - Direct links to full issue details

5. **Community Focus**
    - Shows reporter names (community engagement)
    - Vote and comment counts for each issue
    - Encourages citizen participation
    - "Report Issue" button prominently displayed

### 🎯 **Citizen-Specific Enhancements:**

#### **Smaller Radius (5km vs 10km)**

-   More focused on immediate neighborhood
-   Better for walking/cycling citizens
-   Reduces information overload

#### **Community Engagement Elements**

-   Vote counts visible on all issues
-   Comment counts to encourage discussion
-   Reporter names to build community trust
-   Easy access to report new issues

#### **User-Friendly Interface**

-   Clear "Find My Location" button
-   Helpful empty states with call-to-action
-   Encouraging messages for first-time users
-   Direct links to report issues

### 🔄 **Updated Citizen Dashboard**

#### **Enhanced Map Toggle**

-   Map view now links to full map page
-   Clear call-to-action card when map view selected
-   Added "Map View" button in header
-   Maintains existing list view functionality

#### **Better Navigation**

-   Direct access to full map from dashboard
-   Breadcrumb navigation back to dashboard
-   Consistent UI with admin interface

### 📊 **Technical Implementation:**

#### **Real-Time Data**

```javascript
// Fetches issues with vote/comment counts
const issuesWithCounts = await Promise.all(
    (data || []).map(async (issue) => {
        const [{ count: votesCount }, { count: commentsCount }] =
            await Promise.all([
                supabase
                    .from("issue_votes")
                    .select("*", { count: "exact", head: true })
                    .eq("issue_id", issue.id),
                supabase
                    .from("comments")
                    .select("*", { count: "exact", head: true })
                    .eq("issue_id", issue.id),
            ]);

        return {
            ...issue,
            votes_count: votesCount || 0,
            comments_count: commentsCount || 0,
        };
    })
);
```

#### **Smart Location Logic**

```javascript
// Prioritizes nearby issues for citizens
const nearbyIssues = userLocation
    ? filteredIssues.filter((issue) => {
          const distance = calculateDistance(
              userLocation.lat,
              userLocation.lng,
              issue.location_lat,
              issue.location_lng
          );
          return distance <= 5; // 5km radius for citizens
      })
    : filteredIssues;
```

#### **Dynamic Map Centering**

```javascript
const mapCenter = (() => {
    if (userLocation) return userLocation; // Priority 1: User location
    if (nearbyIssues.length > 0) return nearbyCenter; // Priority 2: Nearby issues
    if (filteredIssues.length > 0) return allCenter; // Priority 3: All issues
    return defaultCenter; // Fallback: Default
})();
```

### 🎨 **UI/UX Improvements:**

#### **Citizen-Focused Design**

-   Warmer, more community-oriented language
-   Emphasis on "community issues" vs "municipal management"
-   Encouraging tone for civic participation
-   Clear calls-to-action for reporting

#### **Mobile-First Approach**

-   Touch-friendly markers and controls
-   Responsive sidebar that works on phones
-   Optimized for citizen mobile usage
-   Fast loading with efficient queries

#### **Visual Enhancements**

-   Beautiful gradient fallbacks for avatars
-   Consistent color scheme with admin
-   Clear status indicators and legends
-   Professional but approachable design

### 🚀 **Benefits for Citizens:**

1. **Better Community Awareness**

    - See what issues neighbors are reporting
    - Understand local problem patterns
    - Track resolution progress visually

2. **Improved Engagement**

    - Easy to find and support existing issues
    - Reduces duplicate reporting
    - Encourages community participation

3. **Location-Based Relevance**

    - Focus on nearby issues that affect them
    - Understand neighborhood-specific problems
    - Better context for local civic engagement

4. **Seamless Experience**
    - Consistent with admin interface
    - Familiar Google Maps interaction
    - Fast, responsive performance

### 🔧 **Setup Requirements:**

1. **Google Maps API Key** (optional)

    - Add `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` to environment
    - Fallback map works without API key

2. **Database Migration**

    - Ensure avatar_url migration is applied
    - Vote and comment tables should exist

3. **Permissions**
    - Location permission for best experience
    - Works without location permission

The citizen map view now provides a comprehensive, engaging way for community members to explore, understand, and participate in local civic issues - just like the admin version but tailored for citizen needs!
