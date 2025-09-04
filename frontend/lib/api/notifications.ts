import { createClient } from "@/lib/supabase/client";
import type { Notification } from "@/lib/types";

export class NotificationsAPI {
  private supabase = createClient();

  async getNotifications(userId: string, limit = 50) {
    const { data, error } = await this.supabase
      .from('notifications')
      .select(`
        *,
        product:products(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data as (Notification & { product?: unknown })[];
  }

  async getUnreadNotifications(userId: string) {
    const { data, error } = await this.supabase
      .from('notifications')
      .select(`
        *,
        product:products(*)
      `)
      .eq('user_id', userId)
      .eq('is_read', false)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as (Notification & { product?: unknown })[];
  }

  async markAsRead(notificationId: string, userId: string) {
    const { error } = await this.supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  async markAllAsRead(userId: string) {
    const { error } = await this.supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;
  }

  async getUnreadCount(userId: string) {
    const { count, error } = await this.supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;
    return count || 0;
  }

  // Real-time subscription for notifications
  subscribeToNotifications(userId: string, callback: (payload: unknown) => void) {
    return this.supabase
      .channel(`notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        callback
      )
      .subscribe();
  }
}

export const notificationsAPI = new NotificationsAPI();
