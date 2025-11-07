export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      activities: {
        Row: {
          amount: string | null
          created_at: string
          date: string
          description: string
          id: string
          location: string | null
          property: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount?: string | null
          created_at?: string
          date?: string
          description: string
          id?: string
          location?: string | null
          property?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: string | null
          created_at?: string
          date?: string
          description?: string
          id?: string
          location?: string | null
          property?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      announcements: {
        Row: {
          content: string
          created_at: string
          expires_at: string | null
          id: string
          is_global: boolean
          property_id: string | null
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_global?: boolean
          property_id?: string | null
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_global?: boolean
          property_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "announcements_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      application_documents: {
        Row: {
          application_id: string | null
          created_at: string | null
          document_id: string | null
          document_type: string
          id: string
        }
        Insert: {
          application_id?: string | null
          created_at?: string | null
          document_id?: string | null
          document_type: string
          id?: string
        }
        Update: {
          application_id?: string | null
          created_at?: string | null
          document_id?: string | null
          document_type?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_documents_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "rental_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_documents_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          category: string
          created_at: string
          description: string | null
          file_path: string
          file_size: number
          file_type: string
          id: string
          name: string
          property_id: string | null
          tenant_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          file_path: string
          file_size: number
          file_type: string
          id?: string
          name: string
          property_id?: string | null
          tenant_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          name?: string
          property_id?: string | null
          tenant_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_transactions: {
        Row: {
          amount: number
          category: string
          created_at: string
          date: string
          description: string | null
          id: string
          property_id: string | null
          tenant_id: string | null
          type: string
          updated_at: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          date: string
          description?: string | null
          id?: string
          property_id?: string | null
          tenant_id?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          property_id?: string | null
          tenant_id?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_transactions_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_transactions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          created_at: string | null
          due_date: string
          id: string
          items: Json | null
          notes: string | null
          property_id: string
          status: string
          subtotal: number
          tax: number
          tenant_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          due_date: string
          id?: string
          items?: Json | null
          notes?: string | null
          property_id: string
          status?: string
          subtotal: number
          tax: number
          tenant_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          due_date?: string
          id?: string
          items?: Json | null
          notes?: string | null
          property_id?: string
          status?: string
          subtotal?: number
          tax?: number
          tenant_id?: string
        }
        Relationships: []
      }
      lease_actions: {
        Row: {
          action_type: string
          created_at: string
          effective_date: string | null
          id: string
          initiated_by: string
          lease_id: string
          new_end_date: string | null
          new_monthly_rent: number | null
          property_id: string
          reason: string | null
          renewal_term_months: number | null
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          action_type: string
          created_at?: string
          effective_date?: string | null
          id?: string
          initiated_by: string
          lease_id: string
          new_end_date?: string | null
          new_monthly_rent?: number | null
          property_id: string
          reason?: string | null
          renewal_term_months?: number | null
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          action_type?: string
          created_at?: string
          effective_date?: string | null
          id?: string
          initiated_by?: string
          lease_id?: string
          new_end_date?: string | null
          new_monthly_rent?: number | null
          property_id?: string
          reason?: string | null
          renewal_term_months?: number | null
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lease_actions_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "lease_agreements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lease_actions_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lease_actions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      lease_agreements: {
        Row: {
          application_id: string | null
          created_at: string | null
          document_id: string | null
          end_date: string | null
          id: string
          monthly_rent: number | null
          property_id: string | null
          security_deposit: number | null
          signed_date: string | null
          start_date: string | null
          status: string | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          application_id?: string | null
          created_at?: string | null
          document_id?: string | null
          end_date?: string | null
          id?: string
          monthly_rent?: number | null
          property_id?: string | null
          security_deposit?: number | null
          signed_date?: string | null
          start_date?: string | null
          status?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          application_id?: string | null
          created_at?: string | null
          document_id?: string | null
          end_date?: string | null
          id?: string
          monthly_rent?: number | null
          property_id?: string | null
          security_deposit?: number | null
          signed_date?: string | null
          start_date?: string | null
          status?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lease_agreements_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "rental_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lease_agreements_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lease_agreements_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lease_agreements_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      lease_documents: {
        Row: {
          created_at: string
          document_id: string | null
          expire_date: string | null
          id: string
          property_id: string
          sent_date: string | null
          signed_date: string | null
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          document_id?: string | null
          expire_date?: string | null
          id?: string
          property_id: string
          sent_date?: string | null
          signed_date?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          document_id?: string | null
          expire_date?: string | null
          id?: string
          property_id?: string
          sent_date?: string | null
          signed_date?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lease_documents_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lease_documents_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lease_documents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_requests: {
        Row: {
          admin_notes: string | null
          category: string
          created_at: string
          description: string
          id: string
          image_url: string | null
          priority: string
          property_id: string | null
          property_name: string | null
          status: string
          tenant_name: string | null
          title: string
          updates: Json | null
          user_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          category?: string
          created_at?: string
          description: string
          id?: string
          image_url?: string | null
          priority: string
          property_id?: string | null
          property_name?: string | null
          status?: string
          tenant_name?: string | null
          title: string
          updates?: Json | null
          user_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          category?: string
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          priority?: string
          property_id?: string | null
          property_name?: string | null
          status?: string
          tenant_name?: string | null
          title?: string
          updates?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_property"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_schedules: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          property_id: string
          scheduled_date: string
          status: string
          title: string
          user_id: string | null
          vendor_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          property_id: string
          scheduled_date: string
          status?: string
          title: string
          user_id?: string | null
          vendor_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          property_id?: string
          scheduled_date?: string
          status?: string
          title?: string
          user_id?: string | null
          vendor_id?: string
        }
        Relationships: []
      }
      message_templates: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          key: string
          lang: string
          title: string | null
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          key: string
          lang?: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          lang?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean
          recipient_id: string | null
          sender_id: string | null
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean
          recipient_id?: string | null
          sender_id?: string | null
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          recipient_id?: string | null
          sender_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_read: boolean
          link: string | null
          metadata: Json | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_read?: boolean
          link?: string | null
          metadata?: Json | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_read?: boolean
          link?: string | null
          metadata?: Json | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: []
      }
      owner_payouts: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          owner_id: string
          payment_ids: string[]
          payout_date: string | null
          status: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          owner_id: string
          payment_ids: string[]
          payout_date?: string | null
          status?: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          owner_id?: string
          payment_ids?: string[]
          payout_date?: string | null
          status?: string
        }
        Relationships: []
      }
      payment_breakdowns: {
        Row: {
          agent_commission: number
          created_at: string | null
          id: string
          owner_amount: number
          paid_to_owner: boolean | null
          payment_id: string
          platform_fee: number
          tax_amount: number
          tax_rate: number
          total_amount: number
        }
        Insert: {
          agent_commission: number
          created_at?: string | null
          id?: string
          owner_amount: number
          paid_to_owner?: boolean | null
          payment_id: string
          platform_fee: number
          tax_amount: number
          tax_rate: number
          total_amount: number
        }
        Update: {
          agent_commission?: number
          created_at?: string | null
          id?: string
          owner_amount?: number
          paid_to_owner?: boolean | null
          payment_id?: string
          platform_fee?: number
          tax_amount?: number
          tax_rate?: number
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "payment_breakdowns_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "rent_payments"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          admin_settings: Json | null
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          onboarding_tour_completed: boolean
          updated_at: string
        }
        Insert: {
          admin_settings?: Json | null
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          onboarding_tour_completed?: boolean
          updated_at?: string
        }
        Update: {
          admin_settings?: Json | null
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          onboarding_tour_completed?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          address: string | null
          agent_commission_rate: number | null
          agent_id: string | null
          amenities: string[] | null
          availability_date: string | null
          bathrooms: string | null
          bedrooms: string | null
          created_at: string
          description: string | null
          features: string[] | null
          id: string
          imageUrl: string | null
          latitude: number | null
          lease_terms: string | null
          location: string | null
          longitude: number | null
          name: string
          owner_id: string | null
          price: string | null
          squareFeet: string | null
          status: string | null
          tour_url: string | null
          type: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          agent_commission_rate?: number | null
          agent_id?: string | null
          amenities?: string[] | null
          availability_date?: string | null
          bathrooms?: string | null
          bedrooms?: string | null
          created_at?: string
          description?: string | null
          features?: string[] | null
          id?: string
          imageUrl?: string | null
          latitude?: number | null
          lease_terms?: string | null
          location?: string | null
          longitude?: number | null
          name: string
          owner_id?: string | null
          price?: string | null
          squareFeet?: string | null
          status?: string | null
          tour_url?: string | null
          type?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          agent_commission_rate?: number | null
          agent_id?: string | null
          amenities?: string[] | null
          availability_date?: string | null
          bathrooms?: string | null
          bedrooms?: string | null
          created_at?: string
          description?: string | null
          features?: string[] | null
          id?: string
          imageUrl?: string | null
          latitude?: number | null
          lease_terms?: string | null
          location?: string | null
          longitude?: number | null
          name?: string
          owner_id?: string | null
          price?: string | null
          squareFeet?: string | null
          status?: string | null
          tour_url?: string | null
          type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      property_tenants: {
        Row: {
          created_at: string
          deposit_amount: number | null
          end_date: string | null
          id: string
          property_id: string | null
          rent_amount: number
          start_date: string
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          deposit_amount?: number | null
          end_date?: string | null
          id?: string
          property_id?: string | null
          rent_amount: number
          start_date: string
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          deposit_amount?: number | null
          end_date?: string | null
          id?: string
          property_id?: string | null
          rent_amount?: number
          start_date?: string
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_tenants_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_tenants_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      rent_payments: {
        Row: {
          amount: number
          category: string | null
          created_at: string
          description: string | null
          due_date: string
          id: string
          is_recurring: boolean | null
          next_payment_date: string | null
          payment_date: string | null
          payment_method: string | null
          property_tenant_id: string | null
          recurring_type: string | null
          reference: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          category?: string | null
          created_at?: string
          description?: string | null
          due_date: string
          id?: string
          is_recurring?: boolean | null
          next_payment_date?: string | null
          payment_date?: string | null
          payment_method?: string | null
          property_tenant_id?: string | null
          recurring_type?: string | null
          reference?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string
          description?: string | null
          due_date?: string
          id?: string
          is_recurring?: boolean | null
          next_payment_date?: string | null
          payment_date?: string | null
          payment_method?: string | null
          property_tenant_id?: string | null
          recurring_type?: string | null
          reference?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rent_payments_property_tenant_id_fkey"
            columns: ["property_tenant_id"]
            isOneToOne: false
            referencedRelation: "property_tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      rental_applications: {
        Row: {
          admin_notes: string | null
          created_at: string | null
          current_address: string | null
          email: string
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          employer_contact: string | null
          employer_name: string | null
          employment_status: string | null
          first_name: string
          has_pets: boolean | null
          id: string
          last_name: string
          monthly_income: number | null
          move_in_date: string | null
          num_occupants: number | null
          occupation: string | null
          pets_details: string | null
          phone: string | null
          property_id: string | null
          status: Database["public"]["Enums"]["application_status"] | null
          tenancy_period: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string | null
          current_address?: string | null
          email: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          employer_contact?: string | null
          employer_name?: string | null
          employment_status?: string | null
          first_name: string
          has_pets?: boolean | null
          id?: string
          last_name: string
          monthly_income?: number | null
          move_in_date?: string | null
          num_occupants?: number | null
          occupation?: string | null
          pets_details?: string | null
          phone?: string | null
          property_id?: string | null
          status?: Database["public"]["Enums"]["application_status"] | null
          tenancy_period?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          created_at?: string | null
          current_address?: string | null
          email?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          employer_contact?: string | null
          employer_name?: string | null
          employment_status?: string | null
          first_name?: string
          has_pets?: boolean | null
          id?: string
          last_name?: string
          monthly_income?: number | null
          move_in_date?: string | null
          num_occupants?: number | null
          occupation?: string | null
          pets_details?: string | null
          phone?: string | null
          property_id?: string | null
          status?: Database["public"]["Enums"]["application_status"] | null
          tenancy_period?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rental_applications_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      rental_milestones: {
        Row: {
          created_at: string
          date: string
          description: string
          id: string
          milestone_type: string
          notification_sent: boolean
          property_id: string
          property_name: string
          status: string
          tenant_id: string
          tenant_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date: string
          description: string
          id?: string
          milestone_type: string
          notification_sent?: boolean
          property_id: string
          property_name: string
          status: string
          tenant_id: string
          tenant_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          description?: string
          id?: string
          milestone_type?: string
          notification_sent?: boolean
          property_id?: string
          property_name?: string
          status?: string
          tenant_id?: string
          tenant_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rental_milestones_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rental_milestones_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string
          description: string | null
          generated_file: string | null
          id: string
          parameters: Json | null
          title: string
          type: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          generated_file?: string | null
          id?: string
          parameters?: Json | null
          title: string
          type: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          generated_file?: string | null
          id?: string
          parameters?: Json | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          id: string
          paystack_customer_code: string | null
          paystack_plan_code: string | null
          paystack_subscription_code: string | null
          plan_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          paystack_customer_code?: string | null
          paystack_plan_code?: string | null
          paystack_subscription_code?: string | null
          plan_id: string
          status: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          paystack_customer_code?: string | null
          paystack_plan_code?: string | null
          paystack_subscription_code?: string | null
          plan_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      super_admin_invite: {
        Row: {
          code: string
          id: string
          used: boolean
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          code: string
          id?: string
          used?: boolean
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          code?: string
          id?: string
          used?: boolean
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: []
      }
      tenant_onboarding: {
        Row: {
          completed: boolean
          created_at: string
          id: string
          lease_document_id: string | null
          lease_generated: boolean
          lease_sent: boolean
          lease_signed: boolean
          move_in_instructions_sent: boolean
          tenant_id: string
          updated_at: string
          welcome_sent: boolean
        }
        Insert: {
          completed?: boolean
          created_at?: string
          id?: string
          lease_document_id?: string | null
          lease_generated?: boolean
          lease_sent?: boolean
          lease_signed?: boolean
          move_in_instructions_sent?: boolean
          tenant_id: string
          updated_at?: string
          welcome_sent?: boolean
        }
        Update: {
          completed?: boolean
          created_at?: string
          id?: string
          lease_document_id?: string | null
          lease_generated?: boolean
          lease_sent?: boolean
          lease_signed?: boolean
          move_in_instructions_sent?: boolean
          tenant_id?: string
          updated_at?: string
          welcome_sent?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "tenant_onboarding_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_screenings: {
        Row: {
          created_at: string
          id: string
          results: Json | null
          status: Database["public"]["Enums"]["screening_status"]
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          results?: Json | null
          status?: Database["public"]["Enums"]["screening_status"]
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          results?: Json | null
          status?: Database["public"]["Enums"]["screening_status"]
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_screenings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          phone: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          first_name: string
          id?: string
          last_name: string
          phone?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          phone?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: []
      }
      vendor_jobs: {
        Row: {
          completed_date: string | null
          cost: number | null
          created_at: string
          description: string | null
          feedback: string | null
          id: string
          property: string
          rating: number | null
          scheduled_date: string
          status: string
          title: string
          updated_at: string
          vendor_id: string
        }
        Insert: {
          completed_date?: string | null
          cost?: number | null
          created_at?: string
          description?: string | null
          feedback?: string | null
          id?: string
          property: string
          rating?: number | null
          scheduled_date: string
          status: string
          title: string
          updated_at?: string
          vendor_id: string
        }
        Update: {
          completed_date?: string | null
          cost?: number | null
          created_at?: string
          description?: string | null
          feedback?: string | null
          id?: string
          property?: string
          rating?: number | null
          scheduled_date?: string
          status?: string
          title?: string
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_jobs_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          active: boolean
          address: string
          category: string
          completed_jobs: number
          created_at: string
          email: string
          id: string
          name: string
          phone: string
          rating: number
          response_time: string | null
          specialties: string[]
          total_jobs: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          active?: boolean
          address: string
          category: string
          completed_jobs?: number
          created_at?: string
          email: string
          id?: string
          name: string
          phone: string
          rating?: number
          response_time?: string | null
          specialties?: string[]
          total_jobs?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          active?: boolean
          address?: string
          category?: string
          completed_jobs?: number
          created_at?: string
          email?: string
          id?: string
          name?: string
          phone?: string
          rating?: number
          response_time?: string | null
          specialties?: string[]
          total_jobs?: number
          updated_at?: string
          user_id?: string | null
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
          uid: string
          requested_role: Database["public"]["Enums"]["user_role"]
        }
        Returns: boolean
      }
      is_admin: {
        Args: { uid: string }
        Returns: boolean
      }
    }
    Enums: {
      application_status: "pending" | "approved" | "rejected" | "more_info"
      notification_type:
        | "payment"
        | "maintenance"
        | "lease"
        | "announcement"
        | "general"
        | "message"
      screening_status: "pending" | "in_progress" | "completed" | "failed"
      user_role:
        | "super_admin"
        | "admin"
        | "manager"
        | "user"
        | "owner"
        | "agent"
        | "tenant"
        | "vendor"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      application_status: ["pending", "approved", "rejected", "more_info"],
      notification_type: [
        "payment",
        "maintenance",
        "lease",
        "announcement",
        "general",
        "message",
      ],
      screening_status: ["pending", "in_progress", "completed", "failed"],
      user_role: [
        "super_admin",
        "admin",
        "manager",
        "user",
        "owner",
        "agent",
        "tenant",
        "vendor",
      ],
    },
  },
} as const
