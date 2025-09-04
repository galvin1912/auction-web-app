import { AuthButtonClient } from "@/components/auth-button-client";
import Link from "next/link";

export function Navigation() {
  return (
    <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16 sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
      <div className="w-full max-w-7xl flex justify-between items-center p-3 px-5 text-sm">
        <div className="flex gap-5 items-center font-semibold">
          <Link href={"/"} className="text-xl font-bold">
            Auction App
          </Link>
          <div className="hidden md:flex gap-4">
            <Link href="/" className="text-sm hover:text-primary transition-colors">
              Auctions
            </Link>
            <Link href="/categories" className="text-sm hover:text-primary transition-colors">
              Categories
            </Link>
            <Link href="/create" className="text-sm hover:text-primary transition-colors">
              Create Auction
            </Link>
            <Link href="/profile" className="text-sm hover:text-primary transition-colors">
              My Profile
            </Link>
          </div>
        </div>
        <AuthButtonClient />
      </div>
    </nav>
  );
}
