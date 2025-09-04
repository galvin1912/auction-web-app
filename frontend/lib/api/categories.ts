import { createClient } from "@/lib/supabase/client";
import type { Category } from "@/lib/types";

export class CategoriesAPI {
  private supabase = createClient();

  async getCategories() {
    const { data, error } = await this.supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return data as Category[];
  }

  async getCategory(slug: string) {
    const { data, error } = await this.supabase
      .from('categories')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) throw error;
    return data as Category;
  }
}

export const categoriesAPI = new CategoriesAPI();
