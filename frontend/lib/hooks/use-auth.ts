"use client";

import { createClient } from "@/lib/supabase/client";
import { User } from "@/lib/types";
import { usersAPI } from "@/lib/api/users";
import { useEffect, useState } from "react";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await loadUserProfile(session.user.id, session.user.email || '');
      }
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          await loadUserProfile(session.user.id, session.user.email || '');
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase]);

  const loadUserProfile = async (userId: string, email: string) => {
    try {
      // Try to get existing profile
      const profile = await usersAPI.getUserProfile(userId);
      setUser(profile);
    } catch {
      // If profile doesn't exist, create it
      try {
        const newProfile = await usersAPI.createUserProfile(userId, email);
        setUser(newProfile);
      } catch (createError) {
        console.error('Failed to create user profile:', createError);
        // Set a temporary user object if profile creation fails
        setUser({
          id: userId,
          email: email,
          name: email.split('@')[0],
          avatar_url: undefined,
          phone: undefined,
          address: undefined,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return {
    user,
    loading,
    signOut,
  };
}
