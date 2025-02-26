"use client";
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";

import { Bell } from "lucide-react";
import Link from "next/link";

import { useFcmToken } from "@/hooks/useFcmToken";
import { useRouter } from "next/navigation";

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
    defaultVariants: {
      size: "default",
    },
  }
);

export interface HeaderProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof headerVariants> {
  asChild?: boolean;
  icon?: React.ReactNode;
}

const Header = React.forwardRef<HTMLDivElement, HeaderProps>(
  ({ className, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "div";
    const { icon } = props;
    const { notifications } = useFcmToken();
    const router = useRouter();
    return (
      <Comp className={cn(headerVariants({ className }))} ref={ref} {...props}>
        <div
          className="flex items-center gap-2"
          onClick={() => router.push("/")}
        >
          {icon}
          My Queen App
        </div>
        <Button type="button" variant="outline" size="icon">
          <Link href="/notification">
            <Bell className="text-primary" />
            <span className="absolute -top-1 -right-1 rounded-full bg-primary text-xs text-primary-foreground border border-primary-foreground w-4 h-4 flex items-center justify-center">
              {notifications.length}
            </span>
          </Link>
        </Button>
      </Comp>
    );
  }
);

Header.displayName = "Header";

export { Header, headerVariants };
