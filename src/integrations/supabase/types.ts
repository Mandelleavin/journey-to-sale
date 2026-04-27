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
      courses: {
        Row: {
          cover_url: string | null
          created_at: string
          description: string | null
          id: string
          is_published: boolean
          position: number
          required_xp: number
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
          title?: string
          updated_at?: string
        }
        Relationships: []
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
      lessons: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          due_in_days: number | null
          id: string
          is_published: boolean
          position: number
          title: string
          unlock_after_hours: number
          updated_at: string
          video_url: string | null
          xp_reward: number
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          due_in_days?: number | null
          id?: string
          is_published?: boolean
          position?: number
          title: string
          unlock_after_hours?: number
          updated_at?: string
          video_url?: string | null
          xp_reward?: number
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          due_in_days?: number | null
          id?: string
          is_published?: boolean
          position?: number
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
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      acquisition_plan_type: "paid_ads" | "organic_social" | "unsure"
      advisor_type: "technical" | "marketing"
      app_role: "admin" | "user"
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
      submission_status: "pending" | "approved" | "rejected" | "needs_revision"
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
      app_role: ["admin", "user"],
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
      submission_status: ["pending", "approved", "rejected", "needs_revision"],
    },
  },
} as const
