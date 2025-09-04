import { createClient } from "@/lib/supabase/client";
import type { Product, ProductWithDetails, ProductFilters, CreateProductForm } from "@/lib/types";

export class ProductsAPI {
  private supabase = createClient();

  async getProducts(filters: ProductFilters = {}) {
    let query = this.supabase
      .from('products')
      .select(`
        *,
        category:categories(*),
        seller:users!products_seller_id_fkey(*),
        bids(count)
      `)
      .eq('status', 'active');

    // Apply filters
    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    if (filters.category_id) {
      query = query.eq('category_id', filters.category_id);
    }

    if (filters.min_price) {
      query = query.gte('current_price', filters.min_price);
    }

    if (filters.max_price) {
      query = query.lte('current_price', filters.max_price);
    }

    // Apply sorting
    const sortBy = filters.sort_by || 'created_at';
    const sortOrder = filters.sort_order || 'desc';
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    const { data, error } = await query;

    if (error) throw error;
    return data as ProductWithDetails[];
  }

  async getProduct(id: string) {
    const { data, error } = await this.supabase
      .from('products')
      .select(`
        *,
        category:categories(*),
        seller:users!products_seller_id_fkey(*),
        bids(
          *,
          user:users!bids_user_id_fkey(*)
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching product:', error);
      throw error;
    }
    
    return data as ProductWithDetails;
  }

  async createProduct(productData: CreateProductForm, userId: string) {
    // First, upload images to Supabase Storage
    let imageUrls: string[] = [];
    
    // Upload all images concurrently
    const uploadPromises = productData.images.map(async (image) => {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(image.type)) {
        throw new Error(`Invalid file type: ${image.type}. Only JPEG, PNG, and WebP images are allowed.`);
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (image.size > maxSize) {
        throw new Error(`File too large: ${image.name}. Maximum size is 5MB.`);
      }

      const fileExt = image.name.split('.').pop();
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 15);
      const fileName = `${timestamp}-${randomId}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await this.supabase.storage
        .from('product-images')
        .upload(filePath, image);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(`Failed to upload image: ${uploadError.message}`);
      }

      const { data: { publicUrl } } = this.supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      return publicUrl;
    });

    imageUrls = await Promise.all(uploadPromises);

    // Create product
    const { data, error } = await this.supabase
      .from('products')
      .insert({
        title: productData.title,
        description: productData.description,
        starting_price: productData.starting_price,
        current_price: productData.starting_price,
        reserve_price: productData.reserve_price,
        end_time: productData.end_time,
        seller_id: userId,
        category_id: productData.category_id,
        image_urls: imageUrls,
      })
      .select()
      .single();

    if (error) throw error;
    return data as Product;
  }

  async updateProduct(id: string, updates: Partial<Product>, userId: string) {
    const { data, error } = await this.supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .eq('seller_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data as Product;
  }

  async deleteProduct(id: string, userId: string) {
    const { error } = await this.supabase
      .from('products')
      .delete()
      .eq('id', id)
      .eq('seller_id', userId);

    if (error) throw error;
  }

  async getUserProducts(userId: string) {
    const { data, error } = await this.supabase
      .from('products')
      .select(`
        *,
        category:categories(*),
        bids(count)
      `)
      .eq('seller_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as ProductWithDetails[];
  }

  async getWonProducts(userId: string) {
    const { data, error } = await this.supabase
      .from('products')
      .select(`
        *,
        category:categories(*),
        seller:users!products_seller_id_fkey(*)
      `)
      .eq('winner_id', userId)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data as ProductWithDetails[];
  }

  // Real-time subscription for product updates
  subscribeToProduct(productId: string, callback: (payload: unknown) => void) {
    return this.supabase
      .channel(`product-${productId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products',
          filter: `id=eq.${productId}`,
        },
        callback
      )
      .subscribe();
  }

  // Real-time subscription for bids on a product
  subscribeToBids(productId: string, callback: (payload: unknown) => void) {
    return this.supabase
      .channel(`bids-${productId}`)
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
      .subscribe();
  }
}

export const productsAPI = new ProductsAPI();
