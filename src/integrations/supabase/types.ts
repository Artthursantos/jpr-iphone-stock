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
      documents: {
        Row: {
          content: string | null
          embedding: string | null
          fts: unknown
          id: number
          metadata: Json | null
        }
        Insert: {
          content?: string | null
          embedding?: string | null
          fts?: unknown
          id?: never
          metadata?: Json | null
        }
        Update: {
          content?: string | null
          embedding?: string | null
          fts?: unknown
          id?: never
          metadata?: Json | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          armazenamento_desejado: string | null
          armazenamento_entrada: string | null
          created_at: string | null
          id: number
          interesse: string | null
          kommo_lead_id: string | null
          modelo_desejado: string
          modelo_entrada: string | null
          nome: string
          orcamento: number | null
          origem: string | null
          responsavel: string | null
          status: string | null
          temperatura: string | null
          tipo: string
          updated_at: string | null
          urgencia: string | null
        }
        Insert: {
          armazenamento_desejado?: string | null
          armazenamento_entrada?: string | null
          created_at?: string | null
          id?: never
          interesse?: string | null
          kommo_lead_id?: string | null
          modelo_desejado: string
          modelo_entrada?: string | null
          nome: string
          orcamento?: number | null
          origem?: string | null
          responsavel?: string | null
          status?: string | null
          temperatura?: string | null
          tipo?: string
          updated_at?: string | null
          urgencia?: string | null
        }
        Update: {
          armazenamento_desejado?: string | null
          armazenamento_entrada?: string | null
          created_at?: string | null
          id?: never
          interesse?: string | null
          kommo_lead_id?: string | null
          modelo_desejado?: string
          modelo_entrada?: string | null
          nome?: string
          orcamento?: number | null
          origem?: string | null
          responsavel?: string | null
          status?: string | null
          temperatura?: string | null
          tipo?: string
          updated_at?: string | null
          urgencia?: string | null
        }
        Relationships: []
      }
      presets: {
        Row: {
          id: string
          name: string
          config: Json
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          config: Json
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          config?: Json
          created_at?: string
        }
        Relationships: []
      }
      produtos: {
        Row: {
          armazenamento: string | null
          atualized_at: string | null
          cores: string | null
          created_at: string
          custo: string | null
          economia: string | null
          fora_do_club: string | null
          id: number
          novo_seminovo: string | null
          parcelado12: string | null
          preco: string | null
          produto: string | null
          revendedor: string | null
          sku: string | null
          total: string | null
        }
        Insert: {
          armazenamento?: string | null
          atualized_at?: string | null
          cores?: string | null
          created_at?: string
          custo?: string | null
          economia?: string | null
          fora_do_club?: string | null
          id?: number
          novo_seminovo?: string | null
          parcelado12?: string | null
          preco?: string | null
          produto?: string | null
          revendedor?: string | null
          sku?: string | null
          total?: string | null
        }
        Update: {
          armazenamento?: string | null
          atualized_at?: string | null
          cores?: string | null
          created_at?: string
          custo?: string | null
          economia?: string | null
          fora_do_club?: string | null
          id?: number
          novo_seminovo?: string | null
          parcelado12?: string | null
          preco?: string | null
          produto?: string | null
          revendedor?: string | null
          sku?: string | null
          total?: string | null
        }
        Relationships: []
      }
      produtos_backup: {
        Row: {
          armazenamento: string | null
          atualized_at: string | null
          cores: string | null
          created_at: string
          id: number
          novo_seminovo: string | null
          preco: string | null
          produto: string | null
          revendedor: string | null
          sku: string | null
        }
        Insert: {
          armazenamento?: string | null
          atualized_at?: string | null
          cores?: string | null
          created_at?: string
          id?: number
          novo_seminovo?: string | null
          preco?: string | null
          produto?: string | null
          revendedor?: string | null
          sku?: string | null
        }
        Update: {
          armazenamento?: string | null
          atualized_at?: string | null
          cores?: string | null
          created_at?: string
          id?: number
          novo_seminovo?: string | null
          preco?: string | null
          produto?: string | null
          revendedor?: string | null
          sku?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      hybrid_search: {
        Args: {
          full_text_weight?: number
          match_count: number
          query_embedding: string
          query_text: string
          rrf_k?: number
          semantic_weight?: number
        }
        Returns: {
          content: string
          id: number
          rank: number
          score: number
        }[]
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
