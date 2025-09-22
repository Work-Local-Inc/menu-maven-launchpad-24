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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      ai_processing_logs: {
        Row: {
          ai_provider: string
          confidence_score: number | null
          created_at: string | null
          error_message: string | null
          id: string
          input_data: Json | null
          offer_id: string | null
          output_data: Json | null
          processing_time_ms: number | null
          processing_type: string
          success: boolean | null
        }
        Insert: {
          ai_provider: string
          confidence_score?: number | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          input_data?: Json | null
          offer_id?: string | null
          output_data?: Json | null
          processing_time_ms?: number | null
          processing_type: string
          success?: boolean | null
        }
        Update: {
          ai_provider?: string
          confidence_score?: number | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          input_data?: Json | null
          offer_id?: string | null
          output_data?: Json | null
          processing_time_ms?: number | null
          processing_type?: string
          success?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_processing_logs_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
        ]
      }
      automated_scraping_logs: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          offers_added: number | null
          run_date: string
          success: boolean
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          offers_added?: number | null
          run_date?: string
          success?: boolean
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          offers_added?: number | null
          run_date?: string
          success?: boolean
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          email: string
          id: string
          is_active: boolean | null
          preferences: Json | null
          source: string | null
          subscribed_at: string | null
        }
        Insert: {
          email: string
          id?: string
          is_active?: boolean | null
          preferences?: Json | null
          source?: string | null
          subscribed_at?: string | null
        }
        Update: {
          email?: string
          id?: string
          is_active?: boolean | null
          preferences?: Json | null
          source?: string | null
          subscribed_at?: string | null
        }
        Relationships: []
      }
      offers: {
        Row: {
          ai_confidence_score: number | null
          brand: string
          brand_background: string | null
          category: string
          created_at: string | null
          date_posted: string | null
          delivery_timeframe: string | null
          description: string
          eligibility_requirements: string | null
          entry_deadline: string | null
          entry_requirements: string | null
          estimated_entries: number | null
          expiry_date: string | null
          faq: Json | null
          how_to_claim: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_canada_eligible: boolean | null
          meta_description: string | null
          offer_type: Database["public"]["Enums"]["offer_type"]
          prize_value: string | null
          product_features: string | null
          slug: string | null
          source_id: string | null
          source_url: string
          structured_data: Json | null
          title: string
          updated_at: string | null
          usage_tips: string | null
        }
        Insert: {
          ai_confidence_score?: number | null
          brand: string
          brand_background?: string | null
          category: string
          created_at?: string | null
          date_posted?: string | null
          delivery_timeframe?: string | null
          description: string
          eligibility_requirements?: string | null
          entry_deadline?: string | null
          entry_requirements?: string | null
          estimated_entries?: number | null
          expiry_date?: string | null
          faq?: Json | null
          how_to_claim?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_canada_eligible?: boolean | null
          meta_description?: string | null
          offer_type?: Database["public"]["Enums"]["offer_type"]
          prize_value?: string | null
          product_features?: string | null
          slug?: string | null
          source_id?: string | null
          source_url: string
          structured_data?: Json | null
          title: string
          updated_at?: string | null
          usage_tips?: string | null
        }
        Update: {
          ai_confidence_score?: number | null
          brand?: string
          brand_background?: string | null
          category?: string
          created_at?: string | null
          date_posted?: string | null
          delivery_timeframe?: string | null
          description?: string
          eligibility_requirements?: string | null
          entry_deadline?: string | null
          entry_requirements?: string | null
          estimated_entries?: number | null
          expiry_date?: string | null
          faq?: Json | null
          how_to_claim?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_canada_eligible?: boolean | null
          meta_description?: string | null
          offer_type?: Database["public"]["Enums"]["offer_type"]
          prize_value?: string | null
          product_features?: string | null
          slug?: string | null
          source_id?: string | null
          source_url?: string
          structured_data?: Json | null
          title?: string
          updated_at?: string | null
          usage_tips?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "offers_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "scraping_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_deals: {
        Row: {
          created_at: string
          description: string
          display_order: number
          id: string
          image_url: string | null
          restaurant_submission_id: string
          title: string
        }
        Insert: {
          created_at?: string
          description: string
          display_order?: number
          id?: string
          image_url?: string | null
          restaurant_submission_id: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string
          display_order?: number
          id?: string
          image_url?: string | null
          restaurant_submission_id?: string
          title?: string
        }
        Relationships: []
      }
      restaurant_dishes: {
        Row: {
          created_at: string
          description: string
          display_order: number
          id: string
          image_url: string | null
          name: string
          restaurant_submission_id: string
        }
        Insert: {
          created_at?: string
          description: string
          display_order?: number
          id?: string
          image_url?: string | null
          name: string
          restaurant_submission_id: string
        }
        Update: {
          created_at?: string
          description?: string
          display_order?: number
          id?: string
          image_url?: string | null
          name?: string
          restaurant_submission_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_dishes_restaurant_submission_id_fkey"
            columns: ["restaurant_submission_id"]
            isOneToOne: false
            referencedRelation: "restaurant_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_dishes_restaurant_submission_id_fkey"
            columns: ["restaurant_submission_id"]
            isOneToOne: false
            referencedRelation: "restaurant_submissions_public"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_menus: {
        Row: {
          category: string
          created_at: string
          custom_category_name: string | null
          display_order: number
          id: string
          menu_name: string
          menu_url: string
          restaurant_submission_id: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          custom_category_name?: string | null
          display_order?: number
          id?: string
          menu_name: string
          menu_url: string
          restaurant_submission_id: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          custom_category_name?: string | null
          display_order?: number
          id?: string
          menu_name?: string
          menu_url?: string
          restaurant_submission_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      restaurant_photos: {
        Row: {
          created_at: string
          display_order: number
          id: string
          image_url: string
          restaurant_submission_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          image_url: string
          restaurant_submission_id: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string
          restaurant_submission_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_photos_restaurant_submission_id_fkey"
            columns: ["restaurant_submission_id"]
            isOneToOne: false
            referencedRelation: "restaurant_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_photos_restaurant_submission_id_fkey"
            columns: ["restaurant_submission_id"]
            isOneToOne: false
            referencedRelation: "restaurant_submissions_public"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_submissions: {
        Row: {
          about_image_url: string | null
          address: string
          comments: string | null
          created_at: string
          custom_sections: Json | null
          delivery_areas: string
          delivery_instructions: string | null
          email: string
          facebook: string | null
          founded_year: string | null
          generated_site_url: string | null
          hero_image_url: string | null
          hours: string
          id: string
          instagram: string | null
          logo_url: string | null
          menu_pdf_url: string | null
          online_ordering_url: string | null
          owner_quote: string | null
          phone: string | null
          restaurant_name: string
          status: string
          story: string
          twitter: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          about_image_url?: string | null
          address: string
          comments?: string | null
          created_at?: string
          custom_sections?: Json | null
          delivery_areas: string
          delivery_instructions?: string | null
          email: string
          facebook?: string | null
          founded_year?: string | null
          generated_site_url?: string | null
          hero_image_url?: string | null
          hours: string
          id?: string
          instagram?: string | null
          logo_url?: string | null
          menu_pdf_url?: string | null
          online_ordering_url?: string | null
          owner_quote?: string | null
          phone?: string | null
          restaurant_name: string
          status?: string
          story: string
          twitter?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          about_image_url?: string | null
          address?: string
          comments?: string | null
          created_at?: string
          custom_sections?: Json | null
          delivery_areas?: string
          delivery_instructions?: string | null
          email?: string
          facebook?: string | null
          founded_year?: string | null
          generated_site_url?: string | null
          hero_image_url?: string | null
          hours?: string
          id?: string
          instagram?: string | null
          logo_url?: string | null
          menu_pdf_url?: string | null
          online_ordering_url?: string | null
          owner_quote?: string | null
          phone?: string | null
          restaurant_name?: string
          status?: string
          story?: string
          twitter?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      scraping_configurations: {
        Row: {
          anthropic_api_key: string | null
          created_at: string | null
          firecrawl_api_key: string | null
          id: string
          openai_api_key: string | null
          scraping_enabled: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          anthropic_api_key?: string | null
          created_at?: string | null
          firecrawl_api_key?: string | null
          id?: string
          openai_api_key?: string | null
          scraping_enabled?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          anthropic_api_key?: string | null
          created_at?: string | null
          firecrawl_api_key?: string | null
          id?: string
          openai_api_key?: string | null
          scraping_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      scraping_sources: {
        Row: {
          base_url: string
          created_at: string | null
          id: string
          is_active: boolean | null
          last_scraped_at: string | null
          name: string
          scraping_config: Json
          scraping_frequency_hours: number | null
          updated_at: string | null
        }
        Insert: {
          base_url: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_scraped_at?: string | null
          name: string
          scraping_config?: Json
          scraping_frequency_hours?: number | null
          updated_at?: string | null
        }
        Update: {
          base_url?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_scraped_at?: string | null
          name?: string
          scraping_config?: Json
          scraping_frequency_hours?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      simple_ga4_properties: {
        Row: {
          created_at: string
          id: string
          measurement_id: string
          property_id: string
          website_url: string
        }
        Insert: {
          created_at?: string
          id?: string
          measurement_id: string
          property_id: string
          website_url: string
        }
        Update: {
          created_at?: string
          id?: string
          measurement_id?: string
          property_id?: string
          website_url?: string
        }
        Relationships: []
      }
      user_feedback: {
        Row: {
          comment: string | null
          created_at: string | null
          feedback_type: string
          id: string
          offer_id: string | null
          user_ip: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          feedback_type: string
          id?: string
          offer_id?: string | null
          user_ip?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          feedback_type?: string
          id?: string
          offer_id?: string | null
          user_ip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_feedback_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      restaurant_submissions_public: {
        Row: {
          address: string | null
          created_at: string | null
          delivery_areas: string | null
          founded_year: string | null
          generated_site_url: string | null
          hero_image_url: string | null
          hours: string | null
          id: string | null
          logo_url: string | null
          online_ordering_url: string | null
          restaurant_name: string | null
          status: string | null
          story: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          delivery_areas?: string | null
          founded_year?: string | null
          generated_site_url?: string | null
          hero_image_url?: string | null
          hours?: string | null
          id?: string | null
          logo_url?: string | null
          online_ordering_url?: string | null
          restaurant_name?: string | null
          status?: string | null
          story?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          delivery_areas?: string | null
          founded_year?: string | null
          generated_site_url?: string | null
          hero_image_url?: string | null
          hours?: string | null
          id?: string | null
          logo_url?: string | null
          online_ordering_url?: string | null
          restaurant_name?: string | null
          status?: string | null
          story?: string | null
          website?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      generate_slug: {
        Args: { input_text: string }
        Returns: string
      }
      get_automation_logs: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_at: string
          error_message: string
          id: string
          offers_added: number
          run_date: string
          success: boolean
        }[]
      }
    }
    Enums: {
      offer_type: "sample" | "giveaway"
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
      offer_type: ["sample", "giveaway"],
    },
  },
} as const
