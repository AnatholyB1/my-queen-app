import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";

import { Bell } from "lucide-react";

const headerVariants = cva(
  "flex absolute w-full top-0 items-center justify-between gap-4 text-2xl font-bold p-4",
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
    return (
      <Comp className={cn(headerVariants({ className }))} ref={ref} {...props}>
        <div className="flex items-center gap-2">
          {icon}
          My Queen App
        </div>
        <Button type="button" variant="outline" size="icon">
          <Bell className="text-primary" />
        </Button>
      </Comp>
    );
  }
);

Header.displayName = "Header";

export { Header, headerVariants };
