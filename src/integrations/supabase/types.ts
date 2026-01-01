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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      cigar_band_images: {
        Row: {
          cigar_id: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          image_url: string
          is_primary: boolean | null
        }
        Insert: {
          cigar_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          image_url: string
          is_primary?: boolean | null
        }
        Update: {
          cigar_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          image_url?: string
          is_primary?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "cigar_band_images_cigar_id_fkey"
            columns: ["cigar_id"]
            isOneToOne: false
            referencedRelation: "cigars"
            referencedColumns: ["id"]
          },
        ]
      }
      cigar_requests: {
        Row: {
          created_at: string
          details: string | null
          id: string
          requested_name: string
          status: Database["public"]["Enums"]["request_status"]
          user_id: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: string
          requested_name: string
          status?: Database["public"]["Enums"]["request_status"]
          user_id: string
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: string
          requested_name?: string
          status?: Database["public"]["Enums"]["request_status"]
          user_id?: string
        }
        Relationships: []
      }
      cigars: {
        Row: {
          binder: string | null
          brand: string
          created_at: string
          filler: string | null
          id: string
          image_url: string | null
          line: string
          origin: string | null
          size: string | null
          strength_profile: string | null
          vitola: string
          wrapper: string | null
        }
        Insert: {
          binder?: string | null
          brand: string
          created_at?: string
          filler?: string | null
          id?: string
          image_url?: string | null
          line: string
          origin?: string | null
          size?: string | null
          strength_profile?: string | null
          vitola: string
          wrapper?: string | null
        }
        Update: {
          binder?: string | null
          brand?: string
          created_at?: string
          filler?: string | null
          id?: string
          image_url?: string | null
          line?: string
          origin?: string | null
          size?: string | null
          strength_profile?: string | null
          vitola?: string
          wrapper?: string | null
        }
        Relationships: []
      }
      comments: {
        Row: {
          comment: string
          created_at: string
          id: string
          smoke_log_id: string
          user_id: string
        }
        Insert: {
          comment: string
          created_at?: string
          id?: string
          smoke_log_id: string
          user_id: string
        }
        Update: {
          comment?: string
          created_at?: string
          id?: string
          smoke_log_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_smoke_log_id_fkey"
            columns: ["smoke_log_id"]
            isOneToOne: false
            referencedRelation: "smoke_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      likes: {
        Row: {
          created_at: string
          id: string
          smoke_log_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          smoke_log_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          smoke_log_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_smoke_log_id_fkey"
            columns: ["smoke_log_id"]
            isOneToOne: false
            referencedRelation: "smoke_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          id: string
          reason: string
          reporter_user_id: string
          status: Database["public"]["Enums"]["report_status"]
          target_id: string
          target_type: Database["public"]["Enums"]["report_target_type"]
        }
        Insert: {
          created_at?: string
          id?: string
          reason: string
          reporter_user_id: string
          status?: Database["public"]["Enums"]["report_status"]
          target_id: string
          target_type: Database["public"]["Enums"]["report_target_type"]
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string
          reporter_user_id?: string
          status?: Database["public"]["Enums"]["report_status"]
          target_id?: string
          target_type?: Database["public"]["Enums"]["report_target_type"]
        }
        Relationships: []
      }
      smoke_logs: {
        Row: {
          burn: number
          cigar_id: string
          construction: number
          created_at: string
          flavor: number
          id: string
          notes: string
          overall_score: number | null
          photo_url: string | null
          smoked_at: string
          strength: number
          user_id: string
        }
        Insert: {
          burn: number
          cigar_id: string
          construction: number
          created_at?: string
          flavor: number
          id?: string
          notes: string
          overall_score?: number | null
          photo_url?: string | null
          smoked_at?: string
          strength: number
          user_id: string
        }
        Update: {
          burn?: number
          cigar_id?: string
          construction?: number
          created_at?: string
          flavor?: number
          id?: string
          notes?: string
          overall_score?: number | null
          photo_url?: string | null
          smoked_at?: string
          strength?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "smoke_logs_cigar_id_fkey"
            columns: ["cigar_id"]
            isOneToOne: false
            referencedRelation: "cigars"
            referencedColumns: ["id"]
          },
        ]
      }
      user_favorites: {
        Row: {
          cigar_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          cigar_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          cigar_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_favorites_cigar_id_fkey"
            columns: ["cigar_id"]
            isOneToOne: false
            referencedRelation: "cigars"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      report_status: "open" | "reviewing" | "resolved" | "dismissed"
      report_target_type: "log" | "cigar" | "user" | "comment"
      request_status: "pending" | "approved" | "rejected"
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
      app_role: ["admin", "user"],
      report_status: ["open", "reviewing", "resolved", "dismissed"],
      report_target_type: ["log", "cigar", "user", "comment"],
      request_status: ["pending", "approved", "rejected"],
    },
  },
} as const
