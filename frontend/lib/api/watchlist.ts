import { createClient } from "@/lib/supabase/client";
import type { WatchlistItem, ProductWithDetails } from "@/lib/types";

export class WatchlistAPI {
  private supabase = createClient();

  async addToWatchlist(productId: string, userId: string) {
    try {
      const { data, error } = await this.supabase
        .from('watchlist')
        .insert({
          product_id: productId,
          user_id: userId,
        })
        .select()
        .single();

      if (error) throw error;
      return data as WatchlistItem;
    } catch (error) {
      console.error('Failed to add to watchlist:', error);
      throw error;
    }
  }

  async removeFromWatchlist(productId: string, userId: string) {
    try {
      const { error } = await this.supabase
        .from('watchlist')
        .delete()
        .eq('product_id', productId)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to remove from watchlist:', error);
      throw error;
    }
  }

  async getWatchlist(userId: string) {
    const { data, error } = await this.supabase
      .from('watchlist')
      .select(`
        *,
        product:products(
          *,
          category:categories(*),
          seller:users!products_seller_id_fkey(*),
          bids(count)
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data.map(item => item.product).filter(Boolean) as ProductWithDetails[];
  }

  async isInWatchlist(productId: string, userId: string) {
    try {
      // Check if user is authenticated
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        return false;
      }
      
      const { data, error } = await this.supabase
        .from('watchlist')
        .select('id')
        .eq('product_id', productId)
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      return !!data;
    } catch (error) {
      console.error('Failed to check watchlist status:', error);
      return false; // Return false on error to prevent UI issues
    }
  }

  async toggleWatchlist(productId: string, userId: string) {
    const isInWatchlist = await this.isInWatchlist(productId, userId);
    
    if (isInWatchlist) {
      await this.removeFromWatchlist(productId, userId);
      return false;
    } else {
      await this.addToWatchlist(productId, userId);
      return true;
    }
  }
}

export const watchlistAPI = new WatchlistAPI();
