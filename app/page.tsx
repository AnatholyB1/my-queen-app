"use client";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { SendNotification } from "@/backEnd/firebaseNotification";
import useFcmToken from "@/hooks/useFcmToken";

export default function Home() {
  const { token } = useFcmToken();

  const body = {
    token: token || "",
    title: "New message",
    message: "This is a new message",
    link: "/",
  };
  const { mutate: server_SendNotification } = useMutation({
    mutationFn: SendNotification,
  });

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
