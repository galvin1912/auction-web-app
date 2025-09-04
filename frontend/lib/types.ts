// Database types based on the SQL schema
export type AuctionStatus = 'active' | 'ended' | 'cancelled';
export type BidStatus = 'active' | 'outbid' | 'winning' | 'won' | 'lost';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  phone?: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  slug: string;
  created_at: string;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  starting_price: number;
  current_price: number;
  reserve_price?: number;
  end_time: string;
  status: AuctionStatus;
  seller_id: string;
  winner_id?: string;
  category_id?: string;
  image_urls: string[];
  created_at: string;
  updated_at: string;
}

export interface Bid {
  id: string;
  product_id: string;
  user_id: string;
  bid_amount: number;
  status: BidStatus;
  created_at: string;
}

export interface WatchlistItem {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  product_id?: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

// Extended types for UI components
export interface ProductWithDetails extends Product {
  category?: Category;
  seller?: User;
  highest_bidder?: User;
  highest_bid_amount?: number;
  last_bid_time?: string;
  seconds_remaining?: number;
  bid_count?: number;
  bids?: Bid[] | { length: number };
}

export interface BidWithDetails extends Bid {
  product?: Product;
  user?: User;
  final_status?: 'won' | 'lost' | 'winning' | 'outbid' | 'active';
}

export interface UserBiddingHistory extends Bid {
  product_title: string;
  product_image?: string;
  auction_status: AuctionStatus;
  winner_id?: string;
  final_status: 'won' | 'lost' | 'winning' | 'outbid' | 'active';
}

// Form types
export interface CreateProductForm {
  title: string;
  description: string;
  starting_price: number;
  reserve_price?: number;
  end_time: string;
  category_id?: string;
  images: File[];
}

export interface BidForm {
  bid_amount: number;
}

// API response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  limit: number;
  total_pages: number;
}

// Search and filter types
export interface ProductFilters {
  search?: string;
  category_id?: string;
  min_price?: number;
  max_price?: number;
  status?: AuctionStatus;
  sort_by?: 'created_at' | 'end_time' | 'current_price' | 'title';
  sort_order?: 'asc' | 'desc';
}

// Real-time subscription types
export interface RealtimeBidUpdate {
  product_id: string;
  bid_amount: number;
  user_id: string;
  created_at: string;
}

export interface RealtimeAuctionUpdate {
  product_id: string;
  status: AuctionStatus;
  winner_id?: string;
  current_price: number;
}
