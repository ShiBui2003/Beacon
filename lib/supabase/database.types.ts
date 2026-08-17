export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      admin_notifications: {
        Row: {
          admin_id: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          issue_id: string | null
          link: string | null
          message: string
          read: boolean | null
          title: string
          type: string | null
          updated_at: string | null
        }
        Insert: {
          admin_id?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          issue_id?: string | null
          link?: string | null
          message: string
          read?: boolean | null
          title: string
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          admin_id?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          issue_id?: string | null
          link?: string | null
          message?: string
          read?: boolean | null
          title?: string
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_notifications_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_notifications_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "user_role_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_notifications_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issue_vote_stats"
            referencedColumns: ["issue_id"]
          },
          {
            foreignKeyName: "admin_notifications_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string
          id: string
          raised_amount: number
          role: string
          target_amount: number
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description: string
          id?: string
          raised_amount?: number
          role: string
          target_amount?: number
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string
          id?: string
          raised_amount?: number
          role?: string
          target_amount?: number
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_role_view"
            referencedColumns: ["id"]
          },
        ]
      }
      category_department_mapping: {
        Row: {
          category: string
          created_at: string | null
          department_id: string
          id: string
          is_primary: boolean | null
        }
        Insert: {
          category: string
          created_at?: string | null
          department_id: string
          id?: string
          is_primary?: boolean | null
        }
        Update: {
          category?: string
          created_at?: string | null
          department_id?: string
          id?: string
          is_primary?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "category_department_mapping_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "department_issue_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "category_department_mapping_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          content: string
          created_at: string | null
          dispute_reason: string | null
          id: string
          is_admin: boolean | null
          is_dispute: boolean | null
          issue_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          dispute_reason?: string | null
          id?: string
          is_admin?: boolean | null
          is_dispute?: boolean | null
          issue_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          dispute_reason?: string | null
          id?: string
          is_admin?: boolean | null
          is_dispute?: boolean | null
          issue_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issue_vote_stats"
            referencedColumns: ["issue_id"]
          },
          {
            foreignKeyName: "comments_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_role_view"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          created_at: string | null
          description: string | null
          email: string | null
          head_id: string | null
          id: string
          is_active: boolean | null
          name: string
          phone: string | null
          required_role_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          email?: string | null
          head_id?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          phone?: string | null
          required_role_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          email?: string | null
          head_id?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          phone?: string | null
          required_role_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "departments_head_id_fkey"
            columns: ["head_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "departments_head_id_fkey"
            columns: ["head_id"]
            isOneToOne: false
            referencedRelation: "user_role_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "departments_required_role_id_fkey"
            columns: ["required_role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      issue_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string
          created_at: string
          ended_at: string | null
          id: string
          issue_id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by: string
          created_at?: string
          ended_at?: string | null
          id?: string
          issue_id: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string
          created_at?: string
          ended_at?: string | null
          id?: string
          issue_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "issue_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issue_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "user_role_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issue_assignments_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issue_vote_stats"
            referencedColumns: ["issue_id"]
          },
          {
            foreignKeyName: "issue_assignments_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issue_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issue_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_role_view"
            referencedColumns: ["id"]
          },
        ]
      }
      issue_updates: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string
          issue_id: string
          status: string | null
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string
          issue_id: string
          status?: string | null
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string
          issue_id?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "issue_updates_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issue_vote_stats"
            referencedColumns: ["issue_id"]
          },
          {
            foreignKeyName: "issue_updates_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issue_updates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issue_updates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_role_view"
            referencedColumns: ["id"]
          },
        ]
      }
      issue_votes: {
        Row: {
          created_at: string | null
          id: string
          issue_id: string
          user_id: string
          vote_type: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          issue_id: string
          user_id: string
          vote_type?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          issue_id?: string
          user_id?: string
          vote_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "issue_votes_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issue_vote_stats"
            referencedColumns: ["issue_id"]
          },
          {
            foreignKeyName: "issue_votes_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issue_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issue_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_role_view"
            referencedColumns: ["id"]
          },
        ]
      }
      issue_workflow_states: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          created_by: string
          department_id: string | null
          estimated_completion: string | null
          id: string
          issue_id: string
          notes: string | null
          status: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          created_by: string
          department_id?: string | null
          estimated_completion?: string | null
          id?: string
          issue_id: string
          notes?: string | null
          status: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          created_by?: string
          department_id?: string | null
          estimated_completion?: string | null
          id?: string
          issue_id?: string
          notes?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "issue_workflow_states_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issue_workflow_states_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "user_role_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issue_workflow_states_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issue_workflow_states_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_role_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issue_workflow_states_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "department_issue_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issue_workflow_states_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issue_workflow_states_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issue_vote_stats"
            referencedColumns: ["issue_id"]
          },
          {
            foreignKeyName: "issue_workflow_states_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
        ]
      }
      issues: {
        Row: {
          ai_confidence: number | null
          ai_urgency: string | null
          assigned_to: string | null
          audio_url: string | null
          category: string
          completed_at: string | null
          created_at: string | null
          department_id: string | null
          description: string
          estimated_completion: string | null
          id: string
          image_url: string | null
          landmark: string | null
          location_address: string | null
          location_lat: number | null
          location_lng: number | null
          priority: string | null
          status: string | null
          title: string
          updated_at: string | null
          upvotes: number | null
          user_id: string
        }
        Insert: {
          ai_confidence?: number | null
          ai_urgency?: string | null
          assigned_to?: string | null
          audio_url?: string | null
          category: string
          completed_at?: string | null
          created_at?: string | null
          department_id?: string | null
          description: string
          estimated_completion?: string | null
          id?: string
          image_url?: string | null
          landmark?: string | null
          location_address?: string | null
          location_lat?: number | null
          location_lng?: number | null
          priority?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          upvotes?: number | null
          user_id: string
        }
        Update: {
          ai_confidence?: number | null
          ai_urgency?: string | null
          assigned_to?: string | null
          audio_url?: string | null
          category?: string
          completed_at?: string | null
          created_at?: string | null
          department_id?: string | null
          description?: string
          estimated_completion?: string | null
          id?: string
          image_url?: string | null
          landmark?: string | null
          location_address?: string | null
          location_lat?: number | null
          location_lng?: number | null
          priority?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          upvotes?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "issues_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issues_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "user_role_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issues_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "department_issue_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issues_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issues_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issues_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_role_view"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          issue_id: string | null
          link: string | null
          message: string
          read: boolean | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          issue_id?: string | null
          link?: string | null
          message: string
          read?: boolean | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          issue_id?: string | null
          link?: string | null
          message?: string
          read?: boolean | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issue_vote_stats"
            referencedColumns: ["issue_id"]
          },
          {
            foreignKeyName: "notifications_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_role_view"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          department_id: string | null
          email: string
          email_notifications: boolean | null
          full_name: string | null
          id: string
          location: string | null
          location_coordinates: string | null
          phone: string | null
          privacy_public_profile: boolean | null
          push_notifications: boolean | null
          role_id: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          department_id?: string | null
          email: string
          email_notifications?: boolean | null
          full_name?: string | null
          id: string
          location?: string | null
          location_coordinates?: string | null
          phone?: string | null
          privacy_public_profile?: boolean | null
          push_notifications?: boolean | null
          role_id?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          department_id?: string | null
          email?: string
          email_notifications?: boolean | null
          full_name?: string | null
          id?: string
          location?: string | null
          location_coordinates?: string | null
          phone?: string | null
          privacy_public_profile?: boolean | null
          push_notifications?: boolean | null
          role_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "department_issue_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          level: number
          name: string
          permissions: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          level: number
          name: string
          permissions?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          level?: number
          name?: string
          permissions?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          department_id: string | null
          id: string
          is_active: boolean | null
          notes: string | null
          role_id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          department_id?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          role_id: string
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          department_id?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          role_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "user_role_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "department_issue_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_role_view"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_states: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          created_by: string | null
          department_id: string | null
          estimated_completion: string | null
          id: string
          issue_id: string
          notes: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          created_by?: string | null
          department_id?: string | null
          estimated_completion?: string | null
          id?: string
          issue_id: string
          notes?: string | null
          status: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          created_by?: string | null
          department_id?: string | null
          estimated_completion?: string | null
          id?: string
          issue_id?: string
          notes?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workflow_states_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_states_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "user_role_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_states_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_states_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_role_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_states_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "department_issue_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_states_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_states_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issue_vote_stats"
            referencedColumns: ["issue_id"]
          },
          {
            foreignKeyName: "workflow_states_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      admin_notification_stats: {
        Row: {
          last_24h_count: number | null
          last_7d_count: number | null
          new_issues_count: number | null
          total_notifications: number | null
          unread_count: number | null
          urgent_count: number | null
        }
        Relationships: []
      }
      department_issue_stats: {
        Row: {
          assigned_count: number | null
          closed_count: number | null
          completion_rate: number | null
          email: string | null
          id: string | null
          in_progress_count: number | null
          name: string | null
          resolved_count: number | null
          submitted_count: number | null
          total_issues: number | null
        }
        Relationships: []
      }
      issue_vote_stats: {
        Row: {
          dispute_comments: number | null
          disputes: number | null
          downvotes: number | null
          issue_id: string | null
          status: string | null
          title: string | null
          total_comments: number | null
          total_votes: number | null
          upvotes: number | null
        }
        Relationships: []
      }
      user_role_view: {
        Row: {
          created_at: string | null
          department_description: string | null
          department_name: string | null
          email: string | null
          full_name: string | null
          id: string | null
          location: string | null
          permissions: Json | null
          phone: string | null
          role_description: string | null
          role_level: number | null
          role_name: string | null
          updated_at: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_or_create_test_user: { Args: never; Returns: string }
      get_user_permissions: { Args: { user_uuid: string }; Returns: Json }
      get_user_role_info: {
        Args: { user_uuid: string }
        Returns: {
          department_name: string
          permissions: Json
          role_level: number
          role_name: string
        }[]
      }
      get_user_vote: {
        Args: { issue_uuid: string; user_uuid: string }
        Returns: string
      }
      has_permission: {
        Args: { permission_name: string; user_uuid: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
