export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '12.2.3 (519615d)';
  };
  public: {
    Tables: {
      accounting_config: {
        Row: {
          description: string | null;
          id: string;
          key: string;
          updated_at: string | null;
          value: Json;
        };
        Insert: {
          description?: string | null;
          id?: string;
          key: string;
          updated_at?: string | null;
          value: Json;
        };
        Update: {
          description?: string | null;
          id?: string;
          key?: string;
          updated_at?: string | null;
          value?: Json;
        };
        Relationships: [];
      };
      accounts: {
        Row: {
          created_at: string | null;
          id: string;
          name: string;
          organization_id: string;
          type: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          name: string;
          organization_id: string;
          type?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          name?: string;
          organization_id?: string;
          type?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'accounts_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
        ];
      };
      agents: {
        Row: {
          availability_hours: string | null;
          created_at: string | null;
          id: string;
          license_number: string | null;
          preferred_contact_method: string | null;
          properties_managed: number | null;
          rating: number | null;
          specializations: string[] | null;
          status: string | null;
          total_reviews: number | null;
          updated_at: string | null;
          user_id: string;
          working_areas: string[] | null;
          years_of_experience: number | null;
        };
        Insert: {
          availability_hours?: string | null;
          created_at?: string | null;
          id?: string;
          license_number?: string | null;
          preferred_contact_method?: string | null;
          properties_managed?: number | null;
          rating?: number | null;
          specializations?: string[] | null;
          status?: string | null;
          total_reviews?: number | null;
          updated_at?: string | null;
          user_id: string;
          working_areas?: string[] | null;
          years_of_experience?: number | null;
        };
        Update: {
          availability_hours?: string | null;
          created_at?: string | null;
          id?: string;
          license_number?: string | null;
          preferred_contact_method?: string | null;
          properties_managed?: number | null;
          rating?: number | null;
          specializations?: string[] | null;
          status?: string | null;
          total_reviews?: number | null;
          updated_at?: string | null;
          user_id?: string;
          working_areas?: string[] | null;
          years_of_experience?: number | null;
        };
        Relationships: [];
      };
      api_provider_configs: {
        Row: {
          api_key_encrypted: string | null;
          base_url: string;
          created_at: string | null;
          id: string;
          is_active: boolean | null;
          provider: string;
          rate_limit_per_day: number | null;
          rate_limit_per_hour: number | null;
          rate_limit_per_minute: number | null;
          sandbox_mode: boolean | null;
          service_type: string;
          updated_at: string | null;
          webhook_url: string | null;
        };
        Insert: {
          api_key_encrypted?: string | null;
          base_url: string;
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          provider: string;
          rate_limit_per_day?: number | null;
          rate_limit_per_hour?: number | null;
          rate_limit_per_minute?: number | null;
          sandbox_mode?: boolean | null;
          service_type: string;
          updated_at?: string | null;
          webhook_url?: string | null;
        };
        Update: {
          api_key_encrypted?: string | null;
          base_url?: string;
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          provider?: string;
          rate_limit_per_day?: number | null;
          rate_limit_per_hour?: number | null;
          rate_limit_per_minute?: number | null;
          sandbox_mode?: boolean | null;
          service_type?: string;
          updated_at?: string | null;
          webhook_url?: string | null;
        };
        Relationships: [];
      };
      api_usage_logs: {
        Row: {
          cost: number | null;
          created_at: string | null;
          currency: string | null;
          endpoint: string | null;
          id: string;
          ip_address: unknown;
          provider: string;
          request_method: string | null;
          request_size_bytes: number | null;
          response_size_bytes: number | null;
          response_time_ms: number | null;
          service_type: string;
          status_code: number | null;
          success: boolean | null;
          user_agent: string | null;
          user_id: string | null;
        };
        Insert: {
          cost?: number | null;
          created_at?: string | null;
          currency?: string | null;
          endpoint?: string | null;
          id?: string;
          ip_address?: unknown;
          provider: string;
          request_method?: string | null;
          request_size_bytes?: number | null;
          response_size_bytes?: number | null;
          response_time_ms?: number | null;
          service_type: string;
          status_code?: number | null;
          success?: boolean | null;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Update: {
          cost?: number | null;
          created_at?: string | null;
          currency?: string | null;
          endpoint?: string | null;
          id?: string;
          ip_address?: unknown;
          provider?: string;
          request_method?: string | null;
          request_size_bytes?: number | null;
          response_size_bytes?: number | null;
          response_time_ms?: number | null;
          service_type?: string;
          status_code?: number | null;
          success?: boolean | null;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      blockchain_events: {
        Row: {
          block_number: number | null;
          contract_address: string | null;
          created_at: string | null;
          event_data: Json;
          event_name: string;
          event_type: string;
          id: string;
          network: string;
          processed: boolean | null;
          processed_at: string | null;
          transaction_hash: string | null;
          user_id: string | null;
        };
        Insert: {
          block_number?: number | null;
          contract_address?: string | null;
          created_at?: string | null;
          event_data: Json;
          event_name: string;
          event_type: string;
          id?: string;
          network: string;
          processed?: boolean | null;
          processed_at?: string | null;
          transaction_hash?: string | null;
          user_id?: string | null;
        };
        Update: {
          block_number?: number | null;
          contract_address?: string | null;
          created_at?: string | null;
          event_data?: Json;
          event_name?: string;
          event_type?: string;
          id?: string;
          network?: string;
          processed?: boolean | null;
          processed_at?: string | null;
          transaction_hash?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      blockchain_payments: {
        Row: {
          amount: number;
          block_number: number | null;
          created_at: string | null;
          currency: string | null;
          description: string | null;
          due_date: string | null;
          from_address: string;
          gas_fee: number | null;
          gas_used: number | null;
          id: string;
          lease_id: string | null;
          metadata: Json | null;
          network: string;
          paid_at: string | null;
          payment_type: string;
          property_id: string | null;
          status: string | null;
          to_address: string;
          token_address: string | null;
          transaction_hash: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          amount: number;
          block_number?: number | null;
          created_at?: string | null;
          currency?: string | null;
          description?: string | null;
          due_date?: string | null;
          from_address: string;
          gas_fee?: number | null;
          gas_used?: number | null;
          id?: string;
          lease_id?: string | null;
          metadata?: Json | null;
          network: string;
          paid_at?: string | null;
          payment_type: string;
          property_id?: string | null;
          status?: string | null;
          to_address: string;
          token_address?: string | null;
          transaction_hash?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          amount?: number;
          block_number?: number | null;
          created_at?: string | null;
          currency?: string | null;
          description?: string | null;
          due_date?: string | null;
          from_address?: string;
          gas_fee?: number | null;
          gas_used?: number | null;
          id?: string;
          lease_id?: string | null;
          metadata?: Json | null;
          network?: string;
          paid_at?: string | null;
          payment_type?: string;
          property_id?: string | null;
          status?: string | null;
          to_address?: string;
          token_address?: string | null;
          transaction_hash?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'blockchain_payments_lease_id_fkey';
            columns: ['lease_id'];
            isOneToOne: false;
            referencedRelation: 'leases';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'blockchain_payments_property_id_fkey';
            columns: ['property_id'];
            isOneToOne: false;
            referencedRelation: 'properties';
            referencedColumns: ['id'];
          },
        ];
      };
      blockchain_transactions: {
        Row: {
          block_hash: string | null;
          block_number: number | null;
          confirmed_at: string | null;
          contract_address: string | null;
          created_at: string | null;
          error_message: string | null;
          from_address: string;
          gas_limit: number | null;
          gas_price: number | null;
          gas_used: number | null;
          id: string;
          input_data: string | null;
          logs: Json | null;
          network: string;
          nonce: number | null;
          status: string | null;
          to_address: string;
          transaction_hash: string;
          transaction_index: number | null;
          transaction_type: string | null;
          updated_at: string | null;
          user_id: string;
          value: number;
          wallet_address: string;
        };
        Insert: {
          block_hash?: string | null;
          block_number?: number | null;
          confirmed_at?: string | null;
          contract_address?: string | null;
          created_at?: string | null;
          error_message?: string | null;
          from_address: string;
          gas_limit?: number | null;
          gas_price?: number | null;
          gas_used?: number | null;
          id?: string;
          input_data?: string | null;
          logs?: Json | null;
          network: string;
          nonce?: number | null;
          status?: string | null;
          to_address: string;
          transaction_hash: string;
          transaction_index?: number | null;
          transaction_type?: string | null;
          updated_at?: string | null;
          user_id: string;
          value: number;
          wallet_address: string;
        };
        Update: {
          block_hash?: string | null;
          block_number?: number | null;
          confirmed_at?: string | null;
          contract_address?: string | null;
          created_at?: string | null;
          error_message?: string | null;
          from_address?: string;
          gas_limit?: number | null;
          gas_price?: number | null;
          gas_used?: number | null;
          id?: string;
          input_data?: string | null;
          logs?: Json | null;
          network?: string;
          nonce?: number | null;
          status?: string | null;
          to_address?: string;
          transaction_hash?: string;
          transaction_index?: number | null;
          transaction_type?: string | null;
          updated_at?: string | null;
          user_id?: string;
          value?: number;
          wallet_address?: string;
        };
        Relationships: [];
      };
      blockchain_wallets: {
        Row: {
          balance: number | null;
          chain_id: number;
          connected_at: string | null;
          created_at: string | null;
          id: string;
          is_primary: boolean | null;
          last_used_at: string | null;
          network: string;
          updated_at: string | null;
          user_id: string;
          wallet_address: string;
          wallet_type: string;
        };
        Insert: {
          balance?: number | null;
          chain_id: number;
          connected_at?: string | null;
          created_at?: string | null;
          id?: string;
          is_primary?: boolean | null;
          last_used_at?: string | null;
          network: string;
          updated_at?: string | null;
          user_id: string;
          wallet_address: string;
          wallet_type: string;
        };
        Update: {
          balance?: number | null;
          chain_id?: number;
          connected_at?: string | null;
          created_at?: string | null;
          id?: string;
          is_primary?: boolean | null;
          last_used_at?: string | null;
          network?: string;
          updated_at?: string | null;
          user_id?: string;
          wallet_address?: string;
          wallet_type?: string;
        };
        Relationships: [];
      };
      bookings: {
        Row: {
          cancellation_policy: Json | null;
          cancellation_reason: string | null;
          cancelled_at: string | null;
          checkin_date: string;
          checkout_date: string;
          commission_amount: number | null;
          created_at: string | null;
          currency: string | null;
          deposit_amount: number | null;
          guest_id: string;
          guests_count: number;
          id: string;
          listing_id: string;
          metadata: Json | null;
          nights: number;
          owner_id: string;
          payment_reference: string | null;
          payout_amount: number | null;
          status: string;
          total_amount: number;
          updated_at: string | null;
        };
        Insert: {
          cancellation_policy?: Json | null;
          cancellation_reason?: string | null;
          cancelled_at?: string | null;
          checkin_date: string;
          checkout_date: string;
          commission_amount?: number | null;
          created_at?: string | null;
          currency?: string | null;
          deposit_amount?: number | null;
          guest_id: string;
          guests_count?: number;
          id?: string;
          listing_id: string;
          metadata?: Json | null;
          nights: number;
          owner_id: string;
          payment_reference?: string | null;
          payout_amount?: number | null;
          status?: string;
          total_amount: number;
          updated_at?: string | null;
        };
        Update: {
          cancellation_policy?: Json | null;
          cancellation_reason?: string | null;
          cancelled_at?: string | null;
          checkin_date?: string;
          checkout_date?: string;
          commission_amount?: number | null;
          created_at?: string | null;
          currency?: string | null;
          deposit_amount?: number | null;
          guest_id?: string;
          guests_count?: number;
          id?: string;
          listing_id?: string;
          metadata?: Json | null;
          nights?: number;
          owner_id?: string;
          payment_reference?: string | null;
          payout_amount?: number | null;
          status?: string;
          total_amount?: number;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'bookings_listing_id_fkey';
            columns: ['listing_id'];
            isOneToOne: false;
            referencedRelation: 'listings';
            referencedColumns: ['id'];
          },
        ];
      };
      channel_manager_integrations: {
        Row: {
          channel_listing_id: string;
          channel_name: string;
          created_at: string | null;
          credentials: Json | null;
          id: string;
          last_sync_at: string | null;
          listing_id: string;
          settings: Json | null;
          sync_direction: string | null;
          sync_enabled: boolean | null;
          sync_status: string | null;
          updated_at: string | null;
        };
        Insert: {
          channel_listing_id: string;
          channel_name: string;
          created_at?: string | null;
          credentials?: Json | null;
          id?: string;
          last_sync_at?: string | null;
          listing_id: string;
          settings?: Json | null;
          sync_direction?: string | null;
          sync_enabled?: boolean | null;
          sync_status?: string | null;
          updated_at?: string | null;
        };
        Update: {
          channel_listing_id?: string;
          channel_name?: string;
          created_at?: string | null;
          credentials?: Json | null;
          id?: string;
          last_sync_at?: string | null;
          listing_id?: string;
          settings?: Json | null;
          sync_direction?: string | null;
          sync_enabled?: boolean | null;
          sync_status?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'channel_manager_integrations_listing_id_fkey';
            columns: ['listing_id'];
            isOneToOne: false;
            referencedRelation: 'listings';
            referencedColumns: ['id'];
          },
        ];
      };
      channel_sync_logs: {
        Row: {
          created_at: string | null;
          direction: string;
          error_message: string | null;
          id: string;
          integration_id: string;
          items_failed: number | null;
          items_synced: number | null;
          metadata: Json | null;
          status: string;
          sync_type: string;
        };
        Insert: {
          created_at?: string | null;
          direction: string;
          error_message?: string | null;
          id?: string;
          integration_id: string;
          items_failed?: number | null;
          items_synced?: number | null;
          metadata?: Json | null;
          status: string;
          sync_type: string;
        };
        Update: {
          created_at?: string | null;
          direction?: string;
          error_message?: string | null;
          id?: string;
          integration_id?: string;
          items_failed?: number | null;
          items_synced?: number | null;
          metadata?: Json | null;
          status?: string;
          sync_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'channel_sync_logs_integration_id_fkey';
            columns: ['integration_id'];
            isOneToOne: false;
            referencedRelation: 'channel_manager_integrations';
            referencedColumns: ['id'];
          },
        ];
      };
      contact_submissions: {
        Row: {
          company: string | null;
          created_at: string | null;
          email: string;
          id: string;
          message: string;
          name: string;
          notes: string | null;
          phone: string | null;
          responded_at: string | null;
          status: string | null;
          subject: string;
          updated_at: string | null;
        };
        Insert: {
          company?: string | null;
          created_at?: string | null;
          email: string;
          id?: string;
          message: string;
          name: string;
          notes?: string | null;
          phone?: string | null;
          responded_at?: string | null;
          status?: string | null;
          subject: string;
          updated_at?: string | null;
        };
        Update: {
          company?: string | null;
          created_at?: string | null;
          email?: string;
          id?: string;
          message?: string;
          name?: string;
          notes?: string | null;
          phone?: string | null;
          responded_at?: string | null;
          status?: string | null;
          subject?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      document_classifications: {
        Row: {
          alternative_predictions: Json | null;
          classification_features: Json | null;
          confidence_score: number;
          created_at: string;
          document_id: string;
          id: string;
          manual_override: string | null;
          predicted_type: string;
          verified_at: string | null;
          verified_by: string | null;
        };
        Insert: {
          alternative_predictions?: Json | null;
          classification_features?: Json | null;
          confidence_score: number;
          created_at?: string;
          document_id: string;
          id?: string;
          manual_override?: string | null;
          predicted_type: string;
          verified_at?: string | null;
          verified_by?: string | null;
        };
        Update: {
          alternative_predictions?: Json | null;
          classification_features?: Json | null;
          confidence_score?: number;
          created_at?: string;
          document_id?: string;
          id?: string;
          manual_override?: string | null;
          predicted_type?: string;
          verified_at?: string | null;
          verified_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'document_classifications_document_id_fkey';
            columns: ['document_id'];
            isOneToOne: false;
            referencedRelation: 'document_metadata';
            referencedColumns: ['id'];
          },
        ];
      };
      document_extractions: {
        Row: {
          created_at: string;
          document_id: string;
          extracted_text: string;
          extraction_method: string;
          id: string;
          key_value_pairs: Json;
          overall_confidence: number | null;
          processing_time_ms: number | null;
          signatures: Json | null;
          stamps: Json | null;
          structured_data: Json;
          tables: Json | null;
        };
        Insert: {
          created_at?: string;
          document_id: string;
          extracted_text: string;
          extraction_method?: string;
          id?: string;
          key_value_pairs?: Json;
          overall_confidence?: number | null;
          processing_time_ms?: number | null;
          signatures?: Json | null;
          stamps?: Json | null;
          structured_data?: Json;
          tables?: Json | null;
        };
        Update: {
          created_at?: string;
          document_id?: string;
          extracted_text?: string;
          extraction_method?: string;
          id?: string;
          key_value_pairs?: Json;
          overall_confidence?: number | null;
          processing_time_ms?: number | null;
          signatures?: Json | null;
          stamps?: Json | null;
          structured_data?: Json;
          tables?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: 'document_extractions_document_id_fkey';
            columns: ['document_id'];
            isOneToOne: false;
            referencedRelation: 'document_metadata';
            referencedColumns: ['id'];
          },
        ];
      };
      document_hashes: {
        Row: {
          authorized_users: string[] | null;
          created_at: string | null;
          document_type: string;
          expires_at: string | null;
          file_hash: string;
          file_size: number | null;
          filename: string;
          id: string;
          ipfs_hash: string | null;
          metadata: Json | null;
          mime_type: string | null;
          property_id: string | null;
          public_access: boolean | null;
          signature: string | null;
          updated_at: string | null;
          user_id: string;
          verification_transaction_hash: string | null;
          verified: boolean | null;
          verified_at: string | null;
          verified_by: string | null;
        };
        Insert: {
          authorized_users?: string[] | null;
          created_at?: string | null;
          document_type: string;
          expires_at?: string | null;
          file_hash: string;
          file_size?: number | null;
          filename: string;
          id?: string;
          ipfs_hash?: string | null;
          metadata?: Json | null;
          mime_type?: string | null;
          property_id?: string | null;
          public_access?: boolean | null;
          signature?: string | null;
          updated_at?: string | null;
          user_id: string;
          verification_transaction_hash?: string | null;
          verified?: boolean | null;
          verified_at?: string | null;
          verified_by?: string | null;
        };
        Update: {
          authorized_users?: string[] | null;
          created_at?: string | null;
          document_type?: string;
          expires_at?: string | null;
          file_hash?: string;
          file_size?: number | null;
          filename?: string;
          id?: string;
          ipfs_hash?: string | null;
          metadata?: Json | null;
          mime_type?: string | null;
          property_id?: string | null;
          public_access?: boolean | null;
          signature?: string | null;
          updated_at?: string | null;
          user_id?: string;
          verification_transaction_hash?: string | null;
          verified?: boolean | null;
          verified_at?: string | null;
          verified_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'document_hashes_property_id_fkey';
            columns: ['property_id'];
            isOneToOne: false;
            referencedRelation: 'properties';
            referencedColumns: ['id'];
          },
        ];
      };
      document_insights: {
        Row: {
          created_at: string;
          date_range: Json;
          description: string;
          id: string;
          impact_level: string;
          insight_type: string;
          metrics: Json;
          recommendations: Json | null;
          title: string;
        };
        Insert: {
          created_at?: string;
          date_range: Json;
          description: string;
          id?: string;
          impact_level?: string;
          insight_type: string;
          metrics?: Json;
          recommendations?: Json | null;
          title: string;
        };
        Update: {
          created_at?: string;
          date_range?: Json;
          description?: string;
          id?: string;
          impact_level?: string;
          insight_type?: string;
          metrics?: Json;
          recommendations?: Json | null;
          title?: string;
        };
        Relationships: [];
      };
      document_metadata: {
        Row: {
          confidence_score: number | null;
          created_at: string;
          document_type: string;
          expires_at: string | null;
          file_path: string;
          file_size: number;
          file_type: string;
          id: string;
          is_sensitive: boolean | null;
          lease_id: string | null;
          original_filename: string;
          processing_stage: string;
          property_id: string | null;
          retention_period_days: number | null;
          status: string;
          tenant_id: string | null;
          updated_at: string;
          upload_date: string;
          user_id: string;
        };
        Insert: {
          confidence_score?: number | null;
          created_at?: string;
          document_type?: string;
          expires_at?: string | null;
          file_path: string;
          file_size: number;
          file_type: string;
          id?: string;
          is_sensitive?: boolean | null;
          lease_id?: string | null;
          original_filename: string;
          processing_stage?: string;
          property_id?: string | null;
          retention_period_days?: number | null;
          status?: string;
          tenant_id?: string | null;
          updated_at?: string;
          upload_date?: string;
          user_id: string;
        };
        Update: {
          confidence_score?: number | null;
          created_at?: string;
          document_type?: string;
          expires_at?: string | null;
          file_path?: string;
          file_size?: number;
          file_type?: string;
          id?: string;
          is_sensitive?: boolean | null;
          lease_id?: string | null;
          original_filename?: string;
          processing_stage?: string;
          property_id?: string | null;
          retention_period_days?: number | null;
          status?: string;
          tenant_id?: string | null;
          updated_at?: string;
          upload_date?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'document_metadata_lease_id_fkey';
            columns: ['lease_id'];
            isOneToOne: false;
            referencedRelation: 'leases';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'document_metadata_property_id_fkey';
            columns: ['property_id'];
            isOneToOne: false;
            referencedRelation: 'properties';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'document_metadata_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
        ];
      };
      document_processing_settings: {
        Row: {
          auto_classification_enabled: boolean | null;
          auto_extraction_enabled: boolean | null;
          created_at: string;
          fraud_detection_enabled: boolean | null;
          notification_preferences: Json | null;
          quality_thresholds: Json | null;
          retention_policies: Json | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          auto_classification_enabled?: boolean | null;
          auto_extraction_enabled?: boolean | null;
          created_at?: string;
          fraud_detection_enabled?: boolean | null;
          notification_preferences?: Json | null;
          quality_thresholds?: Json | null;
          retention_policies?: Json | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          auto_classification_enabled?: boolean | null;
          auto_extraction_enabled?: boolean | null;
          created_at?: string;
          fraud_detection_enabled?: boolean | null;
          notification_preferences?: Json | null;
          quality_thresholds?: Json | null;
          retention_policies?: Json | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      document_templates: {
        Row: {
          auto_fill_mappings: Json | null;
          created_at: string;
          created_by: string;
          document_type: string;
          id: string;
          is_active: boolean | null;
          template_fields: Json;
          template_name: string;
          updated_at: string;
          validation_rules: Json;
          version: string;
        };
        Insert: {
          auto_fill_mappings?: Json | null;
          created_at?: string;
          created_by: string;
          document_type: string;
          id?: string;
          is_active?: boolean | null;
          template_fields?: Json;
          template_name: string;
          updated_at?: string;
          validation_rules?: Json;
          version?: string;
        };
        Update: {
          auto_fill_mappings?: Json | null;
          created_at?: string;
          created_by?: string;
          document_type?: string;
          id?: string;
          is_active?: boolean | null;
          template_fields?: Json;
          template_name?: string;
          updated_at?: string;
          validation_rules?: Json;
          version?: string;
        };
        Relationships: [];
      };
      document_validations: {
        Row: {
          compliance_checks: Json | null;
          created_at: string;
          document_id: string;
          fraud_detection: Json;
          id: string;
          overall_status: string;
          updated_at: string;
          validation_results: Json;
          validation_rules: Json;
        };
        Insert: {
          compliance_checks?: Json | null;
          created_at?: string;
          document_id: string;
          fraud_detection?: Json;
          id?: string;
          overall_status: string;
          updated_at?: string;
          validation_results?: Json;
          validation_rules?: Json;
        };
        Update: {
          compliance_checks?: Json | null;
          created_at?: string;
          document_id?: string;
          fraud_detection?: Json;
          id?: string;
          overall_status?: string;
          updated_at?: string;
          validation_results?: Json;
          validation_rules?: Json;
        };
        Relationships: [
          {
            foreignKeyName: 'document_validations_document_id_fkey';
            columns: ['document_id'];
            isOneToOne: false;
            referencedRelation: 'document_metadata';
            referencedColumns: ['id'];
          },
        ];
      };
      document_workflows: {
        Row: {
          assigned_to: string | null;
          created_at: string;
          current_stage: string;
          document_id: string;
          due_date: string | null;
          id: string;
          priority: string;
          stages: Json;
          status: string;
          updated_at: string;
          workflow_type: string;
        };
        Insert: {
          assigned_to?: string | null;
          created_at?: string;
          current_stage: string;
          document_id: string;
          due_date?: string | null;
          id?: string;
          priority?: string;
          stages?: Json;
          status?: string;
          updated_at?: string;
          workflow_type: string;
        };
        Update: {
          assigned_to?: string | null;
          created_at?: string;
          current_stage?: string;
          document_id?: string;
          due_date?: string | null;
          id?: string;
          priority?: string;
          stages?: Json;
          status?: string;
          updated_at?: string;
          workflow_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'document_workflows_document_id_fkey';
            columns: ['document_id'];
            isOneToOne: false;
            referencedRelation: 'document_metadata';
            referencedColumns: ['id'];
          },
        ];
      };
      equipment_data: {
        Row: {
          brand: string;
          created_at: string | null;
          current_condition: string;
          equipment_type: string;
          expected_lifespan_years: number;
          id: string;
          installation_date: string;
          last_service_date: string | null;
          model: string;
          notes: string | null;
          property_id: string;
          updated_at: string | null;
          usage_intensity: string;
          warranty_expiry: string | null;
        };
        Insert: {
          brand: string;
          created_at?: string | null;
          current_condition: string;
          equipment_type: string;
          expected_lifespan_years?: number;
          id?: string;
          installation_date: string;
          last_service_date?: string | null;
          model: string;
          notes?: string | null;
          property_id: string;
          updated_at?: string | null;
          usage_intensity: string;
          warranty_expiry?: string | null;
        };
        Update: {
          brand?: string;
          created_at?: string | null;
          current_condition?: string;
          equipment_type?: string;
          expected_lifespan_years?: number;
          id?: string;
          installation_date?: string;
          last_service_date?: string | null;
          model?: string;
          notes?: string | null;
          property_id?: string;
          updated_at?: string | null;
          usage_intensity?: string;
          warranty_expiry?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'equipment_data_property_id_fkey';
            columns: ['property_id'];
            isOneToOne: false;
            referencedRelation: 'properties';
            referencedColumns: ['id'];
          },
        ];
      };
      escrow_conditions: {
        Row: {
          completed: boolean | null;
          completed_at: string | null;
          completed_by: string | null;
          condition_id: string;
          condition_type: string;
          created_at: string | null;
          description: string;
          escrow_contract_id: string;
          evidence_hash: string | null;
          evidence_ipfs_hash: string | null;
          id: string;
          required: boolean | null;
          updated_at: string | null;
        };
        Insert: {
          completed?: boolean | null;
          completed_at?: string | null;
          completed_by?: string | null;
          condition_id: string;
          condition_type: string;
          created_at?: string | null;
          description: string;
          escrow_contract_id: string;
          evidence_hash?: string | null;
          evidence_ipfs_hash?: string | null;
          id?: string;
          required?: boolean | null;
          updated_at?: string | null;
        };
        Update: {
          completed?: boolean | null;
          completed_at?: string | null;
          completed_by?: string | null;
          condition_id?: string;
          condition_type?: string;
          created_at?: string | null;
          description?: string;
          escrow_contract_id?: string;
          evidence_hash?: string | null;
          evidence_ipfs_hash?: string | null;
          id?: string;
          required?: boolean | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'escrow_conditions_escrow_contract_id_fkey';
            columns: ['escrow_contract_id'];
            isOneToOne: false;
            referencedRelation: 'escrow_contracts';
            referencedColumns: ['id'];
          },
        ];
      };
      escrow_contracts: {
        Row: {
          amount: number;
          buyer_address: string;
          conditions: Json | null;
          contract_address: string;
          created_at: string | null;
          creation_transaction_hash: string | null;
          currency: string | null;
          escrow_agent_address: string | null;
          expires_at: string | null;
          funded_at: string | null;
          funding_transaction_hash: string | null;
          id: string;
          milestones: Json | null;
          network: string;
          property_id: string | null;
          property_token_id: string | null;
          release_transaction_hash: string | null;
          released_at: string | null;
          seller_address: string;
          status: string | null;
          updated_at: string | null;
        };
        Insert: {
          amount: number;
          buyer_address: string;
          conditions?: Json | null;
          contract_address: string;
          created_at?: string | null;
          creation_transaction_hash?: string | null;
          currency?: string | null;
          escrow_agent_address?: string | null;
          expires_at?: string | null;
          funded_at?: string | null;
          funding_transaction_hash?: string | null;
          id?: string;
          milestones?: Json | null;
          network: string;
          property_id?: string | null;
          property_token_id?: string | null;
          release_transaction_hash?: string | null;
          released_at?: string | null;
          seller_address: string;
          status?: string | null;
          updated_at?: string | null;
        };
        Update: {
          amount?: number;
          buyer_address?: string;
          conditions?: Json | null;
          contract_address?: string;
          created_at?: string | null;
          creation_transaction_hash?: string | null;
          currency?: string | null;
          escrow_agent_address?: string | null;
          expires_at?: string | null;
          funded_at?: string | null;
          funding_transaction_hash?: string | null;
          id?: string;
          milestones?: Json | null;
          network?: string;
          property_id?: string | null;
          property_token_id?: string | null;
          release_transaction_hash?: string | null;
          released_at?: string | null;
          seller_address?: string;
          status?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'escrow_contracts_property_id_fkey';
            columns: ['property_id'];
            isOneToOne: false;
            referencedRelation: 'properties';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'escrow_contracts_property_token_id_fkey';
            columns: ['property_token_id'];
            isOneToOne: false;
            referencedRelation: 'property_tokens';
            referencedColumns: ['id'];
          },
        ];
      };
      escrow_milestones: {
        Row: {
          amount_released: number | null;
          completed: boolean | null;
          completed_at: string | null;
          created_at: string | null;
          description: string | null;
          escrow_contract_id: string;
          id: string;
          milestone_id: string;
          percentage: number;
          required_conditions: string[] | null;
          title: string;
          transaction_hash: string | null;
          updated_at: string | null;
        };
        Insert: {
          amount_released?: number | null;
          completed?: boolean | null;
          completed_at?: string | null;
          created_at?: string | null;
          description?: string | null;
          escrow_contract_id: string;
          id?: string;
          milestone_id: string;
          percentage: number;
          required_conditions?: string[] | null;
          title: string;
          transaction_hash?: string | null;
          updated_at?: string | null;
        };
        Update: {
          amount_released?: number | null;
          completed?: boolean | null;
          completed_at?: string | null;
          created_at?: string | null;
          description?: string | null;
          escrow_contract_id?: string;
          id?: string;
          milestone_id?: string;
          percentage?: number;
          required_conditions?: string[] | null;
          title?: string;
          transaction_hash?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'escrow_milestones_escrow_contract_id_fkey';
            columns: ['escrow_contract_id'];
            isOneToOne: false;
            referencedRelation: 'escrow_contracts';
            referencedColumns: ['id'];
          },
        ];
      };
      expenses: {
        Row: {
          amount: number;
          category: string | null;
          created_at: string | null;
          description: string | null;
          id: string;
          organization_id: string;
          property_id: string | null;
        };
        Insert: {
          amount: number;
          category?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          organization_id: string;
          property_id?: string | null;
        };
        Update: {
          amount?: number;
          category?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          organization_id?: string;
          property_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'expenses_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'expenses_property_id_fkey';
            columns: ['property_id'];
            isOneToOne: false;
            referencedRelation: 'properties';
            referencedColumns: ['id'];
          },
        ];
      };
      feature_usage_tracking: {
        Row: {
          created_at: string;
          feature_key: string;
          id: string;
          metadata: Json | null;
          subscription_id: string | null;
          usage_count: number | null;
          usage_date: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          feature_key: string;
          id?: string;
          metadata?: Json | null;
          subscription_id?: string | null;
          usage_count?: number | null;
          usage_date?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          feature_key?: string;
          id?: string;
          metadata?: Json | null;
          subscription_id?: string | null;
          usage_count?: number | null;
          usage_date?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'feature_usage_tracking_subscription_id_fkey';
            columns: ['subscription_id'];
            isOneToOne: false;
            referencedRelation: 'user_subscriptions';
            referencedColumns: ['id'];
          },
        ];
      };
      guest_documents: {
        Row: {
          booking_id: string | null;
          created_at: string | null;
          document_type: string;
          document_url: string;
          id: string;
          updated_at: string | null;
          user_id: string;
          verified: boolean | null;
          verified_at: string | null;
          verified_by: string | null;
        };
        Insert: {
          booking_id?: string | null;
          created_at?: string | null;
          document_type: string;
          document_url: string;
          id?: string;
          updated_at?: string | null;
          user_id: string;
          verified?: boolean | null;
          verified_at?: string | null;
          verified_by?: string | null;
        };
        Update: {
          booking_id?: string | null;
          created_at?: string | null;
          document_type?: string;
          document_url?: string;
          id?: string;
          updated_at?: string | null;
          user_id?: string;
          verified?: boolean | null;
          verified_at?: string | null;
          verified_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'guest_documents_booking_id_fkey';
            columns: ['booking_id'];
            isOneToOne: false;
            referencedRelation: 'bookings';
            referencedColumns: ['id'];
          },
        ];
      };
      identity_credentials: {
        Row: {
          created_at: string | null;
          credential_hash: string;
          credential_type: string;
          did: string | null;
          encrypted_data: string | null;
          expires_at: string | null;
          id: string;
          issued_at: string | null;
          issuer: string;
          last_verified_at: string | null;
          public_data: Json | null;
          revocation_reason: string | null;
          revoked: boolean | null;
          revoked_at: string | null;
          signature: string;
          updated_at: string | null;
          user_id: string;
          verification_count: number | null;
          wallet_address: string;
        };
        Insert: {
          created_at?: string | null;
          credential_hash: string;
          credential_type: string;
          did?: string | null;
          encrypted_data?: string | null;
          expires_at?: string | null;
          id?: string;
          issued_at?: string | null;
          issuer: string;
          last_verified_at?: string | null;
          public_data?: Json | null;
          revocation_reason?: string | null;
          revoked?: boolean | null;
          revoked_at?: string | null;
          signature: string;
          updated_at?: string | null;
          user_id: string;
          verification_count?: number | null;
          wallet_address: string;
        };
        Update: {
          created_at?: string | null;
          credential_hash?: string;
          credential_type?: string;
          did?: string | null;
          encrypted_data?: string | null;
          expires_at?: string | null;
          id?: string;
          issued_at?: string | null;
          issuer?: string;
          last_verified_at?: string | null;
          public_data?: Json | null;
          revocation_reason?: string | null;
          revoked?: boolean | null;
          revoked_at?: string | null;
          signature?: string;
          updated_at?: string | null;
          user_id?: string;
          verification_count?: number | null;
          wallet_address?: string;
        };
        Relationships: [];
      };
      invoices: {
        Row: {
          amount_due: number;
          amount_paid: number | null;
          created_at: string;
          currency: string;
          discount_amount: number | null;
          due_date: string;
          id: string;
          invoice_number: string;
          line_items: Json;
          paid_at: string | null;
          paystack_invoice_code: string | null;
          pdf_url: string | null;
          status: string;
          stripe_invoice_id: string | null;
          subscription_id: string | null;
          tax_amount: number | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          amount_due: number;
          amount_paid?: number | null;
          created_at?: string;
          currency?: string;
          discount_amount?: number | null;
          due_date: string;
          id?: string;
          invoice_number: string;
          line_items?: Json;
          paid_at?: string | null;
          paystack_invoice_code?: string | null;
          pdf_url?: string | null;
          status?: string;
          stripe_invoice_id?: string | null;
          subscription_id?: string | null;
          tax_amount?: number | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          amount_due?: number;
          amount_paid?: number | null;
          created_at?: string;
          currency?: string;
          discount_amount?: number | null;
          due_date?: string;
          id?: string;
          invoice_number?: string;
          line_items?: Json;
          paid_at?: string | null;
          paystack_invoice_code?: string | null;
          pdf_url?: string | null;
          status?: string;
          stripe_invoice_id?: string | null;
          subscription_id?: string | null;
          tax_amount?: number | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'invoices_subscription_id_fkey';
            columns: ['subscription_id'];
            isOneToOne: false;
            referencedRelation: 'user_subscriptions';
            referencedColumns: ['id'];
          },
        ];
      };
      journal_entries: {
        Row: {
          created_at: string | null;
          description: string | null;
          id: string;
          journal_batch_id: string | null;
          organization_id: string;
          reference: string | null;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          id?: string;
          journal_batch_id?: string | null;
          organization_id: string;
          reference?: string | null;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          id?: string;
          journal_batch_id?: string | null;
          organization_id?: string;
          reference?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'journal_entries_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
        ];
      };
      journal_lines: {
        Row: {
          account_id: string;
          created_at: string | null;
          credit: number | null;
          debit: number | null;
          id: string;
          journal_entry_id: string;
        };
        Insert: {
          account_id: string;
          created_at?: string | null;
          credit?: number | null;
          debit?: number | null;
          id?: string;
          journal_entry_id: string;
        };
        Update: {
          account_id?: string;
          created_at?: string | null;
          credit?: number | null;
          debit?: number | null;
          id?: string;
          journal_entry_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'journal_lines_account_id_fkey';
            columns: ['account_id'];
            isOneToOne: false;
            referencedRelation: 'accounts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'journal_lines_journal_entry_id_fkey';
            columns: ['journal_entry_id'];
            isOneToOne: false;
            referencedRelation: 'journal_entries';
            referencedColumns: ['id'];
          },
        ];
      };
      kyc_profiles: {
        Row: {
          bank_account_verified: boolean | null;
          business_verified: boolean | null;
          bvn_verified: boolean | null;
          created_at: string | null;
          credit_score: number | null;
          id: string;
          nin_verified: boolean | null;
          phone_verified: boolean | null;
          risk_level: string | null;
          risk_score: number | null;
          updated_at: string | null;
          user_id: string;
          verification_level: string | null;
        };
        Insert: {
          bank_account_verified?: boolean | null;
          business_verified?: boolean | null;
          bvn_verified?: boolean | null;
          created_at?: string | null;
          credit_score?: number | null;
          id?: string;
          nin_verified?: boolean | null;
          phone_verified?: boolean | null;
          risk_level?: string | null;
          risk_score?: number | null;
          updated_at?: string | null;
          user_id: string;
          verification_level?: string | null;
        };
        Update: {
          bank_account_verified?: boolean | null;
          business_verified?: boolean | null;
          bvn_verified?: boolean | null;
          created_at?: string | null;
          credit_score?: number | null;
          id?: string;
          nin_verified?: boolean | null;
          phone_verified?: boolean | null;
          risk_level?: string | null;
          risk_score?: number | null;
          updated_at?: string | null;
          user_id?: string;
          verification_level?: string | null;
        };
        Relationships: [];
      };
      leases: {
        Row: {
          created_at: string | null;
          end_date: string;
          id: string;
          monthly_rent: number;
          property_id: string | null;
          security_deposit: number | null;
          start_date: string;
          status: string | null;
          tenant_id: string | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          end_date: string;
          id?: string;
          monthly_rent: number;
          property_id?: string | null;
          security_deposit?: number | null;
          start_date: string;
          status?: string | null;
          tenant_id?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          end_date?: string;
          id?: string;
          monthly_rent?: number;
          property_id?: string | null;
          security_deposit?: number | null;
          start_date?: string;
          status?: string | null;
          tenant_id?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'leases_property_id_fkey';
            columns: ['property_id'];
            isOneToOne: false;
            referencedRelation: 'properties';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'leases_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
        ];
      };
      listing_availabilities: {
        Row: {
          available: boolean | null;
          checkin_days: number[] | null;
          checkout_days: number[] | null;
          created_at: string | null;
          end_date: string;
          id: string;
          listing_id: string;
          max_nights: number | null;
          min_nights: number | null;
          notes: string | null;
          price_override: number | null;
          source: string | null;
          source_id: string | null;
          start_date: string;
          updated_at: string | null;
        };
        Insert: {
          available?: boolean | null;
          checkin_days?: number[] | null;
          checkout_days?: number[] | null;
          created_at?: string | null;
          end_date: string;
          id?: string;
          listing_id: string;
          max_nights?: number | null;
          min_nights?: number | null;
          notes?: string | null;
          price_override?: number | null;
          source?: string | null;
          source_id?: string | null;
          start_date: string;
          updated_at?: string | null;
        };
        Update: {
          available?: boolean | null;
          checkin_days?: number[] | null;
          checkout_days?: number[] | null;
          created_at?: string | null;
          end_date?: string;
          id?: string;
          listing_id?: string;
          max_nights?: number | null;
          min_nights?: number | null;
          notes?: string | null;
          price_override?: number | null;
          source?: string | null;
          source_id?: string | null;
          start_date?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'listing_availabilities_listing_id_fkey';
            columns: ['listing_id'];
            isOneToOne: false;
            referencedRelation: 'listings';
            referencedColumns: ['id'];
          },
        ];
      };
      listing_pricing: {
        Row: {
          available: boolean | null;
          created_at: string | null;
          date: string;
          id: string;
          listing_id: string;
          max_nights: number | null;
          min_nights: number | null;
          notes: string | null;
          price: number;
          source: string | null;
          source_id: string | null;
          updated_at: string | null;
        };
        Insert: {
          available?: boolean | null;
          created_at?: string | null;
          date: string;
          id?: string;
          listing_id: string;
          max_nights?: number | null;
          min_nights?: number | null;
          notes?: string | null;
          price: number;
          source?: string | null;
          source_id?: string | null;
          updated_at?: string | null;
        };
        Update: {
          available?: boolean | null;
          created_at?: string | null;
          date?: string;
          id?: string;
          listing_id?: string;
          max_nights?: number | null;
          min_nights?: number | null;
          notes?: string | null;
          price?: number;
          source?: string | null;
          source_id?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'listing_pricing_listing_id_fkey';
            columns: ['listing_id'];
            isOneToOne: false;
            referencedRelation: 'listings';
            referencedColumns: ['id'];
          },
        ];
      };
      listings: {
        Row: {
          active: boolean | null;
          amenities: Json | null;
          base_price: number;
          cancellation_policy: Json | null;
          capacity: number;
          cleaning_fee: number | null;
          created_at: string | null;
          description: string | null;
          id: string;
          instant_book: boolean | null;
          property_id: string;
          security_deposit: number | null;
          timezone: string | null;
          title: string;
          updated_at: string | null;
        };
        Insert: {
          active?: boolean | null;
          amenities?: Json | null;
          base_price: number;
          cancellation_policy?: Json | null;
          capacity?: number;
          cleaning_fee?: number | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          instant_book?: boolean | null;
          property_id: string;
          security_deposit?: number | null;
          timezone?: string | null;
          title: string;
          updated_at?: string | null;
        };
        Update: {
          active?: boolean | null;
          amenities?: Json | null;
          base_price?: number;
          cancellation_policy?: Json | null;
          capacity?: number;
          cleaning_fee?: number | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          instant_book?: boolean | null;
          property_id?: string;
          security_deposit?: number | null;
          timezone?: string | null;
          title?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'listings_property_id_fkey';
            columns: ['property_id'];
            isOneToOne: false;
            referencedRelation: 'properties';
            referencedColumns: ['id'];
          },
        ];
      };
      maintenance_budgets: {
        Row: {
          budgeted_amount: number;
          category: string;
          id: string;
          last_updated: string | null;
          predicted_amount: number;
          property_id: string;
          quarter: number | null;
          spent_amount: number;
          variance: number | null;
          year: number;
        };
        Insert: {
          budgeted_amount?: number;
          category: string;
          id?: string;
          last_updated?: string | null;
          predicted_amount?: number;
          property_id: string;
          quarter?: number | null;
          spent_amount?: number;
          variance?: number | null;
          year: number;
        };
        Update: {
          budgeted_amount?: number;
          category?: string;
          id?: string;
          last_updated?: string | null;
          predicted_amount?: number;
          property_id?: string;
          quarter?: number | null;
          spent_amount?: number;
          variance?: number | null;
          year?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'maintenance_budgets_property_id_fkey';
            columns: ['property_id'];
            isOneToOne: false;
            referencedRelation: 'properties';
            referencedColumns: ['id'];
          },
        ];
      };
      maintenance_insights: {
        Row: {
          created_at: string | null;
          description: string;
          id: string;
          impact_score: number;
          implementation_effort: string;
          insight_type: string;
          is_active: boolean | null;
          potential_savings: number;
          property_id: string;
          recommended_timeline: string;
          supporting_data: Json | null;
          title: string;
        };
        Insert: {
          created_at?: string | null;
          description: string;
          id?: string;
          impact_score: number;
          implementation_effort: string;
          insight_type: string;
          is_active?: boolean | null;
          potential_savings?: number;
          property_id: string;
          recommended_timeline: string;
          supporting_data?: Json | null;
          title: string;
        };
        Update: {
          created_at?: string | null;
          description?: string;
          id?: string;
          impact_score?: number;
          implementation_effort?: string;
          insight_type?: string;
          is_active?: boolean | null;
          potential_savings?: number;
          property_id?: string;
          recommended_timeline?: string;
          supporting_data?: Json | null;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'maintenance_insights_property_id_fkey';
            columns: ['property_id'];
            isOneToOne: false;
            referencedRelation: 'properties';
            referencedColumns: ['id'];
          },
        ];
      };
      maintenance_records: {
        Row: {
          after_photos: string[] | null;
          before_photos: string[] | null;
          category: string;
          cost: number;
          created_at: string | null;
          description: string;
          equipment_id: string | null;
          id: string;
          maintenance_type: string;
          notes: string | null;
          parts_replaced: string[] | null;
          performed_by: string;
          performed_date: string;
          property_id: string;
        };
        Insert: {
          after_photos?: string[] | null;
          before_photos?: string[] | null;
          category: string;
          cost?: number;
          created_at?: string | null;
          description: string;
          equipment_id?: string | null;
          id?: string;
          maintenance_type: string;
          notes?: string | null;
          parts_replaced?: string[] | null;
          performed_by: string;
          performed_date: string;
          property_id: string;
        };
        Update: {
          after_photos?: string[] | null;
          before_photos?: string[] | null;
          category?: string;
          cost?: number;
          created_at?: string | null;
          description?: string;
          equipment_id?: string | null;
          id?: string;
          maintenance_type?: string;
          notes?: string | null;
          parts_replaced?: string[] | null;
          performed_by?: string;
          performed_date?: string;
          property_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'maintenance_records_equipment_id_fkey';
            columns: ['equipment_id'];
            isOneToOne: false;
            referencedRelation: 'equipment_data';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'maintenance_records_property_id_fkey';
            columns: ['property_id'];
            isOneToOne: false;
            referencedRelation: 'properties';
            referencedColumns: ['id'];
          },
        ];
      };
      maintenance_requests: {
        Row: {
          admin_notes: string | null;
          category: string;
          created_at: string | null;
          id: string;
          issue: string | null;
          property_id: string | null;
          status: string | null;
          tenant_id: string | null;
          user_id: string | null;
        };
        Insert: {
          admin_notes?: string | null;
          category?: string;
          created_at?: string | null;
          id?: string;
          issue?: string | null;
          property_id?: string | null;
          status?: string | null;
          tenant_id?: string | null;
          user_id?: string | null;
        };
        Update: {
          admin_notes?: string | null;
          category?: string;
          created_at?: string | null;
          id?: string;
          issue?: string | null;
          property_id?: string | null;
          status?: string | null;
          tenant_id?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'fk_property';
            columns: ['property_id'];
            isOneToOne: false;
            referencedRelation: 'properties';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'maintenance_requests_property_id_fkey';
            columns: ['property_id'];
            isOneToOne: false;
            referencedRelation: 'properties';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'maintenance_requests_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      maintenance_schedules: {
        Row: {
          assigned_to: string | null;
          category: string;
          created_at: string | null;
          description: string;
          equipment_id: string | null;
          estimated_cost: number;
          estimated_duration: string;
          frequency_type: string;
          frequency_value: number;
          id: string;
          is_active: boolean | null;
          last_completed: string | null;
          next_due: string;
          priority: string;
          property_id: string;
          seasonal_adjustments: Json | null;
          task_name: string;
          updated_at: string | null;
        };
        Insert: {
          assigned_to?: string | null;
          category: string;
          created_at?: string | null;
          description: string;
          equipment_id?: string | null;
          estimated_cost?: number;
          estimated_duration: string;
          frequency_type: string;
          frequency_value?: number;
          id?: string;
          is_active?: boolean | null;
          last_completed?: string | null;
          next_due: string;
          priority: string;
          property_id: string;
          seasonal_adjustments?: Json | null;
          task_name: string;
          updated_at?: string | null;
        };
        Update: {
          assigned_to?: string | null;
          category?: string;
          created_at?: string | null;
          description?: string;
          equipment_id?: string | null;
          estimated_cost?: number;
          estimated_duration?: string;
          frequency_type?: string;
          frequency_value?: number;
          id?: string;
          is_active?: boolean | null;
          last_completed?: string | null;
          next_due?: string;
          priority?: string;
          property_id?: string;
          seasonal_adjustments?: Json | null;
          task_name?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'maintenance_schedules_equipment_id_fkey';
            columns: ['equipment_id'];
            isOneToOne: false;
            referencedRelation: 'equipment_data';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'maintenance_schedules_property_id_fkey';
            columns: ['property_id'];
            isOneToOne: false;
            referencedRelation: 'properties';
            referencedColumns: ['id'];
          },
        ];
      };
      message_templates: {
        Row: {
          category: string;
          created_at: string;
          description: string | null;
          id: string;
          key: string;
          lang: string;
          title: string | null;
          updated_at: string;
        };
        Insert: {
          category: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          key: string;
          lang?: string;
          title?: string | null;
          updated_at?: string;
        };
        Update: {
          category?: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          key?: string;
          lang?: string;
          title?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      nigerian_banks: {
        Row: {
          active: boolean | null;
          code: string;
          country: string | null;
          created_at: string | null;
          currency: string | null;
          gateway: string | null;
          id: number;
          is_deleted: boolean | null;
          logo_url: string | null;
          longcode: string | null;
          name: string;
          pay_with_bank: boolean | null;
          slug: string;
          type: string | null;
          updated_at: string | null;
        };
        Insert: {
          active?: boolean | null;
          code: string;
          country?: string | null;
          created_at?: string | null;
          currency?: string | null;
          gateway?: string | null;
          id?: number;
          is_deleted?: boolean | null;
          logo_url?: string | null;
          longcode?: string | null;
          name: string;
          pay_with_bank?: boolean | null;
          slug: string;
          type?: string | null;
          updated_at?: string | null;
        };
        Update: {
          active?: boolean | null;
          code?: string;
          country?: string | null;
          created_at?: string | null;
          currency?: string | null;
          gateway?: string | null;
          id?: number;
          is_deleted?: boolean | null;
          logo_url?: string | null;
          longcode?: string | null;
          name?: string;
          pay_with_bank?: boolean | null;
          slug?: string;
          type?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          created_at: string | null;
          id: string;
          message: string | null;
          status: string | null;
          type: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          message?: string | null;
          status?: string | null;
          type?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          message?: string | null;
          status?: string | null;
          type?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'notifications_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      organizations: {
        Row: {
          created_at: string | null;
          id: string;
          name: string;
          type: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          name: string;
          type?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          name?: string;
          type?: string | null;
        };
        Relationships: [];
      };
      payment_transactions: {
        Row: {
          amount: number;
          created_at: string;
          currency: string;
          failure_reason: string | null;
          gateway: string;
          gateway_reference: string | null;
          gateway_transaction_id: string;
          id: string;
          invoice_id: string | null;
          metadata: Json | null;
          payment_method: string;
          refund_amount: number | null;
          refunded_at: string | null;
          status: string;
          subscription_id: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          amount: number;
          created_at?: string;
          currency?: string;
          failure_reason?: string | null;
          gateway: string;
          gateway_reference?: string | null;
          gateway_transaction_id: string;
          id?: string;
          invoice_id?: string | null;
          metadata?: Json | null;
          payment_method: string;
          refund_amount?: number | null;
          refunded_at?: string | null;
          status?: string;
          subscription_id?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          amount?: number;
          created_at?: string;
          currency?: string;
          failure_reason?: string | null;
          gateway?: string;
          gateway_reference?: string | null;
          gateway_transaction_id?: string;
          id?: string;
          invoice_id?: string | null;
          metadata?: Json | null;
          payment_method?: string;
          refund_amount?: number | null;
          refunded_at?: string | null;
          status?: string;
          subscription_id?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'payment_transactions_invoice_id_fkey';
            columns: ['invoice_id'];
            isOneToOne: false;
            referencedRelation: 'invoices';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'payment_transactions_subscription_id_fkey';
            columns: ['subscription_id'];
            isOneToOne: false;
            referencedRelation: 'user_subscriptions';
            referencedColumns: ['id'];
          },
        ];
      };
      payments: {
        Row: {
          amount: number;
          created_at: string | null;
          currency: string | null;
          flutterwave_tx_id: string | null;
          id: string;
          organization_id: string;
          paid_at: string | null;
          payment_link: string | null;
          status: string | null;
          tenant_id: string;
          tx_ref: string | null;
        };
        Insert: {
          amount: number;
          created_at?: string | null;
          currency?: string | null;
          flutterwave_tx_id?: string | null;
          id?: string;
          organization_id: string;
          paid_at?: string | null;
          payment_link?: string | null;
          status?: string | null;
          tenant_id: string;
          tx_ref?: string | null;
        };
        Update: {
          amount?: number;
          created_at?: string | null;
          currency?: string | null;
          flutterwave_tx_id?: string | null;
          id?: string;
          organization_id?: string;
          paid_at?: string | null;
          payment_link?: string | null;
          status?: string | null;
          tenant_id?: string;
          tx_ref?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'payments_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'payments_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      predictive_alerts: {
        Row: {
          category: string;
          confidence_score: number;
          created_at: string | null;
          description: string;
          equipment_id: string | null;
          estimated_cost: number;
          factors: Json;
          id: string;
          notes: string | null;
          potential_savings: number;
          predicted_failure_date: string;
          priority: string;
          property_id: string;
          recommended_actions: Json;
          resolved_at: string | null;
          risk_level: string;
          status: string;
          title: string;
          updated_at: string | null;
        };
        Insert: {
          category: string;
          confidence_score: number;
          created_at?: string | null;
          description: string;
          equipment_id?: string | null;
          estimated_cost?: number;
          factors?: Json;
          id?: string;
          notes?: string | null;
          potential_savings?: number;
          predicted_failure_date: string;
          priority: string;
          property_id: string;
          recommended_actions?: Json;
          resolved_at?: string | null;
          risk_level: string;
          status?: string;
          title: string;
          updated_at?: string | null;
        };
        Update: {
          category?: string;
          confidence_score?: number;
          created_at?: string | null;
          description?: string;
          equipment_id?: string | null;
          estimated_cost?: number;
          factors?: Json;
          id?: string;
          notes?: string | null;
          potential_savings?: number;
          predicted_failure_date?: string;
          priority?: string;
          property_id?: string;
          recommended_actions?: Json;
          resolved_at?: string | null;
          risk_level?: string;
          status?: string;
          title?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'predictive_alerts_equipment_id_fkey';
            columns: ['equipment_id'];
            isOneToOne: false;
            referencedRelation: 'equipment_data';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'predictive_alerts_property_id_fkey';
            columns: ['property_id'];
            isOneToOne: false;
            referencedRelation: 'properties';
            referencedColumns: ['id'];
          },
        ];
      };
      predictive_maintenance_settings: {
        Row: {
          alert_preferences: Json | null;
          auto_scheduling_enabled: boolean | null;
          budget_alert_threshold: number | null;
          confidence_threshold: number | null;
          created_at: string | null;
          prediction_horizon_days: number | null;
          preferred_maintenance_window: Json | null;
          property_id: string;
          seasonal_adjustments_enabled: boolean | null;
          sensor_integration_enabled: boolean | null;
          updated_at: string | null;
        };
        Insert: {
          alert_preferences?: Json | null;
          auto_scheduling_enabled?: boolean | null;
          budget_alert_threshold?: number | null;
          confidence_threshold?: number | null;
          created_at?: string | null;
          prediction_horizon_days?: number | null;
          preferred_maintenance_window?: Json | null;
          property_id: string;
          seasonal_adjustments_enabled?: boolean | null;
          sensor_integration_enabled?: boolean | null;
          updated_at?: string | null;
        };
        Update: {
          alert_preferences?: Json | null;
          auto_scheduling_enabled?: boolean | null;
          budget_alert_threshold?: number | null;
          confidence_threshold?: number | null;
          created_at?: string | null;
          prediction_horizon_days?: number | null;
          preferred_maintenance_window?: Json | null;
          property_id?: string;
          seasonal_adjustments_enabled?: boolean | null;
          sensor_integration_enabled?: boolean | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'predictive_maintenance_settings_property_id_fkey';
            columns: ['property_id'];
            isOneToOne: true;
            referencedRelation: 'properties';
            referencedColumns: ['id'];
          },
        ];
      };
      pricing_experiments: {
        Row: {
          created_at: string;
          description: string | null;
          end_date: string | null;
          id: string;
          name: string;
          results: Json | null;
          start_date: string | null;
          status: string;
          success_metrics: Json | null;
          traffic_allocation: number | null;
          updated_at: string;
          variants: Json;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          end_date?: string | null;
          id?: string;
          name: string;
          results?: Json | null;
          start_date?: string | null;
          status?: string;
          success_metrics?: Json | null;
          traffic_allocation?: number | null;
          updated_at?: string;
          variants?: Json;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          end_date?: string | null;
          id?: string;
          name?: string;
          results?: Json | null;
          start_date?: string | null;
          status?: string;
          success_metrics?: Json | null;
          traffic_allocation?: number | null;
          updated_at?: string;
          variants?: Json;
        };
        Relationships: [];
      };
      pricing_rules: {
        Row: {
          active: boolean | null;
          created_at: string | null;
          end_date: string | null;
          id: string;
          listing_id: string;
          priority: number | null;
          rule_config: Json;
          rule_name: string;
          rule_type: string;
          start_date: string | null;
          updated_at: string | null;
        };
        Insert: {
          active?: boolean | null;
          created_at?: string | null;
          end_date?: string | null;
          id?: string;
          listing_id: string;
          priority?: number | null;
          rule_config: Json;
          rule_name: string;
          rule_type: string;
          start_date?: string | null;
          updated_at?: string | null;
        };
        Update: {
          active?: boolean | null;
          created_at?: string | null;
          end_date?: string | null;
          id?: string;
          listing_id?: string;
          priority?: number | null;
          rule_config?: Json;
          rule_name?: string;
          rule_type?: string;
          start_date?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'pricing_rules_listing_id_fkey';
            columns: ['listing_id'];
            isOneToOne: false;
            referencedRelation: 'listings';
            referencedColumns: ['id'];
          },
        ];
      };
      profiles: {
        Row: {
          availability_hours: string | null;
          avatar_url: string | null;
          bio: string | null;
          company: string | null;
          created_at: string | null;
          email: string;
          first_name: string | null;
          flutterwave_recipient_data: Json | null;
          id: string;
          last_name: string | null;
          license_number: string | null;
          onboarding_completed: boolean | null;
          onboarding_data: Json | null;
          onboarding_tour_completed: boolean;
          paystack_recipient_code: string | null;
          paystack_recipient_data: Json | null;
          phone: string | null;
          preferred_contact_method: string | null;
          recommended_settings: Json | null;
          role: string | null;
          specializations: string[] | null;
          status: string | null;
          updated_at: string | null;
          working_areas: string[] | null;
          years_of_experience: number | null;
        };
        Insert: {
          availability_hours?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          company?: string | null;
          created_at?: string | null;
          email: string;
          first_name?: string | null;
          flutterwave_recipient_data?: Json | null;
          id: string;
          last_name?: string | null;
          license_number?: string | null;
          onboarding_completed?: boolean | null;
          onboarding_data?: Json | null;
          onboarding_tour_completed?: boolean;
          paystack_recipient_code?: string | null;
          paystack_recipient_data?: Json | null;
          phone?: string | null;
          preferred_contact_method?: string | null;
          recommended_settings?: Json | null;
          role?: string | null;
          specializations?: string[] | null;
          status?: string | null;
          updated_at?: string | null;
          working_areas?: string[] | null;
          years_of_experience?: number | null;
        };
        Update: {
          availability_hours?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          company?: string | null;
          created_at?: string | null;
          email?: string;
          first_name?: string | null;
          flutterwave_recipient_data?: Json | null;
          id?: string;
          last_name?: string | null;
          license_number?: string | null;
          onboarding_completed?: boolean | null;
          onboarding_data?: Json | null;
          onboarding_tour_completed?: boolean;
          paystack_recipient_code?: string | null;
          paystack_recipient_data?: Json | null;
          phone?: string | null;
          preferred_contact_method?: string | null;
          recommended_settings?: Json | null;
          role?: string | null;
          specializations?: string[] | null;
          status?: string | null;
          updated_at?: string | null;
          working_areas?: string[] | null;
          years_of_experience?: number | null;
        };
        Relationships: [];
      };
      properties: {
        Row: {
          address: string | null;
          agent_commission_rate: number | null;
          agent_id: string | null;
          amenities: string[] | null;
          availability_date: string | null;
          city: string | null;
          created_at: string | null;
          features: string[] | null;
          id: string;
          is_shortlet: boolean | null;
          latitude: number | null;
          lease_terms: string | null;
          longitude: number | null;
          name: string | null;
          organization_id: string;
          owner_id: string | null;
          shortlet_details: Json | null;
          state: string | null;
          status: string | null;
          tour_url: string | null;
        };
        Insert: {
          address?: string | null;
          agent_commission_rate?: number | null;
          agent_id?: string | null;
          amenities?: string[] | null;
          availability_date?: string | null;
          city?: string | null;
          created_at?: string | null;
          features?: string[] | null;
          id?: string;
          is_shortlet?: boolean | null;
          latitude?: number | null;
          lease_terms?: string | null;
          longitude?: number | null;
          name?: string | null;
          organization_id?: string;
          owner_id?: string | null;
          shortlet_details?: Json | null;
          state?: string | null;
          status?: string | null;
          tour_url?: string | null;
        };
        Update: {
          address?: string | null;
          agent_commission_rate?: number | null;
          agent_id?: string | null;
          amenities?: string[] | null;
          availability_date?: string | null;
          city?: string | null;
          created_at?: string | null;
          features?: string[] | null;
          id?: string;
          is_shortlet?: boolean | null;
          latitude?: number | null;
          lease_terms?: string | null;
          longitude?: number | null;
          name?: string | null;
          organization_id?: string;
          owner_id?: string | null;
          shortlet_details?: Json | null;
          state?: string | null;
          status?: string | null;
          tour_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'properties_agent_id_fkey';
            columns: ['agent_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'properties_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'properties_owner_id_fkey';
            columns: ['owner_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      property_interactions: {
        Row: {
          created_at: string | null;
          duration_seconds: number | null;
          id: string;
          interaction_data: Json | null;
          interaction_type: string;
          property_id: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          duration_seconds?: number | null;
          id?: string;
          interaction_data?: Json | null;
          interaction_type: string;
          property_id?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          duration_seconds?: number | null;
          id?: string;
          interaction_data?: Json | null;
          interaction_type?: string;
          property_id?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'property_interactions_property_id_fkey';
            columns: ['property_id'];
            isOneToOne: false;
            referencedRelation: 'properties';
            referencedColumns: ['id'];
          },
        ];
      };
      property_maintenance_profiles: {
        Row: {
          annual_maintenance_cost: number | null;
          climate_zone: string | null;
          created_at: string | null;
          equipment_condition_score: number | null;
          last_assessment: string | null;
          maintenance_complexity: string | null;
          maintenance_history_score: number | null;
          occupancy_rate: number | null;
          predictive_accuracy: number | null;
          property_age: number;
          property_id: string;
          property_type: string;
          risk_factors: string[] | null;
          square_footage: number | null;
          updated_at: string | null;
        };
        Insert: {
          annual_maintenance_cost?: number | null;
          climate_zone?: string | null;
          created_at?: string | null;
          equipment_condition_score?: number | null;
          last_assessment?: string | null;
          maintenance_complexity?: string | null;
          maintenance_history_score?: number | null;
          occupancy_rate?: number | null;
          predictive_accuracy?: number | null;
          property_age?: number;
          property_id: string;
          property_type: string;
          risk_factors?: string[] | null;
          square_footage?: number | null;
          updated_at?: string | null;
        };
        Update: {
          annual_maintenance_cost?: number | null;
          climate_zone?: string | null;
          created_at?: string | null;
          equipment_condition_score?: number | null;
          last_assessment?: string | null;
          maintenance_complexity?: string | null;
          maintenance_history_score?: number | null;
          occupancy_rate?: number | null;
          predictive_accuracy?: number | null;
          property_age?: number;
          property_id?: string;
          property_type?: string;
          risk_factors?: string[] | null;
          square_footage?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'property_maintenance_profiles_property_id_fkey';
            columns: ['property_id'];
            isOneToOne: true;
            referencedRelation: 'properties';
            referencedColumns: ['id'];
          },
        ];
      };
      property_tokens: {
        Row: {
          contract_address: string;
          created_at: string | null;
          currency: string | null;
          id: string;
          metadata: Json | null;
          metadata_uri: string | null;
          minted_at: string | null;
          network: string;
          owner_address: string;
          price: number | null;
          property_id: string;
          token_id: string;
          updated_at: string | null;
          verification_transaction_hash: string | null;
          verified: boolean | null;
        };
        Insert: {
          contract_address: string;
          created_at?: string | null;
          currency?: string | null;
          id?: string;
          metadata?: Json | null;
          metadata_uri?: string | null;
          minted_at?: string | null;
          network: string;
          owner_address: string;
          price?: number | null;
          property_id: string;
          token_id: string;
          updated_at?: string | null;
          verification_transaction_hash?: string | null;
          verified?: boolean | null;
        };
        Update: {
          contract_address?: string;
          created_at?: string | null;
          currency?: string | null;
          id?: string;
          metadata?: Json | null;
          metadata_uri?: string | null;
          minted_at?: string | null;
          network?: string;
          owner_address?: string;
          price?: number | null;
          property_id?: string;
          token_id?: string;
          updated_at?: string | null;
          verification_transaction_hash?: string | null;
          verified?: boolean | null;
        };
        Relationships: [
          {
            foreignKeyName: 'property_tokens_property_id_fkey';
            columns: ['property_id'];
            isOneToOne: false;
            referencedRelation: 'properties';
            referencedColumns: ['id'];
          },
        ];
      };
      property_transfers: {
        Row: {
          block_number: number | null;
          confirmed_at: string | null;
          created_at: string | null;
          currency: string | null;
          escrow_address: string | null;
          escrow_used: boolean | null;
          from_address: string;
          id: string;
          price: number | null;
          property_token_id: string;
          to_address: string;
          transaction_hash: string;
          transfer_type: string | null;
        };
        Insert: {
          block_number?: number | null;
          confirmed_at?: string | null;
          created_at?: string | null;
          currency?: string | null;
          escrow_address?: string | null;
          escrow_used?: boolean | null;
          from_address: string;
          id?: string;
          price?: number | null;
          property_token_id: string;
          to_address: string;
          transaction_hash: string;
          transfer_type?: string | null;
        };
        Update: {
          block_number?: number | null;
          confirmed_at?: string | null;
          created_at?: string | null;
          currency?: string | null;
          escrow_address?: string | null;
          escrow_used?: boolean | null;
          from_address?: string;
          id?: string;
          price?: number | null;
          property_token_id?: string;
          to_address?: string;
          transaction_hash?: string;
          transfer_type?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'property_transfers_property_token_id_fkey';
            columns: ['property_token_id'];
            isOneToOne: false;
            referencedRelation: 'property_tokens';
            referencedColumns: ['id'];
          },
        ];
      };
      reconciliation_runs: {
        Row: {
          created_at: string | null;
          discrepancy: number | null;
          finalized_at: string | null;
          finalized_by: string | null;
          id: string;
          notes: string | null;
          period_end: string;
          period_start: string;
          status: string | null;
          total_payouts: number | null;
          total_revenue: number | null;
        };
        Insert: {
          created_at?: string | null;
          discrepancy?: number | null;
          finalized_at?: string | null;
          finalized_by?: string | null;
          id?: string;
          notes?: string | null;
          period_end: string;
          period_start: string;
          status?: string | null;
          total_payouts?: number | null;
          total_revenue?: number | null;
        };
        Update: {
          created_at?: string | null;
          discrepancy?: number | null;
          finalized_at?: string | null;
          finalized_by?: string | null;
          id?: string;
          notes?: string | null;
          period_end?: string;
          period_start?: string;
          status?: string | null;
          total_payouts?: number | null;
          total_revenue?: number | null;
        };
        Relationships: [];
      };
      recurring_availability_patterns: {
        Row: {
          active: boolean | null;
          available: boolean | null;
          checkin_days: number[] | null;
          checkout_days: number[] | null;
          created_at: string | null;
          end_date: string | null;
          id: string;
          listing_id: string;
          max_nights: number | null;
          min_nights: number | null;
          pattern_config: Json;
          pattern_type: string;
          price_override: number | null;
          start_date: string;
          updated_at: string | null;
        };
        Insert: {
          active?: boolean | null;
          available?: boolean | null;
          checkin_days?: number[] | null;
          checkout_days?: number[] | null;
          created_at?: string | null;
          end_date?: string | null;
          id?: string;
          listing_id: string;
          max_nights?: number | null;
          min_nights?: number | null;
          pattern_config: Json;
          pattern_type: string;
          price_override?: number | null;
          start_date: string;
          updated_at?: string | null;
        };
        Update: {
          active?: boolean | null;
          available?: boolean | null;
          checkin_days?: number[] | null;
          checkout_days?: number[] | null;
          created_at?: string | null;
          end_date?: string | null;
          id?: string;
          listing_id?: string;
          max_nights?: number | null;
          min_nights?: number | null;
          pattern_config?: Json;
          pattern_type?: string;
          price_override?: number | null;
          start_date?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'recurring_availability_patterns_listing_id_fkey';
            columns: ['listing_id'];
            isOneToOne: false;
            referencedRelation: 'listings';
            referencedColumns: ['id'];
          },
        ];
      };
      recurring_payments: {
        Row: {
          active: boolean | null;
          amount: number;
          auto_execute: boolean | null;
          contract_address: string | null;
          created_at: string | null;
          currency: string | null;
          failed_payments: number | null;
          frequency: string;
          from_address: string;
          id: string;
          last_payment_date: string | null;
          lease_id: string | null;
          network: string;
          next_payment_date: string;
          payment_type: string;
          property_id: string | null;
          successful_payments: number | null;
          to_address: string;
          total_payments: number | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          active?: boolean | null;
          amount: number;
          auto_execute?: boolean | null;
          contract_address?: string | null;
          created_at?: string | null;
          currency?: string | null;
          failed_payments?: number | null;
          frequency: string;
          from_address: string;
          id?: string;
          last_payment_date?: string | null;
          lease_id?: string | null;
          network: string;
          next_payment_date: string;
          payment_type: string;
          property_id?: string | null;
          successful_payments?: number | null;
          to_address: string;
          total_payments?: number | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          active?: boolean | null;
          amount?: number;
          auto_execute?: boolean | null;
          contract_address?: string | null;
          created_at?: string | null;
          currency?: string | null;
          failed_payments?: number | null;
          frequency?: string;
          from_address?: string;
          id?: string;
          last_payment_date?: string | null;
          lease_id?: string | null;
          network?: string;
          next_payment_date?: string;
          payment_type?: string;
          property_id?: string | null;
          successful_payments?: number | null;
          to_address?: string;
          total_payments?: number | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'recurring_payments_lease_id_fkey';
            columns: ['lease_id'];
            isOneToOne: false;
            referencedRelation: 'leases';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'recurring_payments_property_id_fkey';
            columns: ['property_id'];
            isOneToOne: false;
            referencedRelation: 'properties';
            referencedColumns: ['id'];
          },
        ];
      };
      rental_milestones: {
        Row: {
          created_at: string;
          date: string;
          description: string;
          id: string;
          milestone_type: string;
          notification_sent: boolean;
          property_id: string;
          property_name: string;
          status: string;
          tenant_id: string;
          tenant_name: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          date: string;
          description: string;
          id?: string;
          milestone_type: string;
          notification_sent?: boolean;
          property_id: string;
          property_name: string;
          status: string;
          tenant_id: string;
          tenant_name: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          date?: string;
          description?: string;
          id?: string;
          milestone_type?: string;
          notification_sent?: boolean;
          property_id?: string;
          property_name?: string;
          status?: string;
          tenant_id?: string;
          tenant_name?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'rental_milestones_property_id_fkey';
            columns: ['property_id'];
            isOneToOne: false;
            referencedRelation: 'properties';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'rental_milestones_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
        ];
      };
      reviews: {
        Row: {
          booking_id: string;
          comment: string | null;
          created_at: string | null;
          id: string;
          rating: number;
          response: string | null;
          response_at: string | null;
          review_type: string;
          reviewee_id: string;
          reviewer_id: string;
          updated_at: string | null;
        };
        Insert: {
          booking_id: string;
          comment?: string | null;
          created_at?: string | null;
          id?: string;
          rating: number;
          response?: string | null;
          response_at?: string | null;
          review_type?: string;
          reviewee_id: string;
          reviewer_id: string;
          updated_at?: string | null;
        };
        Update: {
          booking_id?: string;
          comment?: string | null;
          created_at?: string | null;
          id?: string;
          rating?: number;
          response?: string | null;
          response_at?: string | null;
          review_type?: string;
          reviewee_id?: string;
          reviewer_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'reviews_booking_id_fkey';
            columns: ['booking_id'];
            isOneToOne: true;
            referencedRelation: 'bookings';
            referencedColumns: ['id'];
          },
        ];
      };
      sensor_readings: {
        Row: {
          created_at: string | null;
          equipment_id: string;
          id: string;
          is_anomaly: boolean | null;
          sensor_type: string;
          threshold_max: number | null;
          threshold_min: number | null;
          timestamp: string;
          unit: string;
          value: number;
        };
        Insert: {
          created_at?: string | null;
          equipment_id: string;
          id?: string;
          is_anomaly?: boolean | null;
          sensor_type: string;
          threshold_max?: number | null;
          threshold_min?: number | null;
          timestamp: string;
          unit: string;
          value: number;
        };
        Update: {
          created_at?: string | null;
          equipment_id?: string;
          id?: string;
          is_anomaly?: boolean | null;
          sensor_type?: string;
          threshold_max?: number | null;
          threshold_min?: number | null;
          timestamp?: string;
          unit?: string;
          value?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'sensor_readings_equipment_id_fkey';
            columns: ['equipment_id'];
            isOneToOne: false;
            referencedRelation: 'equipment_data';
            referencedColumns: ['id'];
          },
        ];
      };
      smart_recommendations: {
        Row: {
          confidence_level: string;
          created_at: string | null;
          expires_at: string | null;
          id: string;
          overall_score: number;
          property_id: string | null;
          reasons: string[] | null;
          recommendation_type: string | null;
          score_breakdown: Json;
          status: string | null;
          user_id: string | null;
        };
        Insert: {
          confidence_level: string;
          created_at?: string | null;
          expires_at?: string | null;
          id?: string;
          overall_score: number;
          property_id?: string | null;
          reasons?: string[] | null;
          recommendation_type?: string | null;
          score_breakdown: Json;
          status?: string | null;
          user_id?: string | null;
        };
        Update: {
          confidence_level?: string;
          created_at?: string | null;
          expires_at?: string | null;
          id?: string;
          overall_score?: number;
          property_id?: string | null;
          reasons?: string[] | null;
          recommendation_type?: string | null;
          score_breakdown?: Json;
          status?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'smart_recommendations_property_id_fkey';
            columns: ['property_id'];
            isOneToOne: false;
            referencedRelation: 'properties';
            referencedColumns: ['id'];
          },
        ];
      };
      subscription_events: {
        Row: {
          created_at: string;
          event_data: Json;
          event_type: string;
          id: string;
          subscription_id: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          event_data?: Json;
          event_type: string;
          id?: string;
          subscription_id?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          event_data?: Json;
          event_type?: string;
          id?: string;
          subscription_id?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'subscription_events_subscription_id_fkey';
            columns: ['subscription_id'];
            isOneToOne: false;
            referencedRelation: 'user_subscriptions';
            referencedColumns: ['id'];
          },
        ];
      };
      subscription_plans: {
        Row: {
          add_ons: Json | null;
          created_at: string;
          description: string;
          features: Json;
          id: string;
          is_active: boolean | null;
          limits: Json;
          name: string;
          popular: boolean | null;
          pricing: Json;
          setup_fee: number | null;
          tagline: string | null;
          tier: string;
          trial_days: number | null;
          updated_at: string;
        };
        Insert: {
          add_ons?: Json | null;
          created_at?: string;
          description: string;
          features?: Json;
          id?: string;
          is_active?: boolean | null;
          limits?: Json;
          name: string;
          popular?: boolean | null;
          pricing?: Json;
          setup_fee?: number | null;
          tagline?: string | null;
          tier: string;
          trial_days?: number | null;
          updated_at?: string;
        };
        Update: {
          add_ons?: Json | null;
          created_at?: string;
          description?: string;
          features?: Json;
          id?: string;
          is_active?: boolean | null;
          limits?: Json;
          name?: string;
          popular?: boolean | null;
          pricing?: Json;
          setup_fee?: number | null;
          tagline?: string | null;
          tier?: string;
          trial_days?: number | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          organization_id: string | null;
          plan: string | null;
          started_at: string | null;
          status: string | null;
        };
        Insert: {
          id?: string;
          organization_id?: string | null;
          plan?: string | null;
          started_at?: string | null;
          status?: string | null;
        };
        Update: {
          id?: string;
          organization_id?: string | null;
          plan?: string | null;
          started_at?: string | null;
          status?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'subscriptions_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
        ];
      };
      tenancies: {
        Row: {
          created_at: string | null;
          deposit_amount: number | null;
          end_date: string | null;
          id: string;
          rent_amount: number | null;
          start_date: string | null;
          status: string | null;
          tenant_id: string;
          unit_id: string;
        };
        Insert: {
          created_at?: string | null;
          deposit_amount?: number | null;
          end_date?: string | null;
          id?: string;
          rent_amount?: number | null;
          start_date?: string | null;
          status?: string | null;
          tenant_id: string;
          unit_id: string;
        };
        Update: {
          created_at?: string | null;
          deposit_amount?: number | null;
          end_date?: string | null;
          id?: string;
          rent_amount?: number | null;
          start_date?: string | null;
          status?: string | null;
          tenant_id?: string;
          unit_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'tenancies_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tenancies_unit_id_fkey';
            columns: ['unit_id'];
            isOneToOne: false;
            referencedRelation: 'units';
            referencedColumns: ['id'];
          },
        ];
      };
      tenant_screenings: {
        Row: {
          created_at: string;
          id: string;
          results: Json | null;
          status: Database['public']['Enums']['screening_status'];
          tenant_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          results?: Json | null;
          status?: Database['public']['Enums']['screening_status'];
          tenant_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          results?: Json | null;
          status?: Database['public']['Enums']['screening_status'];
          tenant_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'tenant_screenings_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
        ];
      };
      screening_waivers: {
        Row: {
          active: boolean;
          created_at: string;
          created_by: string | null;
          reason: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          active?: boolean;
          created_at?: string;
          created_by?: string | null;
          reason?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          active?: boolean;
          created_at?: string;
          created_by?: string | null;
          reason?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'screening_waivers_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'screening_waivers_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      tenants: {
        Row: {
          application_status: string | null;
          background_check: Json | null;
          created_at: string | null;
          credit_score: number | null;
          documents: Json | null;
          email: string;
          emergency_contact: Json | null;
          emergency_contact_name: string | null;
          emergency_contact_phone: string | null;
          employment_info: Json | null;
          employment_status: string | null;
          first_name: string;
          id: string;
          last_name: string;
          lease_end_date: string | null;
          lease_start_date: string | null;
          monthly_income: number | null;
          monthly_rent: number | null;
          move_in_date: string | null;
          move_out_date: string | null;
          notes: string | null;
          phone: string | null;
          preferences: Json | null;
          references: Json | null;
          security_deposit: number | null;
          status: string | null;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          application_status?: string | null;
          background_check?: Json | null;
          created_at?: string | null;
          credit_score?: number | null;
          documents?: Json | null;
          email: string;
          emergency_contact?: Json | null;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          employment_info?: Json | null;
          employment_status?: string | null;
          first_name: string;
          id?: string;
          last_name: string;
          lease_end_date?: string | null;
          lease_start_date?: string | null;
          monthly_income?: number | null;
          monthly_rent?: number | null;
          move_in_date?: string | null;
          move_out_date?: string | null;
          notes?: string | null;
          phone?: string | null;
          preferences?: Json | null;
          references?: Json | null;
          security_deposit?: number | null;
          status?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          application_status?: string | null;
          background_check?: Json | null;
          created_at?: string | null;
          credit_score?: number | null;
          documents?: Json | null;
          email?: string;
          emergency_contact?: Json | null;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          employment_info?: Json | null;
          employment_status?: string | null;
          first_name?: string;
          id?: string;
          last_name?: string;
          lease_end_date?: string | null;
          lease_start_date?: string | null;
          monthly_income?: number | null;
          monthly_rent?: number | null;
          move_in_date?: string | null;
          move_out_date?: string | null;
          notes?: string | null;
          phone?: string | null;
          preferences?: Json | null;
          references?: Json | null;
          security_deposit?: number | null;
          status?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      transactions: {
        Row: {
          amount: number;
          booking_id: string | null;
          created_at: string | null;
          description: string | null;
          id: string;
          metadata: Json | null;
          provider: string | null;
          provider_ref: string | null;
          status: string;
          type: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          amount: number;
          booking_id?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          metadata?: Json | null;
          provider?: string | null;
          provider_ref?: string | null;
          status?: string;
          type: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          amount?: number;
          booking_id?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          metadata?: Json | null;
          provider?: string | null;
          provider_ref?: string | null;
          status?: string;
          type?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'transactions_booking_id_fkey';
            columns: ['booking_id'];
            isOneToOne: false;
            referencedRelation: 'bookings';
            referencedColumns: ['id'];
          },
        ];
      };
      units: {
        Row: {
          created_at: string | null;
          id: string;
          property_id: string;
          rent_amount: number;
          status: string | null;
          unit_number: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          property_id: string;
          rent_amount: number;
          status?: string | null;
          unit_number?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          property_id?: string;
          rent_amount?: number;
          status?: string | null;
          unit_number?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'units_property_id_fkey';
            columns: ['property_id'];
            isOneToOne: false;
            referencedRelation: 'properties';
            referencedColumns: ['id'];
          },
        ];
      };
      usage_history: {
        Row: {
          created_at: string;
          id: string;
          overage_charges: Json | null;
          period_end: string;
          period_start: string;
          subscription_id: string;
          usage_data: Json;
        };
        Insert: {
          created_at?: string;
          id?: string;
          overage_charges?: Json | null;
          period_end: string;
          period_start: string;
          subscription_id: string;
          usage_data?: Json;
        };
        Update: {
          created_at?: string;
          id?: string;
          overage_charges?: Json | null;
          period_end?: string;
          period_start?: string;
          subscription_id?: string;
          usage_data?: Json;
        };
        Relationships: [
          {
            foreignKeyName: 'usage_history_subscription_id_fkey';
            columns: ['subscription_id'];
            isOneToOne: false;
            referencedRelation: 'user_subscriptions';
            referencedColumns: ['id'];
          },
        ];
      };
      user_preferences: {
        Row: {
          amenity_preferences: Json | null;
          applied_properties: string[] | null;
          budget_flexibility: string | null;
          calculated_preferences: Json | null;
          commute_locations: string[] | null;
          created_at: string | null;
          furnished_preference: string | null;
          has_pets: boolean | null;
          id: string;
          max_bedrooms: number | null;
          max_budget: number;
          max_commute_time: number | null;
          min_bathrooms: number;
          min_bedrooms: number;
          min_budget: number;
          noise_tolerance: string | null;
          pet_types: string[] | null;
          preferred_areas: string[] | null;
          property_types: string[] | null;
          rejected_properties: string[] | null;
          saved_properties: string[] | null;
          search_patterns: Json | null;
          social_preference: string | null;
          transportation_mode: string | null;
          updated_at: string | null;
          user_id: string | null;
          viewed_properties: string[] | null;
          work_from_home: boolean | null;
        };
        Insert: {
          amenity_preferences?: Json | null;
          applied_properties?: string[] | null;
          budget_flexibility?: string | null;
          calculated_preferences?: Json | null;
          commute_locations?: string[] | null;
          created_at?: string | null;
          furnished_preference?: string | null;
          has_pets?: boolean | null;
          id?: string;
          max_bedrooms?: number | null;
          max_budget?: number;
          max_commute_time?: number | null;
          min_bathrooms?: number;
          min_bedrooms?: number;
          min_budget?: number;
          noise_tolerance?: string | null;
          pet_types?: string[] | null;
          preferred_areas?: string[] | null;
          property_types?: string[] | null;
          rejected_properties?: string[] | null;
          saved_properties?: string[] | null;
          search_patterns?: Json | null;
          social_preference?: string | null;
          transportation_mode?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
          viewed_properties?: string[] | null;
          work_from_home?: boolean | null;
        };
        Update: {
          amenity_preferences?: Json | null;
          applied_properties?: string[] | null;
          budget_flexibility?: string | null;
          calculated_preferences?: Json | null;
          commute_locations?: string[] | null;
          created_at?: string | null;
          furnished_preference?: string | null;
          has_pets?: boolean | null;
          id?: string;
          max_bedrooms?: number | null;
          max_budget?: number;
          max_commute_time?: number | null;
          min_bathrooms?: number;
          min_bedrooms?: number;
          min_budget?: number;
          noise_tolerance?: string | null;
          pet_types?: string[] | null;
          preferred_areas?: string[] | null;
          property_types?: string[] | null;
          rejected_properties?: string[] | null;
          saved_properties?: string[] | null;
          search_patterns?: Json | null;
          social_preference?: string | null;
          transportation_mode?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
          viewed_properties?: string[] | null;
          work_from_home?: boolean | null;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          created_at: string | null;
          id: string;
          role: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          role: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          role?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      user_subscriptions: {
        Row: {
          add_ons: Json | null;
          billing_address: Json | null;
          billing_cycle: string;
          cancel_at_period_end: boolean | null;
          canceled_at: string | null;
          created_at: string;
          current_period_end: string;
          current_period_start: string;
          id: string;
          payment_method: Json | null;
          paystack_customer_code: string | null;
          paystack_subscription_code: string | null;
          plan_id: string;
          status: string;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          tier: string;
          trial_end: string | null;
          trial_start: string | null;
          updated_at: string;
          usage_tracking: Json;
          user_id: string;
        };
        Insert: {
          add_ons?: Json | null;
          billing_address?: Json | null;
          billing_cycle?: string;
          cancel_at_period_end?: boolean | null;
          canceled_at?: string | null;
          created_at?: string;
          current_period_end: string;
          current_period_start: string;
          id?: string;
          payment_method?: Json | null;
          paystack_customer_code?: string | null;
          paystack_subscription_code?: string | null;
          plan_id: string;
          status?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          tier: string;
          trial_end?: string | null;
          trial_start?: string | null;
          updated_at?: string;
          usage_tracking?: Json;
          user_id: string;
        };
        Update: {
          add_ons?: Json | null;
          billing_address?: Json | null;
          billing_cycle?: string;
          cancel_at_period_end?: boolean | null;
          canceled_at?: string | null;
          created_at?: string;
          current_period_end?: string;
          current_period_start?: string;
          id?: string;
          payment_method?: Json | null;
          paystack_customer_code?: string | null;
          paystack_subscription_code?: string | null;
          plan_id?: string;
          status?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          tier?: string;
          trial_end?: string | null;
          trial_start?: string | null;
          updated_at?: string;
          usage_tracking?: Json;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_subscriptions_plan_id_fkey';
            columns: ['plan_id'];
            isOneToOne: false;
            referencedRelation: 'subscription_plans';
            referencedColumns: ['id'];
          },
        ];
      };
      users: {
        Row: {
          created_at: string | null;
          email: string | null;
          full_name: string | null;
          id: string;
          organization_id: string;
          phone: string | null;
          role: string | null;
        };
        Insert: {
          created_at?: string | null;
          email?: string | null;
          full_name?: string | null;
          id?: string;
          organization_id: string;
          phone?: string | null;
          role?: string | null;
        };
        Update: {
          created_at?: string | null;
          email?: string | null;
          full_name?: string | null;
          id?: string;
          organization_id?: string;
          phone?: string | null;
          role?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'users_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
        ];
      };
      vendor_jobs: {
        Row: {
          actual_cost: number | null;
          category: string;
          completed_date: string | null;
          created_at: string;
          customer_feedback: string | null;
          customer_rating: number | null;
          description: string;
          estimated_cost: number | null;
          id: string;
          maintenance_request_id: string | null;
          payment_status: string | null;
          priority: string | null;
          property_id: string | null;
          scheduled_date: string | null;
          started_date: string | null;
          status: string | null;
          title: string;
          updated_at: string;
          vendor_id: string | null;
          vendor_notes: string | null;
        };
        Insert: {
          actual_cost?: number | null;
          category: string;
          completed_date?: string | null;
          created_at?: string;
          customer_feedback?: string | null;
          customer_rating?: number | null;
          description: string;
          estimated_cost?: number | null;
          id?: string;
          maintenance_request_id?: string | null;
          payment_status?: string | null;
          priority?: string | null;
          property_id?: string | null;
          scheduled_date?: string | null;
          started_date?: string | null;
          status?: string | null;
          title: string;
          updated_at?: string;
          vendor_id?: string | null;
          vendor_notes?: string | null;
        };
        Update: {
          actual_cost?: number | null;
          category?: string;
          completed_date?: string | null;
          created_at?: string;
          customer_feedback?: string | null;
          customer_rating?: number | null;
          description?: string;
          estimated_cost?: number | null;
          id?: string;
          maintenance_request_id?: string | null;
          payment_status?: string | null;
          priority?: string | null;
          property_id?: string | null;
          scheduled_date?: string | null;
          started_date?: string | null;
          status?: string | null;
          title?: string;
          updated_at?: string;
          vendor_id?: string | null;
          vendor_notes?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'vendor_jobs_vendor_id_fkey';
            columns: ['vendor_id'];
            isOneToOne: false;
            referencedRelation: 'vendors';
            referencedColumns: ['id'];
          },
        ];
      };
      vendors: {
        Row: {
          active: boolean | null;
          address: string;
          available_24_hours: boolean | null;
          available_weekdays: boolean | null;
          available_weekends: boolean | null;
          business_license: string | null;
          category: string;
          certifications: string | null;
          completed_jobs: number | null;
          created_at: string;
          description: string | null;
          email: string;
          emergency_rate: number | null;
          hourly_rate: number | null;
          id: string;
          insurance_policy_number: string | null;
          insurance_provider: string | null;
          name: string;
          phone: string;
          professional_references: string | null;
          rating: number | null;
          response_time: string | null;
          service_areas: string[] | null;
          specialties: string[] | null;
          total_jobs: number | null;
          updated_at: string;
          user_id: string | null;
          verified: boolean | null;
          years_of_experience: number | null;
        };
        Insert: {
          active?: boolean | null;
          address: string;
          available_24_hours?: boolean | null;
          available_weekdays?: boolean | null;
          available_weekends?: boolean | null;
          business_license?: string | null;
          category: string;
          certifications?: string | null;
          completed_jobs?: number | null;
          created_at?: string;
          description?: string | null;
          email: string;
          emergency_rate?: number | null;
          hourly_rate?: number | null;
          id?: string;
          insurance_policy_number?: string | null;
          insurance_provider?: string | null;
          name: string;
          phone: string;
          professional_references?: string | null;
          rating?: number | null;
          response_time?: string | null;
          service_areas?: string[] | null;
          specialties?: string[] | null;
          total_jobs?: number | null;
          updated_at?: string;
          user_id?: string | null;
          verified?: boolean | null;
          years_of_experience?: number | null;
        };
        Update: {
          active?: boolean | null;
          address?: string;
          available_24_hours?: boolean | null;
          available_weekdays?: boolean | null;
          available_weekends?: boolean | null;
          business_license?: string | null;
          category?: string;
          certifications?: string | null;
          completed_jobs?: number | null;
          created_at?: string;
          description?: string | null;
          email?: string;
          emergency_rate?: number | null;
          hourly_rate?: number | null;
          id?: string;
          insurance_policy_number?: string | null;
          insurance_provider?: string | null;
          name?: string;
          phone?: string;
          professional_references?: string | null;
          rating?: number | null;
          response_time?: string | null;
          service_areas?: string[] | null;
          specialties?: string[] | null;
          total_jobs?: number | null;
          updated_at?: string;
          user_id?: string | null;
          verified?: boolean | null;
          years_of_experience?: number | null;
        };
        Relationships: [];
      };
      verification_records: {
        Row: {
          confidence_score: number | null;
          cost: number | null;
          created_at: string | null;
          currency: string | null;
          error_message: string | null;
          expires_at: string | null;
          id: string;
          provider: string;
          request_data: Json;
          response_data: Json | null;
          status: string | null;
          updated_at: string | null;
          user_id: string;
          verification_id: string | null;
          verification_type: string;
        };
        Insert: {
          confidence_score?: number | null;
          cost?: number | null;
          created_at?: string | null;
          currency?: string | null;
          error_message?: string | null;
          expires_at?: string | null;
          id?: string;
          provider: string;
          request_data: Json;
          response_data?: Json | null;
          status?: string | null;
          updated_at?: string | null;
          user_id: string;
          verification_id?: string | null;
          verification_type: string;
        };
        Update: {
          confidence_score?: number | null;
          cost?: number | null;
          created_at?: string | null;
          currency?: string | null;
          error_message?: string | null;
          expires_at?: string | null;
          id?: string;
          provider?: string;
          request_data?: Json;
          response_data?: Json | null;
          status?: string | null;
          updated_at?: string | null;
          user_id?: string;
          verification_id?: string | null;
          verification_type?: string;
        };
        Relationships: [];
      };
      viewings: {
        Row: {
          created_at: string | null;
          id: string;
          property_id: string | null;
          scheduled_date: string | null;
          scheduled_time: string | null;
          status: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          property_id?: string | null;
          scheduled_date?: string | null;
          scheduled_time?: string | null;
          status?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          property_id?: string | null;
          scheduled_date?: string | null;
          scheduled_time?: string | null;
          status?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'viewings_property_id_fkey';
            columns: ['property_id'];
            isOneToOne: false;
            referencedRelation: 'properties';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'viewings_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      voice_assistant_analytics: {
        Row: {
          average_confidence: number | null;
          created_at: string | null;
          date: string;
          failed_commands: number | null;
          id: string;
          most_used_intent: string | null;
          successful_commands: number | null;
          total_commands: number | null;
          total_session_time_minutes: number | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          average_confidence?: number | null;
          created_at?: string | null;
          date?: string;
          failed_commands?: number | null;
          id?: string;
          most_used_intent?: string | null;
          successful_commands?: number | null;
          total_commands?: number | null;
          total_session_time_minutes?: number | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          average_confidence?: number | null;
          created_at?: string | null;
          date?: string;
          failed_commands?: number | null;
          id?: string;
          most_used_intent?: string | null;
          successful_commands?: number | null;
          total_commands?: number | null;
          total_session_time_minutes?: number | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      voice_assistant_settings: {
        Row: {
          auto_execute_commands: boolean | null;
          confirmation_required: boolean | null;
          continuous_listening: boolean | null;
          created_at: string | null;
          enabled: boolean | null;
          id: string;
          language: string | null;
          noise_cancellation: boolean | null;
          privacy_mode: boolean | null;
          speech_pitch: number | null;
          speech_rate: number | null;
          speech_volume: number | null;
          updated_at: string | null;
          user_id: string;
          voice_type: string | null;
          wake_word: string | null;
          wake_word_enabled: boolean | null;
        };
        Insert: {
          auto_execute_commands?: boolean | null;
          confirmation_required?: boolean | null;
          continuous_listening?: boolean | null;
          created_at?: string | null;
          enabled?: boolean | null;
          id?: string;
          language?: string | null;
          noise_cancellation?: boolean | null;
          privacy_mode?: boolean | null;
          speech_pitch?: number | null;
          speech_rate?: number | null;
          speech_volume?: number | null;
          updated_at?: string | null;
          user_id: string;
          voice_type?: string | null;
          wake_word?: string | null;
          wake_word_enabled?: boolean | null;
        };
        Update: {
          auto_execute_commands?: boolean | null;
          confirmation_required?: boolean | null;
          continuous_listening?: boolean | null;
          created_at?: string | null;
          enabled?: boolean | null;
          id?: string;
          language?: string | null;
          noise_cancellation?: boolean | null;
          privacy_mode?: boolean | null;
          speech_pitch?: number | null;
          speech_rate?: number | null;
          speech_volume?: number | null;
          updated_at?: string | null;
          user_id?: string;
          voice_type?: string | null;
          wake_word?: string | null;
          wake_word_enabled?: boolean | null;
        };
        Relationships: [];
      };
      voice_command_history: {
        Row: {
          action_taken: string | null;
          command: string;
          confidence: number;
          created_at: string | null;
          entities: Json | null;
          error_message: string | null;
          id: string;
          intent: string;
          processing_time_ms: number | null;
          response: string | null;
          session_id: string | null;
          success: boolean;
          user_id: string;
        };
        Insert: {
          action_taken?: string | null;
          command: string;
          confidence: number;
          created_at?: string | null;
          entities?: Json | null;
          error_message?: string | null;
          id?: string;
          intent: string;
          processing_time_ms?: number | null;
          response?: string | null;
          session_id?: string | null;
          success?: boolean;
          user_id: string;
        };
        Update: {
          action_taken?: string | null;
          command?: string;
          confidence?: number;
          created_at?: string | null;
          entities?: Json | null;
          error_message?: string | null;
          id?: string;
          intent?: string;
          processing_time_ms?: number | null;
          response?: string | null;
          session_id?: string | null;
          success?: boolean;
          user_id?: string;
        };
        Relationships: [];
      };
      voice_commands: {
        Row: {
          created_at: string | null;
          id: string;
          intent: string | null;
          response: string | null;
          session_id: string | null;
          transcript: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          intent?: string | null;
          response?: string | null;
          session_id?: string | null;
          transcript?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          intent?: string | null;
          response?: string | null;
          session_id?: string | null;
          transcript?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'voice_commands_session_id_fkey';
            columns: ['session_id'];
            isOneToOne: false;
            referencedRelation: 'voice_sessions';
            referencedColumns: ['id'];
          },
        ];
      };
      voice_sessions: {
        Row: {
          channel: string | null;
          end_time: string | null;
          id: string;
          start_time: string | null;
          user_id: string | null;
        };
        Insert: {
          channel?: string | null;
          end_time?: string | null;
          id?: string;
          start_time?: string | null;
          user_id?: string | null;
        };
        Update: {
          channel?: string | null;
          end_time?: string | null;
          id?: string;
          start_time?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'voice_sessions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      wallets: {
        Row: {
          balance: number | null;
          created_at: string | null;
          id: string;
          pending_balance: number | null;
          total_earned: number | null;
          total_paid_out: number | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          balance?: number | null;
          created_at?: string | null;
          id?: string;
          pending_balance?: number | null;
          total_earned?: number | null;
          total_paid_out?: number | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          balance?: number | null;
          created_at?: string | null;
          id?: string;
          pending_balance?: number | null;
          total_earned?: number | null;
          total_paid_out?: number | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      web_push_subscriptions: {
        Row: {
          auth: string;
          created_at: string;
          endpoint: string;
          id: string;
          p256dh: string;
          updated_at: string;
          user_agent: string | null;
          user_id: string;
        };
        Insert: {
          auth: string;
          created_at?: string;
          endpoint: string;
          id?: string;
          p256dh: string;
          updated_at?: string;
          user_agent?: string | null;
          user_id: string;
        };
        Update: {
          auth?: string;
          created_at?: string;
          endpoint?: string;
          id?: string;
          p256dh?: string;
          updated_at?: string;
          user_agent?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'web_push_subscriptions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      webhook_events: {
        Row: {
          created_at: string | null;
          event_data: Json;
          event_type: string;
          id: string;
          processed: boolean | null;
          processed_at: string | null;
          provider: string;
          signature: string | null;
          verification_record_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          event_data: Json;
          event_type: string;
          id?: string;
          processed?: boolean | null;
          processed_at?: string | null;
          provider: string;
          signature?: string | null;
          verification_record_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          event_data?: Json;
          event_type?: string;
          id?: string;
          processed?: boolean | null;
          processed_at?: string | null;
          provider?: string;
          signature?: string | null;
          verification_record_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'webhook_events_verification_record_id_fkey';
            columns: ['verification_record_id'];
            isOneToOne: false;
            referencedRelation: 'verification_records';
            referencedColumns: ['id'];
          },
        ];
      };
      white_label_configs: {
        Row: {
          api_access: Json | null;
          brand_name: string;
          created_at: string;
          custom_css: string | null;
          custom_domain: string | null;
          domain: string;
          email_templates: Json | null;
          features_enabled: Json | null;
          id: string;
          is_active: boolean | null;
          logo_url: string | null;
          primary_color: string;
          secondary_color: string;
          subscription_id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          api_access?: Json | null;
          brand_name: string;
          created_at?: string;
          custom_css?: string | null;
          custom_domain?: string | null;
          domain: string;
          email_templates?: Json | null;
          features_enabled?: Json | null;
          id?: string;
          is_active?: boolean | null;
          logo_url?: string | null;
          primary_color?: string;
          secondary_color?: string;
          subscription_id: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          api_access?: Json | null;
          brand_name?: string;
          created_at?: string;
          custom_css?: string | null;
          custom_domain?: string | null;
          domain?: string;
          email_templates?: Json | null;
          features_enabled?: Json | null;
          id?: string;
          is_active?: boolean | null;
          logo_url?: string | null;
          primary_color?: string;
          secondary_color?: string;
          subscription_id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'white_label_configs_subscription_id_fkey';
            columns: ['subscription_id'];
            isOneToOne: false;
            referencedRelation: 'user_subscriptions';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      calculate_equipment_age: {
        Args: { installation_date: string };
        Returns: number;
      };
      calculate_escrow_completion: {
        Args: { escrow_id: string };
        Returns: number;
      };
      calculate_kyc_verification_level: {
        Args: {
          p_bank_verified: boolean;
          p_business_verified: boolean;
          p_bvn_verified: boolean;
          p_nin_verified: boolean;
          p_phone_verified: boolean;
        };
        Returns: string;
      };
      calculate_property_compatibility: {
        Args: { property_data: Json; user_prefs: Json };
        Returns: number;
      };
      calculate_risk_score: {
        Args: {
          p_bank_verified: boolean;
          p_business_verified: boolean;
          p_bvn_verified: boolean;
          p_nin_verified: boolean;
          p_phone_verified: boolean;
        };
        Returns: number;
      };
      can_create_tenant_profile: {
        Args: { target_user_id: string };
        Returns: boolean;
      };
      check_feature_limit: {
        Args: {
          p_feature_key: string;
          p_requested_usage?: number;
          p_user_id: string;
        };
        Returns: Json;
      };
      check_property_access: {
        Args: { p_property_id: string; p_user_id: string };
        Returns: boolean;
      };
      cleanup_expired_documents: { Args: never; Returns: number };
      cleanup_old_voice_commands: { Args: never; Returns: undefined };
      create_journal_entries_from_rent_payment: {
        Args: {
          p_entry_date?: string;
          p_payment_id: string;
          p_property_id?: string;
          p_tenant_id?: string;
        };
        Returns: string;
      };
      create_tenant_profile:
        | {
            Args: {
              p_email: string;
              p_first_name: string;
              p_last_name: string;
              p_phone?: string;
              p_user_id?: string;
            };
            Returns: string;
          }
        | {
            Args: {
              p_email?: string;
              p_first_name?: string;
              p_last_name?: string;
              p_phone?: string;
              p_user_id?: string;
            };
            Returns: string;
          };
      create_tenant_record: {
        Args: {
          p_email: string;
          p_first_name: string;
          p_last_name: string;
          p_phone?: string;
          p_user_id: string;
        };
        Returns: string;
      };
      expire_all_subscription_trials_if_due: { Args: never; Returns: number };
      expire_own_subscription_trials_if_due: { Args: never; Returns: number };
      generate_daily_maintenance_recommendations: {
        Args: never;
        Returns: undefined;
      };
      generate_daily_recommendations: { Args: never; Returns: number };
      generate_invoice_number: { Args: never; Returns: string };
      get_blockchain_portfolio_value: {
        Args: { user_wallet_address: string };
        Returns: {
          total_escrow_value: number;
          total_payments_received: number;
          total_payments_sent: number;
          total_property_value: number;
        }[];
      };
      get_equipment_health_score: {
        Args: { condition: string };
        Returns: number;
      };
      get_voice_assistant_stats: {
        Args: { p_user_id: string };
        Returns: {
          average_confidence: number;
          commands_this_month: number;
          commands_this_week: number;
          commands_today: number;
          most_used_intent: string;
          success_rate: number;
          successful_commands: number;
          total_commands: number;
        }[];
      };
      has_active_lease_for_property: {
        Args: { p_property_id: string; p_user_id: string };
        Returns: boolean;
      };
      is_admin: { Args: { check_user_id?: string }; Returns: boolean };
      is_agent: { Args: { user_id: string }; Returns: boolean };
      is_owner: { Args: { user_id?: string }; Returns: boolean };
      log_api_usage: {
        Args: {
          p_cost?: number;
          p_endpoint: string;
          p_provider: string;
          p_request_method: string;
          p_response_time_ms: number;
          p_service_type: string;
          p_status_code: number;
          p_success: boolean;
          p_user_id: string;
        };
        Returns: undefined;
      };
      log_blockchain_event: {
        Args: {
          p_block_number: number;
          p_contract_address: string;
          p_event_data: Json;
          p_event_name: string;
          p_event_type: string;
          p_network: string;
          p_transaction_hash: string;
          p_user_id: string;
        };
        Returns: undefined;
      };
      show_limit: { Args: never; Returns: number };
      show_trgm: { Args: { '': string }; Returns: string[] };
      start_subscription_trial: { Args: { p_plan_id: string }; Returns: string };
      test_tenant_policies: { Args: never; Returns: string };
      test_tenant_rls: { Args: never; Returns: string };
      track_feature_usage: {
        Args: {
          p_feature_key: string;
          p_metadata?: Json;
          p_usage_count?: number;
          p_user_id: string;
        };
        Returns: undefined;
      };
      update_kyc_profile_verification: {
        Args: {
          p_user_id: string;
          p_verification_type: string;
          p_verified: boolean;
        };
        Returns: undefined;
      };
      update_voice_analytics: {
        Args: {
          p_command_success: boolean;
          p_confidence: number;
          p_intent: string;
          p_session_time_minutes?: number;
          p_user_id: string;
        };
        Returns: undefined;
      };
      validate_emergency_contact: {
        Args: { contact_data: Json };
        Returns: boolean;
      };
    };
    Enums: {
      notification_type:
        | 'payment'
        | 'maintenance'
        | 'lease'
        | 'announcement'
        | 'general'
        | 'message';
      screening_status: 'pending' | 'in_progress' | 'completed' | 'failed';
      user_role:
        | 'super_admin'
        | 'admin'
        | 'owner'
        | 'agent'
        | 'tenant'
        | 'vendor'
        | 'user'
        | 'manager';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      notification_type: ['payment', 'maintenance', 'lease', 'announcement', 'general', 'message'],
      screening_status: ['pending', 'in_progress', 'completed', 'failed'],
      user_role: ['super_admin', 'admin', 'owner', 'agent', 'tenant', 'vendor', 'user', 'manager'],
    },
  },
} as const;
