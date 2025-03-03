"use client";

import {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  createContext,
  useLayoutEffect,
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
  ChangeReadState,
  CreateNotification,
  GetAllNotification,
  GetUnreadNotification,
} from "@/backEnd/notification";
import {
  UseMutateFunction,
  useMutation,
  useQuery,
} from "@tanstack/react-query";
import { NotificationType } from "@/app/db/schema";

type FcmContextType = {
  notificationPermissionStatus: NotificationPermission | null;
  token: string | null;
  notifications: NotificationType[];
  server_ChangeReadStateNotification: UseMutateFunction<
    | { success: boolean; error?: undefined }
    | { success: boolean; error: unknown },
    Error,
    number | number[],
    unknown
  >;
  allNotifications: NotificationType[] | undefined;
};

const FcmContext = createContext({} as FcmContextType);

export const useFcmToken = () => {
  const context = useContext(FcmContext);
  if (!context) {
    throw new Error("useFcmToken must be used within a FcmTokenProvider");
  }
  return context;
};

async function getNotificationPermissionAndToken() {
  // Step 1: Check if Notifications are supported in the browser.
  if (!("Notification" in window)) {
    console.info("This browser does not support desktop notification");
    return null;
  }

  // Step 2: Check if permission is already granted.
  if (Notification.permission === "granted") {
    return await fetchToken();
  }

  // Step 3: If permission is not denied, request permission from the user.
  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      return await fetchToken();
    }
  }

  console.log("Notification permission not granted.");
  return null;
}

export const FcmTokenProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { data: session } = useSession();
  const email = session?.user?.email;
  const router = useRouter(); // Initialize the router for navigation.
  const [notificationPermissionStatus, setNotificationPermissionStatus] =
    useState<NotificationPermission | null>(null); // State to store the notification permission status.
  const [token, setToken] = useState<string | null>(null); // State to store the FCM token.
  const retryLoadToken = useRef(0); // Ref to keep track of retry attempts.
  const isLoading = useRef(false); // Ref to keep track if a token fetch is currently in progress.
  const [notifications, setNotifications] = useState<NotificationType[]>([]);

  const { data: allNotifications, refetch } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const result = await GetAllNotification();
      if (result.success) return result.notifications;
      else return [] as NotificationType[];
    },
  });

  const { mutate: server_CreateNotification } = useMutation({
    mutationFn: CreateNotification,
    onSuccess: (success) => {
      if (!success) return;
      server_GetUnreadNotification(email!);
      refetch();
    },
  });

  const { mutate: server_GetUnreadNotification } = useMutation({
    mutationFn: GetUnreadNotification,
    onSuccess: (data) => {
      if (!data.success) return;
      if (!data.notifications) return;
      setNotifications(data.notifications);
    },
  });

  const { mutate: server_ChangeReadStateNotification } = useMutation({
    mutationFn: ChangeReadState,
    onSuccess: (success) => {
      if (!success) return;
      server_GetUnreadNotification(email!);
    },
  });

  //on mount get unread notifications

  // Call server_GetUnreadNotification once on mount
  useLayoutEffect(() => {
    if (email) {
      server_GetUnreadNotification(email);
    }
  }, [email, server_GetUnreadNotification]);

  const loadToken = useCallback(async () => {
    // Step 4: Prevent multiple fetches if already fetched or in progress.
    if (isLoading.current) return;

    isLoading.current = true; // Mark loading as in progress.
    const token = await getNotificationPermissionAndToken(); // Fetch the token.

    // Step 5: Handle the case where permission is denied.
    if (Notification.permission === "denied") {
      setNotificationPermissionStatus("denied");
      console.info(
        "%cPush Notifications issue - permission denied",
        "color: green; background: #c7c7c7; padding: 8px; font-size: 20px"
      );
      isLoading.current = false;
      return;
    }

    // Step 6: Retry fetching the token if necessary. (up to 3 times)
    // This step is typical initially as the service worker may not be ready/installed yet.
    if (!token) {
      if (retryLoadToken.current >= 3) {
        alert("Unable to load token, refresh the browser");
        console.info(
          "%cPush Notifications issue - unable to load token after 3 retries",
          "color: green; background: #c7c7c7; padding: 8px; font-size: 20px"
        );
        isLoading.current = false;
        return;
      }

      retryLoadToken.current += 1;
      console.error("An error occurred while retrieving token. Retrying...");
      isLoading.current = false;
      await loadToken();
      return;
    }

    // Step 7: Set the fetched token and mark as fetched.
    setNotificationPermissionStatus(Notification.permission);
    setToken(token);

    const subscription = await subscribeToTopic(token); // Subscribe to the topic to receive messages.
    if (!subscription.success) return;

    console.log(`Subscribed to topic with token ${token}`);
    isLoading.current = false;
  }, []);

  useEffect(() => {
    // Step 8: Initialize token loading when the component mounts.
    if ("Notification" in window) {
      loadToken();
    }
  }, [loadToken]);

  const messageListener = useCallback(async () => {
    const m = await messaging();
    if (!m) return;

    if (!token) return;

    // Step 9: Register a listener for incoming FCM messages.
    onMessage(m, async (payload) => {
      if (Notification.permission !== "granted") return;
      //if i'm the one sending the message i don't want to see the notification
      if (!email) return;
      if (payload.data?.user === email) return;

      const link = payload.fcmOptions?.link || payload.data?.link;

      if (!link) return;
      const notification = payload.notification;

      if (!notification) return;
      if (!notification.title || !notification.body) return;

      const bodyToSend = {
        title: notification.title,
        message: notification.body,
        link: link,
        user: email,
      };

      server_CreateNotification(bodyToSend);

      toast.info(`${notification.title}: ${notification.body}`, {
        action: {
          label: "Visit",
          onClick: () => {
            if (link) {
              router.push(link);
            }
          },
        },
      });

      // --------------------------------------------
      // Disable this if you only want toast notifications.
      const n = new Notification(payload.notification?.title || "New message", {
        body: payload.notification?.body || "This is a new message",
        data: link ? { url: link } : undefined,
      });

      // Step 10: Handle notification click event to navigate to a link if present.
      n.onclick = (event) => {
        event.preventDefault();
        const link = (event.target as Notification)?.data?.url;
        if (link) {
          router.push(link);
        } else {
          console.log("No link found in the notification payload");
        }
      };
      // --------------------------------------------
    });
  }, [router, token, email, server_CreateNotification]);

  useEffect(() => {
    // Step 10: Initialize the message listener when the component mounts.
    messageListener();
    return () => {
      // Step 11: Unsubscribe from the FCM message listener when the component unmounts.
      if (token) {
        unsubscribeFromTopic(token);
      }
    };
  }, [token, router, messageListener]);

  const contextValue: FcmContextType = {
    notificationPermissionStatus,
    token,
    notifications,
    server_ChangeReadStateNotification,
    allNotifications,
  };

  return (
    <FcmContext.Provider value={contextValue}>{children}</FcmContext.Provider>
  );
};
