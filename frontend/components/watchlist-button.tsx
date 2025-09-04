"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { watchlistAPI } from "@/lib/api/watchlist";
import { Heart } from "lucide-react";

interface WatchlistButtonProps {
  productId: string;
  className?: string;
}

export function WatchlistButton({ productId, className }: WatchlistButtonProps) {
  const { user } = useAuth();
  const [isWatched, setIsWatched] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      const checkWatchlistStatus = async () => {
        try {
          const inWatchlist = await watchlistAPI.isInWatchlist(productId, user.id);
          setIsWatched(inWatchlist);
        } catch (error) {
          console.error('Failed to check watchlist status:', error);
        }
      };

      checkWatchlistStatus();
    }
  }, [user, productId]);

  const handleToggle = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const newStatus = await watchlistAPI.toggleWatchlist(productId, user.id);
      setIsWatched(newStatus);
    } catch (error) {
      console.error('Failed to toggle watchlist:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleToggle}
      disabled={loading}
      className={className}
    >
      <Heart 
        className={`h-4 w-4 mr-2 ${isWatched ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} 
      />
      {isWatched ? 'Watching' : 'Watch'}
    </Button>
  );
}
