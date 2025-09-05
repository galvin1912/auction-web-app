import { createClient } from "@/lib/supabase/client";
import type { BidWithDetails, UserBiddingHistory } from "@/lib/types";

export class BidsAPI {
  private supabase = createClient();

  async placeBid(productId: string, bidAmount: number, userId: string) {
    // First, get the current product and highest bid to validate
    const { data: product, error: productError } = await this.supabase
      .from('products')
      .select('current_price, status, end_time')
      .eq('id', productId)
      .single();

    if (productError) throw productError;

    // Get the current highest bid amount (regardless of status)
    const { data: highestBid, error: bidError } = await this.supabase
      .from('bids')
      .select('bid_amount')
      .eq('product_id', productId)
      .order('bid_amount', { ascending: false })
      .limit(1)
      .single();

    if (bidError && bidError.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw bidError;
    }

    const currentHighestBid = highestBid?.bid_amount || product.current_price;

    // Validate bid
    if (product.status !== 'active') {
      throw new Error('This auction is no longer active');
    }

    if (new Date(product.end_time) <= new Date()) {
      throw new Error('This auction has ended');
    }

    if (bidAmount <= currentHighestBid) {
      throw new Error(`Bid amount must be higher than current highest bid of $${currentHighestBid.toFixed(2)}`);
    }

    // Place the bid
    const { data, error } = await this.supabase
      .from('bids')
      .insert({
        product_id: productId,
        user_id: userId,
        bid_amount: bidAmount,
      })
      .select(`
        *,
        product:products(*),
        user:users!bids_user_id_fkey(*)
      `)
      .single();

    if (error) {
      console.error('Bid placement error:', error);
      throw error;
    }
    
    // Manually update the product's current_price to ensure it's correct
    await this.updateProductCurrentPrice(productId);
    
    // Add a small delay to ensure database consistency
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return data as BidWithDetails;
  }

  async getProductBids(productId: string) {
    const { data, error } = await this.supabase
      .from('bids')
      .select(`
        *,
        user:users!bids_user_id_fkey(*)
      `)
      .eq('product_id', productId)
      .order('bid_amount', { ascending: false });

    if (error) throw error;
    return data as BidWithDetails[];
  }

  async getUserBids(userId: string) {
    const { data, error } = await this.supabase
      .from('user_bidding_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as UserBiddingHistory[];
  }

  async getWinningBids(userId: string) {
    const { data, error } = await this.supabase
      .from('bids')
      .select(`
        *,
        product:products(*)
      `)
      .eq('user_id', userId)
      .eq('status', 'winning')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as BidWithDetails[];
  }

  async getWonBids(userId: string) {
    const { data, error } = await this.supabase
      .from('bids')
      .select(`
        *,
        product:products(*)
      `)
      .eq('user_id', userId)
      .eq('status', 'won')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as BidWithDetails[];
  }

  // Real-time subscription for all bids
  subscribeToBids(callback: (payload: unknown) => void) {
    return this.supabase
      .channel('bids')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bids',
        },
        callback
      )
      .subscribe();
  }

  // Real-time subscription for bids on a specific product
  subscribeToProductBids(productId: string, callback: (payload: unknown) => void) {
    return this.supabase
      .channel(`product-bids-${productId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bids',
          filter: `product_id=eq.${productId}`,
        },
        callback
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bids',
          filter: `product_id=eq.${productId}`,
        },
        callback
      )
      .subscribe();
  }

  // Helper method to manually update product current_price
  private async updateProductCurrentPrice(productId: string) {
    try {
      // Get the highest bid amount
      const { data: highestBid, error: bidError } = await this.supabase
        .from('bids')
        .select('bid_amount')
        .eq('product_id', productId)
        .order('bid_amount', { ascending: false })
        .limit(1)
        .single();

      if (bidError && bidError.code !== 'PGRST116') {
        console.error('Error getting highest bid:', bidError);
        return;
      }

      // Get the product's starting price
      const { data: product, error: productError } = await this.supabase
        .from('products')
        .select('starting_price, current_price')
        .eq('id', productId)
        .single();

      if (productError) {
        console.error('Error getting product:', productError);
        return;
      }

      const highestBidAmount = highestBid?.bid_amount || 0;
      const currentPrice = Math.max(highestBidAmount, product.starting_price);

      // Update the product's current_price using the database function
      const { error: updateError } = await this.supabase
        .rpc('update_product_current_price_manual', {
          product_id: productId,
          new_current_price: currentPrice
        });

      if (updateError) {
        console.error('Error updating product current_price:', updateError);
      }
    } catch (error) {
      console.error('Error in updateProductCurrentPrice:', error);
    }
  }
}

export const bidsAPI = new BidsAPI();
