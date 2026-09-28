export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          full_name: string | null
          role: 'admin' | 'estimator' | 'viewer' | null
          created_at: string | null
        }
        Insert: {
          id: string
          full_name?: string | null
          role?: 'admin' | 'estimator' | 'viewer' | null
          created_at?: string | null
        }
        Update: {
          id?: string
          full_name?: string | null
          role?: 'admin' | 'estimator' | 'viewer' | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      jobs: {
        Row: {
          id: string
          ref_number: string
          client_company: string | null
          client_name: string | null
          client_email: string | null
          client_phone: string | null
          status: 'draft' | 'ai_processing' | 'review' | 'estimated' | 'quoted' | 'closed' | null
          source: 'pdf_upload' | 'manual' | 'cloned' | null
          cloned_from: string | null
          created_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          ref_number: string
          client_company?: string | null
          client_name?: string | null
          client_email?: string | null
          client_phone?: string | null
          status?: 'draft' | 'ai_processing' | 'review' | 'estimated' | 'quoted' | 'closed' | null
          source?: 'pdf_upload' | 'manual' | 'cloned' | null
          cloned_from?: string | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          ref_number?: string
          client_company?: string | null
          client_name?: string | null
          client_email?: string | null
          client_phone?: string | null
          status?: 'draft' | 'ai_processing' | 'review' | 'estimated' | 'quoted' | 'closed' | null
          source?: 'pdf_upload' | 'manual' | 'cloned' | null
          cloned_from?: string | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_cloned_from_fkey"
            columns: ["cloned_from"]
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      job_requirements: {
        Row: {
          id: string
          job_id: string | null
          crane_type: string | null
          quantity: number | null
          location_type: string | null
          control_type: string | null
          mh_capacity: number | null
          ah_capacity: number | null
          span: number | null
          mh_lift: number | null
          ah_lift: number | null
          bay_length: number | null
          mh_speed: number | null
          ah_speed: number | null
          ct_speed: number | null
          lt_speed: number | null
          micro_speed: boolean | null
          ambient_temp: number | null
          duty_class: string | null
          vvvf_required: boolean | null
          power_supply: string | null
          rail_size: string | null
          dsl_type: string | null
          special_features: Json | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          job_id?: string | null
          crane_type?: string | null
          quantity?: number | null
          location_type?: string | null
          control_type?: string | null
          mh_capacity?: number | null
          ah_capacity?: number | null
          span?: number | null
          mh_lift?: number | null
          ah_lift?: number | null
          bay_length?: number | null
          mh_speed?: number | null
          ah_speed?: number | null
          ct_speed?: number | null
          lt_speed?: number | null
          micro_speed?: boolean | null
          ambient_temp?: number | null
          duty_class?: string | null
          vvvf_required?: boolean | null
          power_supply?: string | null
          rail_size?: string | null
          dsl_type?: string | null
          special_features?: Json | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          job_id?: string | null
          crane_type?: string | null
          quantity?: number | null
          location_type?: string | null
          control_type?: string | null
          mh_capacity?: number | null
          ah_capacity?: number | null
          span?: number | null
          mh_lift?: number | null
          ah_lift?: number | null
          bay_length?: number | null
          mh_speed?: number | null
          ah_speed?: number | null
          ct_speed?: number | null
          lt_speed?: number | null
          micro_speed?: boolean | null
          ambient_temp?: number | null
          duty_class?: string | null
          vvvf_required?: boolean | null
          power_supply?: string | null
          rail_size?: string | null
          dsl_type?: string | null
          special_features?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_requirements_job_id_fkey"
            columns: ["job_id"]
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          }
        ]
      }
      ai_extractions: {
        Row: {
          id: string
          job_id: string | null
          raw_extraction: Json | null
          field_confidence: Json | null
          missing_fields: Json | null
          created_at: string | null
        }
        Insert: {
          id?: string
          job_id?: string | null
          raw_extraction?: Json | null
          field_confidence?: Json | null
          missing_fields?: Json | null
          created_at?: string | null
        }
        Update: {
          id?: string
          job_id?: string | null
          raw_extraction?: Json | null
          field_confidence?: Json | null
          missing_fields?: Json | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_extractions_job_id_fkey"
            columns: ["job_id"]
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          }
        ]
      }
      components: {
        Row: {
          id: string
          category: string
          model: string
          unit_price: number
          unit: string | null
          specs: Json | null
          is_active: boolean | null
          updated_by: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          category: string
          model: string
          unit_price: number
          unit?: string | null
          specs?: Json | null
          is_active?: boolean | null
          updated_by?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          category?: string
          model?: string
          unit_price?: number
          unit?: string | null
          specs?: Json | null
          is_active?: boolean | null
          updated_by?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "components_updated_by_fkey"
            columns: ["updated_by"]
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      formulas: {
        Row: {
          id: string
          name: string
          expression: string
          variables: Json | null
          description: string | null
          updated_by: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          expression: string
          variables?: Json | null
          description?: string | null
          updated_by?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          expression?: string
          variables?: Json | null
          description?: string | null
          updated_by?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "formulas_updated_by_fkey"
            columns: ["updated_by"]
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      rules: {
        Row: {
          id: string
          name: string
          condition: Json
          action: Json
          priority: number | null
          is_active: boolean | null
        }
        Insert: {
          id?: string
          name: string
          condition: Json
          action: Json
          priority?: number | null
          is_active?: boolean | null
        }
        Update: {
          id?: string
          name?: string
          condition?: Json
          action?: Json
          priority?: number | null
          is_active?: boolean | null
        }
        Relationships: []
      }
      system_config: {
        Row: {
          key: string
          value: string
          description: string | null
          updated_at: string | null
        }
        Insert: {
          key: string
          value: string
          description?: string | null
          updated_at?: string | null
        }
        Update: {
          key?: string
          value?: string
          description?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      drawing_config: {
        Row: {
          id: string
          parameter: string
          value: string
          unit: string | null
          description: string | null
        }
        Insert: {
          id?: string
          parameter: string
          value: string
          unit?: string | null
          description?: string | null
        }
        Update: {
          id?: string
          parameter?: string
          value?: string
          unit?: string | null
          description?: string | null
        }
        Relationships: []
      }
      estimations: {
        Row: {
          id: string
          job_id: string | null
          mh_breakdown: Json | null
          ah_breakdown: Json | null
          ct_breakdown: Json | null
          lt_breakdown: Json | null
          structural_cost: number | null
          base_total: number | null
          margin_multiplier: number | null
          painting_cost: number | null
          misc_cost: number | null
          crd_cost: number | null
          grand_total: number | null
          gst_amount: number | null
          grand_total_with_gst: number | null
          version: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          job_id?: string | null
          mh_breakdown?: Json | null
          ah_breakdown?: Json | null
          ct_breakdown?: Json | null
          lt_breakdown?: Json | null
          structural_cost?: number | null
          base_total?: number | null
          margin_multiplier?: number | null
          painting_cost?: number | null
          misc_cost?: number | null
          crd_cost?: number | null
          grand_total?: number | null
          gst_amount?: number | null
          grand_total_with_gst?: number | null
          version?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          job_id?: string | null
          mh_breakdown?: Json | null
          ah_breakdown?: Json | null
          ct_breakdown?: Json | null
          lt_breakdown?: Json | null
          structural_cost?: number | null
          base_total?: number | null
          margin_multiplier?: number | null
          painting_cost?: number | null
          misc_cost?: number | null
          crd_cost?: number | null
          grand_total?: number | null
          gst_amount?: number | null
          grand_total_with_gst?: number | null
          version?: number | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "estimations_job_id_fkey"
            columns: ["job_id"]
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          }
        ]
      }
      documents: {
        Row: {
          id: string
          job_id: string | null
          type: 'quotation' | 'job_card' | 'missing_fields' | 'ga_drawing' | null
          storage_path: string | null
          version: number | null
          created_by: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          job_id?: string | null
          type?: 'quotation' | 'job_card' | 'missing_fields' | 'ga_drawing' | null
          storage_path?: string | null
          version?: number | null
          created_by?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          job_id?: string | null
          type?: 'quotation' | 'job_card' | 'missing_fields' | 'ga_drawing' | null
          storage_path?: string | null
          version?: number | null
          created_by?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_job_id_fkey"
            columns: ["job_id"]
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
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
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
