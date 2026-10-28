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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      accounts_payable: {
        Row: {
          amount: number
          business_unit_id: string
          cash_movement_id: string | null
          category: string | null
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          description: string
          due_date: string
          id: string
          organization_id: string
          paid_at: string | null
          paid_by: string | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          status: Database["public"]["Enums"]["payable_status"]
          supplier_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          business_unit_id: string
          cash_movement_id?: string | null
          category?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          description: string
          due_date: string
          id?: string
          organization_id: string
          paid_at?: string | null
          paid_by?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          status?: Database["public"]["Enums"]["payable_status"]
          supplier_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          business_unit_id?: string
          cash_movement_id?: string | null
          category?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string
          due_date?: string
          id?: string
          organization_id?: string
          paid_at?: string | null
          paid_by?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          status?: Database["public"]["Enums"]["payable_status"]
          supplier_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_payable_business_unit_id_fkey"
            columns: ["business_unit_id"]
            isOneToOne: false
            referencedRelation: "business_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_payable_cash_movement_id_fkey"
            columns: ["cash_movement_id"]
            isOneToOne: false
            referencedRelation: "cash_movements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_payable_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_payable_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_payable_paid_by_fkey"
            columns: ["paid_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_payable_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payable_org_unit_fk"
            columns: ["organization_id", "business_unit_id"]
            isOneToOne: false
            referencedRelation: "business_units"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      accounts_receivable: {
        Row: {
          amount: number
          business_unit_id: string
          created_at: string
          customer_id: string | null
          description: string
          due_date: string
          id: string
          organization_id: string
          paid_at: string | null
          sale_id: string | null
          status: Database["public"]["Enums"]["receivable_status"]
          updated_at: string
        }
        Insert: {
          amount: number
          business_unit_id: string
          created_at?: string
          customer_id?: string | null
          description: string
          due_date: string
          id?: string
          organization_id: string
          paid_at?: string | null
          sale_id?: string | null
          status?: Database["public"]["Enums"]["receivable_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          business_unit_id?: string
          created_at?: string
          customer_id?: string | null
          description?: string
          due_date?: string
          id?: string
          organization_id?: string
          paid_at?: string | null
          sale_id?: string | null
          status?: Database["public"]["Enums"]["receivable_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_receivable_business_unit_id_fkey"
            columns: ["business_unit_id"]
            isOneToOne: false
            referencedRelation: "business_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_receivable_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_receivable_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_receivable_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receivable_org_unit_fk"
            columns: ["organization_id", "business_unit_id"]
            isOneToOne: false
            referencedRelation: "business_units"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          entity: string
          entity_id: string | null
          id: string
          ip_address: unknown
          new_data: Json | null
          old_data: Json | null
          organization_id: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity: string
          entity_id?: string | null
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          organization_id: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity?: string
          entity_id?: string | null
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          organization_id?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      backup_logs: {
        Row: {
          created_at: string
          error_message: string | null
          finished_at: string | null
          id: string
          organization_id: string
          size: number | null
          started_at: string
          status: Database["public"]["Enums"]["backup_status"]
          storage_path: string | null
          type: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          finished_at?: string | null
          id?: string
          organization_id: string
          size?: number | null
          started_at?: string
          status?: Database["public"]["Enums"]["backup_status"]
          storage_path?: string | null
          type: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          finished_at?: string | null
          id?: string
          organization_id?: string
          size?: number | null
          started_at?: string
          status?: Database["public"]["Enums"]["backup_status"]
          storage_path?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "backup_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      brands: {
        Row: {
          active: boolean
          created_at: string
          deleted_at: string | null
          id: string
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          deleted_at?: string | null
          id?: string
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          deleted_at?: string | null
          id?: string
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "brands_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      business_units: {
        Row: {
          active: boolean
          code: string
          created_at: string
          id: string
          name: string
          organization_id: string
          settings: Json
          type: Database["public"]["Enums"]["business_unit_type"]
          updated_at: string
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          id?: string
          name: string
          organization_id: string
          settings?: Json
          type: Database["public"]["Enums"]["business_unit_type"]
          updated_at?: string
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
          settings?: Json
          type?: Database["public"]["Enums"]["business_unit_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_units_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_movements: {
        Row: {
          amount: number
          business_unit_id: string
          cash_session_id: string
          created_at: string
          created_by: string
          description: string
          id: string
          organization_id: string
          payment_id: string | null
          reference_id: string | null
          reference_type: string | null
          type: Database["public"]["Enums"]["cash_movement_type"]
        }
        Insert: {
          amount: number
          business_unit_id: string
          cash_session_id: string
          created_at?: string
          created_by: string
          description: string
          id?: string
          organization_id: string
          payment_id?: string | null
          reference_id?: string | null
          reference_type?: string | null
          type: Database["public"]["Enums"]["cash_movement_type"]
        }
        Update: {
          amount?: number
          business_unit_id?: string
          cash_session_id?: string
          created_at?: string
          created_by?: string
          description?: string
          id?: string
          organization_id?: string
          payment_id?: string | null
          reference_id?: string | null
          reference_type?: string | null
          type?: Database["public"]["Enums"]["cash_movement_type"]
        }
        Relationships: [
          {
            foreignKeyName: "cash_movements_business_unit_id_fkey"
            columns: ["business_unit_id"]
            isOneToOne: false
            referencedRelation: "business_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_movements_cash_session_id_fkey"
            columns: ["cash_session_id"]
            isOneToOne: false
            referencedRelation: "cash_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_movements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_movements_organization_id_business_unit_id_fkey"
            columns: ["organization_id", "business_unit_id"]
            isOneToOne: false
            referencedRelation: "business_units"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "cash_movements_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_movements_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_registers: {
        Row: {
          active: boolean
          business_unit_id: string
          created_at: string
          id: string
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          business_unit_id: string
          created_at?: string
          id?: string
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          business_unit_id?: string
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cash_registers_business_unit_id_fkey"
            columns: ["business_unit_id"]
            isOneToOne: false
            referencedRelation: "business_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_registers_organization_id_business_unit_id_fkey"
            columns: ["organization_id", "business_unit_id"]
            isOneToOne: false
            referencedRelation: "business_units"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "cash_registers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_sessions: {
        Row: {
          business_unit_id: string
          cash_register_id: string
          closed_at: string | null
          closed_by: string | null
          closing_balance: number | null
          difference: number | null
          expected_balance: number | null
          id: string
          notes: string | null
          opened_at: string
          opened_by: string
          opening_balance: number
          organization_id: string
          status: Database["public"]["Enums"]["cash_session_status"]
        }
        Insert: {
          business_unit_id: string
          cash_register_id: string
          closed_at?: string | null
          closed_by?: string | null
          closing_balance?: number | null
          difference?: number | null
          expected_balance?: number | null
          id?: string
          notes?: string | null
          opened_at?: string
          opened_by: string
          opening_balance?: number
          organization_id: string
          status?: Database["public"]["Enums"]["cash_session_status"]
        }
        Update: {
          business_unit_id?: string
          cash_register_id?: string
          closed_at?: string | null
          closed_by?: string | null
          closing_balance?: number | null
          difference?: number | null
          expected_balance?: number | null
          id?: string
          notes?: string | null
          opened_at?: string
          opened_by?: string
          opening_balance?: number
          organization_id?: string
          status?: Database["public"]["Enums"]["cash_session_status"]
        }
        Relationships: [
          {
            foreignKeyName: "cash_sessions_business_unit_id_fkey"
            columns: ["business_unit_id"]
            isOneToOne: false
            referencedRelation: "business_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_sessions_cash_register_id_fkey"
            columns: ["cash_register_id"]
            isOneToOne: false
            referencedRelation: "cash_registers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_sessions_closed_by_fkey"
            columns: ["closed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_sessions_opened_by_fkey"
            columns: ["opened_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_sessions_organization_id_business_unit_id_fkey"
            columns: ["organization_id", "business_unit_id"]
            isOneToOne: false
            referencedRelation: "business_units"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "cash_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_template_items: {
        Row: {
          id: string
          label: string
          organization_id: string
          position: number
          required: boolean
          template_id: string
        }
        Insert: {
          id?: string
          label: string
          organization_id: string
          position?: number
          required?: boolean
          template_id: string
        }
        Update: {
          id?: string
          label?: string
          organization_id?: string
          position?: number
          required?: boolean
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_template_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_template_items_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "checklist_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_templates: {
        Row: {
          active: boolean
          created_at: string
          equipment_type_id: string | null
          id: string
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          equipment_type_id?: string | null
          id?: string
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          equipment_type_id?: string | null
          id?: string
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_templates_equipment_type_id_fkey"
            columns: ["equipment_type_id"]
            isOneToOne: false
            referencedRelation: "equipment_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          active: boolean
          business_unit_id: string
          code: string
          created_at: string
          discount_type: Database["public"]["Enums"]["coupon_discount_type"]
          discount_value: number
          ends_at: string | null
          id: string
          maximum_discount: number | null
          minimum_order: number
          organization_id: string
          starts_at: string | null
          updated_at: string
          usage_count: number
          usage_limit: number | null
        }
        Insert: {
          active?: boolean
          business_unit_id: string
          code: string
          created_at?: string
          discount_type: Database["public"]["Enums"]["coupon_discount_type"]
          discount_value: number
          ends_at?: string | null
          id?: string
          maximum_discount?: number | null
          minimum_order?: number
          organization_id: string
          starts_at?: string | null
          updated_at?: string
          usage_count?: number
          usage_limit?: number | null
        }
        Update: {
          active?: boolean
          business_unit_id?: string
          code?: string
          created_at?: string
          discount_type?: Database["public"]["Enums"]["coupon_discount_type"]
          discount_value?: number
          ends_at?: string | null
          id?: string
          maximum_discount?: number | null
          minimum_order?: number
          organization_id?: string
          starts_at?: string | null
          updated_at?: string
          usage_count?: number
          usage_limit?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "coupons_business_unit_id_fkey"
            columns: ["business_unit_id"]
            isOneToOne: false
            referencedRelation: "business_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupons_organization_id_business_unit_id_fkey"
            columns: ["organization_id", "business_unit_id"]
            isOneToOne: false
            referencedRelation: "business_units"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "coupons_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_addresses: {
        Row: {
          city: string | null
          complement: string | null
          country: string
          created_at: string
          customer_id: string
          id: string
          is_primary: boolean
          neighborhood: string | null
          number: string | null
          organization_id: string
          state: string | null
          street: string | null
          type: string
          updated_at: string
          zip_code: string | null
        }
        Insert: {
          city?: string | null
          complement?: string | null
          country?: string
          created_at?: string
          customer_id: string
          id?: string
          is_primary?: boolean
          neighborhood?: string | null
          number?: string | null
          organization_id: string
          state?: string | null
          street?: string | null
          type?: string
          updated_at?: string
          zip_code?: string | null
        }
        Update: {
          city?: string | null
          complement?: string | null
          country?: string
          created_at?: string
          customer_id?: string
          id?: string
          is_primary?: boolean
          neighborhood?: string | null
          number?: string | null
          organization_id?: string
          state?: string | null
          street?: string | null
          type?: string
          updated_at?: string
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_addresses_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_addresses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          active: boolean
          birth_date: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          document: string | null
          email: string | null
          id: string
          legal_name: string | null
          name: string
          notes: string | null
          organization_id: string
          phone: string | null
          state_registration: string | null
          type: Database["public"]["Enums"]["customer_type"]
          updated_at: string
          updated_by: string | null
          whatsapp: string | null
        }
        Insert: {
          active?: boolean
          birth_date?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          document?: string | null
          email?: string | null
          id?: string
          legal_name?: string | null
          name: string
          notes?: string | null
          organization_id: string
          phone?: string | null
          state_registration?: string | null
          type?: Database["public"]["Enums"]["customer_type"]
          updated_at?: string
          updated_by?: string | null
          whatsapp?: string | null
        }
        Update: {
          active?: boolean
          birth_date?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          document?: string | null
          email?: string | null
          id?: string
          legal_name?: string | null
          name?: string
          notes?: string | null
          organization_id?: string
          phone?: string | null
          state_registration?: string | null
          type?: Database["public"]["Enums"]["customer_type"]
          updated_at?: string
          updated_by?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_settings: {
        Row: {
          accent_color: string
          banner_path: string | null
          business_unit_id: string
          delivery_enabled: boolean
          description: string | null
          id: string
          is_open: boolean
          local_enabled: boolean
          logo_path: string | null
          minimum_order: number
          opening_hours: string | null
          organization_id: string
          pickup_enabled: boolean
          store_name: string
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          accent_color?: string
          banner_path?: string | null
          business_unit_id: string
          delivery_enabled?: boolean
          description?: string | null
          id?: string
          is_open?: boolean
          local_enabled?: boolean
          logo_path?: string | null
          minimum_order?: number
          opening_hours?: string | null
          organization_id: string
          pickup_enabled?: boolean
          store_name: string
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          accent_color?: string
          banner_path?: string | null
          business_unit_id?: string
          delivery_enabled?: boolean
          description?: string | null
          id?: string
          is_open?: boolean
          local_enabled?: boolean
          logo_path?: string | null
          minimum_order?: number
          opening_hours?: string | null
          organization_id?: string
          pickup_enabled?: boolean
          store_name?: string
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_settings_business_unit_id_fkey"
            columns: ["business_unit_id"]
            isOneToOne: false
            referencedRelation: "business_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_settings_organization_id_business_unit_id_fkey"
            columns: ["organization_id", "business_unit_id"]
            isOneToOne: true
            referencedRelation: "business_units"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "delivery_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_zones: {
        Row: {
          active: boolean
          business_unit_id: string
          created_at: string
          fee: number
          id: string
          minimum_order: number
          name: string
          neighborhood: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          business_unit_id: string
          created_at?: string
          fee?: number
          id?: string
          minimum_order?: number
          name: string
          neighborhood: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          business_unit_id?: string
          created_at?: string
          fee?: number
          id?: string
          minimum_order?: number
          name?: string
          neighborhood?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_zones_business_unit_id_fkey"
            columns: ["business_unit_id"]
            isOneToOne: false
            referencedRelation: "business_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_zones_organization_id_business_unit_id_fkey"
            columns: ["organization_id", "business_unit_id"]
            isOneToOne: false
            referencedRelation: "business_units"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "delivery_zones_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ecommerce_option_groups: {
        Row: {
          active: boolean
          created_at: string
          ecommerce_product_id: string
          id: string
          maximum_selections: number
          minimum_selections: number
          name: string
          organization_id: string
          position: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          ecommerce_product_id: string
          id?: string
          maximum_selections?: number
          minimum_selections?: number
          name: string
          organization_id: string
          position?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          ecommerce_product_id?: string
          id?: string
          maximum_selections?: number
          minimum_selections?: number
          name?: string
          organization_id?: string
          position?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ecommerce_option_groups_ecommerce_product_id_fkey"
            columns: ["ecommerce_product_id"]
            isOneToOne: false
            referencedRelation: "ecommerce_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecommerce_option_groups_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ecommerce_options: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          option_group_id: string
          organization_id: string
          position: number
          price_delta: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          option_group_id: string
          organization_id: string
          position?: number
          price_delta?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          option_group_id?: string
          organization_id?: string
          position?: number
          price_delta?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ecommerce_options_option_group_id_fkey"
            columns: ["option_group_id"]
            isOneToOne: false
            referencedRelation: "ecommerce_option_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecommerce_options_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ecommerce_product_images: {
        Row: {
          alt_text: string | null
          created_at: string
          ecommerce_product_id: string
          id: string
          is_primary: boolean
          organization_id: string
          position: number
          removed_at: string | null
          storage_path: string
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          ecommerce_product_id: string
          id?: string
          is_primary?: boolean
          organization_id: string
          position?: number
          removed_at?: string | null
          storage_path: string
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          ecommerce_product_id?: string
          id?: string
          is_primary?: boolean
          organization_id?: string
          position?: number
          removed_at?: string | null
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "ecommerce_product_images_ecommerce_product_id_fkey"
            columns: ["ecommerce_product_id"]
            isOneToOne: false
            referencedRelation: "ecommerce_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecommerce_product_images_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ecommerce_products: {
        Row: {
          available_for_delivery: boolean
          available_for_pickup: boolean
          business_unit_id: string
          category_id: string | null
          created_at: string
          description: string | null
          display_name: string
          id: string
          is_featured: boolean
          is_published: boolean
          max_per_order: number | null
          online_price: number | null
          organization_id: string
          product_id: string
          promotion_ends_at: string | null
          promotion_starts_at: string | null
          promotional_price: number | null
          published_at: string | null
          seo_description: string | null
          seo_title: string | null
          short_description: string | null
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          available_for_delivery?: boolean
          available_for_pickup?: boolean
          business_unit_id: string
          category_id?: string | null
          created_at?: string
          description?: string | null
          display_name: string
          id?: string
          is_featured?: boolean
          is_published?: boolean
          max_per_order?: number | null
          online_price?: number | null
          organization_id: string
          product_id: string
          promotion_ends_at?: string | null
          promotion_starts_at?: string | null
          promotional_price?: number | null
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          short_description?: string | null
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          available_for_delivery?: boolean
          available_for_pickup?: boolean
          business_unit_id?: string
          category_id?: string | null
          created_at?: string
          description?: string | null
          display_name?: string
          id?: string
          is_featured?: boolean
          is_published?: boolean
          max_per_order?: number | null
          online_price?: number | null
          organization_id?: string
          product_id?: string
          promotion_ends_at?: string | null
          promotion_starts_at?: string | null
          promotional_price?: number | null
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          short_description?: string | null
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ecommerce_products_business_unit_id_fkey"
            columns: ["business_unit_id"]
            isOneToOne: false
            referencedRelation: "business_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecommerce_products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecommerce_products_organization_id_business_unit_id_fkey"
            columns: ["organization_id", "business_unit_id"]
            isOneToOne: false
            referencedRelation: "business_units"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "ecommerce_products_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecommerce_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_models: {
        Row: {
          active: boolean
          brand_id: string | null
          created_at: string
          deleted_at: string | null
          equipment_type_id: string
          id: string
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          brand_id?: string | null
          created_at?: string
          deleted_at?: string | null
          equipment_type_id: string
          id?: string
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          brand_id?: string | null
          created_at?: string
          deleted_at?: string | null
          equipment_type_id?: string
          id?: string
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_models_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_models_equipment_type_id_fkey"
            columns: ["equipment_type_id"]
            isOneToOne: false
            referencedRelation: "equipment_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_models_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_types: {
        Row: {
          active: boolean
          created_at: string
          deleted_at: string | null
          id: string
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          deleted_at?: string | null
          id?: string
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          deleted_at?: string | null
          id?: string
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_types_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      import_jobs: {
        Row: {
          created_at: string
          created_by: string
          entity: string
          errors: Json
          finished_at: string | null
          id: string
          invalid_rows: number
          organization_id: string
          status: string
          storage_path: string
          total_rows: number
          valid_rows: number
        }
        Insert: {
          created_at?: string
          created_by: string
          entity: string
          errors?: Json
          finished_at?: string | null
          id?: string
          invalid_rows?: number
          organization_id: string
          status?: string
          storage_path: string
          total_rows?: number
          valid_rows?: number
        }
        Update: {
          created_at?: string
          created_by?: string
          entity?: string
          errors?: Json
          finished_at?: string | null
          id?: string
          invalid_rows?: number
          organization_id?: string
          status?: string
          storage_path?: string
          total_rows?: number
          valid_rows?: number
        }
        Relationships: [
          {
            foreignKeyName: "import_jobs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_jobs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory: {
        Row: {
          business_unit_id: string
          id: string
          organization_id: string
          product_id: string
          quantity: number
          updated_at: string
        }
        Insert: {
          business_unit_id: string
          id?: string
          organization_id: string
          product_id: string
          quantity?: number
          updated_at?: string
        }
        Update: {
          business_unit_id?: string
          id?: string
          organization_id?: string
          product_id?: string
          quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_business_unit_id_fkey"
            columns: ["business_unit_id"]
            isOneToOne: false
            referencedRelation: "business_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_org_unit_fk"
            columns: ["organization_id", "business_unit_id"]
            isOneToOne: false
            referencedRelation: "business_units"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "inventory_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_movements: {
        Row: {
          business_unit_id: string
          created_at: string
          created_by: string
          id: string
          organization_id: string
          product_id: string
          quantity: number
          quantity_after: number
          quantity_before: number
          reason: string
          reference_id: string | null
          reference_type: string | null
          type: Database["public"]["Enums"]["inventory_movement_type"]
        }
        Insert: {
          business_unit_id: string
          created_at?: string
          created_by: string
          id?: string
          organization_id: string
          product_id: string
          quantity: number
          quantity_after: number
          quantity_before: number
          reason: string
          reference_id?: string | null
          reference_type?: string | null
          type: Database["public"]["Enums"]["inventory_movement_type"]
        }
        Update: {
          business_unit_id?: string
          created_at?: string
          created_by?: string
          id?: string
          organization_id?: string
          product_id?: string
          quantity?: number
          quantity_after?: number
          quantity_before?: number
          reason?: string
          reference_id?: string | null
          reference_type?: string | null
          type?: Database["public"]["Enums"]["inventory_movement_type"]
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_business_unit_id_fkey"
            columns: ["business_unit_id"]
            isOneToOne: false
            referencedRelation: "business_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_org_unit_fk"
            columns: ["organization_id", "business_unit_id"]
            isOneToOne: false
            referencedRelation: "business_units"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "inventory_movements_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_reservations: {
        Row: {
          business_unit_id: string
          created_at: string
          expires_at: string
          id: string
          order_id: string
          organization_id: string
          product_id: string
          quantity: number
          status: Database["public"]["Enums"]["inventory_reservation_status"]
        }
        Insert: {
          business_unit_id: string
          created_at?: string
          expires_at?: string
          id?: string
          order_id: string
          organization_id: string
          product_id: string
          quantity: number
          status?: Database["public"]["Enums"]["inventory_reservation_status"]
        }
        Update: {
          business_unit_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          order_id?: string
          organization_id?: string
          product_id?: string
          quantity?: number
          status?: Database["public"]["Enums"]["inventory_reservation_status"]
        }
        Relationships: [
          {
            foreignKeyName: "inventory_reservations_business_unit_id_fkey"
            columns: ["business_unit_id"]
            isOneToOne: false
            referencedRelation: "business_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_reservations_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "online_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_reservations_organization_id_business_unit_id_fkey"
            columns: ["organization_id", "business_unit_id"]
            isOneToOne: false
            referencedRelation: "business_units"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "inventory_reservations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_reservations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_accounts: {
        Row: {
          customer_id: string
          id: string
          lifetime_points: number
          organization_id: string
          points: number
          updated_at: string
        }
        Insert: {
          customer_id: string
          id?: string
          lifetime_points?: number
          organization_id: string
          points?: number
          updated_at?: string
        }
        Update: {
          customer_id?: string
          id?: string
          lifetime_points?: number
          organization_id?: string
          points?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_accounts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_accounts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      online_order_item_options: {
        Row: {
          created_at: string
          group_name: string
          id: string
          online_order_item_id: string
          option_id: string | null
          option_name: string
          organization_id: string
          price_delta: number
        }
        Insert: {
          created_at?: string
          group_name: string
          id?: string
          online_order_item_id: string
          option_id?: string | null
          option_name: string
          organization_id: string
          price_delta?: number
        }
        Update: {
          created_at?: string
          group_name?: string
          id?: string
          online_order_item_id?: string
          option_id?: string | null
          option_name?: string
          organization_id?: string
          price_delta?: number
        }
        Relationships: [
          {
            foreignKeyName: "online_order_item_options_online_order_item_id_fkey"
            columns: ["online_order_item_id"]
            isOneToOne: false
            referencedRelation: "online_order_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "online_order_item_options_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "ecommerce_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "online_order_item_options_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      online_order_items: {
        Row: {
          id: string
          order_id: string
          organization_id: string
          product_id: string
          product_name: string
          quantity: number
          sku: string
          total: number
          unit_price: number
        }
        Insert: {
          id?: string
          order_id: string
          organization_id: string
          product_id: string
          product_name: string
          quantity: number
          sku: string
          total: number
          unit_price: number
        }
        Update: {
          id?: string
          order_id?: string
          organization_id?: string
          product_id?: string
          product_name?: string
          quantity?: number
          sku?: string
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "online_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "online_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "online_order_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "online_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      online_order_status_history: {
        Row: {
          changed_by: string | null
          created_at: string
          from_status: Database["public"]["Enums"]["online_order_status"] | null
          id: string
          notes: string | null
          order_id: string
          organization_id: string
          to_status: Database["public"]["Enums"]["online_order_status"]
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          from_status?:
            | Database["public"]["Enums"]["online_order_status"]
            | null
          id?: string
          notes?: string | null
          order_id: string
          organization_id: string
          to_status: Database["public"]["Enums"]["online_order_status"]
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          from_status?:
            | Database["public"]["Enums"]["online_order_status"]
            | null
          id?: string
          notes?: string | null
          order_id?: string
          organization_id?: string
          to_status?: Database["public"]["Enums"]["online_order_status"]
        }
        Relationships: [
          {
            foreignKeyName: "online_order_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "online_order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "online_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "online_order_status_history_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      online_orders: {
        Row: {
          business_unit_id: string
          cancellation_reason: string | null
          cancelled_at: string | null
          cash_change_for: number | null
          confirmed_at: string | null
          coupon_id: string | null
          created_at: string
          customer_id: string | null
          customer_name: string
          customer_phone: string
          delivered_at: string | null
          delivery_address: Json | null
          delivery_fee: number
          delivery_zone_id: string | null
          discount: number
          fulfillment: Database["public"]["Enums"]["fulfillment_type"]
          id: string
          notes: string | null
          number: string
          organization_id: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          public_code: string
          status: Database["public"]["Enums"]["online_order_status"]
          subtotal: number
          total: number
          updated_at: string
        }
        Insert: {
          business_unit_id: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cash_change_for?: number | null
          confirmed_at?: string | null
          coupon_id?: string | null
          created_at?: string
          customer_id?: string | null
          customer_name: string
          customer_phone: string
          delivered_at?: string | null
          delivery_address?: Json | null
          delivery_fee?: number
          delivery_zone_id?: string | null
          discount?: number
          fulfillment: Database["public"]["Enums"]["fulfillment_type"]
          id?: string
          notes?: string | null
          number: string
          organization_id: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          public_code?: string
          status?: Database["public"]["Enums"]["online_order_status"]
          subtotal: number
          total: number
          updated_at?: string
        }
        Update: {
          business_unit_id?: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cash_change_for?: number | null
          confirmed_at?: string | null
          coupon_id?: string | null
          created_at?: string
          customer_id?: string | null
          customer_name?: string
          customer_phone?: string
          delivered_at?: string | null
          delivery_address?: Json | null
          delivery_fee?: number
          delivery_zone_id?: string | null
          discount?: number
          fulfillment?: Database["public"]["Enums"]["fulfillment_type"]
          id?: string
          notes?: string | null
          number?: string
          organization_id?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          public_code?: string
          status?: Database["public"]["Enums"]["online_order_status"]
          subtotal?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "online_orders_business_unit_id_fkey"
            columns: ["business_unit_id"]
            isOneToOne: false
            referencedRelation: "business_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "online_orders_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "online_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "online_orders_delivery_zone_id_fkey"
            columns: ["delivery_zone_id"]
            isOneToOne: false
            referencedRelation: "delivery_zones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "online_orders_organization_id_business_unit_id_fkey"
            columns: ["organization_id", "business_unit_id"]
            isOneToOne: false
            referencedRelation: "business_units"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "online_orders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          active: boolean
          catalog_slug: string
          created_at: string
          currency: string
          document: string | null
          email: string | null
          id: string
          legal_name: string | null
          logo_url: string | null
          name: string
          phone: string | null
          timezone: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          catalog_slug: string
          created_at?: string
          currency?: string
          document?: string | null
          email?: string | null
          id?: string
          legal_name?: string | null
          logo_url?: string | null
          name: string
          phone?: string | null
          timezone?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          catalog_slug?: string
          created_at?: string
          currency?: string
          document?: string | null
          email?: string | null
          id?: string
          legal_name?: string | null
          logo_url?: string | null
          name?: string
          phone?: string | null
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          method: Database["public"]["Enums"]["payment_method"]
          organization_id: string
          paid_at: string | null
          reference: string | null
          sale_id: string
          status: Database["public"]["Enums"]["payment_status"]
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          method: Database["public"]["Enums"]["payment_method"]
          organization_id: string
          paid_at?: string | null
          reference?: string | null
          sale_id: string
          status?: Database["public"]["Enums"]["payment_status"]
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          organization_id?: string
          paid_at?: string | null
          reference?: string | null
          sale_id?: string
          status?: Database["public"]["Enums"]["payment_status"]
        }
        Relationships: [
          {
            foreignKeyName: "payments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          code: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          code: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          code?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      product_categories: {
        Row: {
          active: boolean
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          name: string
          organization_id: string
          parent_id: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          name: string
          organization_id: string
          parent_id?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          name?: string
          organization_id?: string
          parent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          created_at: string
          id: string
          is_primary: boolean
          organization_id: string
          position: number
          product_id: string
          storage_path: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_primary?: boolean
          organization_id: string
          position?: number
          product_id: string
          storage_path: string
        }
        Update: {
          created_at?: string
          id?: string
          is_primary?: boolean
          organization_id?: string
          position?: number
          product_id?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean
          barcode: string | null
          brand_id: string | null
          category_id: string | null
          cost_price: number
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          description: string | null
          id: string
          location: string | null
          minimum_stock: number
          name: string
          notes: string | null
          organization_id: string
          sale_price: number
          sku: string
          supplier_id: string | null
          unit: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          active?: boolean
          barcode?: string | null
          brand_id?: string | null
          category_id?: string | null
          cost_price?: number
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          id?: string
          location?: string | null
          minimum_stock?: number
          name: string
          notes?: string | null
          organization_id: string
          sale_price?: number
          sku: string
          supplier_id?: string | null
          unit?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          active?: boolean
          barcode?: string | null
          brand_id?: string | null
          category_id?: string | null
          cost_price?: number
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          id?: string
          location?: string | null
          minimum_stock?: number
          name?: string
          notes?: string | null
          organization_id?: string
          sale_price?: number
          sku?: string
          supplier_id?: string | null
          unit?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active: boolean
          auth_user_id: string
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          name: string
          organization_id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          auth_user_id: string
          avatar_url?: string | null
          created_at?: string
          email: string
          id?: string
          name: string
          organization_id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          auth_user_id?: string
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          organization_id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_items: {
        Row: {
          created_at: string
          description: string
          discount: number
          id: string
          organization_id: string
          product_id: string | null
          quantity: number
          quote_id: string
          total: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          description: string
          discount?: number
          id?: string
          organization_id: string
          product_id?: string | null
          quantity: number
          quote_id: string
          total: number
          unit_price: number
        }
        Update: {
          created_at?: string
          description?: string
          discount?: number
          id?: string
          organization_id?: string
          product_id?: string | null
          quantity?: number
          quote_id?: string
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "quote_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          business_unit_id: string
          created_at: string
          created_by: string
          customer_id: string | null
          deleted_at: string | null
          discount: number
          id: string
          notes: string | null
          number: string
          organization_id: string
          status: Database["public"]["Enums"]["quote_status"]
          subtotal: number
          total: number
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          business_unit_id: string
          created_at?: string
          created_by: string
          customer_id?: string | null
          deleted_at?: string | null
          discount?: number
          id?: string
          notes?: string | null
          number: string
          organization_id: string
          status?: Database["public"]["Enums"]["quote_status"]
          subtotal?: number
          total?: number
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          business_unit_id?: string
          created_at?: string
          created_by?: string
          customer_id?: string | null
          deleted_at?: string | null
          discount?: number
          id?: string
          notes?: string | null
          number?: string
          organization_id?: string
          status?: Database["public"]["Enums"]["quote_status"]
          subtotal?: number
          total?: number
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotes_business_unit_id_fkey"
            columns: ["business_unit_id"]
            isOneToOne: false
            referencedRelation: "business_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_org_unit_fk"
            columns: ["organization_id", "business_unit_id"]
            isOneToOne: false
            referencedRelation: "business_units"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "quotes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limit_buckets: {
        Row: {
          key: string
          request_count: number
          updated_at: string
          window_started_at: string
        }
        Insert: {
          key: string
          request_count?: number
          updated_at?: string
          window_started_at: string
        }
        Update: {
          key?: string
          request_count?: number
          updated_at?: string
          window_started_at?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          permission_id: string
          role_id: string
        }
        Insert: {
          permission_id: string
          role_id: string
        }
        Update: {
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          description: string | null
          id: string
          is_system_role: boolean
          name: string
          organization_id: string
        }
        Insert: {
          description?: string | null
          id?: string
          is_system_role?: boolean
          name: string
          organization_id: string
        }
        Update: {
          description?: string | null
          id?: string
          is_system_role?: boolean
          name?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "roles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_items: {
        Row: {
          cost_price_snapshot: number
          created_at: string
          discount: number
          id: string
          organization_id: string
          product_id: string
          product_name: string
          quantity: number
          sale_id: string
          sku: string
          total: number
          unit_price: number
        }
        Insert: {
          cost_price_snapshot: number
          created_at?: string
          discount?: number
          id?: string
          organization_id: string
          product_id: string
          product_name: string
          quantity: number
          sale_id: string
          sku: string
          total: number
          unit_price: number
        }
        Update: {
          cost_price_snapshot?: number
          created_at?: string
          discount?: number
          id?: string
          organization_id?: string
          product_id?: string
          product_name?: string
          quantity?: number
          sale_id?: string
          sku?: string
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          business_unit_id: string
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          created_at: string
          customer_id: string | null
          discount: number
          id: string
          notes: string | null
          number: string
          organization_id: string
          quote_id: string | null
          seller_id: string
          status: Database["public"]["Enums"]["sale_status"]
          subtotal: number
          total: number
          updated_at: string
        }
        Insert: {
          business_unit_id: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string
          customer_id?: string | null
          discount?: number
          id?: string
          notes?: string | null
          number: string
          organization_id: string
          quote_id?: string | null
          seller_id: string
          status?: Database["public"]["Enums"]["sale_status"]
          subtotal: number
          total: number
          updated_at?: string
        }
        Update: {
          business_unit_id?: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string
          customer_id?: string | null
          discount?: number
          id?: string
          notes?: string | null
          number?: string
          organization_id?: string
          quote_id?: string | null
          seller_id?: string
          status?: Database["public"]["Enums"]["sale_status"]
          subtotal?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_business_unit_id_fkey"
            columns: ["business_unit_id"]
            isOneToOne: false
            referencedRelation: "business_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_cancelled_by_fkey"
            columns: ["cancelled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_org_unit_fk"
            columns: ["organization_id", "business_unit_id"]
            isOneToOne: false
            referencedRelation: "business_units"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "sales_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      service_catalog: {
        Row: {
          active: boolean
          created_at: string
          deleted_at: string | null
          description: string | null
          estimated_minutes: number | null
          id: string
          name: string
          organization_id: string
          price: number
          updated_at: string
          warranty_days: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          estimated_minutes?: number | null
          id?: string
          name: string
          organization_id: string
          price?: number
          updated_at?: string
          warranty_days?: number
        }
        Update: {
          active?: boolean
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          estimated_minutes?: number | null
          id?: string
          name?: string
          organization_id?: string
          price?: number
          updated_at?: string
          warranty_days?: number
        }
        Relationships: [
          {
            foreignKeyName: "service_catalog_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      service_order_access_secrets: {
        Row: {
          access_instructions: string
          business_unit_id: string
          organization_id: string
          service_order_id: string
          updated_at: string
          updated_by: string
        }
        Insert: {
          access_instructions: string
          business_unit_id: string
          organization_id: string
          service_order_id: string
          updated_at?: string
          updated_by: string
        }
        Update: {
          access_instructions?: string
          business_unit_id?: string
          organization_id?: string
          service_order_id?: string
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_order_access_secrets_business_unit_id_fkey"
            columns: ["business_unit_id"]
            isOneToOne: false
            referencedRelation: "business_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_order_access_secrets_organization_id_business_unit_fkey"
            columns: ["organization_id", "business_unit_id"]
            isOneToOne: false
            referencedRelation: "business_units"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "service_order_access_secrets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_order_access_secrets_service_order_id_fkey"
            columns: ["service_order_id"]
            isOneToOne: true
            referencedRelation: "service_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_order_access_secrets_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      service_order_checklist: {
        Row: {
          business_unit_id: string
          checked: boolean
          checked_at: string | null
          checked_by: string | null
          id: string
          label: string
          notes: string | null
          organization_id: string
          service_order_id: string
          template_item_id: string | null
        }
        Insert: {
          business_unit_id: string
          checked?: boolean
          checked_at?: string | null
          checked_by?: string | null
          id?: string
          label: string
          notes?: string | null
          organization_id: string
          service_order_id: string
          template_item_id?: string | null
        }
        Update: {
          business_unit_id?: string
          checked?: boolean
          checked_at?: string | null
          checked_by?: string | null
          id?: string
          label?: string
          notes?: string | null
          organization_id?: string
          service_order_id?: string
          template_item_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_order_checklist_business_unit_id_fkey"
            columns: ["business_unit_id"]
            isOneToOne: false
            referencedRelation: "business_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_order_checklist_checked_by_fkey"
            columns: ["checked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_order_checklist_organization_id_business_unit_id_fkey"
            columns: ["organization_id", "business_unit_id"]
            isOneToOne: false
            referencedRelation: "business_units"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "service_order_checklist_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_order_checklist_service_order_id_fkey"
            columns: ["service_order_id"]
            isOneToOne: false
            referencedRelation: "service_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_order_checklist_template_item_id_fkey"
            columns: ["template_item_id"]
            isOneToOne: false
            referencedRelation: "checklist_template_items"
            referencedColumns: ["id"]
          },
        ]
      }
      service_order_documents: {
        Row: {
          business_unit_id: string
          generated_at: string
          generated_by: string
          id: string
          organization_id: string
          paper_format: Database["public"]["Enums"]["document_paper_format"]
          service_order_id: string
          type: Database["public"]["Enums"]["service_order_document_type"]
        }
        Insert: {
          business_unit_id: string
          generated_at?: string
          generated_by: string
          id?: string
          organization_id: string
          paper_format: Database["public"]["Enums"]["document_paper_format"]
          service_order_id: string
          type: Database["public"]["Enums"]["service_order_document_type"]
        }
        Update: {
          business_unit_id?: string
          generated_at?: string
          generated_by?: string
          id?: string
          organization_id?: string
          paper_format?: Database["public"]["Enums"]["document_paper_format"]
          service_order_id?: string
          type?: Database["public"]["Enums"]["service_order_document_type"]
        }
        Relationships: [
          {
            foreignKeyName: "service_order_documents_business_unit_id_fkey"
            columns: ["business_unit_id"]
            isOneToOne: false
            referencedRelation: "business_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_order_documents_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_order_documents_organization_id_business_unit_id_fkey"
            columns: ["organization_id", "business_unit_id"]
            isOneToOne: false
            referencedRelation: "business_units"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "service_order_documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_order_documents_service_order_id_fkey"
            columns: ["service_order_id"]
            isOneToOne: false
            referencedRelation: "service_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      service_order_notes: {
        Row: {
          business_unit_id: string
          created_at: string
          created_by: string
          id: string
          internal: boolean
          note: string
          organization_id: string
          service_order_id: string
        }
        Insert: {
          business_unit_id: string
          created_at?: string
          created_by: string
          id?: string
          internal?: boolean
          note: string
          organization_id: string
          service_order_id: string
        }
        Update: {
          business_unit_id?: string
          created_at?: string
          created_by?: string
          id?: string
          internal?: boolean
          note?: string
          organization_id?: string
          service_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_order_notes_business_unit_id_fkey"
            columns: ["business_unit_id"]
            isOneToOne: false
            referencedRelation: "business_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_order_notes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_order_notes_organization_id_business_unit_id_fkey"
            columns: ["organization_id", "business_unit_id"]
            isOneToOne: false
            referencedRelation: "business_units"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "service_order_notes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_order_notes_service_order_id_fkey"
            columns: ["service_order_id"]
            isOneToOne: false
            referencedRelation: "service_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      service_order_parts: {
        Row: {
          business_unit_id: string
          cost_price_snapshot: number
          created_at: string
          discount: number
          id: string
          inventory_applied: boolean
          organization_id: string
          product_id: string
          product_name: string
          quantity: number
          removal_reason: string | null
          removed_at: string | null
          removed_by: string | null
          service_order_id: string
          sku: string
          total: number
          unit_price: number
        }
        Insert: {
          business_unit_id: string
          cost_price_snapshot: number
          created_at?: string
          discount?: number
          id?: string
          inventory_applied?: boolean
          organization_id: string
          product_id: string
          product_name: string
          quantity: number
          removal_reason?: string | null
          removed_at?: string | null
          removed_by?: string | null
          service_order_id: string
          sku: string
          total: number
          unit_price: number
        }
        Update: {
          business_unit_id?: string
          cost_price_snapshot?: number
          created_at?: string
          discount?: number
          id?: string
          inventory_applied?: boolean
          organization_id?: string
          product_id?: string
          product_name?: string
          quantity?: number
          removal_reason?: string | null
          removed_at?: string | null
          removed_by?: string | null
          service_order_id?: string
          sku?: string
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "service_order_parts_business_unit_id_fkey"
            columns: ["business_unit_id"]
            isOneToOne: false
            referencedRelation: "business_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_order_parts_organization_id_business_unit_id_fkey"
            columns: ["organization_id", "business_unit_id"]
            isOneToOne: false
            referencedRelation: "business_units"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "service_order_parts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_order_parts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_order_parts_removed_by_fkey"
            columns: ["removed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_order_parts_service_order_id_fkey"
            columns: ["service_order_id"]
            isOneToOne: false
            referencedRelation: "service_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      service_order_payments: {
        Row: {
          amount: number
          business_unit_id: string
          cash_movement_id: string | null
          created_by: string
          id: string
          method: Database["public"]["Enums"]["payment_method"]
          organization_id: string
          paid_at: string
          reference: string | null
          service_order_id: string
          status: Database["public"]["Enums"]["payment_status"]
        }
        Insert: {
          amount: number
          business_unit_id: string
          cash_movement_id?: string | null
          created_by: string
          id?: string
          method: Database["public"]["Enums"]["payment_method"]
          organization_id: string
          paid_at?: string
          reference?: string | null
          service_order_id: string
          status?: Database["public"]["Enums"]["payment_status"]
        }
        Update: {
          amount?: number
          business_unit_id?: string
          cash_movement_id?: string | null
          created_by?: string
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          organization_id?: string
          paid_at?: string
          reference?: string | null
          service_order_id?: string
          status?: Database["public"]["Enums"]["payment_status"]
        }
        Relationships: [
          {
            foreignKeyName: "service_order_payments_business_unit_id_fkey"
            columns: ["business_unit_id"]
            isOneToOne: false
            referencedRelation: "business_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_order_payments_cash_movement_id_fkey"
            columns: ["cash_movement_id"]
            isOneToOne: false
            referencedRelation: "cash_movements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_order_payments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_order_payments_organization_id_business_unit_id_fkey"
            columns: ["organization_id", "business_unit_id"]
            isOneToOne: false
            referencedRelation: "business_units"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "service_order_payments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_order_payments_service_order_id_fkey"
            columns: ["service_order_id"]
            isOneToOne: false
            referencedRelation: "service_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      service_order_photos: {
        Row: {
          business_unit_id: string
          caption: string | null
          created_at: string
          created_by: string
          id: string
          organization_id: string
          service_order_id: string
          storage_path: string
        }
        Insert: {
          business_unit_id: string
          caption?: string | null
          created_at?: string
          created_by: string
          id?: string
          organization_id: string
          service_order_id: string
          storage_path: string
        }
        Update: {
          business_unit_id?: string
          caption?: string | null
          created_at?: string
          created_by?: string
          id?: string
          organization_id?: string
          service_order_id?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_order_photos_business_unit_id_fkey"
            columns: ["business_unit_id"]
            isOneToOne: false
            referencedRelation: "business_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_order_photos_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_order_photos_organization_id_business_unit_id_fkey"
            columns: ["organization_id", "business_unit_id"]
            isOneToOne: false
            referencedRelation: "business_units"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "service_order_photos_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_order_photos_service_order_id_fkey"
            columns: ["service_order_id"]
            isOneToOne: false
            referencedRelation: "service_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      service_order_services: {
        Row: {
          business_unit_id: string
          created_at: string
          description: string
          discount: number
          id: string
          organization_id: string
          quantity: number
          removal_reason: string | null
          removed_at: string | null
          removed_by: string | null
          service_id: string | null
          service_order_id: string
          total: number
          unit_price: number
          warranty_days: number
        }
        Insert: {
          business_unit_id: string
          created_at?: string
          description: string
          discount?: number
          id?: string
          organization_id: string
          quantity: number
          removal_reason?: string | null
          removed_at?: string | null
          removed_by?: string | null
          service_id?: string | null
          service_order_id: string
          total: number
          unit_price: number
          warranty_days?: number
        }
        Update: {
          business_unit_id?: string
          created_at?: string
          description?: string
          discount?: number
          id?: string
          organization_id?: string
          quantity?: number
          removal_reason?: string | null
          removed_at?: string | null
          removed_by?: string | null
          service_id?: string | null
          service_order_id?: string
          total?: number
          unit_price?: number
          warranty_days?: number
        }
        Relationships: [
          {
            foreignKeyName: "service_order_services_business_unit_id_fkey"
            columns: ["business_unit_id"]
            isOneToOne: false
            referencedRelation: "business_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_order_services_organization_id_business_unit_id_fkey"
            columns: ["organization_id", "business_unit_id"]
            isOneToOne: false
            referencedRelation: "business_units"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "service_order_services_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_order_services_removed_by_fkey"
            columns: ["removed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_order_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "service_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_order_services_service_order_id_fkey"
            columns: ["service_order_id"]
            isOneToOne: false
            referencedRelation: "service_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      service_order_status_history: {
        Row: {
          business_unit_id: string
          changed_at: string
          changed_by: string
          from_status_id: string | null
          id: string
          note: string | null
          organization_id: string
          service_order_id: string
          to_status_id: string
        }
        Insert: {
          business_unit_id: string
          changed_at?: string
          changed_by: string
          from_status_id?: string | null
          id?: string
          note?: string | null
          organization_id: string
          service_order_id: string
          to_status_id: string
        }
        Update: {
          business_unit_id?: string
          changed_at?: string
          changed_by?: string
          from_status_id?: string | null
          id?: string
          note?: string | null
          organization_id?: string
          service_order_id?: string
          to_status_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_order_status_history_business_unit_id_fkey"
            columns: ["business_unit_id"]
            isOneToOne: false
            referencedRelation: "business_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_order_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_order_status_history_from_status_id_fkey"
            columns: ["from_status_id"]
            isOneToOne: false
            referencedRelation: "service_order_statuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_order_status_history_organization_id_business_unit_fkey"
            columns: ["organization_id", "business_unit_id"]
            isOneToOne: false
            referencedRelation: "business_units"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "service_order_status_history_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_order_status_history_service_order_id_fkey"
            columns: ["service_order_id"]
            isOneToOne: false
            referencedRelation: "service_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_order_status_history_to_status_id_fkey"
            columns: ["to_status_id"]
            isOneToOne: false
            referencedRelation: "service_order_statuses"
            referencedColumns: ["id"]
          },
        ]
      }
      service_order_statuses: {
        Row: {
          active: boolean
          business_unit_id: string
          code: string
          color: string
          created_at: string
          id: string
          is_final: boolean
          name: string
          organization_id: string
          position: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          business_unit_id: string
          code: string
          color?: string
          created_at?: string
          id?: string
          is_final?: boolean
          name: string
          organization_id: string
          position?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          business_unit_id?: string
          code?: string
          color?: string
          created_at?: string
          id?: string
          is_final?: boolean
          name?: string
          organization_id?: string
          position?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_order_statuses_business_unit_id_fkey"
            columns: ["business_unit_id"]
            isOneToOne: false
            referencedRelation: "business_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_order_statuses_organization_id_business_unit_id_fkey"
            columns: ["organization_id", "business_unit_id"]
            isOneToOne: false
            referencedRelation: "business_units"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "service_order_statuses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      service_orders: {
        Row: {
          accessories: string | null
          advance_amount: number
          assigned_technician_id: string | null
          brand_name: string | null
          business_unit_id: string
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          color: string | null
          created_at: string
          created_by: string
          customer_id: string
          discount: number
          equipment_model_id: string | null
          equipment_name: string
          equipment_type_id: string | null
          estimated_delivery_at: string | null
          general_notes: string | null
          id: string
          imei: string | null
          invoice_number: string | null
          is_warranty: boolean
          model_name: string | null
          number: string
          organization_id: string
          parts_total: number
          reported_defect: string
          serial_number: string | null
          service_total: number
          status_id: string
          total: number
          updated_at: string
          updated_by: string
          visible_damage: string | null
          voltage: string | null
          warranty_reference_id: string | null
          warranty_until: string | null
        }
        Insert: {
          accessories?: string | null
          advance_amount?: number
          assigned_technician_id?: string | null
          brand_name?: string | null
          business_unit_id: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          color?: string | null
          created_at?: string
          created_by: string
          customer_id: string
          discount?: number
          equipment_model_id?: string | null
          equipment_name: string
          equipment_type_id?: string | null
          estimated_delivery_at?: string | null
          general_notes?: string | null
          id?: string
          imei?: string | null
          invoice_number?: string | null
          is_warranty?: boolean
          model_name?: string | null
          number: string
          organization_id: string
          parts_total?: number
          reported_defect: string
          serial_number?: string | null
          service_total?: number
          status_id: string
          total?: number
          updated_at?: string
          updated_by: string
          visible_damage?: string | null
          voltage?: string | null
          warranty_reference_id?: string | null
          warranty_until?: string | null
        }
        Update: {
          accessories?: string | null
          advance_amount?: number
          assigned_technician_id?: string | null
          brand_name?: string | null
          business_unit_id?: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          color?: string | null
          created_at?: string
          created_by?: string
          customer_id?: string
          discount?: number
          equipment_model_id?: string | null
          equipment_name?: string
          equipment_type_id?: string | null
          estimated_delivery_at?: string | null
          general_notes?: string | null
          id?: string
          imei?: string | null
          invoice_number?: string | null
          is_warranty?: boolean
          model_name?: string | null
          number?: string
          organization_id?: string
          parts_total?: number
          reported_defect?: string
          serial_number?: string | null
          service_total?: number
          status_id?: string
          total?: number
          updated_at?: string
          updated_by?: string
          visible_damage?: string | null
          voltage?: string | null
          warranty_reference_id?: string | null
          warranty_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_orders_assigned_technician_id_fkey"
            columns: ["assigned_technician_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_orders_business_unit_id_fkey"
            columns: ["business_unit_id"]
            isOneToOne: false
            referencedRelation: "business_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_orders_cancelled_by_fkey"
            columns: ["cancelled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_orders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_orders_equipment_model_id_fkey"
            columns: ["equipment_model_id"]
            isOneToOne: false
            referencedRelation: "equipment_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_orders_equipment_type_id_fkey"
            columns: ["equipment_type_id"]
            isOneToOne: false
            referencedRelation: "equipment_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_orders_organization_id_business_unit_id_fkey"
            columns: ["organization_id", "business_unit_id"]
            isOneToOne: false
            referencedRelation: "business_units"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "service_orders_organization_id_business_unit_id_status_id_fkey"
            columns: ["organization_id", "business_unit_id", "status_id"]
            isOneToOne: false
            referencedRelation: "service_order_statuses"
            referencedColumns: ["organization_id", "business_unit_id", "id"]
          },
          {
            foreignKeyName: "service_orders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_orders_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_orders_warranty_reference_id_fkey"
            columns: ["warranty_reference_id"]
            isOneToOne: false
            referencedRelation: "service_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          active: boolean
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          document: string | null
          email: string | null
          id: string
          legal_name: string | null
          name: string
          notes: string | null
          organization_id: string
          phone: string | null
          updated_at: string
          updated_by: string | null
          whatsapp: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          document?: string | null
          email?: string | null
          id?: string
          legal_name?: string | null
          name: string
          notes?: string | null
          organization_id: string
          phone?: string | null
          updated_at?: string
          updated_by?: string | null
          whatsapp?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          document?: string | null
          email?: string | null
          id?: string
          legal_name?: string | null
          name?: string
          notes?: string | null
          organization_id?: string
          phone?: string | null
          updated_at?: string
          updated_by?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suppliers_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suppliers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suppliers_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          role_id: string
          user_id: string
        }
        Insert: {
          role_id: string
          user_id: string
        }
        Update: {
          role_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_service_order_checklist_item: {
        Args: { p_label: string; p_service_order_id: string }
        Returns: string
      }
      add_service_order_part: {
        Args: {
          p_discount?: number
          p_product_id: string
          p_quantity: number
          p_service_order_id: string
          p_unit_price?: number
        }
        Returns: string
      }
      add_service_order_service: {
        Args: {
          p_description: string
          p_discount?: number
          p_quantity: number
          p_service_id?: string
          p_service_order_id: string
          p_unit_price: number
          p_warranty_days?: number
        }
        Returns: string
      }
      adjust_inventory: {
        Args: {
          p_business_unit_id: string
          p_product_id: string
          p_quantity: number
          p_reason: string
          p_reference_id?: string
          p_reference_type?: string
          p_type: Database["public"]["Enums"]["inventory_movement_type"]
        }
        Returns: {
          business_unit_id: string
          id: string
          organization_id: string
          product_id: string
          quantity: number
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "inventory"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      bill_service_order: {
        Args: {
          p_cash_session_id?: string
          p_payments: Json
          p_service_order_id: string
        }
        Returns: undefined
      }
      bootstrap_organization: {
        Args: {
          auth_id: string
          org_name: string
          profile_email: string
          profile_name: string
        }
        Returns: string
      }
      business_unit_belongs_to_current_org: {
        Args: { p_business_unit_id: string }
        Returns: boolean
      }
      cancel_account_payable: {
        Args: { p_payable_id: string; p_reason: string }
        Returns: undefined
      }
      cancel_sale: {
        Args: {
          p_cash_session_id?: string
          p_reason: string
          p_sale_id: string
        }
        Returns: undefined
      }
      close_cash_session: {
        Args: {
          p_cash_session_id: string
          p_closing_balance: number
          p_notes?: string
        }
        Returns: {
          business_unit_id: string
          cash_register_id: string
          closed_at: string | null
          closed_by: string | null
          closing_balance: number | null
          difference: number | null
          expected_balance: number | null
          id: string
          notes: string | null
          opened_at: string
          opened_by: string
          opening_balance: number
          organization_id: string
          status: Database["public"]["Enums"]["cash_session_status"]
        }
        SetofOptions: {
          from: "*"
          to: "cash_sessions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      complete_sale: {
        Args: {
          p_business_unit_id: string
          p_cash_session_id?: string
          p_customer_id: string
          p_discount?: number
          p_items: Json
          p_notes?: string
          p_payments: Json
        }
        Returns: string
      }
      consume_rate_limit: {
        Args: { p_key: string; p_limit: number; p_window_seconds: number }
        Returns: {
          allowed: boolean
          retry_after: number
        }[]
      }
      convert_quote_to_sale: {
        Args: {
          p_cash_session_id?: string
          p_payments: Json
          p_quote_id: string
        }
        Returns: string
      }
      create_account_payable: {
        Args: {
          p_amount: number
          p_business_unit_id: string
          p_category: string
          p_description: string
          p_due_date: string
          p_supplier_id: string
        }
        Returns: string
      }
      create_public_order: {
        Args: {
          p_address: Json
          p_cash_change_for: number
          p_coupon_code: string
          p_customer_name: string
          p_customer_phone: string
          p_delivery_zone_id: string
          p_fulfillment: Database["public"]["Enums"]["fulfillment_type"]
          p_items: Json
          p_notes?: string
          p_payment_method: Database["public"]["Enums"]["payment_method"]
          p_slug: string
        }
        Returns: Json
      }
      create_quote: {
        Args: {
          p_business_unit_id: string
          p_customer_id: string
          p_discount?: number
          p_items: Json
          p_notes?: string
          p_valid_until?: string
        }
        Returns: string
      }
      create_service_order: {
        Args: {
          p_access_instructions?: string
          p_accessories?: string
          p_assigned_technician_id?: string
          p_brand_name?: string
          p_business_unit_id: string
          p_color?: string
          p_customer_id: string
          p_equipment_name: string
          p_estimated_delivery_at?: string
          p_general_notes?: string
          p_imei?: string
          p_invoice_number?: string
          p_is_warranty?: boolean
          p_model_name?: string
          p_reported_defect: string
          p_serial_number?: string
          p_visible_damage?: string
          p_voltage?: string
          p_warranty_reference_id?: string
        }
        Returns: string
      }
      current_organization_id: { Args: never; Returns: string }
      current_profile_id: { Args: never; Returns: string }
      get_public_catalog: { Args: { p_slug: string }; Returns: Json }
      get_public_order: { Args: { p_code: string }; Returns: Json }
      has_permission: { Args: { requested: string }; Returns: boolean }
      health_check: { Args: never; Returns: boolean }
      open_cash_session: {
        Args: {
          p_business_unit_id: string
          p_cash_register_id: string
          p_opening_balance?: number
        }
        Returns: string
      }
      populate_demo_data: { Args: never; Returns: Json }
      rate_limit_cleanup: { Args: never; Returns: number }
      recalculate_service_order_totals: {
        Args: { p_service_order_id: string }
        Returns: undefined
      }
      record_auth_event: {
        Args: {
          p_action: string
          p_email: string
          p_ip_address?: unknown
          p_user_agent?: string
        }
        Returns: undefined
      }
      record_cash_movement: {
        Args: {
          p_amount: number
          p_cash_session_id: string
          p_description: string
          p_type: Database["public"]["Enums"]["cash_movement_type"]
        }
        Returns: string
      }
      record_report_export: {
        Args: { p_filters?: Json; p_report: string }
        Returns: string
      }
      record_service_order_document: {
        Args: {
          p_paper_format: Database["public"]["Enums"]["document_paper_format"]
          p_service_order_id: string
          p_type: Database["public"]["Enums"]["service_order_document_type"]
        }
        Returns: string
      }
      register_service_order_photo: {
        Args: {
          p_caption?: string
          p_service_order_id: string
          p_storage_path: string
        }
        Returns: string
      }
      remove_service_order_item: {
        Args: {
          p_item_id: string
          p_item_type: string
          p_reason: string
          p_service_order_id: string
        }
        Returns: undefined
      }
      reverse_service_order_billing: {
        Args: {
          p_cash_session_id?: string
          p_reason: string
          p_service_order_id: string
        }
        Returns: undefined
      }
      seed_service_order_statuses: {
        Args: { p_business_unit_id: string; p_organization_id: string }
        Returns: undefined
      }
      set_quote_status: {
        Args: {
          p_quote_id: string
          p_status: Database["public"]["Enums"]["quote_status"]
        }
        Returns: undefined
      }
      set_service_order_checklist_item: {
        Args: { p_checked: boolean; p_item_id: string; p_notes?: string }
        Returns: undefined
      }
      set_service_order_status: {
        Args: {
          p_note?: string
          p_service_order_id: string
          p_status_code: string
        }
        Returns: undefined
      }
      settle_account_payable: {
        Args: {
          p_cash_session_id?: string
          p_payable_id: string
          p_payment_method: Database["public"]["Enums"]["payment_method"]
        }
        Returns: undefined
      }
      transfer_inventory: {
        Args: {
          p_from_business_unit_id: string
          p_product_id: string
          p_quantity: number
          p_reason: string
          p_to_business_unit_id: string
        }
        Returns: string
      }
      transition_online_order: {
        Args: {
          p_cash_session_id?: string
          p_notes?: string
          p_order_id: string
          p_status: Database["public"]["Enums"]["online_order_status"]
        }
        Returns: undefined
      }
    }
    Enums: {
      backup_status: "STARTED" | "SUCCESS" | "FAILED"
      business_unit_type: "TECHNICAL_ASSISTANCE" | "STORE_DELIVERY"
      cash_movement_type:
        | "OPENING"
        | "SALE"
        | "SUPPLY"
        | "WITHDRAWAL"
        | "REFUND"
      cash_session_status: "OPEN" | "CLOSED"
      coupon_discount_type: "PERCENT" | "FIXED"
      customer_type: "PERSON" | "COMPANY"
      document_paper_format: "A4" | "THERMAL_80" | "THERMAL_58"
      fulfillment_type: "DELIVERY" | "PICKUP" | "LOCAL"
      inventory_movement_type:
        | "INITIAL"
        | "PURCHASE"
        | "SALE"
        | "RETURN"
        | "ADJUSTMENT"
        | "ENTRY"
        | "EXIT"
        | "CANCELLATION"
      inventory_reservation_status: "ACTIVE" | "CONSUMED" | "RELEASED"
      online_order_status:
        | "NEW"
        | "CONFIRMED"
        | "PREPARING"
        | "READY"
        | "OUT_FOR_DELIVERY"
        | "DELIVERED"
        | "CANCELLED"
      payable_status: "PENDING" | "PAID" | "PARTIAL" | "OVERDUE" | "CANCELLED"
      payment_method:
        | "CASH"
        | "PIX"
        | "CREDIT_CARD"
        | "DEBIT_CARD"
        | "BANK_TRANSFER"
        | "BOLETO"
        | "OTHER"
      payment_status: "PENDING" | "PAID" | "CANCELLED" | "REFUNDED"
      quote_status:
        | "DRAFT"
        | "SENT"
        | "APPROVED"
        | "REJECTED"
        | "EXPIRED"
        | "CONVERTED"
        | "CANCELLED"
      receivable_status:
        | "PENDING"
        | "PAID"
        | "PARTIAL"
        | "OVERDUE"
        | "CANCELLED"
      sale_status: "OPEN" | "COMPLETED" | "CANCELLED" | "REFUNDED"
      service_order_document_type:
        | "ENTRY"
        | "QUOTE"
        | "RECEIPT"
        | "WARRANTY"
        | "TECHNICAL_REPORT"
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
      backup_status: ["STARTED", "SUCCESS", "FAILED"],
      business_unit_type: ["TECHNICAL_ASSISTANCE", "STORE_DELIVERY"],
      cash_movement_type: ["OPENING", "SALE", "SUPPLY", "WITHDRAWAL", "REFUND"],
      cash_session_status: ["OPEN", "CLOSED"],
      coupon_discount_type: ["PERCENT", "FIXED"],
      customer_type: ["PERSON", "COMPANY"],
      document_paper_format: ["A4", "THERMAL_80", "THERMAL_58"],
      fulfillment_type: ["DELIVERY", "PICKUP", "LOCAL"],
      inventory_movement_type: [
        "INITIAL",
        "PURCHASE",
        "SALE",
        "RETURN",
        "ADJUSTMENT",
        "ENTRY",
        "EXIT",
        "CANCELLATION",
      ],
      inventory_reservation_status: ["ACTIVE", "CONSUMED", "RELEASED"],
      online_order_status: [
        "NEW",
        "CONFIRMED",
        "PREPARING",
        "READY",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
        "CANCELLED",
      ],
      payable_status: ["PENDING", "PAID", "PARTIAL", "OVERDUE", "CANCELLED"],
      payment_method: [
        "CASH",
        "PIX",
        "CREDIT_CARD",
        "DEBIT_CARD",
        "BANK_TRANSFER",
        "BOLETO",
        "OTHER",
      ],
      payment_status: ["PENDING", "PAID", "CANCELLED", "REFUNDED"],
      quote_status: [
        "DRAFT",
        "SENT",
        "APPROVED",
        "REJECTED",
        "EXPIRED",
        "CONVERTED",
        "CANCELLED",
      ],
      receivable_status: ["PENDING", "PAID", "PARTIAL", "OVERDUE", "CANCELLED"],
      sale_status: ["OPEN", "COMPLETED", "CANCELLED", "REFUNDED"],
      service_order_document_type: [
        "ENTRY",
        "QUOTE",
        "RECEIPT",
        "WARRANTY",
        "TECHNICAL_REPORT",
      ],
    },
  },
} as const
