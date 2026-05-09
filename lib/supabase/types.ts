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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      availability_exceptions: {
        Row: {
          admin_member_id: string
          created_at: string
          date: string
          end_time: string | null
          id: string
          reason: string | null
          start_time: string | null
          studio_id: string
          type: string
        }
        Insert: {
          admin_member_id: string
          created_at?: string
          date: string
          end_time?: string | null
          id?: string
          reason?: string | null
          start_time?: string | null
          studio_id: string
          type: string
        }
        Update: {
          admin_member_id?: string
          created_at?: string
          date?: string
          end_time?: string | null
          id?: string
          reason?: string | null
          start_time?: string | null
          studio_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "availability_exceptions_admin_member_id_fkey"
            columns: ["admin_member_id"]
            isOneToOne: false
            referencedRelation: "studio_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "availability_exceptions_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      availability_rules: {
        Row: {
          admin_member_id: string
          end_time: string
          id: string
          start_time: string
          studio_id: string
          weekday: number
        }
        Insert: {
          admin_member_id: string
          end_time: string
          id?: string
          start_time: string
          studio_id: string
          weekday: number
        }
        Update: {
          admin_member_id?: string
          end_time?: string
          id?: string
          start_time?: string
          studio_id?: string
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "availability_rules_admin_member_id_fkey"
            columns: ["admin_member_id"]
            isOneToOne: false
            referencedRelation: "studio_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "availability_rules_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          booked_at: string
          cancellation_reason: string | null
          cancelled_at: string | null
          client_member_id: string
          credits_charged: number
          id: string
          session_id: string
          status: string
        }
        Insert: {
          booked_at?: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          client_member_id: string
          credits_charged: number
          id?: string
          session_id: string
          status?: string
        }
        Update: {
          booked_at?: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          client_member_id?: string
          credits_charged?: number
          id?: string
          session_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_client_member_id_fkey"
            columns: ["client_member_id"]
            isOneToOne: false
            referencedRelation: "studio_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      client_credits: {
        Row: {
          balance: number
          last_grant_at: string | null
          member_id: string
          updated_at: string
        }
        Insert: {
          balance?: number
          last_grant_at?: string | null
          member_id: string
          updated_at?: string
        }
        Update: {
          balance?: number
          last_grant_at?: string | null
          member_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_credits_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: true
            referencedRelation: "studio_members"
            referencedColumns: ["id"]
          },
        ]
      }
      client_subscriptions: {
        Row: {
          cancelled_at: string | null
          created_at: string
          current_period_end: string
          current_period_start: string
          id: string
          ls_subscription_id: string | null
          member_id: string
          plan_id: string
          started_at: string
          status: string
        }
        Insert: {
          cancelled_at?: string | null
          created_at?: string
          current_period_end: string
          current_period_start: string
          id?: string
          ls_subscription_id?: string | null
          member_id: string
          plan_id: string
          started_at?: string
          status: string
        }
        Update: {
          cancelled_at?: string | null
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          id?: string
          ls_subscription_id?: string | null
          member_id?: string
          plan_id?: string
          started_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_subscriptions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "studio_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_packs: {
        Row: {
          active: boolean
          created_at: string
          credits: number
          id: string
          label: string | null
          ls_variant_id: string | null
          price_cents: number
          sort_order: number
          studio_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          credits: number
          id?: string
          label?: string | null
          ls_variant_id?: string | null
          price_cents: number
          sort_order?: number
          studio_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          credits?: number
          id?: string
          label?: string | null
          ls_variant_id?: string | null
          price_cents?: number
          sort_order?: number
          studio_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_packs_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_transactions: {
        Row: {
          created_at: string
          delta: number
          description: string
          id: string
          member_id: string
          related_booking_id: string | null
          related_payment_id: string | null
          type: string
        }
        Insert: {
          created_at?: string
          delta: number
          description: string
          id?: string
          member_id: string
          related_booking_id?: string | null
          related_payment_id?: string | null
          type: string
        }
        Update: {
          created_at?: string
          delta?: number
          description?: string
          id?: string
          member_id?: string
          related_booking_id?: string | null
          related_payment_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_transactions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "studio_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_transactions_related_booking_id_fkey"
            columns: ["related_booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_transactions_related_payment_id_fkey"
            columns: ["related_payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachments: Json | null
          body: string
          created_at: string
          id: string
          sender_member_id: string
          thread_id: string
        }
        Insert: {
          attachments?: Json | null
          body: string
          created_at?: string
          id?: string
          sender_member_id: string
          thread_id: string
        }
        Update: {
          attachments?: Json | null
          body?: string
          created_at?: string
          id?: string
          sender_member_id?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_sender_member_id_fkey"
            columns: ["sender_member_id"]
            isOneToOne: false
            referencedRelation: "studio_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "threads"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_cents: number
          created_at: string
          currency: string
          description: string | null
          id: string
          ls_order_id: string | null
          ls_subscription_id: string | null
          member_id: string | null
          status: string
          studio_id: string
          type: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          ls_order_id?: string | null
          ls_subscription_id?: string | null
          member_id?: string | null
          status: string
          studio_id: string
          type: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          ls_order_id?: string | null
          ls_subscription_id?: string | null
          member_id?: string | null
          status?: string
          studio_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "studio_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      payouts: {
        Row: {
          admin_member_id: string
          commission_cents: number
          fees_cents: number
          gross_cents: number
          id: string
          net_cents: number
          paid_at: string | null
          period_end: string
          period_start: string
          status: string
          studio_id: string
        }
        Insert: {
          admin_member_id: string
          commission_cents: number
          fees_cents?: number
          gross_cents: number
          id?: string
          net_cents: number
          paid_at?: string | null
          period_end: string
          period_start: string
          status?: string
          studio_id: string
        }
        Update: {
          admin_member_id?: string
          commission_cents?: number
          fees_cents?: number
          gross_cents?: number
          id?: string
          net_cents?: number
          paid_at?: string | null
          period_end?: string
          period_start?: string
          status?: string
          studio_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payouts_admin_member_id_fkey"
            columns: ["admin_member_id"]
            isOneToOne: false
            referencedRelation: "studio_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payouts_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_class_templates: {
        Row: {
          admin_member_id: string
          capacity: number
          created_at: string
          duration_min: number
          id: string
          service_id: string
          start_time: string
          studio_id: string
          valid_from: string
          valid_until: string | null
          weekdays: number[]
        }
        Insert: {
          admin_member_id: string
          capacity: number
          created_at?: string
          duration_min: number
          id?: string
          service_id: string
          start_time: string
          studio_id: string
          valid_from: string
          valid_until?: string | null
          weekdays: number[]
        }
        Update: {
          admin_member_id?: string
          capacity?: number
          created_at?: string
          duration_min?: number
          id?: string
          service_id?: string
          start_time?: string
          studio_id?: string
          valid_from?: string
          valid_until?: string | null
          weekdays?: number[]
        }
        Relationships: [
          {
            foreignKeyName: "recurring_class_templates_admin_member_id_fkey"
            columns: ["admin_member_id"]
            isOneToOne: false
            referencedRelation: "studio_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_class_templates_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_class_templates_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          admin_member_id: string
          booking_id: string
          client_member_id: string
          comment: string | null
          created_at: string
          id: string
          rating: number
        }
        Insert: {
          admin_member_id: string
          booking_id: string
          client_member_id: string
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
        }
        Update: {
          admin_member_id?: string
          booking_id?: string
          client_member_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "reviews_admin_member_id_fkey"
            columns: ["admin_member_id"]
            isOneToOne: false
            referencedRelation: "studio_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_client_member_id_fkey"
            columns: ["client_member_id"]
            isOneToOne: false
            referencedRelation: "studio_members"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          active: boolean
          admin_member_id: string | null
          created_at: string
          credits_cost: number
          default_capacity: number
          description: string | null
          duration_min: number
          gross_price_cents: number
          hue: number
          id: string
          mode: string
          name: string
          studio_id: string
        }
        Insert: {
          active?: boolean
          admin_member_id?: string | null
          created_at?: string
          credits_cost: number
          default_capacity: number
          description?: string | null
          duration_min: number
          gross_price_cents: number
          hue?: number
          id?: string
          mode: string
          name: string
          studio_id: string
        }
        Update: {
          active?: boolean
          admin_member_id?: string | null
          created_at?: string
          credits_cost?: number
          default_capacity?: number
          description?: string | null
          duration_min?: number
          gross_price_cents?: number
          hue?: number
          id?: string
          mode?: string
          name?: string
          studio_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_admin_member_id_fkey"
            columns: ["admin_member_id"]
            isOneToOne: false
            referencedRelation: "studio_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          admin_member_id: string
          capacity: number
          created_at: string
          duration_min: number
          id: string
          min_to_run: number | null
          notes: string | null
          recurring_template_id: string | null
          service_id: string
          starts_at: string
          status: string
          studio_id: string
        }
        Insert: {
          admin_member_id: string
          capacity: number
          created_at?: string
          duration_min: number
          id?: string
          min_to_run?: number | null
          notes?: string | null
          recurring_template_id?: string | null
          service_id: string
          starts_at: string
          status?: string
          studio_id: string
        }
        Update: {
          admin_member_id?: string
          capacity?: number
          created_at?: string
          duration_min?: number
          id?: string
          min_to_run?: number | null
          notes?: string | null
          recurring_template_id?: string | null
          service_id?: string
          starts_at?: string
          status?: string
          studio_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_admin_member_id_fkey"
            columns: ["admin_member_id"]
            isOneToOne: false
            referencedRelation: "studio_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_recurring_template_id_fkey"
            columns: ["recurring_template_id"]
            isOneToOne: false
            referencedRelation: "recurring_class_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_hours: {
        Row: {
          close_time: string | null
          closed: boolean
          open_time: string | null
          studio_id: string
          weekday: number
        }
        Insert: {
          close_time?: string | null
          closed?: boolean
          open_time?: string | null
          studio_id: string
          weekday: number
        }
        Update: {
          close_time?: string | null
          closed?: boolean
          open_time?: string | null
          studio_id?: string
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "studio_hours_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_members: {
        Row: {
          acquired_by: string | null
          acquired_by_member_id: string | null
          buffer_min: number
          commission_pct: number | null
          id: string
          invited_by: string | null
          joined_at: string
          last_visit_at: string | null
          ltv_cents: number
          member_since: string
          monthly_fee_cents: number | null
          require_booking_approval: boolean
          role: string
          specialty: string | null
          status: string
          studio_id: string
          user_id: string
        }
        Insert: {
          acquired_by?: string | null
          acquired_by_member_id?: string | null
          buffer_min?: number
          commission_pct?: number | null
          id?: string
          invited_by?: string | null
          joined_at?: string
          last_visit_at?: string | null
          ltv_cents?: number
          member_since?: string
          monthly_fee_cents?: number | null
          require_booking_approval?: boolean
          role: string
          specialty?: string | null
          status?: string
          studio_id: string
          user_id: string
        }
        Update: {
          acquired_by?: string | null
          acquired_by_member_id?: string | null
          buffer_min?: number
          commission_pct?: number | null
          id?: string
          invited_by?: string | null
          joined_at?: string
          last_visit_at?: string | null
          ltv_cents?: number
          member_since?: string
          monthly_fee_cents?: number | null
          require_booking_approval?: boolean
          role?: string
          specialty?: string | null
          status?: string
          studio_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "studio_members_acquired_by_member_fkey"
            columns: ["acquired_by_member_id"]
            isOneToOne: false
            referencedRelation: "studio_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_members_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_members_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_subscriptions: {
        Row: {
          cancel_at: string | null
          created_at: string
          current_period_end: string | null
          ls_customer_id: string | null
          ls_subscription_id: string | null
          plan: string
          status: string
          studio_id: string
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          cancel_at?: string | null
          created_at?: string
          current_period_end?: string | null
          ls_customer_id?: string | null
          ls_subscription_id?: string | null
          plan: string
          status: string
          studio_id: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          cancel_at?: string | null
          created_at?: string
          current_period_end?: string | null
          ls_customer_id?: string | null
          ls_subscription_id?: string | null
          plan?: string
          status?: string
          studio_id?: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "studio_subscriptions_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: true
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      studios: {
        Row: {
          country: string | null
          created_at: string
          currency: string
          id: string
          locale: string
          logo_url: string | null
          name: string
          owner_id: string
          slug: string
          timezone: string
        }
        Insert: {
          country?: string | null
          created_at?: string
          currency?: string
          id?: string
          locale?: string
          logo_url?: string | null
          name: string
          owner_id: string
          slug: string
          timezone?: string
        }
        Update: {
          country?: string | null
          created_at?: string
          currency?: string
          id?: string
          locale?: string
          logo_url?: string | null
          name?: string
          owner_id?: string
          slug?: string
          timezone?: string
        }
        Relationships: [
          {
            foreignKeyName: "studios_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          active: boolean
          billing_interval: string
          created_at: string
          credits_granted: number
          description: string | null
          features: Json | null
          id: string
          ls_variant_id: string | null
          name: string
          price_cents: number
          sort_order: number
          studio_id: string
        }
        Insert: {
          active?: boolean
          billing_interval?: string
          created_at?: string
          credits_granted: number
          description?: string | null
          features?: Json | null
          id?: string
          ls_variant_id?: string | null
          name: string
          price_cents: number
          sort_order?: number
          studio_id: string
        }
        Update: {
          active?: boolean
          billing_interval?: string
          created_at?: string
          credits_granted?: number
          description?: string | null
          features?: Json | null
          id?: string
          ls_variant_id?: string | null
          name?: string
          price_cents?: number
          sort_order?: number
          studio_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_plans_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      thread_participants: {
        Row: {
          last_read_at: string
          member_id: string
          thread_id: string
        }
        Insert: {
          last_read_at?: string
          member_id: string
          thread_id: string
        }
        Update: {
          last_read_at?: string
          member_id?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "thread_participants_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "studio_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "thread_participants_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "threads"
            referencedColumns: ["id"]
          },
        ]
      }
      threads: {
        Row: {
          created_at: string
          id: string
          last_message_at: string | null
          studio_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          studio_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          studio_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "threads_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_hue: number
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          locale: string | null
          name: string
          phone: string | null
        }
        Insert: {
          avatar_hue?: number
          avatar_url?: string | null
          created_at?: string
          email: string
          id: string
          locale?: string | null
          name: string
          phone?: string | null
        }
        Update: {
          avatar_hue?: number
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          locale?: string | null
          name?: string
          phone?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_studio_for_owner: {
        Args: { p_slug: string; p_studio_name: string; p_user_id: string }
        Returns: string
      }
      current_member: {
        Args: { target_studio: string }
        Returns: {
          acquired_by: string | null
          acquired_by_member_id: string | null
          buffer_min: number
          commission_pct: number | null
          id: string
          invited_by: string | null
          joined_at: string
          last_visit_at: string | null
          ltv_cents: number
          member_since: string
          monthly_fee_cents: number | null
          require_booking_approval: boolean
          role: string
          specialty: string | null
          status: string
          studio_id: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "studio_members"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      is_member_of: { Args: { target_studio: string }; Returns: boolean }
      my_role_in: { Args: { target_studio: string }; Returns: string }
      session_range: {
        Args: { p_duration: number; p_starts: string }
        Returns: unknown
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
