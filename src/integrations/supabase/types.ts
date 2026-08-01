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
      ad_events: {
        Row: {
          ad_id: string
          created_at: string
          event_type: string
          id: string
          user_id: string | null
        }
        Insert: {
          ad_id: string
          created_at?: string
          event_type: string
          id?: string
          user_id?: string | null
        }
        Update: {
          ad_id?: string
          created_at?: string
          event_type?: string
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_events_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "advertisements"
            referencedColumns: ["id"]
          },
        ]
      }
      advertisements: {
        Row: {
          active: boolean
          created_at: string
          description: string
          destination_url: string
          id: string
          image_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string
          destination_url: string
          id?: string
          image_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string
          destination_url?: string
          id?: string
          image_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      blocked_users: {
        Row: {
          blocked_user_id: string
          blocker_id: string
          created_at: string
          id: string
        }
        Insert: {
          blocked_user_id: string
          blocker_id: string
          created_at?: string
          id?: string
        }
        Update: {
          blocked_user_id?: string
          blocker_id?: string
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      bookmarks: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmarks_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      capsule_proofs: {
        Row: {
          capsule_id: string
          caption: string | null
          created_at: string
          id: string
          image_url: string
          owner_id: string
        }
        Insert: {
          capsule_id: string
          caption?: string | null
          created_at?: string
          id?: string
          image_url: string
          owner_id: string
        }
        Update: {
          capsule_id?: string
          caption?: string | null
          created_at?: string
          id?: string
          image_url?: string
          owner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "capsule_proofs_capsule_id_fkey"
            columns: ["capsule_id"]
            isOneToOne: false
            referencedRelation: "time_capsules"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string | null
          participant_one_id: string
          participant_two_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          participant_one_id: string
          participant_two_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          participant_one_id?: string
          participant_two_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_participant_one_id_fkey"
            columns: ["participant_one_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_participant_two_id_fkey"
            columns: ["participant_two_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string
          followed_id: string
          follower_id: string
          id: string
        }
        Insert: {
          created_at?: string
          followed_id: string
          follower_id: string
          id?: string
        }
        Update: {
          created_at?: string
          followed_id?: string
          follower_id?: string
          id?: string
        }
        Relationships: []
      }
      geocode_cache: {
        Row: {
          created_at: string
          hit: boolean
          last_used_at: string
          lat: number | null
          lng: number | null
          query: string
        }
        Insert: {
          created_at?: string
          hit?: boolean
          last_used_at?: string
          lat?: number | null
          lng?: number | null
          query: string
        }
        Update: {
          created_at?: string
          hit?: boolean
          last_used_at?: string
          lat?: number | null
          lng?: number | null
          query?: string
        }
        Relationships: []
      }
      help_requests: {
        Row: {
          budget: number | null
          category: Database["public"]["Enums"]["request_category"]
          created_at: string
          deadline: string | null
          description: string
          helper_id: string | null
          id: string
          image_url: string | null
          location: string | null
          requester_id: string
          status: Database["public"]["Enums"]["request_status"]
          title: string
          updated_at: string
          urgency: Database["public"]["Enums"]["urgency_level"]
        }
        Insert: {
          budget?: number | null
          category?: Database["public"]["Enums"]["request_category"]
          created_at?: string
          deadline?: string | null
          description: string
          helper_id?: string | null
          id?: string
          image_url?: string | null
          location?: string | null
          requester_id: string
          status?: Database["public"]["Enums"]["request_status"]
          title: string
          updated_at?: string
          urgency?: Database["public"]["Enums"]["urgency_level"]
        }
        Update: {
          budget?: number | null
          category?: Database["public"]["Enums"]["request_category"]
          created_at?: string
          deadline?: string | null
          description?: string
          helper_id?: string | null
          id?: string
          image_url?: string | null
          location?: string | null
          requester_id?: string
          status?: Database["public"]["Enums"]["request_status"]
          title?: string
          updated_at?: string
          urgency?: Database["public"]["Enums"]["urgency_level"]
        }
        Relationships: []
      }
      helper_recommendations: {
        Row: {
          created_at: string
          helper_id: string
          id: string
          reasons: string[]
          request_id: string
          score: number
          signals: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          helper_id: string
          id?: string
          reasons?: string[]
          request_id: string
          score: number
          signals?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          helper_id?: string
          id?: string
          reasons?: string[]
          request_id?: string
          score?: number
          signals?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "helper_recommendations_helper_id_fkey"
            columns: ["helper_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "helper_recommendations_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "help_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      humi_messages: {
        Row: {
          actions: Json
          attachments: Json
          content: string
          created_at: string
          id: string
          role: string
          thread_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          actions?: Json
          attachments?: Json
          content?: string
          created_at?: string
          id?: string
          role: string
          thread_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          actions?: Json
          attachments?: Json
          content?: string
          created_at?: string
          id?: string
          role?: string
          thread_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "humi_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "humi_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      humi_threads: {
        Row: {
          agent: string
          created_at: string
          emergency: boolean
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          agent?: string
          created_at?: string
          emergency?: boolean
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          agent?: string
          created_at?: string
          emergency?: boolean
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          read: boolean
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          read?: boolean
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          read?: boolean
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      notification_prefs: {
        Row: {
          chat_notifications: boolean
          comments: boolean
          created_at: string
          donation_updates: boolean
          email_enabled: boolean
          followers: boolean
          likes: boolean
          marketing_emails: boolean
          mentions: boolean
          product_updates: boolean
          push_enabled: boolean
          request_updates: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          chat_notifications?: boolean
          comments?: boolean
          created_at?: string
          donation_updates?: boolean
          email_enabled?: boolean
          followers?: boolean
          likes?: boolean
          marketing_emails?: boolean
          mentions?: boolean
          product_updates?: boolean
          push_enabled?: boolean
          request_updates?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          chat_notifications?: boolean
          comments?: boolean
          created_at?: string
          donation_updates?: boolean
          email_enabled?: boolean
          followers?: boolean
          likes?: boolean
          marketing_emails?: boolean
          mentions?: boolean
          product_updates?: boolean
          push_enabled?: boolean
          request_updates?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          kind: string
          link: string | null
          read: boolean
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          kind: string
          link?: string | null
          read?: boolean
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: string
          link?: string | null
          read?: boolean
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_logs: {
        Row: {
          created_at: string
          event: string
          id: string
          level: string
          message: string | null
          metadata: Json | null
          payment_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event: string
          id?: string
          level?: string
          message?: string | null
          metadata?: Json | null
          payment_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event?: string
          id?: string
          level?: string
          message?: string | null
          metadata?: Json | null
          payment_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_logs_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_settings: {
        Row: {
          account_holder: string | null
          account_number: string | null
          bank_name: string | null
          id: string
          ifsc_code: string | null
          instructions: string | null
          qr_image_url: string | null
          updated_at: string
          upi_id: string | null
        }
        Insert: {
          account_holder?: string | null
          account_number?: string | null
          bank_name?: string | null
          id?: string
          ifsc_code?: string | null
          instructions?: string | null
          qr_image_url?: string | null
          updated_at?: string
          upi_id?: string | null
        }
        Update: {
          account_holder?: string | null
          account_number?: string | null
          bank_name?: string | null
          id?: string
          ifsc_code?: string | null
          instructions?: string | null
          qr_image_url?: string | null
          updated_at?: string
          upi_id?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          notes: Json | null
          plan_id: string | null
          plan_name: string
          razorpay_order_id: string
          razorpay_payment_id: string | null
          razorpay_signature: string | null
          status: string
          updated_at: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          notes?: Json | null
          plan_id?: string | null
          plan_name: string
          razorpay_order_id: string
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          status?: string
          updated_at?: string
          user_id: string
          verified_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          notes?: Json | null
          plan_id?: string | null
          plan_name?: string
          razorpay_order_id?: string
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "premium_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      post_comments: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          post_id: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          post_id: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          image_url: string | null
          is_announcement: boolean
          updated_at: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_announcement?: boolean
          updated_at?: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_announcement?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      premium_plans: {
        Row: {
          created_at: string
          currency: string
          features: Json
          id: string
          interval: string
          is_active: boolean
          name: string
          price_cents: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          features?: Json
          id?: string
          interval?: string
          is_active?: boolean
          name: string
          price_cents: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          features?: Json
          id?: string
          interval?: string
          is_active?: boolean
          name?: string
          price_cents?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      profile_contacts: {
        Row: {
          created_at: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profile_privacy: {
        Row: {
          allow_profile_indexing: boolean
          created_at: string
          profile_visibility: string
          show_activity_status: boolean
          show_last_seen: boolean
          show_online_status: boolean
          updated_at: string
          user_id: string
          who_can_message: string
          who_can_view_email: string
          who_can_view_followers: string
          who_can_view_following: string
          who_can_view_phone: string
        }
        Insert: {
          allow_profile_indexing?: boolean
          created_at?: string
          profile_visibility?: string
          show_activity_status?: boolean
          show_last_seen?: boolean
          show_online_status?: boolean
          updated_at?: string
          user_id: string
          who_can_message?: string
          who_can_view_email?: string
          who_can_view_followers?: string
          who_can_view_following?: string
          who_can_view_phone?: string
        }
        Update: {
          allow_profile_indexing?: boolean
          created_at?: string
          profile_visibility?: string
          show_activity_status?: boolean
          show_last_seen?: boolean
          show_online_status?: boolean
          updated_at?: string
          user_id?: string
          who_can_message?: string
          who_can_view_email?: string
          who_can_view_followers?: string
          who_can_view_following?: string
          who_can_view_phone?: string
        }
        Relationships: []
      }
      profile_private: {
        Row: {
          address: string | null
          created_at: string
          date_of_birth: string | null
          emergency_contact: string | null
          gender: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          date_of_birth?: string | null
          emergency_contact?: string | null
          gender?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          created_at?: string
          date_of_birth?: string | null
          emergency_contact?: string | null
          gender?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_type: string
          availability: string | null
          avatar_url: string | null
          bio: string | null
          categories: string[] | null
          city: string | null
          cofounder_pitch: string | null
          country: string | null
          cover_url: string | null
          created_at: string
          deactivated_at: string | null
          full_name: string
          fundraising_link: string | null
          id: string
          incognito: boolean
          interests: string[] | null
          karma_points: number
          languages: string[] | null
          last_seen_at: string | null
          location: string | null
          onboarded: boolean
          operational_hours: string | null
          org_type: string | null
          preferred_language: string | null
          premium_tier: string | null
          premium_until: string | null
          profession: string | null
          role: Database["public"]["Enums"]["user_role"]
          search_radius: number | null
          seeking_cofounder: boolean
          skills: string[] | null
          state: string | null
          suspended: boolean
          suspended_at: string | null
          suspended_reason: string | null
          updated_at: string
          username: string | null
          verified: boolean
          website_url: string | null
        }
        Insert: {
          account_type?: string
          availability?: string | null
          avatar_url?: string | null
          bio?: string | null
          categories?: string[] | null
          city?: string | null
          cofounder_pitch?: string | null
          country?: string | null
          cover_url?: string | null
          created_at?: string
          deactivated_at?: string | null
          full_name?: string
          fundraising_link?: string | null
          id: string
          incognito?: boolean
          interests?: string[] | null
          karma_points?: number
          languages?: string[] | null
          last_seen_at?: string | null
          location?: string | null
          onboarded?: boolean
          operational_hours?: string | null
          org_type?: string | null
          preferred_language?: string | null
          premium_tier?: string | null
          premium_until?: string | null
          profession?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          search_radius?: number | null
          seeking_cofounder?: boolean
          skills?: string[] | null
          state?: string | null
          suspended?: boolean
          suspended_at?: string | null
          suspended_reason?: string | null
          updated_at?: string
          username?: string | null
          verified?: boolean
          website_url?: string | null
        }
        Update: {
          account_type?: string
          availability?: string | null
          avatar_url?: string | null
          bio?: string | null
          categories?: string[] | null
          city?: string | null
          cofounder_pitch?: string | null
          country?: string | null
          cover_url?: string | null
          created_at?: string
          deactivated_at?: string | null
          full_name?: string
          fundraising_link?: string | null
          id?: string
          incognito?: boolean
          interests?: string[] | null
          karma_points?: number
          languages?: string[] | null
          last_seen_at?: string | null
          location?: string | null
          onboarded?: boolean
          operational_hours?: string | null
          org_type?: string | null
          preferred_language?: string | null
          premium_tier?: string | null
          premium_until?: string | null
          profession?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          search_radius?: number | null
          seeking_cofounder?: boolean
          skills?: string[] | null
          state?: string | null
          suspended?: boolean
          suspended_at?: string | null
          suspended_reason?: string | null
          updated_at?: string
          username?: string | null
          verified?: boolean
          website_url?: string | null
        }
        Relationships: []
      }
      refunds: {
        Row: {
          amount: number
          created_at: string
          id: string
          payment_id: string
          processed_by: string | null
          razorpay_refund_id: string | null
          reason: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          payment_id: string
          processed_by?: string | null
          razorpay_refund_id?: string | null
          reason?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          payment_id?: string
          processed_by?: string | null
          razorpay_refund_id?: string | null
          reason?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "refunds_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string
          description: string | null
          id: string
          reason: string
          reported_user_id: string
          reporter_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          reason: string
          reported_user_id: string
          reporter_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          reason?: string
          reported_user_id?: string
          reporter_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      request_offers: {
        Row: {
          created_at: string
          helper_id: string
          id: string
          message: string | null
          request_id: string
          status: Database["public"]["Enums"]["offer_status"]
        }
        Insert: {
          created_at?: string
          helper_id: string
          id?: string
          message?: string | null
          request_id: string
          status?: Database["public"]["Enums"]["offer_status"]
        }
        Update: {
          created_at?: string
          helper_id?: string
          id?: string
          message?: string | null
          request_id?: string
          status?: Database["public"]["Enums"]["offer_status"]
        }
        Relationships: [
          {
            foreignKeyName: "request_offers_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "help_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          rating: number
          request_id: string | null
          reviewee_id: string
          reviewer_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          request_id?: string | null
          reviewee_id: string
          reviewer_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          request_id?: string | null
          reviewee_id?: string
          reviewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "help_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      storefront_items: {
        Row: {
          created_at: string
          currency: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          link_url: string | null
          owner_id: string
          price_cents: number
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          link_url?: string | null
          owner_id: string
          price_cents?: number
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          link_url?: string | null
          owner_id?: string
          price_cents?: number
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      stories: {
        Row: {
          author_id: string
          caption: string | null
          created_at: string
          expires_at: string
          id: string
          media_type: string
          media_url: string
        }
        Insert: {
          author_id: string
          caption?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          media_type?: string
          media_url: string
        }
        Update: {
          author_id?: string
          caption?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          media_type?: string
          media_url?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancelled_at: string | null
          created_at: string
          expires_at: string
          id: string
          payment_id: string | null
          plan_id: string | null
          plan_name: string
          started_at: string
          status: string
          tier: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cancelled_at?: string | null
          created_at?: string
          expires_at: string
          id?: string
          payment_id?: string | null
          plan_id?: string | null
          plan_name: string
          started_at?: string
          status?: string
          tier: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cancelled_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          payment_id?: string | null
          plan_id?: string | null
          plan_name?: string
          started_at?: string
          status?: string
          tier?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "premium_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      time_capsules: {
        Row: {
          collected_karma: number
          created_at: string
          description: string
          goal_karma: number
          id: string
          media: Json
          owner_id: string
          title: string
          unlocked_at: string | null
          updated_at: string
        }
        Insert: {
          collected_karma?: number
          created_at?: string
          description?: string
          goal_karma: number
          id?: string
          media?: Json
          owner_id: string
          title: string
          unlocked_at?: string | null
          updated_at?: string
        }
        Update: {
          collected_karma?: number
          created_at?: string
          description?: string
          goal_karma?: number
          id?: string
          media?: Json
          owner_id?: string
          title?: string
          unlocked_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_reports: {
        Row: {
          created_at: string
          id: string
          reason: string
          reporter_id: string
          status: string
          target_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reason: string
          reporter_id: string
          status?: string
          target_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string
          reporter_id?: string
          status?: string
          target_id?: string
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
      verification_requests: {
        Row: {
          admin_notes: string | null
          created_at: string
          document_url: string | null
          id: string
          kind: string
          notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          document_url?: string | null
          id?: string
          kind: string
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          document_url?: string | null
          id?: string
          kind?: string
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      activate_premium: {
        Args: { _plan_id: string }
        Returns: {
          account_type: string
          availability: string | null
          avatar_url: string | null
          bio: string | null
          categories: string[] | null
          city: string | null
          cofounder_pitch: string | null
          country: string | null
          cover_url: string | null
          created_at: string
          deactivated_at: string | null
          full_name: string
          fundraising_link: string | null
          id: string
          incognito: boolean
          interests: string[] | null
          karma_points: number
          languages: string[] | null
          last_seen_at: string | null
          location: string | null
          onboarded: boolean
          operational_hours: string | null
          org_type: string | null
          preferred_language: string | null
          premium_tier: string | null
          premium_until: string | null
          profession: string | null
          role: Database["public"]["Enums"]["user_role"]
          search_radius: number | null
          seeking_cofounder: boolean
          skills: string[] | null
          state: string | null
          suspended: boolean
          suspended_at: string | null
          suspended_reason: string | null
          updated_at: string
          username: string | null
          verified: boolean
          website_url: string | null
        }
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      can_view_follow_list: {
        Args: { _owner: string; _viewer: string; _which: string }
        Returns: boolean
      }
      contribute_to_capsule: {
        Args: { _amount: number; _capsule_id: string }
        Returns: {
          collected_karma: number
          created_at: string
          description: string
          goal_karma: number
          id: string
          media: Json
          owner_id: string
          title: string
          unlocked_at: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "time_capsules"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      app_role: "admin" | "user"
      offer_status: "pending" | "accepted" | "declined" | "withdrawn"
      request_category:
        | "education"
        | "medical"
        | "food"
        | "transport"
        | "technology"
        | "elder_care"
        | "child_care"
        | "jobs"
        | "donations"
        | "emergency"
        | "other"
      request_status: "open" | "accepted" | "completed" | "cancelled"
      urgency_level: "low" | "normal" | "high" | "emergency"
      user_role: "seeker" | "helper" | "both"
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
      offer_status: ["pending", "accepted", "declined", "withdrawn"],
      request_category: [
        "education",
        "medical",
        "food",
        "transport",
        "technology",
        "elder_care",
        "child_care",
        "jobs",
        "donations",
        "emergency",
        "other",
      ],
      request_status: ["open", "accepted", "completed", "cancelled"],
      urgency_level: ["low", "normal", "high", "emergency"],
      user_role: ["seeker", "helper", "both"],
    },
  },
} as const
