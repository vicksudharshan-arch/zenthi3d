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
      admin_requests: {
        Row: {
          created_at: string
          email: string
          id: string
          reason: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          reason: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          reason?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      app_secrets: {
        Row: {
          key_name: string
          key_value: string
          updated_at: string
        }
        Insert: {
          key_name: string
          key_value?: string
          updated_at?: string
        }
        Update: {
          key_name?: string
          key_value?: string
          updated_at?: string
        }
        Relationships: []
      }
      copyright_reports: {
        Row: {
          concern: string
          created_at: string
          good_faith: boolean
          id: string
          part_reference: string
          reporter_email: string
          reporter_name: string
          status: string
          updated_at: string
        }
        Insert: {
          concern: string
          created_at?: string
          good_faith?: boolean
          id?: string
          part_reference: string
          reporter_email: string
          reporter_name: string
          status?: string
          updated_at?: string
        }
        Update: {
          concern?: string
          created_at?: string
          good_faith?: boolean
          id?: string
          part_reference?: string
          reporter_email?: string
          reporter_name?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      external_leads: {
        Row: {
          created_at: string
          id: string
          license: string | null
          note: string | null
          source_site: string | null
          source_url: string
          status: string
          suggested_by: string
          thumbnail_url: string | null
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          license?: string | null
          note?: string | null
          source_site?: string | null
          source_url: string
          status?: string
          suggested_by: string
          thumbnail_url?: string | null
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          license?: string | null
          note?: string | null
          source_site?: string | null
          source_url?: string
          status?: string
          suggested_by?: string
          thumbnail_url?: string | null
          title?: string
        }
        Relationships: []
      }
      parts: {
        Row: {
          aftermarket_part_numbers: Json
          category: string
          contributor_type: string[]
          created_at: string
          description: string
          extra_files: Json
          id: string
          license_accepted: boolean
          license_type: string | null
          material: string | null
          modification_notes: string | null
          name: string
          notes: string | null
          oem_part_numbers: string | null
          original_creator: string | null
          placement: string | null
          reference_only: boolean
          request_id: string | null
          source_link: string | null
          status: string
          step_file_name: string | null
          step_file_path: string | null
          step_file_size: number | null
          step_files: Json
          stl_file_name: string | null
          stl_file_path: string | null
          stl_file_size: number | null
          stl_files: Json
          thickness_infill: string | null
          updated_at: string
          uploader_name: string | null
          vehicles: Json
        }
        Insert: {
          aftermarket_part_numbers?: Json
          category: string
          contributor_type?: string[]
          created_at?: string
          description?: string
          extra_files?: Json
          id?: string
          license_accepted?: boolean
          license_type?: string | null
          material?: string | null
          modification_notes?: string | null
          name: string
          notes?: string | null
          oem_part_numbers?: string | null
          original_creator?: string | null
          placement?: string | null
          reference_only?: boolean
          request_id?: string | null
          source_link?: string | null
          status?: string
          step_file_name?: string | null
          step_file_path?: string | null
          step_file_size?: number | null
          step_files?: Json
          stl_file_name?: string | null
          stl_file_path?: string | null
          stl_file_size?: number | null
          stl_files?: Json
          thickness_infill?: string | null
          updated_at?: string
          uploader_name?: string | null
          vehicles?: Json
        }
        Update: {
          aftermarket_part_numbers?: Json
          category?: string
          contributor_type?: string[]
          created_at?: string
          description?: string
          extra_files?: Json
          id?: string
          license_accepted?: boolean
          license_type?: string | null
          material?: string | null
          modification_notes?: string | null
          name?: string
          notes?: string | null
          oem_part_numbers?: string | null
          original_creator?: string | null
          placement?: string | null
          reference_only?: boolean
          request_id?: string | null
          source_link?: string | null
          status?: string
          step_file_name?: string | null
          step_file_path?: string | null
          step_file_size?: number | null
          step_files?: Json
          stl_file_name?: string | null
          stl_file_path?: string | null
          stl_file_size?: number | null
          stl_files?: Json
          thickness_infill?: string | null
          updated_at?: string
          uploader_name?: string | null
          vehicles?: Json
        }
        Relationships: [
          {
            foreignKeyName: "parts_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      requests: {
        Row: {
          bounty_amount: number | null
          created_at: string
          drivetrain: string | null
          engine_displacement: string | null
          engine_manufacturer: string | null
          engine_series: string | null
          file_type_needed: string
          fulfilled_part_id: string | null
          generation: string | null
          id: string
          make: string | null
          model: string | null
          part_description: string
          requester_contact: string | null
          requester_name: string
          status: string
          updated_at: string
          year_from: string | null
          year_to: string | null
        }
        Insert: {
          bounty_amount?: number | null
          created_at?: string
          drivetrain?: string | null
          engine_displacement?: string | null
          engine_manufacturer?: string | null
          engine_series?: string | null
          file_type_needed?: string
          fulfilled_part_id?: string | null
          generation?: string | null
          id?: string
          make?: string | null
          model?: string | null
          part_description: string
          requester_contact?: string | null
          requester_name: string
          status?: string
          updated_at?: string
          year_from?: string | null
          year_to?: string | null
        }
        Update: {
          bounty_amount?: number | null
          created_at?: string
          drivetrain?: string | null
          engine_displacement?: string | null
          engine_manufacturer?: string | null
          engine_series?: string | null
          file_type_needed?: string
          fulfilled_part_id?: string | null
          generation?: string | null
          id?: string
          make?: string | null
          model?: string | null
          part_description?: string
          requester_contact?: string | null
          requester_name?: string
          status?: string
          updated_at?: string
          year_from?: string | null
          year_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "requests_fulfilled_part_id_fkey"
            columns: ["fulfilled_part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: { Args: { _role: string; _user_id: string }; Returns: boolean }
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
    Enums: {},
  },
} as const
