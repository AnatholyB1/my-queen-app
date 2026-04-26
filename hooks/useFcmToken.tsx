"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { onMessage } from "firebase/messaging";
import { fetchToken, messaging } from "@/app/firebase";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  subscribeToTopic,
  unsubscribeFromTopic,
} from "@/backEnd/firebaseNotification";
import { useSession } from "next-auth/react";
import {
  getAllNotifications,
  getUnreadNotifications,
  markNotificationRead,
} from "@/backEnd/notification";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { NotificationDto } from "@/backEnd/notification";

type FcmContextType = {
  notificationPermissionStatus: NotificationPermission | null;
  token: string | null;
  notifications: NotificationDto[];
  allNotifications: NotificationDto[];
  markRead: (id: number | number[]) => void;
};

const FcmContext = createContext<FcmContextType | null>(null);

const MAX_TOKEN_RETRIES = 3;

export const useFcmToken = (): FcmContextType => {
  const ctx = useContext(FcmContext);
  if (!ctx) throw new Error("useFcmToken must be used within FcmTokenProvider");
  return ctx;
};

async function requestNotificationPermissionAndToken(): Promise<string | null> {
  if (typeof window === "undefined" || !("Notification" in window)) return null;
  if (Notification.permission === "denied") return null;
  if (Notification.permission !== "granted") {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return null;
  }
  return fetchToken();
}

export const FcmTokenProvider = ({ children }: { children: React.ReactNode }) => {
  const { data: session, status } = useSession();
  const isAuthed = status === "authenticated";
  const email = session?.user?.email ?? null;
  const router = useRouter();

  const [permission, setPermission] = useState<NotificationPermission | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const retries = useRef(0);
  const tokenLoadInFlight = useRef(false);

  const { data: allNotifications = [], refetch: refetchAll } = useQuery({
    queryKey: ["notifications", "all"],
    enabled: isAuthed,
    queryFn: async () => {
      const res = await getAllNotifications();
      return res.success ? res.data : [];
    },
  });

  const { data: unread = [], refetch: refetchUnread } = useQuery({
    queryKey: ["notifications", "unread"],
    enabled: isAuthed,
    queryFn: async () => {
      const res = await getUnreadNotifications();
      return res.success ? res.data : [];
    },
  });

  const { mutate: markReadMutation } = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      refetchUnread();
      refetchAll();
    },
  });

  // Token bootstrap — runs once when the user is authed and Notifications are supported
  useEffect(() => {
    if (!isAuthed) return;
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (token || tokenLoadInFlight.current) return;

    let cancelled = false;
    const load = async () => {
      tokenLoadInFlight.current = true;
      try {
        const t = await requestNotificationPermissionAndToken();
        if (cancelled) return;
        setPermission(Notification.permission);
        if (!t) {
          if (retries.current < MAX_TOKEN_RETRIES) {
            retries.current += 1;
            setTimeout(() => {
              if (!cancelled) {
                tokenLoadInFlight.current = false;
                load();
              }
            }, 1500);
            return;
          }
          return;
        }
        setToken(t);
        const subRes = await subscribeToTopic(t);
        if (!subRes.success) {
          console.warn("Failed to subscribe to FCM topic", subRes.error);
        }
      } finally {
        tokenLoadInFlight.current = false;
      }
    };
    load();

    return () => {
      cancelled = true;
    };
  }, [isAuthed, token]);

  // Cleanup subscription on unmount / sign-out
  useEffect(() => {
    if (!token) return;
    return () => {
      unsubscribeFromTopic(token).catch(() => {
        /* swallow — the user might be offline */
      });
    };
  }, [token]);

  // FCM message listener
  useEffect(() => {
    if (!token || !email) return;
    let unsubscribe: (() => void) | null = null;
    let cancelled = false;

    (async () => {
      const m = await messaging();
      if (!m || cancelled) return;
      unsubscribe = onMessage(m, (payload) => {
        if (Notification.permission !== "granted") return;
        // Don't notify the sender themselves
        if (payload.data?.senderEmail === email) return;

        const link = payload.fcmOptions?.link ?? payload.data?.link ?? null;
        const title = payload.notification?.title ?? "Nouvelle notification";
        const body = payload.notification?.body ?? "";

        refetchUnread();
        refetchAll();

        toast.info(`${title}: ${body}`, {
          action: link
            ? { label: "Ouvrir", onClick: () => router.push(link) }
            : undefined,
        });

        try {
          const n = new Notification(title, {
            body,
            data: link ? { url: link } : undefined,
          });
          n.onclick = (event) => {
            event.preventDefault();
            const url = (event.target as Notification | null)?.data?.url;
            if (url) router.push(url);
          };
        } catch {
          /* Notification API may be restricted by site policy */
        }
      });
    })();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [token, email, refetchUnread, refetchAll, router]);

  const markRead = useCallback(
    (id: number | number[]) => markReadMutation(id),
    [markReadMutation],
  );

  return (
    <FcmContext.Provider
      value={{
        notificationPermissionStatus: permission,
        token,
        notifications: unread,
        allNotifications,
        markRead,
      }}
    >
      {children}
    </FcmContext.Provider>
  );
};
