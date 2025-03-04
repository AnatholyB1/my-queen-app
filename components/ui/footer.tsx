import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { House, Clapperboard, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Button } from "./button";

function Menu() {
  const MenuList = [
    {
      name: "Stats",
      icon: <Activity />,
      link: "/stats",
    },
    {
      name: "Home",
      icon: <House />,
      link: "/",
    },
    {
      name: "Activity",
      icon: <Clapperboard />,
      link: "/movie",
    },
  ];

  return (
    <div className="flex flex-row items-center justify-around w-full">
      {MenuList.map((item, index) => (
        <div key={index} className="flex flex-col items-center justify-center ">
          <Button
            type="button"
            variant="default"
            size="icon"
            className="shadow-none"
          >
            <Link
              href={item.link}
              className="flex flex-col items-center justify-center"
            >
              {item.icon}
              <span>{item.name}</span>
            </Link>
          </Button>
        </div>
      ))}
    </div>
  );
}

const footerVariants = cva(
  "flex absolute z-10 bottom-0 w-full items-center gap-4 text-xs font-bold p-4",
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
        <Menu />
      </Comp>
    );
  }
);

Footer.displayName = "Footer";

export { Footer, footerVariants };
