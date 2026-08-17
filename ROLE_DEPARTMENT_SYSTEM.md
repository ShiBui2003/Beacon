# Role and Department System Implementation

## Overview

The civic issue reporting system has been updated to support a hierarchical role system with department assignments, replacing the simple "admin/citizen" structure with a comprehensive organizational hierarchy.

## 🏢 New Role Structure

### Available Roles (in hierarchy order):

1. **Department Head** (Level 1)
   - Full administrative access
   - Manage users, issues, analytics, departments
   - Highest authority level

2. **Supervisor** (Level 2)
   - Team management and issue oversight
   - Manage issues, view analytics, assign tasks, manage team

3. **Field Worker** (Level 3)
   - On-ground issue resolution
   - Manage issues, update status, view assigned tasks

4. **Clerk/Operator** (Level 4)
   - Administrative tasks
   - View issues, update basic info, manage documents

5. **Technician** (Level 5)
   - Technical specialist
   - Manage issues, technical analysis, update status

6. **Citizen** (Level 0)
   - Report and track civic issues
   - Basic user functionality

## 🏛️ Department Structure

### Available Departments:
- **Public Works** - Roads, infrastructure, and general maintenance
- **Utilities** - Water, electricity, and utility services
- **Sanitation** - Waste management and cleaning services
- **Transportation** - Traffic management and public transport
- **Public Safety** - Safety and emergency services
- **Environmental Services** - Environmental and health services
- **General Services** - General municipal services

## 📁 Implementation Details

### Database Changes

#### New Tables:
- `roles` - Defines user roles with hierarchical levels and permissions
- `user_roles` - Tracks user role assignments and history (audit trail)

#### Updated Tables:
- `profiles` - Added `role_id` and `department_id` columns
- `departments` - Added `required_role_id` for department head requirements

#### Key Functions:
- `get_user_permissions(user_uuid)` - Returns user permissions based on role
- `has_permission(user_uuid, permission_name)` - Checks specific permissions
- `get_user_role_info(user_uuid)` - Returns comprehensive role information

### Authentication Flow

#### Signup Process:
1. User selects role from dropdown (Citizen, Department Head, Supervisor, etc.)
2. If non-citizen role selected, user must choose department
3. System validates role-department combination
4. User profile created with role and department assignments

#### Signin Process:
- Existing users sign in normally
- System redirects based on role (staff → admin dashboard, citizen → citizen dashboard)

### API Endpoints

#### New Endpoints:
- `GET /api/roles` - Fetch available roles
- `GET /api/departments` - Fetch available departments (existing, updated)

#### Updated Endpoints:
- Auth callback now handles role and department assignment
- Middleware updated for new role-based access control

## 🎨 User Interface Changes

### Auth Page Updates:
- **Role Selection**: Dropdown with all available roles and descriptions
- **Department Selection**: Conditional dropdown (only for non-citizen roles)
- **Visual Indicators**: Icons and colors for different role types
- **Validation**: Ensures department selection for staff roles

### Role-Based Access:
- **Citizens**: Access citizen dashboard and features
- **Staff Roles**: Access admin dashboard with role-appropriate features
- **Automatic Redirects**: Based on user role after authentication

## 🔒 Security & Permissions

### Row Level Security (RLS):
- Role-based policies for data access
- Department-based data isolation
- Permission-based function access

### Permission System:
```json
{
  "admin": true,           // Full administrative access
  "manage_users": true,    // User management
  "manage_issues": true,   // Issue management
  "view_analytics": true,  // Analytics access
  "manage_departments": true, // Department management
  "assign_tasks": true,    // Task assignment
  "manage_team": true,     // Team management
  "update_status": true,   // Status updates
  "view_assigned": true,   // View assigned tasks
  "technical_analysis": true, // Technical analysis
  "manage_documents": true // Document management
}
```

## 🚀 Migration Process

### Database Migration:
```sql
-- Run the migration
supabase db push
```

### Key Migration Features:
- Creates roles table with predefined roles
- Updates profiles table with role and department columns
- Creates user_roles table for audit trail
- Sets up RLS policies for new structure
- Provides helper functions for permission checking

## 📊 Usage Examples

### Creating a New User:
```typescript
// Signup with role and department
await signUp(
  email, 
  password, 
  fullName, 
  'supervisor', 
  'department-uuid'
);
```

### Checking Permissions:
```sql
-- Check if user has admin permissions
SELECT has_permission('user-uuid', 'admin');

-- Get user role information
SELECT * FROM get_user_role_info('user-uuid');
```

### Role-Based Queries:
```sql
-- Get all users in a department
SELECT * FROM user_role_view 
WHERE department_name = 'Public Works';

-- Get users by role level
SELECT * FROM user_role_view 
WHERE role_level <= 2; -- Department Head and Supervisor
```

## 🔄 Backward Compatibility

### Existing Users:
- Existing users default to "Citizen" role
- No disruption to current functionality
- Gradual migration to new role system

### API Compatibility:
- Existing API endpoints continue to work
- New endpoints added for role management
- Middleware handles both old and new role structures

## 🎯 Benefits

1. **Hierarchical Structure**: Clear organizational hierarchy
2. **Department Assignment**: Users belong to specific departments
3. **Granular Permissions**: Fine-grained access control
4. **Audit Trail**: Track role changes and assignments
5. **Scalability**: Easy to add new roles and departments
6. **Security**: Role-based data access and permissions

## 🔮 Future Enhancements

- **Role Inheritance**: Sub-roles within departments
- **Temporary Assignments**: Time-limited role assignments
- **Department Hierarchies**: Sub-departments and reporting structures
- **Advanced Permissions**: Resource-specific permissions
- **Role Templates**: Predefined role configurations

## 📞 Support

For technical support or questions about the role system, refer to the main project documentation or contact the development team.

---

**Note**: This system maintains full backward compatibility while providing a robust foundation for organizational management and access control.
