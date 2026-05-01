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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      advisor_messages: {
        Row: {
          advisor_type: Database["public"]["Enums"]["advisor_type"]
          created_at: string
          id: string
          message: string
          replied_at: string | null
          replied_by: string | null
          reply: string | null
          user_id: string
        }
        Insert: {
          advisor_type: Database["public"]["Enums"]["advisor_type"]
          created_at?: string
          id?: string
          message: string
          replied_at?: string | null
          replied_by?: string | null
          reply?: string | null
          user_id: string
        }
        Update: {
          advisor_type?: Database["public"]["Enums"]["advisor_type"]
          created_at?: string
          id?: string
          message?: string
          replied_at?: string | null
          replied_by?: string | null
          reply?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ai_credit_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          related_generation_id: string | null
          type: Database["public"]["Enums"]["ai_credit_tx_type"]
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          related_generation_id?: string | null
          type: Database["public"]["Enums"]["ai_credit_tx_type"]
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          related_generation_id?: string | null
          type?: Database["public"]["Enums"]["ai_credit_tx_type"]
          user_id?: string
        }
        Relationships: []
      }
      ai_generation_history: {
        Row: {
          created_at: string
          credits_used: number
          generator_id: string | null
          generator_slug: string
          id: string
          input_data: Json
          model: string | null
          output_data: string | null
          quality_mode: Database["public"]["Enums"]["ai_quality_mode"]
          user_id: string
        }
        Insert: {
          created_at?: string
          credits_used?: number
          generator_id?: string | null
          generator_slug: string
          id?: string
          input_data?: Json
          model?: string | null
          output_data?: string | null
          quality_mode?: Database["public"]["Enums"]["ai_quality_mode"]
          user_id: string
        }
        Update: {
          created_at?: string
          credits_used?: number
          generator_id?: string | null
          generator_slug?: string
          id?: string
          input_data?: Json
          model?: string | null
          output_data?: string | null
          quality_mode?: Database["public"]["Enums"]["ai_quality_mode"]
          user_id?: string
        }
        Relationships: []
      }
      ai_generators: {
        Row: {
          category: string | null
          created_at: string
          credit_cost: number
          description: string | null
          estimated_api_cost_pln: number
          form_schema: Json
          id: string
          max_output_tokens: number
          model: string
          name: string
          position: number
          required_plan: Database["public"]["Enums"]["subscription_plan"] | null
          slug: string
          status: Database["public"]["Enums"]["ai_generator_status"]
          supports_quality_modes: boolean
          system_prompt: string
          temperature: number
          updated_at: string
          user_prompt_template: string
          version: number
        }
        Insert: {
          category?: string | null
          created_at?: string
          credit_cost?: number
          description?: string | null
          estimated_api_cost_pln?: number
          form_schema?: Json
          id?: string
          max_output_tokens?: number
          model?: string
          name: string
          position?: number
          required_plan?:
            | Database["public"]["Enums"]["subscription_plan"]
            | null
          slug: string
          status?: Database["public"]["Enums"]["ai_generator_status"]
          supports_quality_modes?: boolean
          system_prompt: string
          temperature?: number
          updated_at?: string
          user_prompt_template: string
          version?: number
        }
        Update: {
          category?: string | null
          created_at?: string
          credit_cost?: number
          description?: string | null
          estimated_api_cost_pln?: number
          form_schema?: Json
          id?: string
          max_output_tokens?: number
          model?: string
          name?: string
          position?: number
          required_plan?:
            | Database["public"]["Enums"]["subscription_plan"]
            | null
          slug?: string
          status?: Database["public"]["Enums"]["ai_generator_status"]
          supports_quality_modes?: boolean
          system_prompt?: string
          temperature?: number
          updated_at?: string
          user_prompt_template?: string
          version?: number
        }
        Relationships: []
      }
      ai_settings: {
        Row: {
          credit_value_pln: number
          default_model: string
          id: string
          minimum_margin_multiplier: number
          updated_at: string
        }
        Insert: {
          credit_value_pln?: number
          default_model?: string
          id?: string
          minimum_margin_multiplier?: number
          updated_at?: string
        }
        Update: {
          credit_value_pln?: number
          default_model?: string
          id?: string
          minimum_margin_multiplier?: number
          updated_at?: string
        }
        Relationships: []
      }
      badges: {
        Row: {
          code: string
          created_at: string
          description: string | null
          icon: string
          id: string
          name: string
          position: number
          rarity: Database["public"]["Enums"]["badge_rarity"]
          xp_bonus: number
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          name: string
          position?: number
          rarity?: Database["public"]["Enums"]["badge_rarity"]
          xp_bonus?: number
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          name?: string
          position?: number
          rarity?: Database["public"]["Enums"]["badge_rarity"]
          xp_bonus?: number
        }
        Relationships: []
      }
      challenges: {
        Row: {
          badge_code: string | null
          created_at: string
          description: string | null
          ends_at: string
          goal_value: number
          id: string
          is_active: boolean
          metric: Database["public"]["Enums"]["challenge_metric"]
          starts_at: string
          title: string
          type: Database["public"]["Enums"]["challenge_type"]
          xp_reward: number
        }
        Insert: {
          badge_code?: string | null
          created_at?: string
          description?: string | null
          ends_at: string
          goal_value: number
          id?: string
          is_active?: boolean
          metric: Database["public"]["Enums"]["challenge_metric"]
          starts_at?: string
          title: string
          type: Database["public"]["Enums"]["challenge_type"]
          xp_reward?: number
        }
        Update: {
          badge_code?: string | null
          created_at?: string
          description?: string | null
          ends_at?: string
          goal_value?: number
          id?: string
          is_active?: boolean
          metric?: Database["public"]["Enums"]["challenge_metric"]
          starts_at?: string
          title?: string
          type?: Database["public"]["Enums"]["challenge_type"]
          xp_reward?: number
        }
        Relationships: []
      }
      coach_usage: {
        Row: {
          id: string
          message_count: number
          used_date: string
          user_id: string
        }
        Insert: {
          id?: string
          message_count?: number
          used_date?: string
          user_id: string
        }
        Update: {
          id?: string
          message_count?: number
          used_date?: string
          user_id?: string
        }
        Relationships: []
      }
      community_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_posts: {
        Row: {
          category: string
          content: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          content: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      courses: {
        Row: {
          cover_url: string | null
          created_at: string
          description: string | null
          id: string
          is_published: boolean
          position: number
          required_xp: number
          slug: string | null
          title: string
          updated_at: string
        }
        Insert: {
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          position?: number
          required_xp?: number
          slug?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          position?: number
          required_xp?: number
          slug?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      credit_redemption_codes: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          credits: number
          description: string | null
          expires_at: string | null
          id: string
          is_active: boolean
          max_redemptions: number | null
          redemption_count: number
          validity_days: number
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          credits: number
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_redemptions?: number | null
          redemption_count?: number
          validity_days?: number
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          credits?: number
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_redemptions?: number | null
          redemption_count?: number
          validity_days?: number
        }
        Relationships: []
      }
      duels: {
        Row: {
          challenger_id: string
          challenger_progress: number
          created_at: string
          ends_at: string
          id: string
          metric: Database["public"]["Enums"]["duel_metric"]
          opponent_id: string
          opponent_progress: number
          starts_at: string | null
          status: Database["public"]["Enums"]["duel_status"]
          target: number
          updated_at: string
          winner_id: string | null
          xp_stake: number
        }
        Insert: {
          challenger_id: string
          challenger_progress?: number
          created_at?: string
          ends_at: string
          id?: string
          metric: Database["public"]["Enums"]["duel_metric"]
          opponent_id: string
          opponent_progress?: number
          starts_at?: string | null
          status?: Database["public"]["Enums"]["duel_status"]
          target: number
          updated_at?: string
          winner_id?: string | null
          xp_stake?: number
        }
        Update: {
          challenger_id?: string
          challenger_progress?: number
          created_at?: string
          ends_at?: string
          id?: string
          metric?: Database["public"]["Enums"]["duel_metric"]
          opponent_id?: string
          opponent_progress?: number
          starts_at?: string | null
          status?: Database["public"]["Enums"]["duel_status"]
          target?: number
          updated_at?: string
          winner_id?: string | null
          xp_stake?: number
        }
        Relationships: []
      }
      lead_calls: {
        Row: {
          called_at: string | null
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          scheduled_for: string
          status: Database["public"]["Enums"]["call_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          called_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          scheduled_for: string
          status?: Database["public"]["Enums"]["call_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          called_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          scheduled_for?: string
          status?: Database["public"]["Enums"]["call_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      lesson_attachments: {
        Row: {
          created_at: string
          file_size_bytes: number | null
          file_type: string | null
          file_url: string
          id: string
          lesson_id: string
          position: number
          title: string
        }
        Insert: {
          created_at?: string
          file_size_bytes?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          lesson_id: string
          position?: number
          title: string
        }
        Update: {
          created_at?: string
          file_size_bytes?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          lesson_id?: string
          position?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_attachments_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          is_admin_reply: boolean
          lesson_id: string
          parent_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_admin_reply?: boolean
          lesson_id: string
          parent_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_admin_reply?: boolean
          lesson_id?: string
          parent_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_comments_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "lesson_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_tasks: {
        Row: {
          created_at: string
          due_in_days: number | null
          id: string
          instructions: string | null
          is_required: boolean
          lesson_id: string
          title: string
          xp_reward: number
        }
        Insert: {
          created_at?: string
          due_in_days?: number | null
          id?: string
          instructions?: string | null
          is_required?: boolean
          lesson_id: string
          title: string
          xp_reward?: number
        }
        Update: {
          created_at?: string
          due_in_days?: number | null
          id?: string
          instructions?: string | null
          is_required?: boolean
          lesson_id?: string
          title?: string
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "lesson_tasks_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_unlock_notifications: {
        Row: {
          id: string
          lesson_id: string
          sent_at: string
          user_id: string
        }
        Insert: {
          id?: string
          lesson_id: string
          sent_at?: string
          user_id: string
        }
        Update: {
          id?: string
          lesson_id?: string
          sent_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_unlock_notifications_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          content: string | null
          content_blocks: Json
          course_id: string
          created_at: string
          description: string | null
          due_in_days: number | null
          id: string
          is_published: boolean
          module_id: string | null
          position: number
          requires_task_completion: boolean
          title: string
          unlock_after_hours: number
          updated_at: string
          video_url: string | null
          xp_reward: number
        }
        Insert: {
          content?: string | null
          content_blocks?: Json
          course_id: string
          created_at?: string
          description?: string | null
          due_in_days?: number | null
          id?: string
          is_published?: boolean
          module_id?: string | null
          position?: number
          requires_task_completion?: boolean
          title: string
          unlock_after_hours?: number
          updated_at?: string
          video_url?: string | null
          xp_reward?: number
        }
        Update: {
          content?: string | null
          content_blocks?: Json
          course_id?: string
          created_at?: string
          description?: string | null
          due_in_days?: number | null
          id?: string
          is_published?: boolean
          module_id?: string | null
          position?: number
          requires_task_completion?: boolean
          title?: string
          unlock_after_hours?: number
          updated_at?: string
          video_url?: string | null
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      mentor_assigned_tasks: {
        Row: {
          admin_feedback: string | null
          assigned_by: string
          created_at: string
          due_date: string | null
          id: string
          instructions: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["mentor_task_status"]
          submission_content: string | null
          submitted_at: string | null
          title: string
          updated_at: string
          user_id: string
          xp_reward: number
        }
        Insert: {
          admin_feedback?: string | null
          assigned_by: string
          created_at?: string
          due_date?: string | null
          id?: string
          instructions?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["mentor_task_status"]
          submission_content?: string | null
          submitted_at?: string | null
          title: string
          updated_at?: string
          user_id: string
          xp_reward?: number
        }
        Update: {
          admin_feedback?: string | null
          assigned_by?: string
          created_at?: string
          due_date?: string | null
          id?: string
          instructions?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["mentor_task_status"]
          submission_content?: string | null
          submitted_at?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          xp_reward?: number
        }
        Relationships: []
      }
      modules: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          id: string
          is_published: boolean
          position: number
          requires_previous_module: boolean
          title: string
          unlock_after_hours: number
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          position?: number
          requires_previous_module?: boolean
          title: string
          unlock_after_hours?: number
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          position?: number
          requires_previous_module?: boolean
          title?: string
          unlock_after_hours?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: []
      }
      problem_reports: {
        Row: {
          admin_response: string | null
          category: Database["public"]["Enums"]["problem_category"]
          created_at: string
          description: string
          id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_response?: string | null
          category: Database["public"]["Enums"]["problem_category"]
          created_at?: string
          description: string
          id?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_response?: string | null
          category?: Database["public"]["Enums"]["problem_category"]
          created_at?: string
          description?: string
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          ad_budget_ready: string | null
          admin_notes: string | null
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          lead_temp: Database["public"]["Enums"]["user_lead_temp"] | null
          phone: string | null
          social_link: string | null
          updated_at: string
        }
        Insert: {
          ad_budget_ready?: string | null
          admin_notes?: string | null
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          lead_temp?: Database["public"]["Enums"]["user_lead_temp"] | null
          phone?: string | null
          social_link?: string | null
          updated_at?: string
        }
        Update: {
          ad_budget_ready?: string | null
          admin_notes?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          lead_temp?: Database["public"]["Enums"]["user_lead_temp"] | null
          phone?: string | null
          social_link?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      rewards: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_available: boolean
          position: number
          title: string
          updated_at: string
          xp_cost: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_available?: boolean
          position?: number
          title: string
          updated_at?: string
          xp_cost?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_available?: boolean
          position?: number
          title?: string
          updated_at?: string
          xp_cost?: number
        }
        Relationships: []
      }
      service_requests: {
        Row: {
          admin_notes: string | null
          created_at: string
          email: string
          id: string
          message: string | null
          name: string
          phone: string | null
          service_type: string
          status: Database["public"]["Enums"]["service_request_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          email: string
          id?: string
          message?: string | null
          name: string
          phone?: string | null
          service_type: string
          status?: Database["public"]["Enums"]["service_request_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          email?: string
          id?: string
          message?: string | null
          name?: string
          phone?: string | null
          service_type?: string
          status?: Database["public"]["Enums"]["service_request_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      survey_responses: {
        Row: {
          acquisition_plan:
            | Database["public"]["Enums"]["acquisition_plan_type"]
            | null
          biggest_problem: string | null
          created_at: string
          goal_90_days: string | null
          has_landing_page: boolean | null
          has_offer: boolean | null
          has_product_idea: boolean | null
          id: string
          product_idea_details: string | null
          readiness_percent: number
          readiness_score: number
          updated_at: string
          user_id: string
          weekly_hours: number | null
        }
        Insert: {
          acquisition_plan?:
            | Database["public"]["Enums"]["acquisition_plan_type"]
            | null
          biggest_problem?: string | null
          created_at?: string
          goal_90_days?: string | null
          has_landing_page?: boolean | null
          has_offer?: boolean | null
          has_product_idea?: boolean | null
          id?: string
          product_idea_details?: string | null
          readiness_percent?: number
          readiness_score?: number
          updated_at?: string
          user_id: string
          weekly_hours?: number | null
        }
        Update: {
          acquisition_plan?:
            | Database["public"]["Enums"]["acquisition_plan_type"]
            | null
          biggest_problem?: string | null
          created_at?: string
          goal_90_days?: string | null
          has_landing_page?: boolean | null
          has_offer?: boolean | null
          has_product_idea?: boolean | null
          id?: string
          product_idea_details?: string | null
          readiness_percent?: number
          readiness_score?: number
          updated_at?: string
          user_id?: string
          weekly_hours?: number | null
        }
        Relationships: []
      }
      task_submissions: {
        Row: {
          admin_feedback: string | null
          attachment_url: string | null
          content: string
          created_at: string
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["submission_status"]
          task_id: string
          user_id: string
        }
        Insert: {
          admin_feedback?: string | null
          attachment_url?: string | null
          content: string
          created_at?: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["submission_status"]
          task_id: string
          user_id: string
        }
        Update: {
          admin_feedback?: string | null
          attachment_url?: string | null
          content?: string
          created_at?: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["submission_status"]
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_submissions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "lesson_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      user_ai_credits: {
        Row: {
          bonus_credits: number
          bonus_expires_at: string | null
          created_at: string
          id: string
          monthly_credits: number
          purchased_credits: number
          reset_at: string
          updated_at: string
          used_monthly_credits: number
          user_id: string
        }
        Insert: {
          bonus_credits?: number
          bonus_expires_at?: string | null
          created_at?: string
          id?: string
          monthly_credits?: number
          purchased_credits?: number
          reset_at?: string
          updated_at?: string
          used_monthly_credits?: number
          user_id: string
        }
        Update: {
          bonus_credits?: number
          bonus_expires_at?: string | null
          created_at?: string
          id?: string
          monthly_credits?: number
          purchased_credits?: number
          reset_at?: string
          updated_at?: string
          used_monthly_credits?: number
          user_id?: string
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_challenges: {
        Row: {
          challenge_id: string
          claimed: boolean
          claimed_at: string | null
          completed_at: string | null
          created_at: string
          id: string
          progress: number
          user_id: string
        }
        Insert: {
          challenge_id: string
          claimed?: boolean
          claimed_at?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          progress?: number
          user_id: string
        }
        Update: {
          challenge_id?: string
          claimed?: boolean
          claimed_at?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          progress?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_challenges_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_course_enrollments: {
        Row: {
          course_id: string
          enrolled_at: string
          id: string
          user_id: string
        }
        Insert: {
          course_id: string
          enrolled_at?: string
          id?: string
          user_id: string
        }
        Update: {
          course_id?: string
          enrolled_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_course_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_lesson_progress: {
        Row: {
          id: string
          lesson_id: string
          user_id: string
          watched_at: string
        }
        Insert: {
          id?: string
          lesson_id: string
          user_id: string
          watched_at?: string
        }
        Update: {
          id?: string
          lesson_id?: string
          user_id?: string
          watched_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      user_products: {
        Row: {
          created_at: string
          description: string | null
          id: string
          link: string | null
          name: string
          price_pln: number | null
          status: Database["public"]["Enums"]["product_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          link?: string | null
          name: string
          price_pln?: number | null
          status?: Database["public"]["Enums"]["product_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          link?: string | null
          name?: string
          price_pln?: number | null
          status?: Database["public"]["Enums"]["product_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_redeemed_codes: {
        Row: {
          code_id: string
          id: string
          redeemed_at: string
          user_id: string
        }
        Insert: {
          code_id: string
          id?: string
          redeemed_at?: string
          user_id: string
        }
        Update: {
          code_id?: string
          id?: string
          redeemed_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_rewards: {
        Row: {
          claimed_at: string
          id: string
          reward_id: string
          status: string
          user_id: string
          xp_spent: number
        }
        Insert: {
          claimed_at?: string
          id?: string
          reward_id: string
          status?: string
          user_id: string
          xp_spent: number
        }
        Update: {
          claimed_at?: string
          id?: string
          reward_id?: string
          status?: string
          user_id?: string
          xp_spent?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_rewards_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_streaks: {
        Row: {
          current_streak: number
          last_activity_date: string | null
          longest_streak: number
          multiplier: number
          updated_at: string
          user_id: string
        }
        Insert: {
          current_streak?: number
          last_activity_date?: string | null
          longest_streak?: number
          multiplier?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          current_streak?: number
          last_activity_date?: string | null
          longest_streak?: number
          multiplier?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          cancelled_at: string | null
          created_at: string
          current_period_end: string
          current_period_start: string
          free_month_used: boolean
          id: string
          paused_until: string | null
          plan: Database["public"]["Enums"]["subscription_plan"]
          status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          cancelled_at?: string | null
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          free_month_used?: boolean
          id?: string
          paused_until?: string | null
          plan?: Database["public"]["Enums"]["subscription_plan"]
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          cancelled_at?: string | null
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          free_month_used?: boolean
          id?: string
          paused_until?: string | null
          plan?: Database["public"]["Enums"]["subscription_plan"]
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_xp_log: {
        Row: {
          amount: number
          created_at: string
          id: string
          reason: string
          related_lesson_id: string | null
          related_task_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          reason: string
          related_lesson_id?: string | null
          related_task_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          reason?: string
          related_lesson_id?: string | null
          related_task_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_xp_log_related_lesson_id_fkey"
            columns: ["related_lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_xp_log_related_task_id_fkey"
            columns: ["related_task_id"]
            isOneToOne: false
            referencedRelation: "lesson_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_credits: {
        Args: {
          _amount: number
          _bonus_validity_days?: number
          _description: string
          _type: Database["public"]["Enums"]["ai_credit_tx_type"]
          _user_id: string
        }
        Returns: undefined
      }
      award_badge: {
        Args: { _badge_code: string; _user_id: string }
        Returns: undefined
      }
      award_xp: {
        Args: {
          _amount: number
          _lesson_id?: string
          _reason: string
          _task_id?: string
          _user_id: string
        }
        Returns: undefined
      }
      bump_duels: {
        Args: {
          _delta: number
          _metric: Database["public"]["Enums"]["duel_metric"]
          _user_id: string
        }
        Returns: undefined
      }
      bump_user_challenges: {
        Args: {
          _delta: number
          _metric: Database["public"]["Enums"]["challenge_metric"]
          _user_id: string
        }
        Returns: undefined
      }
      consume_credits: {
        Args: {
          _amount: number
          _description: string
          _generation_id?: string
          _user_id: string
        }
        Returns: boolean
      }
      ensure_user_credits: { Args: { _user_id: string }; Returns: undefined }
      get_available_credits: { Args: { _user_id: string }; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      lesson_unlocks_at: {
        Args: { _lesson_id: string; _user_id: string }
        Returns: string
      }
      plan_monthly_credits: {
        Args: { _plan: Database["public"]["Enums"]["subscription_plan"] }
        Returns: number
      }
      redeem_credit_code: {
        Args: { _code: string; _user_id: string }
        Returns: Json
      }
      update_streak: { Args: { _user_id: string }; Returns: undefined }
    }
    Enums: {
      acquisition_plan_type: "paid_ads" | "organic_social" | "unsure"
      advisor_type: "technical" | "marketing"
      ai_credit_tx_type:
        | "monthly"
        | "purchase"
        | "usage"
        | "bonus"
        | "refund"
        | "expired"
      ai_generator_status: "active" | "inactive"
      ai_quality_mode: "fast" | "pro" | "premium"
      app_role: "admin" | "user"
      badge_rarity: "common" | "rare" | "epic" | "legendary"
      call_status: "scheduled" | "completed" | "skipped"
      challenge_metric:
        | "lessons_watched"
        | "tasks_approved"
        | "mentor_tasks_done"
        | "xp_earned"
        | "posts_created"
        | "comments_created"
        | "login_days"
      challenge_type: "daily" | "weekly" | "sprint" | "community"
      duel_metric: "tasks_approved" | "lessons_watched" | "xp_earned"
      duel_status: "pending" | "active" | "completed" | "declined" | "expired"
      mentor_task_status:
        | "assigned"
        | "submitted"
        | "approved"
        | "rejected"
        | "needs_revision"
      notification_type:
        | "task_approved"
        | "task_rejected"
        | "task_revision"
        | "lesson_unlocked"
        | "course_unlocked"
        | "xp_awarded"
        | "reminder"
        | "advisor_reply"
        | "system"
      problem_category:
        | "offer"
        | "website"
        | "sales"
        | "ads"
        | "technical"
        | "other"
      product_status: "idea" | "building" | "active" | "paused"
      service_request_status: "new" | "contacted" | "sold" | "rejected"
      submission_status: "pending" | "approved" | "rejected" | "needs_revision"
      subscription_plan: "start" | "pro" | "vip"
      subscription_status:
        | "active"
        | "paused"
        | "cancelled"
        | "past_due"
        | "trialing"
      user_lead_temp: "cold" | "warm" | "hot"
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
      acquisition_plan_type: ["paid_ads", "organic_social", "unsure"],
      advisor_type: ["technical", "marketing"],
      ai_credit_tx_type: [
        "monthly",
        "purchase",
        "usage",
        "bonus",
        "refund",
        "expired",
      ],
      ai_generator_status: ["active", "inactive"],
      ai_quality_mode: ["fast", "pro", "premium"],
      app_role: ["admin", "user"],
      badge_rarity: ["common", "rare", "epic", "legendary"],
      call_status: ["scheduled", "completed", "skipped"],
      challenge_metric: [
        "lessons_watched",
        "tasks_approved",
        "mentor_tasks_done",
        "xp_earned",
        "posts_created",
        "comments_created",
        "login_days",
      ],
      challenge_type: ["daily", "weekly", "sprint", "community"],
      duel_metric: ["tasks_approved", "lessons_watched", "xp_earned"],
      duel_status: ["pending", "active", "completed", "declined", "expired"],
      mentor_task_status: [
        "assigned",
        "submitted",
        "approved",
        "rejected",
        "needs_revision",
      ],
      notification_type: [
        "task_approved",
        "task_rejected",
        "task_revision",
        "lesson_unlocked",
        "course_unlocked",
        "xp_awarded",
        "reminder",
        "advisor_reply",
        "system",
      ],
      problem_category: [
        "offer",
        "website",
        "sales",
        "ads",
        "technical",
        "other",
      ],
      product_status: ["idea", "building", "active", "paused"],
      service_request_status: ["new", "contacted", "sold", "rejected"],
      submission_status: ["pending", "approved", "rejected", "needs_revision"],
      subscription_plan: ["start", "pro", "vip"],
      subscription_status: [
        "active",
        "paused",
        "cancelled",
        "past_due",
        "trialing",
      ],
      user_lead_temp: ["cold", "warm", "hot"],
    },
  },
} as const
