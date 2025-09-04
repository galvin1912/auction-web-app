"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";
import { CreateProductForm as CreateProductFormType, Category } from "@/lib/types";
import { productsAPI } from "@/lib/api/products";
import { categoriesAPI } from "@/lib/api/categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ImageUpload } from "@/components/image-upload";
import { AlertCircle, CheckCircle } from "lucide-react";

export function CreateProductForm() {
  const { user } = useAuth();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState<CreateProductFormType>({
    title: "",
    description: "",
    starting_price: 0,
    reserve_price: undefined,
    end_time: "",
    category_id: undefined,
    images: [],
  });

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

  const handleInputChange = (field: keyof CreateProductFormType, value: string | number | File[] | undefined) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageChange = (files: File[]) => {
    console.log("files", files);
    if (files.length > 5) {
      setError("Maximum 5 images allowed");
      return;
    }
    setFormData(prev => ({
      ...prev,
      images: files
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError("Please sign in to create an auction");
      return;
    }

    // Validation
    if (!formData.title.trim()) {
      setError("Title is required");
      return;
    }

    if (!formData.description.trim()) {
      setError("Description is required");
      return;
    }

    if (formData.starting_price <= 0) {
      setError("Starting price must be greater than 0");
      return;
    }

    if (!formData.end_time) {
      setError("End time is required");
      return;
    }

    const endTime = new Date(formData.end_time);
    const now = new Date();
    if (endTime <= now) {
      setError("End time must be in the future");
      return;
    }

    // Store the end time as-is since PostgreSQL handles timezone conversion
    const endTimeUTC = endTime;

    if (formData.images.length === 0) {
      setError("At least one image is required");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Create a copy of formData with UTC end_time
      const productDataWithUTC = {
        ...formData,
        end_time: endTimeUTC.toISOString()
      };
      
      const product = await productsAPI.createProduct(productDataWithUTC, user.id);
      setSuccess(true);
      
      // Reset form
      setFormData({
        title: "",
        description: "",
        starting_price: 0,
        reserve_price: undefined,
        end_time: "",
        category_id: undefined,
        images: [],
      });

      // Redirect to product page after 2 seconds
      setTimeout(() => {
        router.push(`/auctions/${product.id}`);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create auction");
    } finally {
      setLoading(false);
    }
  };


  const getMinEndTime = () => {
    const now = new Date();
    now.setHours(now.getHours() + 1); // Minimum 1 hour from now
    return now.toISOString().slice(0, 16);
  };

  if (success) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Auction Created Successfully!</h3>
          <p className="text-muted-foreground">
            Your auction is now live. Redirecting to the auction page...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Product Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter a descriptive title for your item"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe your item in detail. Include condition, features, and any relevant information."
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category_id || "none"}
                onValueChange={(value: string) => handleInputChange('category_id', value === "none" ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Select a category</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_time">Auction End Time *</Label>
              <Input
                id="end_time"
                type="datetime-local"
                value={formData.end_time}
                onChange={(e) => handleInputChange('end_time', e.target.value)}
                min={getMinEndTime()}
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pricing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="starting_price">Starting Price *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  id="starting_price"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.starting_price || ""}
                  onChange={(e) => handleInputChange('starting_price', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="pl-8"
                  required
                />
              </div>
              <p className="text-sm text-muted-foreground">
                This is the minimum bid amount
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reserve_price">Reserve Price (Optional)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  id="reserve_price"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.reserve_price || ""}
                  onChange={(e) => handleInputChange('reserve_price', e.target.value ? parseFloat(e.target.value) : undefined)}
                  placeholder="0.00"
                  className="pl-8"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Minimum price to sell (hidden from bidders)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Images</CardTitle>
        </CardHeader>
        <CardContent>
          <ImageUpload
            images={formData.images}
            onChange={handleImageChange}
            maxImages={5}
          />
          <p className="text-sm text-muted-foreground mt-2">
            Upload 1-5 high-quality images of your item. The first image will be used as the main image.
          </p>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading}
        >
          {loading ? "Creating Auction..." : "Create Auction"}
        </Button>
      </div>
    </form>
  );
}
