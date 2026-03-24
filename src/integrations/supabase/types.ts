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
      admin_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      ads: {
        Row: {
          created_at: string
          cta_text: string | null
          cta_url: string | null
          description: string
          duration: number | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          cta_text?: string | null
          cta_url?: string | null
          description: string
          duration?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          cta_text?: string | null
          cta_url?: string | null
          description?: string
          duration?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      channels: {
        Row: {
          category: string
          created_at: string
          embed_url: string | null
          id: string
          is_live: boolean | null
          logo: string | null
          name: string
          stream_urls: string[]
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          embed_url?: string | null
          id?: string
          is_live?: boolean | null
          logo?: string | null
          name: string
          stream_urls: string[]
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          embed_url?: string | null
          id?: string
          is_live?: boolean | null
          logo?: string | null
          name?: string
          stream_urls?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      course_lessons: {
        Row: {
          created_at: string
          description: string | null
          duration_minutes: number | null
          embed_url: string | null
          id: string
          module_id: string
          order_index: number
          stream_urls: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          embed_url?: string | null
          id?: string
          module_id: string
          order_index?: number
          stream_urls?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          embed_url?: string | null
          id?: string
          module_id?: string
          order_index?: number
          stream_urls?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      course_modules: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          id: string
          order_index: number
          title: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          id?: string
          order_index?: number
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          id?: string
          order_index?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      hero_bg_videos: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          label: string | null
          updated_at: string | null
          youtube_url: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          label?: string | null
          updated_at?: string | null
          youtube_url: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          label?: string | null
          updated_at?: string | null
          youtube_url?: string
        }
        Relationships: []
      }
      premium_content: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          embed_url: string | null
          id: string
          is_active: boolean | null
          stream_urls: string[]
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          embed_url?: string | null
          id?: string
          is_active?: boolean | null
          stream_urls?: string[]
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          embed_url?: string | null
          id?: string
          is_active?: boolean | null
          stream_urls?: string[]
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_lesson_progress: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string
          id: string
          lesson_id: string
          updated_at: string
          user_id: string
          watched_seconds: number | null
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          id?: string
          lesson_id: string
          updated_at?: string
          user_id: string
          watched_seconds?: number | null
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          id?: string
          lesson_id?: string
          updated_at?: string
          user_id?: string
          watched_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
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
      user_watch_progress: {
        Row: {
          content_cover_url: string | null
          content_id: string
          content_name: string
          content_type: string
          created_at: string
          current_time_secs: number
          duration_secs: number
          finished: boolean
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content_cover_url?: string | null
          content_id: string
          content_name?: string
          content_type: string
          created_at?: string
          current_time_secs?: number
          duration_secs?: number
          finished?: boolean
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content_cover_url?: string | null
          content_id?: string
          content_name?: string
          content_type?: string
          created_at?: string
          current_time_secs?: number
          duration_secs?: number
          finished?: boolean
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      vod_episodes: {
        Row: {
          cover_url: string | null
          created_at: string
          duration_secs: number | null
          episode_num: number
          id: string
          season: number
          series_id: string
          stream_url: string
          title: string
          updated_at: string
          xtream_id: number
        }
        Insert: {
          cover_url?: string | null
          created_at?: string
          duration_secs?: number | null
          episode_num?: number
          id?: string
          season?: number
          series_id: string
          stream_url: string
          title: string
          updated_at?: string
          xtream_id: number
        }
        Update: {
          cover_url?: string | null
          created_at?: string
          duration_secs?: number | null
          episode_num?: number
          id?: string
          season?: number
          series_id?: string
          stream_url?: string
          title?: string
          updated_at?: string
          xtream_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "vod_episodes_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "vod_series"
            referencedColumns: ["id"]
          },
        ]
      }
      vod_movies: {
        Row: {
          backdrop_url: string | null
          category: string
          category_tag: string | null
          cover_url: string | null
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          rating: number | null
          stream_url: string
          tmdb_id: number | null
          trailer_mp4_url: string | null
          trailer_url: string | null
          updated_at: string
          xtream_id: number
        }
        Insert: {
          backdrop_url?: string | null
          category?: string
          category_tag?: string | null
          cover_url?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          rating?: number | null
          stream_url: string
          tmdb_id?: number | null
          trailer_mp4_url?: string | null
          trailer_url?: string | null
          updated_at?: string
          xtream_id: number
        }
        Update: {
          backdrop_url?: string | null
          category?: string
          category_tag?: string | null
          cover_url?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          rating?: number | null
          stream_url?: string
          tmdb_id?: number | null
          trailer_mp4_url?: string | null
          trailer_url?: string | null
          updated_at?: string
          xtream_id?: number
        }
        Relationships: []
      }
      vod_series: {
        Row: {
          backdrop_url: string | null
          category: string
          category_tag: string | null
          cover_url: string | null
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          plot: string | null
          rating: number | null
          tmdb_id: number | null
          trailer_mp4_url: string | null
          trailer_url: string | null
          updated_at: string
          xtream_id: number
        }
        Insert: {
          backdrop_url?: string | null
          category?: string
          category_tag?: string | null
          cover_url?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          plot?: string | null
          rating?: number | null
          tmdb_id?: number | null
          trailer_mp4_url?: string | null
          trailer_url?: string | null
          updated_at?: string
          xtream_id: number
        }
        Update: {
          backdrop_url?: string | null
          category?: string
          category_tag?: string | null
          cover_url?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          plot?: string | null
          rating?: number | null
          tmdb_id?: number | null
          trailer_mp4_url?: string | null
          trailer_url?: string | null
          updated_at?: string
          xtream_id?: number
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
      search_vod_movies: {
        Args: { search_term: string }
        Returns: {
          backdrop_url: string | null
          category: string
          category_tag: string | null
          cover_url: string | null
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          rating: number | null
          stream_url: string
          tmdb_id: number | null
          trailer_mp4_url: string | null
          trailer_url: string | null
          updated_at: string
          xtream_id: number
        }[]
        SetofOptions: {
          from: "*"
          to: "vod_movies"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      search_vod_movies_public: {
        Args: { cat?: string; search_term: string }
        Returns: {
          backdrop_url: string | null
          category: string
          category_tag: string | null
          cover_url: string | null
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          rating: number | null
          stream_url: string
          tmdb_id: number | null
          trailer_mp4_url: string | null
          trailer_url: string | null
          updated_at: string
          xtream_id: number
        }[]
        SetofOptions: {
          from: "*"
          to: "vod_movies"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      search_vod_series: {
        Args: { search_term: string }
        Returns: {
          backdrop_url: string | null
          category: string
          category_tag: string | null
          cover_url: string | null
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          plot: string | null
          rating: number | null
          tmdb_id: number | null
          trailer_mp4_url: string | null
          trailer_url: string | null
          updated_at: string
          xtream_id: number
        }[]
        SetofOptions: {
          from: "*"
          to: "vod_series"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      search_vod_series_public: {
        Args: { cat?: string; search_term: string }
        Returns: {
          backdrop_url: string | null
          category: string
          category_tag: string | null
          cover_url: string | null
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          plot: string | null
          rating: number | null
          tmdb_id: number | null
          trailer_mp4_url: string | null
          trailer_url: string | null
          updated_at: string
          xtream_id: number
        }[]
        SetofOptions: {
          from: "*"
          to: "vod_series"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      unaccent: { Args: { "": string }; Returns: string }
    }
    Enums: {
      app_role: "admin" | "user"
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
    },
  },
} as const
