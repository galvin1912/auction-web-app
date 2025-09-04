"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/hooks/use-auth";
import { ProductWithDetails, UserBiddingHistory } from "@/lib/types";
import { productsAPI } from "@/lib/api/products";
import { bidsAPI } from "@/lib/api/bids";
import { watchlistAPI } from "@/lib/api/watchlist";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductCard } from "@/components/product-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Package, Gavel, Heart, Trophy, Clock } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export function UserProfile() {
  const { user } = useAuth();
  const [myProducts, setMyProducts] = useState<ProductWithDetails[]>([]);
  const [biddingHistory, setBiddingHistory] = useState<UserBiddingHistory[]>([]);
  const [watchlist, setWatchlist] = useState<ProductWithDetails[]>([]);
  const [wonProducts, setWonProducts] = useState<ProductWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUserData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const [products, bids, watchlistData, won] = await Promise.all([
        productsAPI.getUserProducts(user.id),
        bidsAPI.getUserBids(user.id),
        watchlistAPI.getWatchlist(user.id),
        productsAPI.getWonProducts(user.id),
      ]);

      setMyProducts(products);
      setBiddingHistory(bids);
      setWatchlist(watchlistData);
      setWonProducts(won);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile data');
      console.error('Error loading user data:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user, loadUserData]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'winning':
        return <span className="text-green-600 font-semibold">Winning</span>;
      case 'outbid':
        return <span className="text-red-600">Outbid</span>;
      case 'won':
        return <span className="text-green-600 font-semibold">Won</span>;
      case 'lost':
        return <span className="text-gray-600">Lost</span>;
      default:
        return <span className="text-blue-600">Active</span>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Profile</h1>
          <p className="text-muted-foreground">
            Manage your auctions, bids, and watchlist
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Package className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">My Auctions</p>
                  <p className="text-2xl font-bold">{myProducts.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Gavel className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Bids</p>
                  <p className="text-2xl font-bold">{biddingHistory.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Trophy className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Won Auctions</p>
                  <p className="text-2xl font-bold">{wonProducts.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Heart className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Watchlist</p>
                  <p className="text-2xl font-bold">{watchlist.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="auctions" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="auctions">My Auctions</TabsTrigger>
            <TabsTrigger value="bids">Bidding History</TabsTrigger>
            <TabsTrigger value="watchlist">Watchlist</TabsTrigger>
            <TabsTrigger value="won">Won Items</TabsTrigger>
          </TabsList>

          {/* My Auctions */}
          <TabsContent value="auctions" className="mt-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">My Auctions</h2>
              <Button asChild>
                <Link href="/create">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Auction
                </Link>
              </Button>
            </div>

            {myProducts.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No auctions yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first auction to start selling items.
                  </p>
                  <Button asChild>
                    <Link href="/create">Create Auction</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {myProducts.map((product) => (
                  <ProductCard key={product.id} product={product} showWatchlistButton={false} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Bidding History */}
          <TabsContent value="bids" className="mt-6">
            <h2 className="text-xl font-semibold mb-6">Bidding History</h2>

            {biddingHistory.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Gavel className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No bids yet</h3>
                  <p className="text-muted-foreground">
                    Start bidding on auctions to see your history here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {biddingHistory.map((bid) => (
                  <Card key={bid.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1">
                            {bid.product_title}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>Bid: {formatPrice(bid.bid_amount)}</span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {formatDistanceToNow(new Date(bid.created_at), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold">
                            {formatPrice(bid.bid_amount)}
                          </div>
                          <div className="text-sm">
                            {getStatusBadge(bid.final_status)}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Watchlist */}
          <TabsContent value="watchlist" className="mt-6">
            <h2 className="text-xl font-semibold mb-6">Watchlist</h2>

            {watchlist.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No items in watchlist</h3>
                  <p className="text-muted-foreground">
                    Add items to your watchlist to track them easily.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {watchlist.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Won Items */}
          <TabsContent value="won" className="mt-6">
            <h2 className="text-xl font-semibold mb-6">Won Items</h2>

            {wonProducts.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No won items yet</h3>
                  <p className="text-muted-foreground">
                    Win auctions to see your items here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {wonProducts.map((product) => (
                  <ProductCard key={product.id} product={product} showWatchlistButton={false} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
