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
      bids: {
        Row: {
          id: string
          product_id: string
          user_id: string
          bid_amount: number
          status: 'active' | 'outbid' | 'winning' | 'won' | 'lost'
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          user_id: string
          bid_amount: number
          status?: 'active' | 'outbid' | 'winning' | 'won' | 'lost'
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          user_id?: string
          bid_amount?: number
          status?: 'active' | 'outbid' | 'winning' | 'won' | 'lost'
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bids_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bids_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      categories: {
        Row: {
          id: string
          name: string
          description: string | null
          slug: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          slug: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          slug?: string
          created_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          product_id: string | null
          type: string
          title: string
          message: string
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          product_id?: string | null
          type: string
          title: string
          message: string
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          product_id?: string | null
          type?: string
          title?: string
          message?: string
          is_read?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      products: {
        Row: {
          id: string
          title: string
          description: string
          starting_price: number
          current_price: number
          reserve_price: number | null
          end_time: string
          status: 'active' | 'ended' | 'cancelled'
          seller_id: string
          winner_id: string | null
          category_id: string | null
          image_urls: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          starting_price: number
          current_price?: number
          reserve_price?: number | null
          end_time: string
          status?: 'active' | 'ended' | 'cancelled'
          seller_id: string
          winner_id?: string | null
          category_id?: string | null
          image_urls?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          starting_price?: number
          current_price?: number
          reserve_price?: number | null
          end_time?: string
          status?: 'active' | 'ended' | 'cancelled'
          seller_id?: string
          winner_id?: string | null
          category_id?: string | null
          image_urls?: string[]
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      users: {
        Row: {
          id: string
          email: string
          name: string
          avatar_url: string | null
          phone: string | null
          address: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          avatar_url?: string | null
          phone?: string | null
          address?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          avatar_url?: string | null
          phone?: string | null
          address?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      watchlist: {
        Row: {
          id: string
          user_id: string
          product_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          product_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          product_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "watchlist_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "watchlist_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      active_auctions: {
        Row: {
          id: string
          title: string
          description: string
          starting_price: number
          current_price: number
          reserve_price: number | null
          end_time: string
          status: 'active' | 'ended' | 'cancelled'
          seller_id: string
          winner_id: string | null
          category_id: string | null
          image_urls: string[]
          created_at: string
          updated_at: string
          category_name: string | null
          seller_name: string
          seller_avatar: string | null
          highest_bidder_id: string | null
          highest_bid_amount: number | null
          last_bid_time: string | null
          seconds_remaining: number | null
        }
        Relationships: []
      }
      user_bidding_history: {
        Row: {
          id: string
          product_id: string
          user_id: string
          bid_amount: number
          status: 'active' | 'outbid' | 'winning' | 'won' | 'lost'
          created_at: string
          product_title: string
          product_image: string | null
          auction_status: 'active' | 'ended' | 'cancelled'
          winner_id: string | null
          final_status: 'won' | 'lost' | 'winning' | 'outbid' | 'active'
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      auction_status: 'active' | 'ended' | 'cancelled'
      bid_status: 'active' | 'outbid' | 'winning' | 'won' | 'lost'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
