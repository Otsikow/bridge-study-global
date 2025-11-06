export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
        agents: {
          Row: {
            active: boolean | null
            commission_rate_l1: number | null
            commission_rate_l2: number | null
            company_name: string | null
            created_at: string | null
            id: string
            parent_agent_id: string | null
            payout_account: Json | null
            profile_id: string
            tenant_id: string
            updated_at: string | null
            verification_document_url: string | null
            verification_status: string | null
            username: string
          }
          Insert: {
            active?: boolean | null
            commission_rate_l1?: number | null
            commission_rate_l2?: number | null
            company_name?: string | null
            created_at?: string | null
            id?: string
            parent_agent_id?: string | null
            payout_account?: Json | null
            profile_id: string
            tenant_id: string
            updated_at?: string | null
            verification_document_url?: string | null
            verification_status?: string | null
            username: string
          }
          Update: {
            active?: boolean | null
            commission_rate_l1?: number | null
            commission_rate_l2?: number | null
            company_name?: string | null
            created_at?: string | null
            id?: string
            parent_agent_id?: string | null
            payout_account?: Json | null
            profile_id?: string
            tenant_id?: string
            updated_at?: string | null
            verification_document_url?: string | null
            verification_status?: string | null
            username?: string
          }
          Relationships: [
            {
              foreignKeyName: "agents_parent_agent_id_fkey"
              columns: ["parent_agent_id"]
              isOneToOne: false
              referencedRelation: "agents"
              referencedColumns: ["id"]
            },
            {
              foreignKeyName: "agents_profile_id_fkey"
              columns: ["profile_id"]
              isOneToOne: true
              referencedRelation: "profiles"
              referencedColumns: ["id"]
            },
            {
              foreignKeyName: "agents_tenant_id_fkey"
              columns: ["tenant_id"]
              isOneToOne: false
              referencedRelation: "tenants"
              referencedColumns: ["id"]
            }
          ]
        }

        profiles: {
          Row: {
            active: boolean | null
            avatar_url: string | null
            country: string | null
            created_at: string | null
            email: string
            full_name: string
            id: string
            locale: string | null
            onboarded: boolean | null
            phone: string | null
            referrer_id: string | null
            referred_by: string | null
            role: Database["public"]["Enums"]["app_role"]
            tenant_id: string
            timezone: string | null
            updated_at: string | null
            username: string
          }
          Insert: {
            active?: boolean | null
            avatar_url?: string | null
            country?: string | null
            created_at?: string | null
            email: string
            full_name: string
            id: string
            locale?: string | null
            onboarded?: boolean | null
            phone?: string | null
            referrer_id?: string | null
            referred_by?: string | null
            role?: Database["public"]["Enums"]["app_role"]
            tenant_id: string
            timezone?: string | null
            updated_at?: string | null
            username: string
          }
          Update: {
            active?: boolean | null
            avatar_url?: string | null
            country?: string | null
            created_at?: string | null
            email?: string
            full_name?: string
            id?: string
            locale?: string | null
            onboarded?: boolean | null
            phone?: string | null
            referrer_id?: string | null
            referred_by?: string | null
            role?: Database["public"]["Enums"]["app_role"]
            tenant_id?: string
            timezone?: string | null
            updated_at?: string | null
            username?: string
          }
          Relationships: [
            {
              foreignKeyName: "profiles_referrer_id_fkey"
              columns: ["referrer_id"]
              isOneToOne: false
              referencedRelation: "profiles"
              referencedColumns: ["id"]
            },
            {
              foreignKeyName: "profiles_tenant_id_fkey"
              columns: ["tenant_id"]
              isOneToOne: false
              referencedRelation: "tenants"
              referencedColumns: ["id"]
            }
          ]
        }

        referral_relations: {
          Row: {
            amount: number
            created_at: string
            id: string
            level: number
            referred_user_id: string
            referrer_id: string
          }
          Insert: {
            amount?: number
            created_at?: string
            id?: string
            level: number
            referred_user_id: string
            referrer_id: string
          }
          Update: {
            amount?: number
            created_at?: string
            id?: string
            level?: number
            referred_user_id?: string
            referrer_id?: string
          }
          Relationships: [
            {
              foreignKeyName: "referral_relations_referred_user_id_fkey"
              columns: ["referred_user_id"]
              isOneToOne: false
              referencedRelation: "profiles"
              referencedColumns: ["id"]
            },
            {
              foreignKeyName: "referral_relations_referrer_id_fkey"
              columns: ["referrer_id"]
              isOneToOne: false
              referencedRelation: "profiles"
              referencedColumns: ["id"]
            }
          ]
        }

      /* --- (All other tables remain unchanged — same as in your provided schema) --- */

      typing_indicators: {
        Row: {
          conversation_id: string
          expires_at: string
          id: string
          started_at: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          expires_at?: string
          id?: string
          started_at?: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          expires_at?: string
          id?: string
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "typing_indicators_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "typing_indicators_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }

      universities: {
        Row: {
          active: boolean | null
          city: string | null
          commission_terms_json: Json | null
          country: string
          created_at: string | null
          description: string | null
          featured: boolean | null
          featured_highlight: string | null
          featured_priority: number | null
          featured_summary: string | null
          featured_image_url: string | null
          id: string
          logo_url: string | null
          name: string
          partnership_status: string | null
          ranking: Json | null
          submission_config_json: Json | null
          submission_mode: string | null
          tenant_id: string
          updated_at: string | null
          website: string | null
        }
        Insert: {
          active?: boolean | null
          city?: string | null
          commission_terms_json?: Json | null
          country: string
          created_at?: string | null
          description?: string | null
          featured?: boolean | null
          featured_highlight?: string | null
          featured_priority?: number | null
          featured_summary?: string | null
          featured_image_url?: string | null
          id?: string
          logo_url?: string | null
          name: string
          partnership_status?: string | null
          ranking?: Json | null
          submission_config_json?: Json | null
          submission_mode?: string | null
          tenant_id: string
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          active?: boolean | null
          city?: string | null
          commission_terms_json?: Json | null
          country?: string
          created_at?: string | null
          description?: string | null
          featured?: boolean | null
          featured_highlight?: string | null
          featured_priority?: number | null
          featured_summary?: string | null
          featured_image_url?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          partnership_status?: string | null
          ranking?: Json | null
          submission_config_json?: Json | null
          submission_mode?: string | null
          tenant_id?: string
          updated_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "universities_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          }
        ]
      }
    }

    Views: {
      [_ in never]: never
    }

    Functions: {
      create_notification: {
        Args: {
          p_action_url?: string
          p_content: string
          p_metadata?: Json
          p_tenant_id: string
          p_title: string
          p_type: string
          p_user_id: string
        }
        Returns: string
      }
      get_or_create_conversation: {
        Args: {
          p_other_user_id: string
          p_tenant_id: string
          p_user_id: string
        }
        Returns: string
      }
      get_primary_role: {
        Args: { p_user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_public_featured_universities: {
        Args: never
        Returns: {
          city: string
          country: string
          featured_highlight: string
          featured_priority: number
          featured_summary: string
          id: string
          logo_url: string
          name: string
        }[]
      }
      match_knowledge: {
        Args: {
          audience_filter?: string[]
          locale_filter?: string
          match_count?: number
          match_threshold?: number
          query_embedding: number[]
          tenant_filter?: string
        }
        Returns: {
          audience: string[]
          category: string
          content: string
          id: string
          locale: string
          metadata: Json
          similarity: number | null
          source_type: string
          source_url: string | null
          tags: string[]
          title: string
        }[]
      }
      get_unread_count: {
        Args: { p_user_id: string; p_conversation_id: string }
        Returns: number
      }
      mark_conversation_read: {
        Args: { p_conversation_id: string }
        Returns: void
      }
      get_user_role: {
        Args: { user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_user_tenant: { Args: { user_id: string }; Returns: string }
      has_role: {
        Args: {
          p_role: Database["public"]["Enums"]["app_role"]
          p_user_id: string
        }
        Returns: boolean
      }
      is_admin_or_staff: { Args: { user_id: string }; Returns: boolean }
      is_username_available: { Args: { candidate: string }; Returns: boolean }
      is_agent_for_application: {
        Args: { _application_id: string; _user_id: string }
        Returns: boolean
      }
      is_agent_for_student: {
        Args: { _student_id: string; _user_id: string }
        Returns: boolean
      }
      is_student_owner: {
        Args: { _student_id: string; _user_id: string }
        Returns: boolean
      }
      mark_all_notifications_read: {
        Args: { p_user_id: string }
        Returns: number
      }
      mark_notification_read: {
        Args: { p_notification_id: string }
        Returns: boolean
      }
      notify_course_recommendation: {
        Args: { p_program_id: string; p_reason?: string; p_student_id: string }
        Returns: string
      }
    }

    Enums: {
      app_role:
        | "student"
        | "agent"
        | "partner"
        | "staff"
        | "admin"
        | "counselor"
        | "verifier"
        | "finance"
        | "school_rep"
      application_status:
        | "draft"
        | "submitted"
        | "screening"
        | "conditional_offer"
        | "unconditional_offer"
        | "cas_loa"
        | "visa"
        | "enrolled"
        | "withdrawn"
        | "deferred"
      commission_status: "pending" | "approved" | "paid" | "clawback"
      document_type:
        | "passport"
        | "transcript"
        | "ielts"
        | "toefl"
        | "sop"
        | "cv"
        | "lor"
        | "portfolio"
        | "other"
      message_type:
        | "text"
        | "system"
        | "document"
        | "image"
        | "file"
        | "audio"
        | "video"
      notification_channel: "email" | "sms" | "whatsapp" | "in_app"
      notification_status: "pending" | "sent" | "failed" | "delivered"
      offer_type: "conditional" | "unconditional"
      payment_purpose:
        | "application_fee"
        | "service_fee"
        | "deposit"
        | "tuition"
        | "other"
      payment_status: "pending" | "succeeded" | "failed" | "refunded"
      security_event_severity: "low" | "medium" | "high" | "critical"
      security_event_type:
        | "failed_authentication"
        | "privilege_escalation_attempt"
        | "suspicious_activity"
        | "policy_violation"
        | "custom"
      task_status: "open" | "in_progress" | "done" | "blocked"
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
    : never = never
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
    : never = never
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
    : never = never
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "student",
        "agent",
        "partner",
        "staff",
        "admin",
        "counselor",
        "verifier",
        "finance",
        "school_rep"
      ],
      application_status: [
        "draft",
        "submitted",
        "screening",
        "conditional_offer",
        "unconditional_offer",
        "cas_loa",
        "visa",
        "enrolled",
        "withdrawn",
        "deferred"
      ],
      commission_status: ["pending", "approved", "paid", "clawback"],
      document_type: [
        "passport",
        "transcript",
        "ielts",
        "toefl",
        "sop",
        "cv",
        "lor",
        "portfolio",
        "other"
      ],
      message_type: ["text", "system", "document"],
      notification_channel: ["email", "sms", "whatsapp", "in_app"],
      notification_status: ["pending", "sent", "failed", "delivered"],
      offer_type: ["conditional", "unconditional"],
      payment_purpose: [
        "application_fee",
        "service_fee",
        "deposit",
        "tuition",
        "other"
      ],
      payment_status: ["pending", "succeeded", "failed", "refunded"],
      security_event_severity: ["low", "medium", "high", "critical"],
      security_event_type: [
        "failed_authentication",
        "privilege_escalation_attempt",
        "suspicious_activity",
        "policy_violation",
        "custom"
      ],
      task_status: ["open", "in_progress", "done", "blocked"]
    }
  }
} as const
