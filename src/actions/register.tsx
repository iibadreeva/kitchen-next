"use server";

import { FormDataType } from "@/types/form-data";
import { prisma } from "@/lib/prisma";

export async function registerUser(formData: FormDataType) {
  const { email, password } = formData;

  try {
    const user = await prisma.user.create({
      data: {
        email: email,
        password: password,
      },
    });

    console.log("user", user);
    return user;
  } catch (error) {
    console.error("Ошибка регистрации:", error);
    return { error: "Ошибка при регистрации" };
  }
}
