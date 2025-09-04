"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return (
    <button
      onClick={logout}
      className="flex w-full items-center px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer"
    >
      Logout
    </button>
  );
}
