import { CategoriesGrid } from "@/components/categories-grid";

export default function CategoriesPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Categories</h1>
          <p className="text-muted-foreground">
            Browse auctions by category
          </p>
        </div>

        <CategoriesGrid />
      </div>
    </div>
  );
}
