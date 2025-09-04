import { createClient } from "@/lib/supabase/client";
import type { User } from "@/lib/types";

export class UsersAPI {
  private supabase = createClient();

  async createUserProfile(userId: string, email: string, name?: string) {
    const { data, error } = await this.supabase
      .from('users')
      .insert({
        id: userId,
        email: email,
        name: name || email.split('@')[0], // Use email prefix as default name
      })
      .select()
      .single();

    if (error) throw error;
    return data as User;
  }

  async getUserProfile(userId: string) {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data as User;
  }

  async updateUserProfile(userId: string, updates: Partial<User>) {
    const { data, error } = await this.supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data as User;
  }

  async deleteUserProfile(userId: string) {
    const { error } = await this.supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) throw error;
  }
}

export const usersAPI = new UsersAPI();
