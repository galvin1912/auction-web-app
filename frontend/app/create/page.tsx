import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CreateProductForm } from "@/components/create-product-form";

export default async function CreateProductPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Create New Auction</h1>
          <p className="text-muted-foreground mt-2">
            List your item for auction and let bidders compete for it.
          </p>
        </div>

        <CreateProductForm />
      </div>
    </div>
  );
}
