"use client";

import { useState } from "react";
import { ProductGrid } from "@/components/product-grid";
import { SearchFilters } from "@/components/search-filters";
import { ProductFilters } from "@/lib/types";

interface HomeProps {
  searchParams: Promise<{
    category?: string;
  }>;
}

export default function Home({ searchParams }: HomeProps) {
  const [filters, setFilters] = useState<ProductFilters>({});

  return (
    <main className="min-h-screen flex flex-col">
      <div className="flex-1 w-full max-w-7xl mx-auto p-5">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Live Auctions</h1>
          <p className="text-muted-foreground">
            Discover unique items and place your bids in real-time
          </p>
        </div>

        <SearchFilters onFiltersChange={setFilters} />
        <ProductGrid filters={filters} />
      </div>

      <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-16 mt-16">
        <p>
          Powered by{" "}
          <a
            href="https://github.com/galvin1912"
            target="_blank"
            className="font-bold hover:underline"
            rel="noreferrer"
          >
            Galvin Nguyen
          </a>
        </p>
      </footer>
    </main>
  );
}
