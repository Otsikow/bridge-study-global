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
          },
        ]
      }
      application_documents: {
        Row: {
          application_id: string
          created_at: string | null
          document_type: Database["public"]["Enums"]["document_type"]
          file_size: number
          id: string
          mime_type: string
          storage_path: string
          uploaded_at: string | null
          verification_notes: string | null
          verified: boolean | null
          verifier_id: string | null
          version: number | null
        }
        Insert: {
          application_id: string
          created_at?: string | null
          document_type: Database["public"]["Enums"]["document_type"]
          file_size: number
          id?: string
          mime_type: string
          storage_path: string
          uploaded_at?: string | null
          verification_notes?: string | null
          verified?: boolean | null
          verifier_id?: string | null
          version?: number | null
        }
        Update: {
          application_id?: string
          created_at?: string | null
          document_type?: Database["public"]["Enums"]["document_type"]
          file_size?: number
          id?: string
          mime_type?: string
          storage_path?: string
          uploaded_at?: string | null
          verification_notes?: string | null
          verified?: boolean | null
          verifier_id?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "application_documents_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_documents_verifier_id_fkey"
            columns: ["verifier_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          agent_id: string | null
          created_at: string | null
          id: string
          intake_month: number
          intake_year: number
          internal_notes: string | null
          notes: string | null
          program_id: string
          status: Database["public"]["Enums"]["application_status"] | null
          student_id: string
          submitted_at: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          agent_id?: string | null
          created_at?: string | null
          id?: string
          intake_month: number
          intake_year: number
          internal_notes?: string | null
          notes?: string | null
          program_id: string
          status?: Database["public"]["Enums"]["application_status"] | null
          student_id: string
          submitted_at?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          agent_id?: string | null
          created_at?: string | null
          id?: string
          intake_month?: number
          intake_year?: number
          internal_notes?: string | null
          notes?: string | null
          program_id?: string
          status?: Database["public"]["Enums"]["application_status"] | null
          student_id?: string
          submitted_at?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "applications_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      attributions: {
        Row: {
          campaign: string | null
          created_at: string | null
          id: string
          landing_page: string | null
          medium: string | null
          referral_id: string | null
          source: string | null
          student_id: string
          tenant_id: string
          touch: string | null
        }
        Insert: {
          campaign?: string | null
          created_at?: string | null
          id?: string
          landing_page?: string | null
          medium?: string | null
          referral_id?: string | null
          source?: string | null
          student_id: string
          tenant_id: string
          touch?: string | null
        }
        Update: {
          campaign?: string | null
          created_at?: string | null
          id?: string
          landing_page?: string | null
          medium?: string | null
          referral_id?: string | null
          source?: string | null
          student_id?: string
          tenant_id?: string
          touch?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attributions_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attributions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attributions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          changes: Json | null
          created_at: string | null
          entity: string
          entity_id: string | null
          id: string
          ip_address: unknown | null
          tenant_id: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          changes?: Json | null
          created_at?: string | null
          entity: string
          entity_id?: string | null
          id?: string
          ip_address?: unknown | null
          tenant_id: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          changes?: Json | null
          created_at?: string | null
          entity?: string
          entity_id?: string | null
          id?: string
          ip_address?: unknown | null
          tenant_id?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cas_loa: {
        Row: {
          application_id: string
          cas_number: string | null
          created_at: string | null
          file_url: string
          id: string
          issue_date: string
        }
        Insert: {
          application_id: string
          cas_number?: string | null
          created_at?: string | null
          file_url: string
          id?: string
          issue_date: string
        }
        Update: {
          application_id?: string
          cas_number?: string | null
          created_at?: string | null
          file_url?: string
          id?: string
          issue_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "cas_loa_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: true
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      commissions: {
        Row: {
          agent_id: string
          amount_cents: number
          application_id: string
          approved_at: string | null
          created_at: string | null
          currency: string | null
          id: string
          level: number
          notes: string | null
          paid_at: string | null
          rate_percent: number
          status: Database["public"]["Enums"]["commission_status"] | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          agent_id: string
          amount_cents: number
          application_id: string
          approved_at?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          level: number
          notes?: string | null
          paid_at?: string | null
          rate_percent: number
          status?: Database["public"]["Enums"]["commission_status"] | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          agent_id?: string
          amount_cents?: number
          application_id?: string
          approved_at?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          level?: number
          notes?: string | null
          paid_at?: string | null
          rate_percent?: number
          status?: Database["public"]["Enums"]["commission_status"] | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commissions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_flags: {
        Row: {
          created_at: string | null
          description: string | null
          enabled: boolean | null
          flag_key: string
          id: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          enabled?: boolean | null
          flag_key: string
          id?: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          enabled?: boolean | null
          flag_key?: string
          id?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feature_flags_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      intake_calendars: {
        Row: {
          created_at: string | null
          deadline_date: string
          id: string
          intake_month: number
          intake_year: number
          program_id: string | null
          tenant_id: string
          university_id: string
        }
        Insert: {
          created_at?: string | null
          deadline_date: string
          id?: string
          intake_month: number
          intake_year: number
          program_id?: string | null
          tenant_id: string
          university_id: string
        }
        Update: {
          created_at?: string | null
          deadline_date?: string
          id?: string
          intake_month?: number
          intake_year?: number
          program_id?: string | null
          tenant_id?: string
          university_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "intake_calendars_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intake_calendars_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intake_calendars_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          application_id: string
          attachments: Json | null
          body: string
          created_at: string | null
          id: string
          message_type: Database["public"]["Enums"]["message_type"] | null
          read_by: string[] | null
          sender_id: string
        }
        Insert: {
          application_id: string
          attachments?: Json | null
          body: string
          created_at?: string | null
          id?: string
          message_type?: Database["public"]["Enums"]["message_type"] | null
          read_by?: string[] | null
          sender_id: string
        }
        Update: {
          application_id?: string
          attachments?: Json | null
          body?: string
          created_at?: string | null
          id?: string
          message_type?: Database["public"]["Enums"]["message_type"] | null
          read_by?: string[] | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          channel: Database["public"]["Enums"]["notification_channel"] | null
          created_at: string | null
          id: string
          payload: Json | null
          read_at: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["notification_status"] | null
          subject: string | null
          template_key: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          body: string
          channel?: Database["public"]["Enums"]["notification_channel"] | null
          created_at?: string | null
          id?: string
          payload?: Json | null
          read_at?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"] | null
          subject?: string | null
          template_key: string
          tenant_id: string
          user_id: string
        }
        Update: {
          body?: string
          channel?: Database["public"]["Enums"]["notification_channel"] | null
          created_at?: string | null
          id?: string
          payload?: Json | null
          read_at?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"] | null
          subject?: string | null
          template_key?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      offers: {
        Row: {
          accepted: boolean | null
          accepted_at: string | null
          application_id: string
          conditions: Json | null
          created_at: string | null
          expiry_date: string | null
          id: string
          letter_url: string
          offer_type: Database["public"]["Enums"]["offer_type"]
          updated_at: string | null
        }
        Insert: {
          accepted?: boolean | null
          accepted_at?: string | null
          application_id: string
          conditions?: Json | null
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          letter_url: string
          offer_type: Database["public"]["Enums"]["offer_type"]
          updated_at?: string | null
        }
        Update: {
          accepted?: boolean | null
          accepted_at?: string | null
          application_id?: string
          conditions?: Json | null
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          letter_url?: string
          offer_type?: Database["public"]["Enums"]["offer_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "offers_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_cents: number
          application_id: string | null
          created_at: string | null
          currency: string | null
          id: string
          metadata: Json | null
          purpose: Database["public"]["Enums"]["payment_purpose"]
          receipt_url: string | null
          status: Database["public"]["Enums"]["payment_status"] | null
          stripe_payment_intent: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          amount_cents: number
          application_id?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          metadata?: Json | null
          purpose: Database["public"]["Enums"]["payment_purpose"]
          receipt_url?: string | null
          status?: Database["public"]["Enums"]["payment_status"] | null
          stripe_payment_intent?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          amount_cents?: number
          application_id?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          metadata?: Json | null
          purpose?: Database["public"]["Enums"]["payment_purpose"]
          receipt_url?: string | null
          status?: Database["public"]["Enums"]["payment_status"] | null
          stripe_payment_intent?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active: boolean | null
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string
          id: string
          locale: string | null
          onboarded: boolean | null
          phone: string | null
          role: Database["public"]["Enums"]["app_role"]
          tenant_id: string
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name: string
          id: string
          locale?: string | null
          onboarded?: boolean | null
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          tenant_id: string
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          locale?: string | null
          onboarded?: boolean | null
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          tenant_id?: string
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      programs: {
        Row: {
          active: boolean | null
          created_at: string | null
          description: string | null
          discipline: string
          duration_months: number
          entry_requirements: Json | null
          id: string
          ielts_overall: number | null
          intake_months: number[] | null
          level: string
          name: string
          seats_available: number | null
          tenant_id: string
          toefl_overall: number | null
          tuition_amount: number
          tuition_currency: string | null
          university_id: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          discipline: string
          duration_months: number
          entry_requirements?: Json | null
          id?: string
          ielts_overall?: number | null
          intake_months?: number[] | null
          level: string
          name: string
          seats_available?: number | null
          tenant_id: string
          toefl_overall?: number | null
          tuition_amount: number
          tuition_currency?: string | null
          university_id: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          discipline?: string
          duration_months?: number
          entry_requirements?: Json | null
          id?: string
          ielts_overall?: number | null
          intake_months?: number[] | null
          level?: string
          name?: string
          seats_available?: number | null
          tenant_id?: string
          toefl_overall?: number | null
          tuition_amount?: number
          tuition_currency?: string | null
          university_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "programs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programs_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          active: boolean | null
          agent_id: string
          code: string
          created_at: string | null
          id: string
          parent_agent_id: string | null
          tenant_id: string
        }
        Insert: {
          active?: boolean | null
          agent_id: string
          code: string
          created_at?: string | null
          id?: string
          parent_agent_id?: string | null
          tenant_id: string
        }
        Update: {
          active?: boolean | null
          agent_id?: string
          code?: string
          created_at?: string | null
          id?: string
          parent_agent_id?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_parent_agent_id_fkey"
            columns: ["parent_agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_views: {
        Row: {
          columns: string[] | null
          context: string
          created_at: string | null
          filters: Json | null
          id: string
          is_default: boolean | null
          name: string
          sort: Json | null
          tenant_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          columns?: string[] | null
          context: string
          created_at?: string | null
          filters?: Json | null
          id?: string
          is_default?: boolean | null
          name: string
          sort?: Json | null
          tenant_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          columns?: string[] | null
          context?: string
          created_at?: string | null
          filters?: Json | null
          id?: string
          is_default?: boolean | null
          name?: string
          sort?: Json | null
          tenant_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_views_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_views_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      scholarships: {
        Row: {
          active: boolean | null
          amount_cents: number | null
          application_deadline: string | null
          coverage_type: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          eligibility_criteria: Json | null
          id: string
          name: string
          program_id: string | null
          renewable: boolean | null
          tenant_id: string
          university_id: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          amount_cents?: number | null
          application_deadline?: string | null
          coverage_type?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          eligibility_criteria?: Json | null
          id?: string
          name: string
          program_id?: string | null
          renewable?: boolean | null
          tenant_id: string
          university_id?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          amount_cents?: number | null
          application_deadline?: string | null
          coverage_type?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          eligibility_criteria?: Json | null
          id?: string
          name?: string
          program_id?: string | null
          renewable?: boolean | null
          tenant_id?: string
          university_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scholarships_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scholarships_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scholarships_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          address: Json | null
          created_at: string | null
          date_of_birth: string | null
          education_history: Json | null
          guardian: Json | null
          id: string
          nationality: string | null
          passport_number: string | null
          profile_id: string
          tenant_id: string
          test_scores: Json | null
          updated_at: string | null
        }
        Insert: {
          address?: Json | null
          created_at?: string | null
          date_of_birth?: string | null
          education_history?: Json | null
          guardian?: Json | null
          id?: string
          nationality?: string | null
          passport_number?: string | null
          profile_id: string
          tenant_id: string
          test_scores?: Json | null
          updated_at?: string | null
        }
        Update: {
          address?: Json | null
          created_at?: string | null
          date_of_birth?: string | null
          education_history?: Json | null
          guardian?: Json | null
          id?: string
          nationality?: string | null
          passport_number?: string | null
          profile_id?: string
          tenant_id?: string
          test_scores?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          application_id: string | null
          assignee_id: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          due_at: string | null
          id: string
          priority: string | null
          status: Database["public"]["Enums"]["task_status"] | null
          tenant_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          application_id?: string | null
          assignee_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_at?: string | null
          id?: string
          priority?: string | null
          status?: Database["public"]["Enums"]["task_status"] | null
          tenant_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          application_id?: string | null
          assignee_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_at?: string | null
          id?: string
          priority?: string | null
          status?: Database["public"]["Enums"]["task_status"] | null
          tenant_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          active: boolean | null
          brand_colors: Json | null
          created_at: string | null
          email_from: string
          id: string
          logo_url: string | null
          name: string
          settings: Json | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          brand_colors?: Json | null
          created_at?: string | null
          email_from: string
          id?: string
          logo_url?: string | null
          name: string
          settings?: Json | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          brand_colors?: Json | null
          created_at?: string | null
          email_from?: string
          id?: string
          logo_url?: string | null
          name?: string
          settings?: Json | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      universities: {
        Row: {
          active: boolean | null
          city: string | null
          country: string
          created_at: string | null
          description: string | null
          id: string
          logo_url: string | null
          name: string
          ranking: Json | null
          tenant_id: string
          updated_at: string | null
          website: string | null
        }
        Insert: {
          active?: boolean | null
          city?: string | null
          country: string
          created_at?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          name: string
          ranking?: Json | null
          tenant_id: string
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          active?: boolean | null
          city?: string | null
          country?: string
          created_at?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          ranking?: Json | null
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
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_user_tenant: {
        Args: { user_id: string }
        Returns: string
      }
      is_admin_or_staff: {
        Args: { user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "student" | "agent" | "partner" | "staff" | "admin"
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
      message_type: "text" | "system" | "document"
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
    Enums: {
      app_role: ["student", "agent", "partner", "staff", "admin"],
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
        "deferred",
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
        "other",
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
        "other",
      ],
      payment_status: ["pending", "succeeded", "failed", "refunded"],
      task_status: ["open", "in_progress", "done", "blocked"],
    },
  },
} as const
