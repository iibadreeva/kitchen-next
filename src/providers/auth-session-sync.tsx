"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

import {
  AUTH_SESSION_CHANGED_EVENT,
  resolveSessionMirror,
  useAuthStore,
  type SessionStatus,
} from "@/store/auth.store";

const SESSION_STATUSES: ReadonlySet<string> = new Set([
  "loading",
  "authenticated",
  "unauthenticated",
]);

function toSessionStatus(status: string): SessionStatus {
  if (SESSION_STATUSES.has(status)) {
    return status as SessionStatus;
  }
  return "unauthenticated";
}

export function AuthSessionSync() {
  const router = useRouter();
  const { data, status, update } = useSession();
  const setSession = useAuthStore((s) => s.setSession);

  const userId = data?.user?.id;
  const userName = data?.user?.name;
  const userEmail = data?.user?.email;
  const userImage = data?.user?.image;

  useEffect(() => {
    const { sessionUser, sessionStatus } = resolveSessionMirror(
      toSessionStatus(status),
      {
        id: userId,
        name: userName,
        email: userEmail,
        image: userImage,
      },
    );

    setSession(sessionUser, sessionStatus);
  }, [status, userId, userName, userEmail, userImage, setSession]);

  useEffect(() => {
    const onSessionChanged = () => {
      void (async () => {
        try {
          await update();
        } catch {
          // зеркало всё равно подтянется при следующем тике useSession
        }
        router.refresh();
      })();
    };
    window.addEventListener(AUTH_SESSION_CHANGED_EVENT, onSessionChanged);
    return () => {
      window.removeEventListener(AUTH_SESSION_CHANGED_EVENT, onSessionChanged);
    };
  }, [router, update]);

  return null;
}
