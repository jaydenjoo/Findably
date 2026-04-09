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
    PostgrestVersion: '14.1'
  }
  public: {
    Tables: {
      self_reports: {
        Row: {
          id: string
          user_id: string
          diagnosis_id: string
          rule_id: string
          reported_at: string
          recrawl_scheduled_at: string
          recrawl_completed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          diagnosis_id: string
          rule_id: string
          reported_at?: string
          recrawl_scheduled_at: string
          recrawl_completed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          diagnosis_id?: string
          rule_id?: string
          reported_at?: string
          recrawl_scheduled_at?: string
          recrawl_completed_at?: string | null
        }
        Relationships: []
      }
      nps_responses: {
        Row: {
          id: string
          user_id: string
          diagnosis_id: string
          score: number
          comment: string | null
          submitted_at: string
        }
        Insert: {
          id?: string
          user_id: string
          diagnosis_id: string
          score: number
          comment?: string | null
          submitted_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          diagnosis_id?: string
          score?: number
          comment?: string | null
          submitted_at?: string
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          id: string
          user_id: string | null
          event: string
          properties: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          event: string
          properties?: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          event?: string
          properties?: Json
          created_at?: string
        }
        Relationships: []
      }
      gift_codes: {
        Row: {
          id: string
          code: string
          description: string | null
          max_uses: number
          used_count: number
          expires_at: string | null
          is_active: boolean
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          code: string
          description?: string | null
          max_uses?: number
          used_count?: number
          expires_at?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          code?: string
          description?: string | null
          max_uses?: number
          used_count?: number
          expires_at?: string | null
          is_active?: boolean
          updated_at?: string | null
        }
        Relationships: []
      }
      gift_code_uses: {
        Row: {
          id: string
          gift_code_id: string
          user_id: string
          diagnosis_id: string | null
          used_at: string
        }
        Insert: {
          id?: string
          gift_code_id: string
          user_id: string
          diagnosis_id?: string | null
          used_at?: string
        }
        Update: {
          id?: string
          gift_code_id?: string
          user_id?: string
          diagnosis_id?: string | null
          used_at?: string
        }
        Relationships: []
      }
      diagnoses: {
        Row: {
          analysis_data: Json | null
          competitor_urls: string[] | null
          completed_at: string | null
          crawl_data: Json | null
          created_at: string
          grade: string | null
          id: string
          industry: string | null
          status: string
          target_keywords: string[] | null
          tier: string
          total_score: number | null
          updated_at: string
          url: string
          user_id: string
        }
        Insert: {
          analysis_data?: Json | null
          competitor_urls?: string[] | null
          completed_at?: string | null
          crawl_data?: Json | null
          created_at?: string
          grade?: string | null
          id?: string
          industry?: string | null
          status?: string
          target_keywords?: string[] | null
          tier?: string
          total_score?: number | null
          updated_at?: string
          url: string
          user_id: string
        }
        Update: {
          analysis_data?: Json | null
          competitor_urls?: string[] | null
          completed_at?: string | null
          crawl_data?: Json | null
          created_at?: string
          grade?: string | null
          id?: string
          industry?: string | null
          status?: string
          target_keywords?: string[] | null
          tier?: string
          total_score?: number | null
          updated_at?: string
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      diagnosis_items: {
        Row: {
          category: string
          description: string | null
          diagnosis_id: string
          id: string
          name: string
          priority: string | null
          raw_data: Json | null
          recommendation: string | null
          score: number
          status: string
        }
        Insert: {
          category: string
          description?: string | null
          diagnosis_id: string
          id?: string
          name: string
          priority?: string | null
          raw_data?: Json | null
          recommendation?: string | null
          score?: number
          status: string
        }
        Update: {
          category?: string
          description?: string | null
          diagnosis_id?: string
          id?: string
          name?: string
          priority?: string | null
          raw_data?: Json | null
          recommendation?: string | null
          score?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: 'diagnosis_items_diagnosis_id_fkey'
            columns: ['diagnosis_id']
            isOneToOne: false
            referencedRelation: 'diagnoses'
            referencedColumns: ['id']
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          diagnosis_id: string
          id: string
          paid_at: string | null
          status: string
          toss_order_id: string | null
          toss_payment_key: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          diagnosis_id: string
          id?: string
          paid_at?: string | null
          status?: string
          toss_order_id?: string | null
          toss_payment_key?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          diagnosis_id?: string
          id?: string
          paid_at?: string | null
          status?: string
          toss_order_id?: string | null
          toss_payment_key?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'payments_diagnosis_id_fkey'
            columns: ['diagnosis_id']
            isOneToOne: false
            referencedRelation: 'diagnoses'
            referencedColumns: ['id']
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          industry: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
          industry?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          industry?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          dashboard_data: Json | null
          diagnosis_id: string
          id: string
          pdf_url: string | null
          tier: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dashboard_data?: Json | null
          diagnosis_id: string
          id?: string
          pdf_url?: string | null
          tier: string
          user_id: string
        }
        Update: {
          created_at?: string
          dashboard_data?: Json | null
          diagnosis_id?: string
          id?: string
          pdf_url?: string | null
          tier?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'reports_diagnosis_id_fkey'
            columns: ['diagnosis_id']
            isOneToOne: false
            referencedRelation: 'diagnoses'
            referencedColumns: ['id']
          },
        ]
      }
      findably_maintenance_notices: {
        Row: {
          id: number
          is_active: boolean
          title: string
          body: string
          contact_email: string | null
          eta_text: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: number
          is_active?: boolean
          title?: string
          body?: string
          contact_email?: string | null
          eta_text?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: number
          is_active?: boolean
          title?: string
          body?: string
          contact_email?: string | null
          eta_text?: string | null
          updated_at?: string
          updated_by?: string | null
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

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
