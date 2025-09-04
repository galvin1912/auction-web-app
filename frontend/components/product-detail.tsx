"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ProductWithDetails } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BidForm } from "@/components/bid-form";
import { BidHistory } from "@/components/bid-history";
import { WatchlistButton } from "@/components/watchlist-button";
import { CountdownTimer } from "@/components/countdown-timer";
import { ArrowLeft, Clock, Users, User, Calendar } from "lucide-react";
import { productsAPI } from "@/lib/api/products";

interface ProductDetailProps {
  product: ProductWithDetails;
}

export function ProductDetail({ product: initialProduct }: ProductDetailProps) {
  const [product, setProduct] = useState(initialProduct);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isEnded, setIsEnded] = useState(false);
  const [bidHistoryKey, setBidHistoryKey] = useState(0);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  useEffect(() => {
    const checkIfEnded = () => {
      const endTime = new Date(product.end_time);
      const now = new Date();
      setIsEnded(endTime <= now);
    };

    checkIfEnded();
    const interval = setInterval(checkIfEnded, 1000);

    return () => clearInterval(interval);
  }, [product.end_time]);

  // Real-time updates for product and bids
  useEffect(() => {
    const refreshProduct = async () => {
      try {
        const updatedProduct = await productsAPI.getProduct(product.id);
        setProduct(updatedProduct);
      } catch (error) {
        console.error('Error refreshing product:', error);
      }
    };

    // Subscribe to product updates
    const productSubscription = productsAPI.subscribeToProduct(product.id, refreshProduct);
    
    // Subscribe to bid updates
    const bidsSubscription = productsAPI.subscribeToBids(product.id, refreshProduct);

    return () => {
      productSubscription.unsubscribe();
      bidsSubscription.unsubscribe();
    };
  }, [product.id]);

  const handleBidPlaced = async () => {
    // Refresh product data after successful bid
    try {
      const updatedProduct = await productsAPI.getProduct(product.id);
      setProduct(updatedProduct);
      
      // Force bid history to refresh by updating the key
      setBidHistoryKey(prev => prev + 1);
    } catch (error) {
      console.error('Error refreshing product after bid:', error);
    }
  };

  const handleImageError = (index: number) => {
    // Could implement fallback logic here
    console.error(`Failed to load image at index ${index}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Auctions
                </Link>
              </Button>
              <div className="hidden sm:block">
                <Badge variant="outline">
                  {product.category?.name || 'Uncategorized'}
                </Badge>
              </div>
            </div>
            <WatchlistButton productId={product.id} />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="aspect-square relative overflow-hidden rounded-lg bg-muted">
              {product.image_urls && product.image_urls.length > 0 ? (
                <Image
                  src={product.image_urls[currentImageIndex]}
                  alt={product.title}
                  fill
                  className="object-cover"
                  onError={() => handleImageError(currentImageIndex)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-muted-foreground">No Image Available</span>
                </div>
              )}
            </div>

            {product.image_urls && product.image_urls.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.image_urls.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`aspect-square relative overflow-hidden rounded-md border-2 ${
                      currentImageIndex === index ? 'border-primary' : 'border-transparent'
                    }`}
                  >
                    <Image
                      src={image}
                      alt={`${product.title} ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{product.title}</h1>
              <p className="text-muted-foreground text-lg">{product.description}</p>
            </div>

            {/* Auction Status */}
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Current Bid</p>
                      <p className="text-3xl font-bold text-primary">
                        {formatPrice(product.current_price)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Starting Price</p>
                      <p className="text-lg font-semibold">
                        {formatPrice(product.starting_price)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {isEnded ? (
                        <span>This auction has ended</span>
                      ) : (
                        <CountdownTimer 
                          endTime={product.end_time} 
                          onEnd={() => setIsEnded(true)}
                        />
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>
                        {product.bids?.length || 0} bid{(product.bids?.length || 0) !== 1 ? 's' : ''}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>Seller: {product.seller?.name}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Ends: {formatDate(product.end_time)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bidding Section */}
            {!isEnded ? (
              <BidForm product={product} onBidPlaced={handleBidPlaced} />
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <h3 className="text-lg font-semibold mb-2">Auction Ended</h3>
                  {product.winner_id ? (
                    <p className="text-muted-foreground">
                      Winner: {product.highest_bidder?.name || 'Unknown'}
                    </p>
                  ) : (
                    <p className="text-muted-foreground">No bids were placed</p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Tabs Section */}
        <div className="mt-12">
          <Tabs defaultValue="bids" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="bids">Bid History</TabsTrigger>
              <TabsTrigger value="details">Product Details</TabsTrigger>
            </TabsList>
            
            <TabsContent value="bids" className="mt-6">
              <BidHistory key={bidHistoryKey} productId={product.id} />
            </TabsContent>
            
            <TabsContent value="details" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Product Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-semibold">Starting Price</p>
                      <p className="text-muted-foreground">{formatPrice(product.starting_price)}</p>
                    </div>
                    {product.reserve_price && (
                      <div>
                        <p className="font-semibold">Reserve Price</p>
                        <p className="text-muted-foreground">{formatPrice(product.reserve_price)}</p>
                      </div>
                    )}
                    <div>
                      <p className="font-semibold">Category</p>
                      <p className="text-muted-foreground">{product.category?.name || 'Uncategorized'}</p>
                    </div>
                    <div>
                      <p className="font-semibold">Listed</p>
                      <p className="text-muted-foreground">{formatDate(product.created_at)}</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="font-semibold mb-2">Description</p>
                    <p className="text-muted-foreground whitespace-pre-wrap">{product.description}</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
