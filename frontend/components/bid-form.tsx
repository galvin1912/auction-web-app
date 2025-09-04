"use client";

import { useState } from "react";
import { useAuth } from "@/lib/hooks/use-auth";
import { ProductWithDetails } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { bidsAPI } from "@/lib/api/bids";
import { AlertCircle, CheckCircle } from "lucide-react";

interface BidFormProps {
  product: ProductWithDetails;
  onBidPlaced?: () => void;
}

export function BidForm({ product, onBidPlaced }: BidFormProps) {
  const { user } = useAuth();
  const [bidAmount, setBidAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError("Please sign in to place a bid");
      return;
    }

    if (user.id === product.seller_id) {
      setError("You cannot bid on your own auction");
      return;
    }

    const amount = parseFloat(bidAmount);
    if (isNaN(amount) || amount <= 0) {
      setError("Please enter a valid bid amount");
      return;
    }

    // Let the API handle validation to ensure we have the most up-to-date highest bid amount

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await bidsAPI.placeBid(product.id, amount, user.id);
      setSuccess(true);
      setBidAmount("");
      onBidPlaced?.();
      
      // Reset success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to place bid");
    } finally {
      setLoading(false);
    }
  };

  const suggestedBids = [
    product.current_price + 1,
    product.current_price + 5,
    product.current_price + 10,
    product.current_price + 25,
  ].filter(bid => bid > product.current_price);

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <h3 className="text-lg font-semibold mb-2">Sign in to Place a Bid</h3>
          <p className="text-muted-foreground mb-4">
            You need to be signed in to participate in this auction.
          </p>
          <Button asChild>
            <a href="/auth/login">Sign In</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (user.id === product.seller_id) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <h3 className="text-lg font-semibold mb-2">Your Auction</h3>
          <p className="text-muted-foreground">
            You cannot bid on your own auction.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Place a Bid</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>Bid placed successfully!</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bidAmount">Bid Amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <Input
                id="bidAmount"
                type="number"
                step="0.01"
                min={product.current_price + 0.01}
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                placeholder={`Minimum: ${formatPrice(product.current_price + 0.01)}`}
                className="pl-8"
                required
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Current highest bid: {formatPrice(product.current_price)}
            </p>
          </div>

          {suggestedBids.length > 0 && (
            <div className="space-y-2">
              <Label>Quick Bid</Label>
              <div className="flex flex-wrap gap-2">
                {suggestedBids.slice(0, 4).map((bid) => (
                  <Button
                    key={bid}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setBidAmount(bid.toString())}
                  >
                    {formatPrice(bid)}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading || !bidAmount}
          >
            {loading ? "Placing Bid..." : "Place Bid"}
          </Button>
        </form>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Bids are final and cannot be withdrawn</p>
          <p>• You will be notified if you are outbid</p>
          <p>• Winner will be determined when the auction ends</p>
        </div>
      </CardContent>
    </Card>
  );
}
