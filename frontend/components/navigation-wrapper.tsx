"use client";

import { usePathname } from "next/navigation";
import { Navigation } from "./navigation";
import Link from "next/link";
import { AuthButtonClient } from "./auth-button-client";

export function NavigationWrapper() {
  const pathname = usePathname();

  const isAuthPage = pathname.startsWith("/auth");

  if (isAuthPage) {
    return (
      <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16 sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="w-full max-w-7xl flex justify-between items-center p-3 px-5 text-sm">
          <div className="flex gap-5 items-center font-semibold">
            <Link href={"/"} className="text-xl font-bold">
              Auction App
            </Link>
          </div>
        </div>
      </nav>
    );
  }

  return <Navigation />;
}
