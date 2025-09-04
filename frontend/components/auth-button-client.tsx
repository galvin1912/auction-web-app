"use client";

import Link from "next/link";
import { Button } from "./ui/button";
import { useAuth } from "@/lib/hooks/use-auth";
import { LogoutButton } from "./logout-button";
import { NotificationDropdown } from "./notification-dropdown";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { User, Plus, Settings } from "lucide-react";

export function AuthButtonClient() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex gap-2">
        <Button size="sm" variant="outline" disabled>
          Loading...
        </Button>
      </div>
    );
  }

  return user ? (
    <div className="flex items-center gap-2">
      <NotificationDropdown />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <User className="h-4 w-4 mr-2" />
            {user.email}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem asChild>
            <Link href="/profile" className="flex items-center">
              <Settings className="h-4 w-4 mr-2" />
              My Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/create" className="flex items-center">
              <Plus className="h-4 w-4 mr-2" />
              Create Auction
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <LogoutButton />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  ) : (
    <div className="flex gap-2">
      <Button asChild size="sm" variant={"outline"}>
        <Link href="/auth/login">Sign in</Link>
      </Button>
      <Button asChild size="sm" variant={"default"}>
        <Link href="/auth/sign-up">Sign up</Link>
      </Button>
    </div>
  );
}
