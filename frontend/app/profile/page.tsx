import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { UserProfile } from "@/components/user-profile";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return <UserProfile />;
}
