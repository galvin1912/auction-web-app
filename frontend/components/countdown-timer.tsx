"use client";

import { useState, useEffect } from "react";

interface CountdownTimerProps {
  endTime: string;
  onEnd?: () => void;
}

export function CountdownTimer({ endTime, onEnd }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const end = new Date(endTime);
      const now = new Date();
      const difference = end.getTime() - now.getTime();

      if (difference <= 0) {
        setTimeLeft(null);
        onEnd?.();
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [endTime, onEnd]);

  if (!timeLeft) {
    return <span>Ended</span>;
  }

  const { days, hours, minutes, seconds } = timeLeft;

  if (days > 0) {
    return (
      <span>
        {days}d {hours}h {minutes}m
      </span>
    );
  }

  if (hours > 0) {
    return (
      <span>
        {hours}h {minutes}m {seconds}s
      </span>
    );
  }

  if (minutes > 0) {
    return (
      <span>
        {minutes}m {seconds}s
      </span>
    );
  }

  return (
    <span className="text-red-500 font-semibold">
      {seconds}s
    </span>
  );
}
