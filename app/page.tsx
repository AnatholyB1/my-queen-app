"use client";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { SendNotification } from "@/backEnd/firebaseNotification";
import { useSession } from "next-auth/react";

export default function Home() {
  const { data: session } = useSession();
  const email = session?.user?.email;

  const { mutate: server_SendNotification } = useMutation({
    mutationFn: SendNotification,
  });

  if (!email) {
    return <div>loading...</div>;
  }
  const body = {
    user: email,
    title: "New message",
    message: "This is a new message",
    link: "/",
  };

  return (
    <div className="flex justify-center items-center h-screen">
      <Button
        type="button"
        className="rounded-full w-32 h-32 hover:scale-150"
        onClick={() => server_SendNotification(body)}
      >
        Give me attention
      </Button>
    </div>
  );
}
