"use client";

import { useState, useEffect } from "react";
import { BidWithDetails } from "@/lib/types";
import { bidsAPI } from "@/lib/api/bids";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, User, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface BidHistoryProps {
  productId: string;
}

export function BidHistory({ productId }: BidHistoryProps) {
  const [bids, setBids] = useState<BidWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadBids = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await bidsAPI.getProductBids(productId);
        setBids(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load bid history');
        console.error('Error loading bids:', err);
      } finally {
        setLoading(false);
      }
    };

    loadBids();

    // Subscribe to real-time bid updates
    const subscription = bidsAPI.subscribeToProductBids(productId, async () => {
      try {
        const data = await bidsAPI.getProductBids(productId);
        setBids(data);
      } catch (err) {
        console.error('Error refreshing bids:', err);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [productId]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'winning':
        return <Badge variant="default">Winning</Badge>;
      case 'outbid':
        return <Badge variant="secondary">Outbid</Badge>;
      case 'won':
        return <Badge variant="default" className="bg-green-500">Won</Badge>;
      case 'lost':
        return <Badge variant="destructive">Lost</Badge>;
      default:
        return <Badge variant="outline">Active</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Bid History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (bids.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Bid History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No bids have been placed yet.</p>
            <p className="text-sm">Be the first to place a bid!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bid History ({bids.length} bid{bids.length !== 1 ? 's' : ''})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {bids.map((bid, index) => (
            <div
              key={bid.id}
              className={`flex items-center justify-between p-4 border rounded-lg ${
                bid.status === 'winning' ? 'bg-primary/5 border-primary/20' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    {bid.user?.name || 'Anonymous'}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(bid.created_at), { addSuffix: true })}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="font-semibold text-lg">
                    {formatPrice(bid.bid_amount)}
                  </div>
                  {index === 0 && (
                    <div className="text-xs text-muted-foreground">
                      Highest bid
                    </div>
                  )}
                </div>
                {getStatusBadge(bid.status)}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
