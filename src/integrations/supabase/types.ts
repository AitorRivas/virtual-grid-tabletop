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
      characters: {
        Row: {
          alignment: string | null
          armor_class: number
          background: string | null
          charisma: number
          class: string
          constitution: number
          created_at: string
          dexterity: number
          hit_points_current: number | null
          hit_points_max: number
          id: string
          initiative_bonus: number
          intelligence: number
          level: number
          name: string
          notes: string | null
          race: string
          speed: number
          strength: number
          token_color: Database["public"]["Enums"]["token_color"]
          token_size: number
          updated_at: string
          user_id: string
          wisdom: number
        }
        Insert: {
          alignment?: string | null
          armor_class?: number
          background?: string | null
          charisma?: number
          class?: string
          constitution?: number
          created_at?: string
          dexterity?: number
          hit_points_current?: number | null
          hit_points_max?: number
          id?: string
          initiative_bonus?: number
          intelligence?: number
          level?: number
          name: string
          notes?: string | null
          race?: string
          speed?: number
          strength?: number
          token_color?: Database["public"]["Enums"]["token_color"]
          token_size?: number
          updated_at?: string
          user_id: string
          wisdom?: number
        }
        Update: {
          alignment?: string | null
          armor_class?: number
          background?: string | null
          charisma?: number
          class?: string
          constitution?: number
          created_at?: string
          dexterity?: number
          hit_points_current?: number | null
          hit_points_max?: number
          id?: string
          initiative_bonus?: number
          intelligence?: number
          level?: number
          name?: string
          notes?: string | null
          race?: string
          speed?: number
          strength?: number
          token_color?: Database["public"]["Enums"]["token_color"]
          token_size?: number
          updated_at?: string
          user_id?: string
          wisdom?: number
        }
        Relationships: []
      }
      monsters: {
        Row: {
          armor_class: number
          challenge_rating: string
          charisma: number
          constitution: number
          created_at: string
          dexterity: number
          hit_points: number
          id: string
          intelligence: number
          name: string
          notes: string | null
          size: Database["public"]["Enums"]["creature_size"]
          speed: number
          strength: number
          token_color: Database["public"]["Enums"]["token_color"]
          token_size: number
          type: string
          updated_at: string
          user_id: string
          wisdom: number
        }
        Insert: {
          armor_class?: number
          challenge_rating?: string
          charisma?: number
          constitution?: number
          created_at?: string
          dexterity?: number
          hit_points?: number
          id?: string
          intelligence?: number
          name: string
          notes?: string | null
          size?: Database["public"]["Enums"]["creature_size"]
          speed?: number
          strength?: number
          token_color?: Database["public"]["Enums"]["token_color"]
          token_size?: number
          type?: string
          updated_at?: string
          user_id: string
          wisdom?: number
        }
        Update: {
          armor_class?: number
          challenge_rating?: string
          charisma?: number
          constitution?: number
          created_at?: string
          dexterity?: number
          hit_points?: number
          id?: string
          intelligence?: number
          name?: string
          notes?: string | null
          size?: Database["public"]["Enums"]["creature_size"]
          speed?: number
          strength?: number
          token_color?: Database["public"]["Enums"]["token_color"]
          token_size?: number
          type?: string
          updated_at?: string
          user_id?: string
          wisdom?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      creature_size:
        | "tiny"
        | "small"
        | "medium"
        | "large"
        | "huge"
        | "gargantuan"
      token_color:
        | "red"
        | "blue"
        | "green"
        | "yellow"
        | "purple"
        | "orange"
        | "pink"
        | "cyan"
        | "black"
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
      creature_size: ["tiny", "small", "medium", "large", "huge", "gargantuan"],
      token_color: [
        "red",
        "blue",
        "green",
        "yellow",
        "purple",
        "orange",
        "pink",
        "cyan",
        "black",
      ],
    },
  },
} as const
