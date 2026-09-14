import { handlers } from "@/auth/auth";

// GET используется для получения сессии, gvt токена и статуса аутентификации
// POST используется для входа-выхода и обновления сессии
export const { GET, POST } = handlers;
