"use client";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { SendNotification } from "@/backEnd/firebaseNotification";
import { useSession } from "next-auth/react";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";

export default function Home() {
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

  const body = {
    user: email,
    title: "Don't ignore me",
    message: "Donne moi de l'attention tirak ♥️",
    link: "/",
  };

  const Content = () => {
    if (isPending) {
      return <LoaderCircle className="animate-spin !w-full !h-full p-4" />;
    } else {
      return <>Give me attention</>;
    }
  };

  return (
    <div className="flex justify-center items-center h-screen">
      <Button
        type="button"
        className="rounded-full w-32 h-32 transform transition-transform duration-300 active:scale-150"
        onClick={() => server_SendNotification(body)}
      >
        <Content />
      </Button>
    </div>
  );
}
