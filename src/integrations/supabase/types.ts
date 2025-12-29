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
      clientes: {
        Row: {
          cpf: string | null
          created_at: string
          email: string | null
          id: string
          nome: string
          whatsapp: string | null
        }
        Insert: {
          cpf?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nome: string
          whatsapp?: string | null
        }
        Update: {
          cpf?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nome?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      configuracoes: {
        Row: {
          chave: string
          id: string
          valor: Json | null
        }
        Insert: {
          chave: string
          id?: string
          valor?: Json | null
        }
        Update: {
          chave?: string
          id?: string
          valor?: Json | null
        }
        Relationships: []
      }
      cupons: {
        Row: {
          ativo: boolean | null
          codigo: string
          created_at: string
          id: string
          tipo: string
          uso_atual: number | null
          uso_maximo: number | null
          validade: string | null
          valor: number
          valor_minimo: number | null
        }
        Insert: {
          ativo?: boolean | null
          codigo: string
          created_at?: string
          id?: string
          tipo: string
          uso_atual?: number | null
          uso_maximo?: number | null
          validade?: string | null
          valor: number
          valor_minimo?: number | null
        }
        Update: {
          ativo?: boolean | null
          codigo?: string
          created_at?: string
          id?: string
          tipo?: string
          uso_atual?: number | null
          uso_maximo?: number | null
          validade?: string | null
          valor?: number
          valor_minimo?: number | null
        }
        Relationships: []
      }
      depoimentos: {
        Row: {
          aprovado: boolean | null
          cliente_nome: string
          created_at: string
          id: string
          nota: number
          resposta_admin: string | null
          texto: string
        }
        Insert: {
          aprovado?: boolean | null
          cliente_nome: string
          created_at?: string
          id?: string
          nota: number
          resposta_admin?: string | null
          texto: string
        }
        Update: {
          aprovado?: boolean | null
          cliente_nome?: string
          created_at?: string
          id?: string
          nota?: number
          resposta_admin?: string | null
          texto?: string
        }
        Relationships: []
      }
      mensagens: {
        Row: {
          assunto: string
          created_at: string
          email: string
          id: string
          lida: boolean | null
          mensagem: string
          nome: string
        }
        Insert: {
          assunto: string
          created_at?: string
          email: string
          id?: string
          lida?: boolean | null
          mensagem: string
          nome: string
        }
        Update: {
          assunto?: string
          created_at?: string
          email?: string
          id?: string
          lida?: boolean | null
          mensagem?: string
          nome?: string
        }
        Relationships: []
      }
      pedidos: {
        Row: {
          cliente_cpf: string | null
          cliente_email: string | null
          cliente_nome: string
          cliente_whatsapp: string | null
          created_at: string
          endereco: Json | null
          frete: number
          id: string
          itens: Json
          numero_pedido: string
          status: string
          subtotal: number
          total: number
        }
        Insert: {
          cliente_cpf?: string | null
          cliente_email?: string | null
          cliente_nome: string
          cliente_whatsapp?: string | null
          created_at?: string
          endereco?: Json | null
          frete?: number
          id?: string
          itens: Json
          numero_pedido: string
          status?: string
          subtotal: number
          total: number
        }
        Update: {
          cliente_cpf?: string | null
          cliente_email?: string | null
          cliente_nome?: string
          cliente_whatsapp?: string | null
          created_at?: string
          endereco?: Json | null
          frete?: number
          id?: string
          itens?: Json
          numero_pedido?: string
          status?: string
          subtotal?: number
          total?: number
        }
        Relationships: []
      }
      produtos: {
        Row: {
          categoria: string
          created_at: string
          descricao: string | null
          destaque: boolean | null
          estoque: number | null
          id: string
          imagem_url: string | null
          nome: string
          preco: number
          preco_promocional: number | null
          variacoes: Json | null
        }
        Insert: {
          categoria: string
          created_at?: string
          descricao?: string | null
          destaque?: boolean | null
          estoque?: number | null
          id?: string
          imagem_url?: string | null
          nome: string
          preco: number
          preco_promocional?: number | null
          variacoes?: Json | null
        }
        Update: {
          categoria?: string
          created_at?: string
          descricao?: string | null
          destaque?: boolean | null
          estoque?: number | null
          id?: string
          imagem_url?: string | null
          nome?: string
          preco?: number
          preco_promocional?: number | null
          variacoes?: Json | null
        }
        Relationships: []
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
