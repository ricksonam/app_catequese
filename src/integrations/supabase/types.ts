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
      atividades: {
        Row: {
          conducao: string | null
          criado_em: string
          data: string
          descricao: string
          horario: string
          id: string
          local: string
          modalidade: string
          nome: string
          observacao: string
          presencas: Json
          tipo: string
          turma_id: string
          user_id: string
        }
        Insert: {
          conducao?: string | null
          criado_em?: string
          data?: string
          descricao?: string
          horario?: string
          id?: string
          local?: string
          modalidade?: string
          nome: string
          observacao?: string
          presencas?: Json
          tipo?: string
          turma_id: string
          user_id?: string
        }
        Update: {
          conducao?: string | null
          criado_em?: string
          data?: string
          descricao?: string
          horario?: string
          id?: string
          local?: string
          modalidade?: string
          nome?: string
          observacao?: string
          presencas?: Json
          tipo?: string
          turma_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "atividades_turma_id_fkey"
            columns: ["turma_id"]
            isOneToOne: false
            referencedRelation: "turmas"
            referencedColumns: ["id"]
          },
        ]
      }
      catequistas: {
        Row: {
          anos_experiencia: string
          comunidade_id: string | null
          data_nascimento: string
          email: string
          endereco: string
          formacao: string
          id: string
          nome: string
          observacao: string
          profissao: string
          telefone: string
          user_id: string
        }
        Insert: {
          anos_experiencia?: string
          comunidade_id?: string | null
          data_nascimento?: string
          email?: string
          endereco?: string
          formacao?: string
          id?: string
          nome: string
          observacao?: string
          profissao?: string
          telefone?: string
          user_id?: string
        }
        Update: {
          anos_experiencia?: string
          comunidade_id?: string | null
          data_nascimento?: string
          email?: string
          endereco?: string
          formacao?: string
          id?: string
          nome?: string
          observacao?: string
          profissao?: string
          telefone?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "catequistas_comunidade_id_fkey"
            columns: ["comunidade_id"]
            isOneToOne: false
            referencedRelation: "comunidades"
            referencedColumns: ["id"]
          },
        ]
      }
      catequizandos: {
        Row: {
          criado_em: string
          data_nascimento: string
          email: string
          endereco: string
          foto: string | null
          id: string
          necessidade_especial: string
          nome: string
          observacao: string
          responsavel: string
          sacramentos: Json | null
          status: string
          telefone: string
          turma_id: string
          user_id: string
        }
        Insert: {
          criado_em?: string
          data_nascimento?: string
          email?: string
          endereco?: string
          foto?: string | null
          id?: string
          necessidade_especial?: string
          nome: string
          observacao?: string
          responsavel?: string
          sacramentos?: Json | null
          status?: string
          telefone?: string
          turma_id: string
          user_id?: string
        }
        Update: {
          criado_em?: string
          data_nascimento?: string
          email?: string
          endereco?: string
          foto?: string | null
          id?: string
          necessidade_especial?: string
          nome?: string
          observacao?: string
          responsavel?: string
          sacramentos?: Json | null
          status?: string
          telefone?: string
          turma_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "catequizandos_turma_id_fkey"
            columns: ["turma_id"]
            isOneToOne: false
            referencedRelation: "turmas"
            referencedColumns: ["id"]
          },
        ]
      }
      comunidades: {
        Row: {
          endereco: string
          id: string
          nome: string
          observacao: string
          paroquia_id: string | null
          responsavel: string
          telefone: string
          tipo: string
          user_id: string
        }
        Insert: {
          endereco?: string
          id?: string
          nome: string
          observacao?: string
          paroquia_id?: string | null
          responsavel?: string
          telefone?: string
          tipo?: string
          user_id?: string
        }
        Update: {
          endereco?: string
          id?: string
          nome?: string
          observacao?: string
          paroquia_id?: string | null
          responsavel?: string
          telefone?: string
          tipo?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comunidades_paroquia_id_fkey"
            columns: ["paroquia_id"]
            isOneToOne: false
            referencedRelation: "paroquias"
            referencedColumns: ["id"]
          },
        ]
      }
      encontros: {
        Row: {
          criado_em: string
          data: string
          data_transferida: string | null
          id: string
          leitura_biblica: string
          material_apoio: string
          motivo_cancelamento: string | null
          presencas: Json
          roteiro: Json
          status: string
          tema: string
          turma_id: string
          user_id: string
        }
        Insert: {
          criado_em?: string
          data?: string
          data_transferida?: string | null
          id?: string
          leitura_biblica?: string
          material_apoio?: string
          motivo_cancelamento?: string | null
          presencas?: Json
          roteiro?: Json
          status?: string
          tema: string
          turma_id: string
          user_id?: string
        }
        Update: {
          criado_em?: string
          data?: string
          data_transferida?: string | null
          id?: string
          leitura_biblica?: string
          material_apoio?: string
          motivo_cancelamento?: string | null
          presencas?: Json
          roteiro?: Json
          status?: string
          tema?: string
          turma_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "encontros_turma_id_fkey"
            columns: ["turma_id"]
            isOneToOne: false
            referencedRelation: "turmas"
            referencedColumns: ["id"]
          },
        ]
      }
      ocorrencias: {
        Row: {
          data: string
          encontro_id: string
          id: string
          motivo: string
          tema_nome: string
          tipo: string
          turma_id: string
          user_id: string
        }
        Insert: {
          data?: string
          encontro_id: string
          id?: string
          motivo?: string
          tema_nome?: string
          tipo?: string
          turma_id: string
          user_id?: string
        }
        Update: {
          data?: string
          encontro_id?: string
          id?: string
          motivo?: string
          tema_nome?: string
          tipo?: string
          turma_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ocorrencias_encontro_id_fkey"
            columns: ["encontro_id"]
            isOneToOne: false
            referencedRelation: "encontros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ocorrencias_turma_id_fkey"
            columns: ["turma_id"]
            isOneToOne: false
            referencedRelation: "turmas"
            referencedColumns: ["id"]
          },
        ]
      }
      paroquias: {
        Row: {
          email: string
          endereco: string
          id: string
          nome: string
          observacao: string
          responsavel: string
          telefone: string
          tipo: string
          user_id: string
        }
        Insert: {
          email?: string
          endereco?: string
          id?: string
          nome: string
          observacao?: string
          responsavel?: string
          telefone?: string
          tipo?: string
          user_id?: string
        }
        Update: {
          email?: string
          endereco?: string
          id?: string
          nome?: string
          observacao?: string
          responsavel?: string
          telefone?: string
          tipo?: string
          user_id?: string
        }
        Relationships: []
      }
      turmas: {
        Row: {
          ano: string
          criado_em: string
          dia_catequese: string
          etapa: string
          horario: string
          id: string
          local: string
          nome: string
          outros_dados: string
          user_id: string
        }
        Insert: {
          ano?: string
          criado_em?: string
          dia_catequese?: string
          etapa?: string
          horario?: string
          id?: string
          local?: string
          nome: string
          outros_dados?: string
          user_id?: string
        }
        Update: {
          ano?: string
          criado_em?: string
          dia_catequese?: string
          etapa?: string
          horario?: string
          id?: string
          local?: string
          nome?: string
          outros_dados?: string
          user_id?: string
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
