# Voting System & Timeline API Fix

## 🚨 **Issues Identified:**

1. **Missing `vote_type` column error:**
   ```
   "column issue_votes.vote_type does not exist"
   ```

2. **Timeline API returning 404:**
   ```
   GET /api/issues/[id]/timeline 404
   ```

3. **Vote API JSON parsing error:**
   ```
   SyntaxError: Unexpected end of JSON input
   ```

## 🔧 **Root Cause Analysis:**

### **1. Vote Type Column Missing**
- The `issue_votes` table was missing the `vote_type` column
- Migration 0005 might not have been applied properly
- Schema cache wasn't refreshed

### **2. Timeline API Table Reference Error**
- Timeline API was referencing `issue_workflow_states` table
- But we created `workflow_states` table in migration 0008
- Table name mismatch causing 404 errors

### **3. Frontend Vote Request Issues**
- Frontend was sending POST requests without JSON body
- Vote API expected JSON with `vote_type` field
- No DELETE handler for removing votes

## ✅ **Solutions Implemented:**

### **1. Fixed Timeline API Table Reference**
```typescript
// BEFORE (incorrect):
.from('issue_workflow_states')

// AFTER (correct):
.from('workflow_states')
```

### **2. Enhanced Vote API Error Handling**
```typescript
/