"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ProductWithDetails } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Heart, Clock, Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { CountdownTimer } from "@/components/countdown-timer";

interface ProductCardProps {
  product: ProductWithDetails;
  showWatchlistButton?: boolean;
  onWatchlistToggle?: (productId: string) => void;
}

export function ProductCard({ 
  product, 
  showWatchlistButton = true,
  onWatchlistToggle 
}: ProductCardProps) {
  const [isWatched, setIsWatched] = useState(false);
  const [imageError, setImageError] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const getBidCount = () => {
    if (!product.bids) return 0;
    
    if (Array.isArray(product.bids)) {
      // Check if it's a count array from Supabase (bids(count))
      if (product.bids.length === 1 && product.bids[0] && typeof product.bids[0] === 'object' && 'count' in product.bids[0]) {
        return product.bids[0].count;
      }
      // Otherwise it's a regular array of bids
      return product.bids.length;
    }
    
    // Handle count object from Supabase
    if (typeof product.bids === 'object' && 'length' in product.bids) {
      return product.bids.length;
    }
    
    return 0;
  };

  const getTimeRemaining = () => {
    const endTime = new Date(product.end_time);
    const now = new Date();
    const diff = endTime.getTime() - now.getTime();
    
    if (diff <= 0) return 'Ended';
    
    return formatDistanceToNow(endTime, { addSuffix: true });
  };

  const handleWatchlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWatched(!isWatched);
    onWatchlistToggle?.(product.id);
  };

  const isEnded = new Date(product.end_time) <= new Date();

  return (
    <Link href={`/auctions/${product.id}`} className="group">
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-200 group-hover:scale-[1.02]">
        <div className="relative aspect-square overflow-hidden">
          {product.image_urls && product.image_urls.length > 0 && !imageError ? (
            <Image
              src={product.image_urls[0]}
              alt={product.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-200"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <span className="text-muted-foreground text-sm">No Image</span>
            </div>
          )}
          
          {showWatchlistButton && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 h-8 w-8 p-0 bg-background/80 hover:bg-background"
              onClick={handleWatchlistToggle}
            >
              <Heart 
                className={`h-4 w-4 ${isWatched ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} 
              />
            </Button>
          )}

          {isEnded && (
            <Badge 
              variant="destructive" 
              className="absolute top-2 left-2"
            >
              Ended
            </Badge>
          )}

          {product.category && (
            <Badge 
              variant="secondary" 
              className="absolute bottom-2 left-2"
            >
              {product.category.name}
            </Badge>
          )}
        </div>

        <CardContent className="p-4">
          <h3 className="font-semibold text-sm mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            {product.title}
          </h3>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-primary">
                {formatPrice(product.current_price)}
              </span>
              {product.bids && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Users className="h-4 w-4 mr-1" />
                  {getBidCount()} bid{getBidCount() !== 1 ? 's' : ''}
                </div>
              )}
            </div>

            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="h-4 w-4 mr-1" />
              {isEnded ? (
                <span>Ended {getTimeRemaining()}</span>
              ) : (
                <CountdownTimer endTime={product.end_time} />
              )}
            </div>

            {product.seller && (
              <p className="text-sm text-muted-foreground">
                by {product.seller.name}
              </p>
            )}
          </div>
        </CardContent>

        <CardFooter className="p-4 pt-0">
          <Button 
            className="w-full" 
            variant={isEnded ? "outline" : "default"}
            disabled={isEnded}
          >
            {isEnded ? 'View Details' : 'Place Bid'}
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
}
