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
      ai_reflections: {
        Row: {
          content: string
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["reflection_kind"]
          meta: Json
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          kind: Database["public"]["Enums"]["reflection_kind"]
          meta?: Json
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["reflection_kind"]
          meta?: Json
          user_id?: string
        }
        Relationships: []
      }
      connections: {
        Row: {
          created_at: string
          from_item_id: string
          id: string
          label: string | null
          to_item_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          from_item_id: string
          id?: string
          label?: string | null
          to_item_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          from_item_id?: string
          id?: string
          label?: string | null
          to_item_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "connections_from_item_id_fkey"
            columns: ["from_item_id"]
            isOneToOne: false
            referencedRelation: "vision_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connections_to_item_id_fkey"
            columns: ["to_item_id"]
            isOneToOne: false
            referencedRelation: "vision_items"
            referencedColumns: ["id"]
          },
        ]
      }
      layouts: {
        Row: {
          created_at: string
          filters: Json
          id: string
          mode: string
          name: string
          positions: Json
          section_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          filters?: Json
          id?: string
          mode?: string
          name: string
          positions?: Json
          section_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          filters?: Json
          id?: string
          mode?: string
          name?: string
          positions?: Json
          section_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "layouts_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          kind: string
          read: boolean
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: string
          read?: boolean
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: string
          read?: boolean
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
          timezone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          timezone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      sections: {
        Row: {
          archived: boolean
          color: string | null
          cover_url: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          last_visited_at: string | null
          name: string
          parent_id: string | null
          sort_order: number
          tags: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          archived?: boolean
          color?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          last_visited_at?: string | null
          name: string
          parent_id?: string | null
          sort_order?: number
          tags?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          archived?: boolean
          color?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          last_visited_at?: string | null
          name?: string
          parent_id?: string | null
          sort_order?: number
          tags?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sections_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
        ]
      }
      vision_items: {
        Row: {
          body: string | null
          caption: string | null
          color: string | null
          created_at: string
          deadline: string | null
          duration_seconds: number | null
          embed_url: string | null
          file_size: number | null
          group_id: string | null
          h: number
          id: string
          last_viewed_at: string | null
          locked: boolean
          media_path: string | null
          mime_type: string | null
          moods: string[]
          notes: string | null
          pinned: boolean
          priority: number
          progress: number
          rotation: number
          section_id: string | null
          status: Database["public"]["Enums"]["item_status"]
          tags: string[]
          target_year: number | null
          text_kind: Database["public"]["Enums"]["text_kind"] | null
          thumbnail_path: string | null
          title: string | null
          transcript: string | null
          type: Database["public"]["Enums"]["item_type"]
          updated_at: string
          user_id: string
          w: number
          x: number
          y: number
          z_index: number
        }
        Insert: {
          body?: string | null
          caption?: string | null
          color?: string | null
          created_at?: string
          deadline?: string | null
          duration_seconds?: number | null
          embed_url?: string | null
          file_size?: number | null
          group_id?: string | null
          h?: number
          id?: string
          last_viewed_at?: string | null
          locked?: boolean
          media_path?: string | null
          mime_type?: string | null
          moods?: string[]
          notes?: string | null
          pinned?: boolean
          priority?: number
          progress?: number
          rotation?: number
          section_id?: string | null
          status?: Database["public"]["Enums"]["item_status"]
          tags?: string[]
          target_year?: number | null
          text_kind?: Database["public"]["Enums"]["text_kind"] | null
          thumbnail_path?: string | null
          title?: string | null
          transcript?: string | null
          type: Database["public"]["Enums"]["item_type"]
          updated_at?: string
          user_id: string
          w?: number
          x?: number
          y?: number
          z_index?: number
        }
        Update: {
          body?: string | null
          caption?: string | null
          color?: string | null
          created_at?: string
          deadline?: string | null
          duration_seconds?: number | null
          embed_url?: string | null
          file_size?: number | null
          group_id?: string | null
          h?: number
          id?: string
          last_viewed_at?: string | null
          locked?: boolean
          media_path?: string | null
          mime_type?: string | null
          moods?: string[]
          notes?: string | null
          pinned?: boolean
          priority?: number
          progress?: number
          rotation?: number
          section_id?: string | null
          status?: Database["public"]["Enums"]["item_status"]
          tags?: string[]
          target_year?: number | null
          text_kind?: Database["public"]["Enums"]["text_kind"] | null
          thumbnail_path?: string | null
          title?: string | null
          transcript?: string | null
          type?: Database["public"]["Enums"]["item_type"]
          updated_at?: string
          user_id?: string
          w?: number
          x?: number
          y?: number
          z_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "vision_items_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      item_status: "idea" | "planned" | "in_progress" | "completed" | "archived"
      item_type: "image" | "video" | "audio" | "text" | "document"
      reflection_kind: "reflection" | "reminder" | "future_self" | "pattern"
      text_kind:
        | "note"
        | "goal"
        | "quote"
        | "journal"
        | "reflection"
        | "manifestation"
        | "idea"
        | "plan"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      item_status: ["idea", "planned", "in_progress", "completed", "archived"],
      item_type: ["image", "video", "audio", "text", "document"],
      reflection_kind: ["reflection", "reminder", "future_self", "pattern"],
      text_kind: [
        "note",
        "goal",
        "quote",
        "journal",
        "reflection",
        "manifestation",
        "idea",
        "plan",
      ],
    },
  },
} as const
