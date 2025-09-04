"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { categoriesAPI } from "@/lib/api/categories";
import { Category, ProductFilters } from "@/lib/types";
import { Search, Filter, X } from "lucide-react";

interface SearchFiltersProps {
  onFiltersChange?: (filters: ProductFilters) => void;
  initialFilters?: ProductFilters;
}

export function SearchFilters({ onFiltersChange, initialFilters = {} }: SearchFiltersProps) {
  const [filters, setFilters] = useState<ProductFilters>(initialFilters);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await categoriesAPI.getCategories();
        setCategories(data);
      } catch (error) {
        console.error('Failed to load categories:', error);
      }
    };

    loadCategories();
  }, []);

  const handleFilterChange = (key: keyof ProductFilters, value: string | number | undefined) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange?.(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters: ProductFilters = {};
    setFilters(clearedFilters);
    onFiltersChange?.(clearedFilters);
  };

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== undefined && value !== '' && value !== null
  );

  return (
    <div className="mb-8">
      {/* Desktop Filters */}
      <div className="hidden md:block">
        <div className="flex flex-wrap gap-4 items-center p-4 bg-muted/50 rounded-lg">
          <div className="flex-1 min-w-[300px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search auctions..."
                value={filters.search || ''}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Select
            value={filters.category_id || 'all'}
            onValueChange={(value: string) => handleFilterChange('category_id', value === 'all' ? undefined : value)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Min Price"
              value={filters.min_price || ''}
              onChange={(e) => handleFilterChange('min_price', e.target.value ? Number(e.target.value) : undefined)}
              className="w-[120px]"
            />
            <Input
              type="number"
              placeholder="Max Price"
              value={filters.max_price || ''}
              onChange={(e) => handleFilterChange('max_price', e.target.value ? Number(e.target.value) : undefined)}
              className="w-[120px]"
            />
          </div>

          <Select
            value={filters.sort_by || 'created_at'}
            onValueChange={(value: string) => handleFilterChange('sort_by', value as ProductFilters['sort_by'])}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at">Newest First</SelectItem>
              <SelectItem value="end_time">Ending Soon</SelectItem>
              <SelectItem value="current_price">Price: Low to High</SelectItem>
              <SelectItem value="title">Name A-Z</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="text-muted-foreground"
            >
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Filters */}
      <div className="md:hidden">
        <div className="flex gap-2 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search auctions..."
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowMobileFilters(!showMobileFilters)}
          >
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        {showMobileFilters && (
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
            <Select
              value={filters.category_id || 'all'}
              onValueChange={(value: string) => handleFilterChange('category_id', value === 'all' ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                placeholder="Min Price"
                value={filters.min_price || ''}
                onChange={(e) => handleFilterChange('min_price', e.target.value ? Number(e.target.value) : undefined)}
              />
              <Input
                type="number"
                placeholder="Max Price"
                value={filters.max_price || ''}
                onChange={(e) => handleFilterChange('max_price', e.target.value ? Number(e.target.value) : undefined)}
              />
            </div>

            <Select
              value={filters.sort_by || 'created_at'}
              onValueChange={(value: string) => handleFilterChange('sort_by', value as ProductFilters['sort_by'])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">Newest First</SelectItem>
                <SelectItem value="end_time">Ending Soon</SelectItem>
                <SelectItem value="current_price">Price: Low to High</SelectItem>
                <SelectItem value="title">Name A-Z</SelectItem>
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="w-full text-muted-foreground"
              >
                <X className="h-4 w-4 mr-1" />
                Clear Filters
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
