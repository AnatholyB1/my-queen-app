"use client";
import { Button } from "@/components/ui/button";
import { useFcmToken } from "@/hooks/useFcmToken";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export default function Notification() {
  const { notifications, server_ChangeReadStateNotification } = useFcmToken();
  const router = useRouter();

  const buttonHandlerOne = (id: number, link: string) => {
    server_ChangeReadStateNotification(id);
    router.push(link);
  };

  const buttonHandlerMultiple = () => {
    const ids = notifications.map((notification) => notification.id);
    server_ChangeReadStateNotification(ids);
  };

  return (
    <section className="flex flex-col gap-4 pt-20 pb-20 overflow-y-auto items-center h-screen">
      <h2 className="flex items-start w-full justify-between font-sans font-bold text-xl p-4 font-stretch-condensed tracking-tight underline">
        <span>Nouvelles notifications</span>
        <Button type="button" size="icon" onClick={buttonHandlerMultiple}>
          <Trash2 />
        </Button>
      </h2>
      {notifications.map((notification) => (
        <Button
          onClick={() => buttonHandlerOne(notification.id, notification.link)}
          variant={"outline"}
          key={notification.id}
          className="flex-col shadow-md p-4 w-auto h-auto gap-1"
        >
          <h1 className="text-lg font-bold w-full text-start">
            {notification.title} :
          </h1>
          <p>{notification.message}</p>
        </Button>
      ))}
    </section>
  );
}
