"use client";
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import Link from "next/link";
import { Bell, LogOut } from "lucide-react";
import { signOut, useSession } from "next-auth/react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useFcmToken } from "@/hooks/useFcmToken";

const headerVariants = cva(
  "flex absolute w-full top-0 items-center justify-between gap-4 text-2xl font-bold p-4 z-10",
  {
    variants: {
      size: {
        default: "h-16",
        sm: "h-12",
        lg: "h-20",
      },
    },
    defaultVariants: { size: "default" },
  },
);

export interface HeaderProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof headerVariants> {
  asChild?: boolean;
  icon?: React.ReactNode;
}

const Header = React.forwardRef<HTMLDivElement, HeaderProps>(
  ({ className, asChild = false, icon, size, ...props }, ref) => {
    const Comp = asChild ? Slot : "header";
    const { notifications } = useFcmToken();
    const { status } = useSession();
    const unreadCount = notifications.length;

    return (
      <Comp
        className={cn(headerVariants({ size, className }))}
        ref={ref}
        {...props}
      >
        <Link
          href="/"
          aria-label="Accueil"
          className="flex items-center gap-2 hover:opacity-90"
        >
          {icon}
          <span>My Queen App</span>
        </Link>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            asChild
            aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} non lues` : ""}`}
          >
            <Link href="/notification" className="relative">
              <Bell className="text-primary" />
              {unreadCount > 0 && (
                <span
                  aria-hidden
                  className="absolute -top-1 -right-1 rounded-full bg-primary text-xs text-primary-foreground border border-primary-foreground w-4 h-4 flex items-center justify-center"
                >
                  {unreadCount}
                </span>
              )}
            </Link>
          </Button>
          {status === "authenticated" && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Se déconnecter"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              <LogOut />
            </Button>
          )}
        </div>
      </Comp>
    );
  },
);

Header.displayName = "Header";

export { Header, headerVariants };
