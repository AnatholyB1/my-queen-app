"use client";
import { Button } from "@/components/ui/button";
import { useFcmToken } from "@/hooks/useFcmToken";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

function formatDate(timestamp: string): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return timestamp;
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
}

export default function NotificationPage() {
  const { notifications, markRead } = useFcmToken();
  const router = useRouter();

  const handleOpen = (id: number, link: string) => {
    markRead(id);
    if (link.startsWith("/") && !link.startsWith("//")) {
      router.push(link);
    }
  };

  const handleClearAll = () => {
    if (notifications.length === 0) return;
    markRead(notifications.map((n) => n.id));
  };

  return (
    <section className="flex flex-col gap-4 pt-20 pb-20 overflow-y-auto items-center h-screen">
      <h2 className="flex items-start w-full justify-between font-sans font-bold text-xl p-4 tracking-tight underline">
        <span>Nouvelles notifications</span>
        <Button
          type="button"
          size="icon"
          aria-label="Marquer toutes comme lues"
          disabled={notifications.length === 0}
          onClick={handleClearAll}
        >
          <Trash2 />
        </Button>
      </h2>
      {notifications.length === 0 ? (
        <p className="text-muted-foreground">Aucune nouvelle notification.</p>
      ) : (
        notifications.map((n) => (
          <Button
            key={n.id}
            variant="outline"
            className="flex-col shadow-md p-4 w-auto h-auto gap-1"
            onClick={() => handleOpen(n.id, n.link)}
          >
            <h1 className="text-lg font-bold w-full text-start">{n.title} :</h1>
            <p className="flex flex-col text-start w-full">
              <span>{n.message}</span>
              <span className="text-xs text-muted-foreground">
                {formatDate(n.timestamp)}
              </span>
            </p>
          </Button>
        ))
      )}
    </section>
  );
}
