import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const footerVariants = cva(
  "flex absolute bottom-0 w-full items-center gap-4 text-xs font-bold p-4",
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

export interface FooterProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof footerVariants> {
  asChild?: boolean;
}

const Footer = React.forwardRef<HTMLDivElement, FooterProps>(
  ({ className, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "div";
    return (
      <Comp className={cn(footerVariants({ className }))} ref={ref} {...props}>
        © 2025 My Queen App
      </Comp>
    );
  }
);

Footer.displayName = "Footer";

export { Footer, footerVariants };
