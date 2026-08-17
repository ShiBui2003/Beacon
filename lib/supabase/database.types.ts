export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[];

type IssueStatus =
    | "submitted"
    | "assigned"
    | "in_progress"
    | "resolved"
    | "closed"
    | "rejected";
type Priority = "low" | "medium" | "high";
type UserRole =
    | "citizen"
    | "department_head"
    | "supervisor"
    | "field_worker"
    | "clerk_operator"
    | "technician";

export interface Database {
    public: {
        Tables: {
            issues: {
                Row: {
                    id: string;
                    created_at: string;
                    updated_at: string | null;
                    title: string;
                    description: string;
                    status: IssueStatus;
                    priority: Priority;
                    category: string;
                    user_id: string;
                    department_id: string | null;
                    image_url: string | null;
                    audio_url: string | null;
                    location_address: string | null;
                    location_lat: number | null;
                    location_lng: number | null;
                    landmark: string | null;
                    ai_urgency: "low" | "medium" | "high" | null;
                    estimated_completion: string | null;
                    completed_at: string | null;
                    last_status_update?: string | null;
                    last_updated_by?: string | null;
                    upvotes?: number | null;
                    profiles?: {
                        id: string;
                        full_name: string | null;
                        email: string;
                    };
                    department?: {
                        id: string;
                        name: string;
                    };
                    assigned_profile?: {
                        id: string;
                        full_name: string | null;
                        email: string;
                    };
                };
                Insert: {
                    id?: string;
                    created_at?: string;
                    updated_at?: string | null;
                    title: string;
                    description: string;
                    status?: IssueStatus;
                    priority?: Priority;
                    category: string;
                    user_id: string;
                    department_id?: string | null;
                    image_url?: string | null;
                    audio_url?: string | null;
                    location_address?: string | null;
                    location_lat?: number | null;
                    location_lng?: number | null;
                    landmark?: string | null;
                    ai_urgency?: "low" | "medium" | "high" | null;
                    estimated_completion?: string | null;
                    completed_at?: string | null;
                    last_status_update?: string | null;
                    last_updated_by?: string | null;
                    upvotes?: number | null;
                };
                Update: {
                    id?: string;
                    created_at?: string;
                    updated_at?: string | null;
                    title?: string;
                    description?: string;
                    status?: IssueStatus;
                    priority?: Priority;
                    category?: string;
                    user_id?: string;
                    department_id?: string | null;
                    image_url?: string | null;
                    audio_url?: string | null;
                    location_address?: string | null;
                    location_lat?: number | null;
                    location_lng?: number | null;
                    landmark?: string | null;
                    ai_urgency?: "low" | "medium" | "high" | null;
                    estimated_completion?: string | null;
                    completed_at?: string | null;
                    last_status_update?: string | null;
                    last_updated_by?: string | null;
                    upvotes?: number | null;
                };
            };
            issue_assignments: {
                Row: {
                    id: string;
                    issue_id: string;
                    user_id: string;
                    assigned_by: string | null;
                    assigned_at: string;
                    ended_at: string | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    issue_id: string;
                    user_id: string;
                    assigned_by?: string | null;
                    assigned_at?: string;
                    ended_at?: string | null;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    issue_id?: string;
                    user_id?: string;
                    assigned_by?: string | null;
                    assigned_at?: string;
                    ended_at?: string | null;
                    created_at?: string;
                };
            };
            departments: {
                Row: {
                    id: string;
                    name: string;
                    description: string | null;
                    email: string | null;
                    phone: string | null;
                    head_id: string | null;
                    created_at: string;
                    updated_at: string | null;
                };
                Insert: {
                    id?: string;
                    name: string;
                    description?: string | null;
                    email?: string | null;
                    phone?: string | null;
                    head_id?: string | null;
                    created_at?: string;
                    updated_at?: string | null;
                };
                Update: {
                    id?: string;
                    name?: string;
                    description?: string | null;
                    email?: string | null;
                    phone?: string | null;
                    head_id?: string | null;
                    created_at?: string;
                    updated_at?: string | null;
                };
            };
            categories: {
                Row: {
                    name: string;
                    description: string | null;
                    icon: string | null;
                    created_at: string;
                };
                Insert: {
                    name: string;
                    description?: string | null;
                    icon?: string | null;
                    created_at?: string;
                };
                Update: {
                    name?: string;
                    description?: string | null;
                    icon?: string | null;
                    created_at?: string;
                };
            };
            category_department_mapping: {
                Row: {
                    id: string;
                    category_name: string;
                    department_id: string;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    category_name: string;
                    department_id: string;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    category_name?: string;
                    department_id?: string;
                    created_at?: string;
                };
            };
            roles: {
                Row: {
                    id: string;
                    name: string;
                    description: string | null;
                    level: number;
                    permissions: Json;
                    is_active: boolean;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    name: string;
                    description?: string | null;
                    level: number;
                    permissions?: Json;
                    is_active?: boolean;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    name?: string;
                    description?: string | null;
                    level?: number;
                    permissions?: Json;
                    is_active?: boolean;
                    created_at?: string;
                    updated_at?: string;
                };
            };
            profiles: {
                Row: {
                    id: string;
                    email: string;
                    full_name: string | null;
                    phone: string | null;
                    bio: string | null;
                    location: string | null;
                    location_coordinates: string | null;
                    avatar_url: string | null;
                    role: UserRole;
                    role_id: string | null;
                    department_id: string | null;
                    email_notifications: boolean;
                    push_notifications: boolean;
                    privacy_public_profile: boolean;
                    created_at: string;
                    updated_at: string | null;
                };
                Insert: {
                    id: string;
                    email: string;
                    full_name?: string | null;
                    phone?: string | null;
                    bio?: string | null;
                    location?: string | null;
                    location_coordinates?: string | null;
                    avatar_url?: string | null;
                    role?: UserRole;
                    role_id?: string | null;
                    department_id?: string | null;
                    email_notifications?: boolean;
                    push_notifications?: boolean;
                    privacy_public_profile?: boolean;
                    created_at?: string;
                    updated_at?: string | null;
                };
                Update: {
                    id?: string;
                    email?: string;
                    full_name?: string | null;
                    phone?: string | null;
                    bio?: string | null;
                    location?: string | null;
                    location_coordinates?: string | null;
                    avatar_url?: string | null;
                    role?: UserRole;
                    role_id?: string | null;
                    department_id?: string | null;
                    email_notifications?: boolean;
                    push_notifications?: boolean;
                    privacy_public_profile?: boolean;
                    created_at?: string;
                    updated_at?: string | null;
                };
            };
            comments: {
                Row: {
                    id: string;
                    issue_id: string;
                    user_id: string;
                    content: string;
                    is_admin: boolean;
                    created_at: string;
                    updated_at: string | null;
                    profiles?: {
                        id: string;
                        full_name: string | null;
                        email: string;
                    };
                };
                Insert: {
                    id?: string;
                    issue_id: string;
                    user_id: string;
                    content: string;
                    is_admin?: boolean;
                    created_at?: string;
                    updated_at?: string | null;
                };
                Update: {
                    id?: string;
                    issue_id?: string;
                    user_id?: string;
                    content?: string;
                    is_admin?: boolean;
                    created_at?: string;
                    updated_at?: string | null;
                };
            };
            notifications: {
                Row: {
                    id: string;
                    user_id: string;
                    title: string;
                    message: string;
                    type: string | null;
                    read: boolean;
                    link: string | null;
                    issue_id: string | null;
                    related_issue_id: string | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    title: string;
                    message: string;
                    type?: string | null;
                    read?: boolean;
                    link?: string | null;
                    issue_id?: string | null;
                    related_issue_id?: string | null;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    title?: string;
                    message?: string;
                    type?: string | null;
                    read?: boolean;
                    link?: string | null;
                    issue_id?: string | null;
                    related_issue_id?: string | null;
                    created_at?: string;
                };
            };
            admin_notifications: {
                Row: {
                    id: string;
                    admin_id: string | null;
                    issue_id: string;
                    action: string;
                    details: Json | null;
                    created_at: string;
                    profiles?: {
                        id: string;
                        full_name: string | null;
                        email: string;
                    };
                };
                Insert: {
                    id?: string;
                    admin_id?: string | null;
                    issue_id: string;
                    action: string;
                    details?: Json | null;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    admin_id?: string | null;
                    issue_id?: string;
                    action?: string;
                    details?: Json | null;
                    created_at?: string;
                };
            };
            issue_votes: {
                Row: {
                    id: string;
                    issue_id: string;
                    user_id: string;
                    vote_type: "up" | "down" | "disputed";
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    issue_id: string;
                    user_id: string;
                    vote_type: "up" | "down" | "disputed";
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    issue_id?: string;
                    user_id?: string;
                    vote_type?: "up" | "down" | "disputed";
                    created_at?: string;
                };
            };
            issue_updates: {
                Row: {
                    id: string;
                    issue_id: string;
                    user_id: string;
                    status: string | null;
                    comment: string | null;
                    created_at: string;
                    profiles?: {
                        id: string;
                        full_name: string | null;
                        email: string;
                    };
                };
                Insert: {
                    id?: string;
                    issue_id: string;
                    user_id: string;
                    status?: string | null;
                    comment?: string | null;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    issue_id?: string;
                    user_id?: string;
                    status?: string | null;
                    comment?: string | null;
                    created_at?: string;
                };
            };
            issue_workflow_states: {
                Row: {
                    id: string;
                    issue_id: string;
                    status: string;
                    department_id: string | null;
                    assigned_to: string | null;
                    notes: string | null;
                    estimated_completion: string | null;
                    created_by: string;
                    created_at: string;
                    department?: {
                        id: string;
                        name: string;
                    };
                    assigned_to_profile?: {
                        id: string;
                        full_name: string | null;
                        email: string;
                    };
                    profiles?: {
                        id: string;
                        full_name: string | null;
                        email: string;
                    };
                };
                Insert: {
                    id?: string;
                    issue_id: string;
                    status: string;
                    department_id?: string | null;
                    assigned_to?: string | null;
                    notes?: string | null;
                    estimated_completion?: string | null;
                    created_by: string;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    issue_id?: string;
                    status?: string;
                    department_id?: string | null;
                    assigned_to?: string | null;
                    notes?: string | null;
                    estimated_completion?: string | null;
                    created_by?: string;
                    created_at?: string;
                };
            };
            abhiyaans: {
                Row: {
                    id: string;
                    name: string;
                    description: string;
                    creator_name: string;
                    location: string;
                    time: string;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    name: string;
                    description: string;
                    creator_name: string;
                    location: string;
                    time: string;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    name?: string;
                    description?: string;
                    creator_name?: string;
                    location?: string;
                    time?: string;
                    created_at?: string;
                };
            };
        };
        Views: {
            [_ in never]: never;
        };
        Functions: {
            [_ in never]: never;
        };
        Enums: {
            [_ in never]: never;
        };
    };
}
