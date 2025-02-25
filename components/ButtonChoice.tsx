import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { SendNotification } from "@/backEnd/firebaseNotification";
import { useMutation } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { ButtonData } from "@/types";

const buttonChoiceVariants = cva(
  "flex w-full items-center text-xs font-bold p-4",
  {
    variants: {
      size: {
        default: "h-auto",
        sm: "h-12",
        lg: "h-20",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
);

export interface ButtonChoiceProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof buttonChoiceVariants> {
  asChild?: boolean;
  buttonData: ButtonData[];
}

const ButtonChoice = React.forwardRef<HTMLDivElement, ButtonChoiceProps>(
  ({ className, buttonData, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "div";

    const { data: session } = useSession();
    const email = session?.user?.email;

    const { mutate: server_SendNotification, isPending } = useMutation({
      mutationFn: SendNotification,
      onSuccess: (success) => {
        if (success) {
          toast.success("Notification sent");
        } else {
          toast.error("Notification failed");
        }
      },
      onError: () => {
        toast.error("Notification failed");
      },
    });

    if (!email) {
      return <div>loading...</div>;
    }

    const getBody = (data: ButtonData) => {
      return {
        user: email,
        title: data.title,
        message: data.message,
        link: data.link,
      };
    };

    const getText = (data: ButtonData) => {
      return data.text;
    };

    const Content: React.FC<ButtonData> = (data) => {
      if (isPending) {
        return <LoaderCircle className="animate-spin !w-full !h-full p-4" />;
      } else {
        return <>{getText(data)}</>;
      }
    };

    return (
      <Comp
        className={cn(buttonChoiceVariants({ className }))}
        ref={ref}
        {...props}
      >
        <Carousel className="flex items-center justify-center w-full">
          <CarouselContent className="">
            {Array.from(buttonData).map((_, index) => (
              <CarouselItem
                className="flex items-center justify-center"
                key={index}
              >
                <Button
                  type="button"
                  className="rounded-full m-9 w-32 h-32 transform transition-transform duration-300 active:scale-150"
                  onClick={() => server_SendNotification(getBody(_))}
                >
                  <Content {..._} />
                </Button>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-0" />
          <CarouselNext className="right-0" />
        </Carousel>
      </Comp>
    );
  }
);

ButtonChoice.displayName = "ButtonChoice";

export { ButtonChoice, buttonChoiceVariants };
