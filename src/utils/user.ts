import { prisma } from "@/lib/prisma";

/** Только поля, нужные для проверки credentials — без лишних данных пользователя. */
export async function getUserFromDb(email: string) {
  return prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      password: true,
    },
  });
}
