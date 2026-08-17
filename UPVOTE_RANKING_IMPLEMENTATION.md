# Upvote-Based Ranking Implementation

## 🎯 **Feature Overview**

This implementation adds upvote-based ranking to all issue lists across the application. Issues with the highest number of upvotes now appear at the top of all lists, with stable sorting to maintain consistent ordering for issues with the same upvote count.

## 🔧 **Changes Made**

### **1. Database Level (API)**
- **File**: `app/api/issues/route.ts`
- **Change**: Updated the main issues API query to sort by upvotes first, then by creation date
- **Code**:
  ```typescript
  .order('upvotes', { ascending: false })
  .order('created_at', { ascending: false })
  ```

### **2. Client-Side Sorting**

#### **Citizen Dashboard**
- **File**: `app/citizen/dashboard/page.tsx`
- **Change**: Added upvote-based sorting to `filteredIssues` useMemo
- **Sorting Logic**:
  ```typescript
  .sort((a, b) => {
    // Primary sort: by upvotes (descending)
    const upvoteDiff = (b.upvotes || 0) - (a.upvotes || 0);
    if (upvoteDiff !== 0) return upvoteDiff;
    
    // Secondary sort: by creation date (descending) for stable sorting
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  })
  ```

#### **Admin Issues Page**
- **File**: `app/admin/issues/page.tsx`
- **Change**: Added upvote-based sorting to `filteredIssues` array
- **Same sorting logic as above**

#### **Citizen My Issues Page**
- **File**: `app/citizen/issues/page.tsx`
- **Change**: Added upvote-based sorting to both `activeIssues` and `resolvedIssues` useMemo hooks
- **Same sorting logic as above**

#### **Map Views (Citizen & Admin)**
- **Files**: 
  - `app/citizen/issues/map/page.tsx`
  - `app/admin/issues/map/page.tsx`
- **Change**: Added upvote-based sorting to `filteredIssues` arrays
- **Same sorting logic as above**

#### **Resolved Issues Section**
- **File**: `components/resolved-issues-section.tsx`
- **Change**: Added upvote-based sorting to the issues display
- **Same sorting logic as above**

### **3. Type Safety Updates**

Updated all Issue interfaces to include the `upvotes` field:

- `app/citizen/dashboard/page.tsx` - Already had `upvotes?: number | null`
- `app/admin/issues/page.tsx` - Added `upvotes: number`
- `app/citizen/issues/page.tsx` - Added `upvotes: number`
- `app/citizen/issues/map/page.tsx` - Added `upvotes: number`
- `app/admin/issues/map/page.tsx` - Added `upvotes: number`
- `components/resolved-issues-section.tsx` - Added `upvotes: number`

## 🎯 **How It Works**

### **Stable Sorting**
The implementation uses a two-level sorting approach:
1. **Primary**: Sort by upvotes (descending) - issues with more upvotes appear first
2. **Secondary**: Sort by creation date (descending) - for issues with the same upvote count, newer issues appear first

This ensures:
- Issues with higher upvotes always appear at the top
- Issues with the same upvote count maintain a consistent order
- The sorting is stable and predictable

### **Database Integration**
The `upvotes` field is already available in the database schema (from the initial migration) and is automatically maintained by database triggers when users vote on issues.

### **Performance**
- Sorting is done at the database level for the main API
- Client-side sorting is applied after filtering to maintain upvote-based order
- Uses efficient JavaScript sorting with early return for different upvote counts

## 🚀 **Benefits**

1. **Community-Driven Prioritization**: Issues that matter most to the community rise to the top
2. **Consistent Experience**: Same ranking logic across all views (dashboard, admin, maps, etc.)
3. **Stable Sorting**: Predictable ordering that doesn't change between page loads
4. **Type Safety**: All interfaces properly typed with upvote counts
5. **Minimal Changes**: Clean, incremental implementation that doesn't break existing functionality

## 📊 **Affected Views**

- ✅ Citizen Dashboard (list and map views)
- ✅ Admin Issues Management
- ✅ Citizen My Issues page
- ✅ Citizen Issues Map
- ✅ Admin Issues Map
- ✅ Resolved Issues Section
- ✅ All filtered and search results

## 🔍 **Testing**

To test the implementation:

1. **Create test issues** with different upvote counts
2. **Vote on issues** to create different upvote scenarios
3. **Check all views** to ensure issues are sorted by upvotes
4. **Verify stable sorting** by refreshing pages and checking order consistency
5. **Test filtering** to ensure upvote-based sorting is maintained after filtering

## 📝 **Notes**

- The implementation maintains backward compatibility
- All existing functionality continues to work as before
- The upvote field is already populated in the database
- No database migrations are required
- The feature works immediately after deployment
