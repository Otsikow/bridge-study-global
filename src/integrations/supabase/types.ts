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
      application_drafts: {
        Row: {
          created_at: string | null
          form_data: Json
          id: string
          last_step: number
          program_id: string | null
          student_id: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          form_data?: Json
          id?: string
          last_step?: number
          program_id?: string | null
          student_id: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          form_data?: Json
          id?: string
          last_step?: number
          program_id?: string | null
          student_id?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "application_drafts_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_drafts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_drafts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          agent_id: string | null
          app_number: string | null
          created_at: string | null
          decision_json: Json | null
          fees_json: Json | null
          id: string
          intake_id: string | null
          intake_month: number
          intake_year: number
          internal_notes: string | null
          notes: string | null
          program_id: string
          risk_flags_json: Json | null
          status: Database["public"]["Enums"]["application_status"] | null
          student_id: string
          submission_channel: string | null
          submitted_at: string | null
          tenant_id: string
          timeline_json: Json | null
          updated_at: string | null
        }
        Insert: {
          agent_id?: string | null
          app_number?: string | null
          created_at?: string | null
          decision_json?: Json | null
          fees_json?: Json | null
          id?: string
          intake_id?: string | null
          intake_month: number
          intake_year: number
          internal_notes?: string | null
          notes?: string | null
          program_id: string
          risk_flags_json?: Json | null
          status?: Database["public"]["Enums"]["application_status"] | null
          student_id: string
          submission_channel?: string | null
          submitted_at?: string | null
          tenant_id: string
          timeline_json?: Json | null
          updated_at?: string | null
        }
        Update: {
          agent_id?: string | null
          app_number?: string | null
          created_at?: string | null
          decision_json?: Json | null
          fees_json?: Json | null
          id?: string
          intake_id?: string | null
          intake_month?: number
          intake_year?: number
          internal_notes?: string | null
          notes?: string | null
          program_id?: string
          risk_flags_json?: Json | null
          status?: Database["public"]["Enums"]["application_status"] | null
          student_id?: string
          submission_channel?: string | null
          submitted_at?: string | null
          tenant_id?: string
          timeline_json?: Json | null
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
            foreignKeyName: "applications_intake_id_fkey"
            columns: ["intake_id"]
            isOneToOne: false
            referencedRelation: "intakes"
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
          ip_address: unknown
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
          ip_address?: unknown
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
          ip_address?: unknown
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
        security_alerts: {
          Row: {
            acknowledged_at: string | null
            created_at: string
            details: string | null
            event_type: Database["public"]["Enums"]["security_event_type"]
            id: string
            metadata: Json | null
            resolved_at: string | null
            severity: Database["public"]["Enums"]["security_event_severity"]
            source_event_id: string | null
            status: Database["public"]["Enums"]["security_alert_status"]
            summary: string
            tenant_id: string | null
          }
          Insert: {
            acknowledged_at?: string | null
            created_at?: string
            details?: string | null
            event_type: Database["public"]["Enums"]["security_event_type"]
            id?: string
            metadata?: Json | null
            resolved_at?: string | null
            severity: Database["public"]["Enums"]["security_event_severity"]
            source_event_id?: string | null
            status?: Database["public"]["Enums"]["security_alert_status"]
            summary: string
            tenant_id?: string | null
          }
          Update: {
            acknowledged_at?: string | null
            created_at?: string
            details?: string | null
            event_type?: Database["public"]["Enums"]["security_event_type"]
            id?: string
            metadata?: Json | null
            resolved_at?: string | null
            severity?: Database["public"]["Enums"]["security_event_severity"]
            source_event_id?: string | null
            status?: Database["public"]["Enums"]["security_alert_status"]
            summary?: string
            tenant_id?: string | null
          }
          Relationships: [
            {
              foreignKeyName: "security_alerts_source_event_id_fkey"
              columns: ["source_event_id"]
              isOneToOne: false
              referencedRelation: "security_audit_logs"
              referencedColumns: ["id"]
            },
            {
              foreignKeyName: "security_alerts_tenant_id_fkey"
              columns: ["tenant_id"]
              isOneToOne: false
              referencedRelation: "tenants"
              referencedColumns: ["id"]
            },
          ]
        }
        security_audit_logs: {
          Row: {
            actor_email: string | null
            created_at: string
            description: string | null
            event_type: Database["public"]["Enums"]["security_event_type"]
            id: string
            ip_address: unknown
            metadata: Json | null
            severity: Database["public"]["Enums"]["security_event_severity"]
            tenant_id: string | null
            user_agent: string | null
            user_id: string | null
          }
          Insert: {
            actor_email?: string | null
            created_at?: string
            description?: string | null
            event_type: Database["public"]["Enums"]["security_event_type"]
            id?: string
            ip_address?: unknown
            metadata?: Json | null
            severity?: Database["public"]["Enums"]["security_event_severity"]
            tenant_id?: string | null
            user_agent?: string | null
            user_id?: string | null
          }
          Update: {
            actor_email?: string | null
            created_at?: string
            description?: string | null
            event_type?: Database["public"]["Enums"]["security_event_type"]
            id?: string
            ip_address?: unknown
            metadata?: Json | null
            severity?: Database["public"]["Enums"]["security_event_severity"]
            tenant_id?: string | null
            user_agent?: string | null
            user_id?: string | null
          }
          Relationships: [
            {
              foreignKeyName: "security_audit_logs_tenant_id_fkey"
              columns: ["tenant_id"]
              isOneToOne: false
              referencedRelation: "tenants"
              referencedColumns: ["id"]
            },
            {
              foreignKeyName: "security_audit_logs_user_id_fkey"
              columns: ["user_id"]
              isOneToOne: false
              referencedRelation: "profiles"
              referencedColumns: ["id"]
            },
          ]
        }
      blog_posts: {
        Row: {
          author_id: string
          content_html: string | null
          content_md: string | null
          cover_image_url: string | null
          created_at: string | null
          excerpt: string | null
          featured: boolean | null
          id: string
          likes_count: number | null
          published_at: string | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          status: string
          tags: string[] | null
          tenant_id: string
          title: string
          updated_at: string | null
          views_count: number | null
        }
        Insert: {
          author_id: string
          content_html?: string | null
          content_md?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          excerpt?: string | null
          featured?: boolean | null
          id?: string
          likes_count?: number | null
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          status?: string
          tags?: string[] | null
          tenant_id: string
          title: string
          updated_at?: string | null
          views_count?: number | null
        }
        Update: {
          author_id?: string
          content_html?: string | null
          content_md?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          excerpt?: string | null
          featured?: boolean | null
          id?: string
          likes_count?: number | null
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          status?: string
          tags?: string[] | null
          tenant_id?: string
          title?: string
          updated_at?: string | null
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_posts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
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
      conversation_messages: {
        Row: {
          attachments: Json | null
          content: string
          conversation_id: string
          created_at: string
          deleted_at: string | null
          edited_at: string | null
          id: string
          message_type: string
          read_by: string[] | null
          reply_to_id: string | null
          sender_id: string
          updated_at: string
        }
        Insert: {
          attachments?: Json | null
          content: string
          conversation_id: string
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          message_type?: string
          read_by?: string[] | null
          reply_to_id?: string | null
          sender_id: string
          updated_at?: string
        }
        Update: {
          attachments?: Json | null
          content?: string
          conversation_id?: string
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          message_type?: string
          read_by?: string[] | null
          reply_to_id?: string | null
          sender_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "conversation_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          id: string
          joined_at: string
          last_read_at: string | null
          user_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          joined_at?: string
          last_read_at?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string
          id?: string
          joined_at?: string
          last_read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          is_group: boolean
          last_message_at: string | null
          tenant_id: string
          title: string | null
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_group?: boolean
          last_message_at?: string | null
          tenant_id: string
          title?: string | null
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_group?: boolean
          last_message_at?: string | null
          tenant_id?: string
          title?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      education_records: {
        Row: {
          certificate_url: string | null
          country: string
          created_at: string | null
          end_date: string | null
          gpa: number | null
          grade_scale: string | null
          id: string
          institution_name: string
          level: string
          start_date: string
          student_id: string
          transcript_url: string | null
          updated_at: string | null
        }
        Insert: {
          certificate_url?: string | null
          country: string
          created_at?: string | null
          end_date?: string | null
          gpa?: number | null
          grade_scale?: string | null
          id?: string
          institution_name: string
          level: string
          start_date: string
          student_id: string
          transcript_url?: string | null
          updated_at?: string | null
        }
        Update: {
          certificate_url?: string | null
          country?: string
          created_at?: string | null
          end_date?: string | null
          gpa?: number | null
          grade_scale?: string | null
          id?: string
          institution_name?: string
          level?: string
          start_date?: string
          student_id?: string
          transcript_url?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "education_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
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
      intakes: {
        Row: {
          app_deadline: string
          created_at: string | null
          id: string
          program_id: string
          seats_available: number | null
          seats_json: Json | null
          start_date: string
          term: string
          updated_at: string | null
          visa_cutoff_date: string | null
        }
        Insert: {
          app_deadline: string
          created_at?: string | null
          id?: string
          program_id: string
          seats_available?: number | null
          seats_json?: Json | null
          start_date: string
          term: string
          updated_at?: string | null
          visa_cutoff_date?: string | null
        }
        Update: {
          app_deadline?: string
          created_at?: string | null
          id?: string
          program_id?: string
          seats_available?: number | null
          seats_json?: Json | null
          start_date?: string
          term?: string
          updated_at?: string | null
          visa_cutoff_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "intakes_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
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
      partnership_applications: {
        Row: {
          accreditation_document_url: string | null
          additional_documents: Json | null
          address: string
          brochure_document_url: string | null
          city: string
          country: string
          created_at: string | null
          id: string
          partnership_terms: string | null
          primary_contact_email: string
          primary_contact_name: string
          primary_contact_phone: string | null
          primary_contact_position: string | null
          programs_offered: Json
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          target_student_demographics: string | null
          tenant_id: string
          terms_accepted: boolean
          terms_accepted_at: string | null
          university_name: string
          updated_at: string | null
          website: string | null
        }
        Insert: {
          accreditation_document_url?: string | null
          additional_documents?: Json | null
          address: string
          brochure_document_url?: string | null
          city: string
          country: string
          created_at?: string | null
          id?: string
          partnership_terms?: string | null
          primary_contact_email: string
          primary_contact_name: string
          primary_contact_phone?: string | null
          primary_contact_position?: string | null
          programs_offered?: Json
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          target_student_demographics?: string | null
          tenant_id: string
          terms_accepted?: boolean
          terms_accepted_at?: string | null
          university_name: string
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          accreditation_document_url?: string | null
          additional_documents?: Json | null
          address?: string
          brochure_document_url?: string | null
          city?: string
          country?: string
          created_at?: string | null
          id?: string
          partnership_terms?: string | null
          primary_contact_email?: string
          primary_contact_name?: string
          primary_contact_phone?: string | null
          primary_contact_position?: string | null
          programs_offered?: Json
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          target_student_demographics?: string | null
          tenant_id?: string
          terms_accepted?: boolean
          terms_accepted_at?: string | null
          university_name?: string
          updated_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partnership_applications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
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
          app_fee: number | null
          created_at: string | null
          description: string | null
          discipline: string
          docs_required_json: Json | null
          duration_months: number
          entry_requirements: Json | null
          id: string
          ielts_overall: number | null
          intake_months: number[] | null
          level: string
          name: string
          requirements_json: Json | null
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
          app_fee?: number | null
          created_at?: string | null
          description?: string | null
          discipline: string
          docs_required_json?: Json | null
          duration_months: number
          entry_requirements?: Json | null
          id?: string
          ielts_overall?: number | null
          intake_months?: number[] | null
          level: string
          name: string
          requirements_json?: Json | null
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
          app_fee?: number | null
          created_at?: string | null
          description?: string | null
          discipline?: string
          docs_required_json?: Json | null
          duration_months?: number
          entry_requirements?: Json | null
          id?: string
          ielts_overall?: number | null
          intake_months?: number[] | null
          level?: string
          name?: string
          requirements_json?: Json | null
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
      student_assignments: {
        Row: {
          assigned_at: string | null
          counselor_id: string
          id: string
          notes: string | null
          student_id: string
        }
        Insert: {
          assigned_at?: string | null
          counselor_id: string
          id?: string
          notes?: string | null
          student_id: string
        }
        Update: {
          assigned_at?: string | null
          counselor_id?: string
          id?: string
          notes?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_assignments_counselor_id_fkey"
            columns: ["counselor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_assignments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_documents: {
        Row: {
          checksum: string | null
          created_at: string | null
          document_type: string
          file_name: string
          file_size: number
          id: string
          mime_type: string
          storage_path: string
          student_id: string
          updated_at: string | null
          verification_notes: string | null
          verified_at: string | null
          verified_by: string | null
          verified_status: string | null
        }
        Insert: {
          checksum?: string | null
          created_at?: string | null
          document_type: string
          file_name: string
          file_size: number
          id?: string
          mime_type: string
          storage_path: string
          student_id: string
          updated_at?: string | null
          verification_notes?: string | null
          verified_at?: string | null
          verified_by?: string | null
          verified_status?: string | null
        }
        Update: {
          checksum?: string | null
          created_at?: string | null
          document_type?: string
          file_name?: string
          file_size?: number
          id?: string
          mime_type?: string
          storage_path?: string
          student_id?: string
          updated_at?: string | null
          verification_notes?: string | null
          verified_at?: string | null
          verified_by?: string | null
          verified_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_documents_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_documents_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          address: Json | null
          consent_flags_json: Json | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string | null
          current_country: string | null
          date_of_birth: string | null
          education_history: Json | null
          finances_json: Json | null
          guardian: Json | null
          id: string
          legal_name: string | null
          nationality: string | null
          passport_expiry: string | null
          passport_number: string | null
          preferred_name: string | null
          profile_completeness: number | null
          profile_id: string
          tenant_id: string
          test_scores: Json | null
          updated_at: string | null
          visa_history_json: Json | null
        }
        Insert: {
          address?: Json | null
          consent_flags_json?: Json | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          current_country?: string | null
          date_of_birth?: string | null
          education_history?: Json | null
          finances_json?: Json | null
          guardian?: Json | null
          id?: string
          legal_name?: string | null
          nationality?: string | null
          passport_expiry?: string | null
          passport_number?: string | null
          preferred_name?: string | null
          profile_completeness?: number | null
          profile_id: string
          tenant_id: string
          test_scores?: Json | null
          updated_at?: string | null
          visa_history_json?: Json | null
        }
        Update: {
          address?: Json | null
          consent_flags_json?: Json | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          current_country?: string | null
          date_of_birth?: string | null
          education_history?: Json | null
          finances_json?: Json | null
          guardian?: Json | null
          id?: string
          legal_name?: string | null
          nationality?: string | null
          passport_expiry?: string | null
          passport_number?: string | null
          preferred_name?: string | null
          profile_completeness?: number | null
          profile_id?: string
          tenant_id?: string
          test_scores?: Json | null
          updated_at?: string | null
          visa_history_json?: Json | null
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
      test_scores: {
        Row: {
          created_at: string | null
          id: string
          report_url: string | null
          student_id: string
          subscores_json: Json | null
          test_date: string
          test_type: string
          total_score: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          report_url?: string | null
          student_id: string
          subscores_json?: Json | null
          test_date: string
          test_type: string
          total_score: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          report_url?: string | null
          student_id?: string
          subscores_json?: Json | null
          test_date?: string
          test_type?: string
          total_score?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "test_scores_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
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
          },
        ]
      }
      user_feedback: {
        Row: {
          admin_notes: string | null
          category: string
          contact_email: string | null
          contact_requested: boolean | null
          created_at: string
          feedback_type: string
          id: string
          message: string
          page_url: string | null
          rating: number | null
          resolved_at: string | null
          resolved_by: string | null
          status: string | null
          tenant_id: string
          updated_at: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          category: string
          contact_email?: string | null
          contact_requested?: boolean | null
          created_at?: string
          feedback_type: string
          id?: string
          message: string
          page_url?: string | null
          rating?: number | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
          tenant_id: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          category?: string
          contact_email?: string | null
          contact_requested?: boolean | null
          created_at?: string
          feedback_type?: string
          id?: string
          message?: string
          page_url?: string | null
          rating?: number | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
          tenant_id?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_feedback_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      user_presence: {
        Row: {
          id: string
          last_seen: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          last_seen?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          last_seen?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
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
        get_unread_count: {
          Args: { p_conversation_id: string; p_user_id: string }
          Returns: number
        }
        get_user_role: {
          Args: { user_id: string }
          Returns: Database["public"]["Enums"]["app_role"]
        }
        get_user_tenant: { Args: { user_id: string }; Returns: string }
        log_security_event: {
          Args: {
            p_tenant_id: string | null
            p_user_id: string | null
            p_actor_email: string | null
            p_event_type: Database["public"]["Enums"]["security_event_type"]
            p_severity?: Database["public"]["Enums"]["security_event_severity"]
            p_description?: string | null
            p_metadata?: Json | null
            p_ip_address?: unknown
            p_user_agent?: string | null
          }
          Returns: string
        }
      has_role: {
        Args: {
          p_role: Database["public"]["Enums"]["app_role"]
          p_user_id: string
        }
        Returns: boolean
      }
      is_admin_or_staff: { Args: { user_id: string }; Returns: boolean }
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
        security_alert_status: "open" | "acknowledged" | "resolved" | "dismissed"
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
      app_role: [
        "student",
        "agent",
        "partner",
        "staff",
        "admin",
        "counselor",
        "verifier",
        "finance",
        "school_rep",
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
