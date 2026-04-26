"use client";
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
import { sendNotification } from "@/backEnd/firebaseNotification";
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
    defaultVariants: { size: "default" },
  },
);

export interface ButtonChoiceProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof buttonChoiceVariants> {
  asChild?: boolean;
  buttonData: ButtonData[];
}

const ButtonChoice = React.forwardRef<HTMLDivElement, ButtonChoiceProps>(
  ({ className, buttonData, asChild = false, size, ...props }, ref) => {
    const Comp = asChild ? Slot : "div";
    const { status } = useSession();
    const isAuthed = status === "authenticated";

    const { mutate: send, isPending } = useMutation({
      mutationFn: sendNotification,
      onSuccess: (res) => {
        if (res.success) toast.success("Notification envoyée");
        else toast.error(res.error.message ?? "Échec de l'envoi");
      },
      onError: () => toast.error("Échec de l'envoi"),
    });

    if (status === "loading") {
      return (
        <div
          role="status"
          aria-label="Chargement"
          className="w-full h-screen flex items-center justify-center"
        >
          <LoaderCircle className="animate-spin" />
        </div>
      );
    }

    if (!isAuthed) return null;

    return (
      <Comp
        className={cn(buttonChoiceVariants({ size, className }))}
        ref={ref}
        {...props}
      >
        <Carousel className="flex items-center justify-center w-full">
          <CarouselContent>
            {buttonData.map((data) => (
              <CarouselItem
                className="flex items-center justify-center"
                key={data.short}
              >
                <Button
                  type="button"
                  className="rounded-full m-9 w-32 h-32"
                  aria-label={data.text}
                  disabled={isPending}
                  onClick={() =>
                    send({
                      title: data.title,
                      message: data.message,
                      link: data.link,
                    })
                  }
                >
                  {isPending ? (
                    <LoaderCircle className="animate-spin !w-full !h-full p-4" />
                  ) : (
                    <span>{data.text}</span>
                  )}
                </Button>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-0" aria-label="Précédent" />
          <CarouselNext className="right-0" aria-label="Suivant" />
        </Carousel>
      </Comp>
    );
  },
);

ButtonChoice.displayName = "ButtonChoice";

export { ButtonChoice, buttonChoiceVariants };
