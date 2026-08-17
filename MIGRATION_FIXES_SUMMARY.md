# Database Migration Fixes Summary

## 🚨 **Current Issues:**

1. **Missing `vote_type` column in `issue_votes` table**

    - Error: `column issue_votes.vote_type does not exist`
    - Cause: Migration 0005 not applied or failed

2. **Timeline API returning 404**

    - Error: `GET /api/issues/[id]/timeline 404`
    - Cause: Wrong table name in API (`issue_workflow_states` vs `workflow_states`)

3. **Vote API JSON parsing error**

    - Error: `SyntaxError: Unexpected end of JSON input`
    - Cause: Frontend sending empty POST requests

4. **Missing function error**
    - Error: `function public.update_updated_at_column() does not exist`
    - Cause: Function not defined in migrations

## ✅ **Fixes Applied:**

### **1. Fixed Vote API (✅ Complete)**

-   **Frontend Fix**: Updated `handleUpvote` to send proper JSON body with `vote_type: 'up'`
-   **Backend Fix**: Added better JSON parsing error handling
-   **Backend Fix**: Added DELETE endpoint for removing votes
-   **Backend Fix**: Enhanced GET endpoint to return user's vote status

### **2. Fixed Timeline API (✅ Complete)**

-   **API Fix**: Changed `issue_workflow_states` to `workflow_states` in timeline route

### **3. Created Comprehensive Migrations:**

#### **Migration 0008: `0008_add_missing_columns.sql` (✅ Ready)**

-   Creates `departments` table with default departments
-   Adds missing columns to `issues` table:
    -   `completed_at` - Auto-set when status becomes "resolved"
    -   `department_id` - Links to departments table
    -   `estimated_completion` - For tracking estimated completion dates
-   Creates `workflow_states` table for issue workflow history
-   Creates `update_updated_at_column()` function
-   Adds all necessary indexes and RLS policies
-   Creates automatic triggers for `completed_at` and `updated_at`

#### **Migration 0009: `0009_fix_schema_issues.sql` (✅ Ready)**

-   Ensures `issue_votes.vote_type` column exists
-   Creates `admin_notifications` table if missing
-   Adds dispute-related columns to `comments` table
-   Creates dispute notification triggers
-   Adds all necessary RLS policies and indexes

## 🚀 **To Apply the Fixes:**

### **Step 1: Apply Migrations**

```bash
# Apply the missing columns and tables
supabase db push

# Or apply individually:
# Migration 0008: Adds departments, workflow_states, and missing columns
# Migration 0009: Fixes vote_type column and admin_notifications
```

### **Step 2: Verify the Fix**

1. **Test Vote Functionality:**

    - Click upvote button on an issue
    - Should work without JSON parsing errors
    - Vote count should update correctly

2. **Test Timeline:**

    - View issue detail page
    - Timeline should load without 404 errors
    - Should show issue progress and updates

3. **Test Status Updates:**
    - Update issue status to "resolved"
    - Should automatically set `completed_at` timestamp
    - No more "completed_at column not found" errors

## 📊 **Database Schema After Fixes:**

### **Enhanced `issues` Table:**

```sql
-- New columns added:
completed_at TIMESTAMPTZ,           -- Auto-set when resolved
department_id UUID REFERENCES departments(id),  -- Assigned department
estimated_completion TIMESTAMPTZ   -- Estimated completion date
```

### **New `departments` Table:**

```sql
CREATE TABLE departments (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **New `workflow_states` Table:**

```sql
CREATE TABLE workflow_states (
    id UUID PRIMARY KEY,
    issue_id UUID REFERENCES issues(id),
    status TEXT NOT NULL,
    department_id UUID REFERENCES departments(id),
    assigned_to UUID REFERENCES profiles(id),
    notes TEXT,
    estimated_completion TIMESTAMPTZ,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **Enhanced `issue_votes` Table:**

```sql
-- New column added:
vote_type TEXT DEFAULT 'up' CHECK (vote_type IN ('up', 'down', 'dispute'))
```

### **New `admin_notifications` Table:**

```sql
CREATE TABLE admin_notifications (
    id UUID PRIMARY KEY,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    link TEXT,
    issue_id UUID REFERENCES issues(id),
    admin_id UUID REFERENCES profiles(id),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 🎯 **Expected Results After Migration:**

### **✅ Fixed API Endpoints:**

-   `GET /api/issues/[id]/vote` - Returns vote counts and user vote status
-   `POST /api/issues/[id]/vote` - Creates/updates votes with proper JSON handling
-   `DELETE /api/issues/[id]/vote` - Removes user's vote
-   `GET /api/issues/[id]/timeline` - Returns issue timeline without 404
-   `PUT /api/issues/[id]/status` - Updates status and sets completed_at automatically

### **✅ Fixed Frontend Features:**

-   Upvote/downvote buttons work correctly
-   Issue timeline displays properly
-   Status updates work without errors
-   Department assignment functionality enabled
-   Workflow tracking fully functional

### **✅ New Functionality Enabled:**

-   **Department Management**: Issues can be assigned to specific departments
-   **Workflow Tracking**: Complete audit trail of issue status changes
-   **Completion Tracking**: Automatic timestamps when issues are resolved
-   **Dispute System**: Citizens can dispute status updates
-   **Admin Notifications**: Automatic notifications for disputed issues

## 🔧 **Migration Files to Apply:**

1. `supabase/migrations/0008_add_missing_columns.sql`
2. `supabase/migrations/0009_fix_schema_issues.sql`

Both migrations are designed to be safe and use `IF NOT EXISTS` clauses to prevent conflicts with existing data.
