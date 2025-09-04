"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/hooks/use-auth";
import { notificationsAPI } from "@/lib/api/notifications";
import { Notification } from "@/lib/types";

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadNotifications = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const [notificationsData, count] = await Promise.all([
        notificationsAPI.getNotifications(user.id),
        notificationsAPI.getUnreadCount(user.id),
      ]);
      
      setNotifications(notificationsData);
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const subscribeToNotifications = useCallback(() => {
    if (!user) return;

    const subscription = notificationsAPI.subscribeToNotifications(user.id, (payload: unknown) => {
      const typedPayload = payload as { eventType: string; new: unknown };
      if (typedPayload.eventType === 'INSERT') {
        const newNotification = typedPayload.new as Notification;
        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  useEffect(() => {
    if (user) {
      loadNotifications();
      subscribeToNotifications();
    } else {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
    }
  }, [user, loadNotifications, subscribeToNotifications]);

  const markAsRead = async (notificationId: string) => {
    if (!user) return;

    try {
      await notificationsAPI.markAsRead(notificationId, user.id);
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, is_read: true }
            : notification
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      await notificationsAPI.markAllAsRead(user.id);
      setNotifications(prev =>
        prev.map(notification => ({ ...notification, is_read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refresh: loadNotifications,
  };
}
