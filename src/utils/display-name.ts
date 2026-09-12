/** Имя для UI: name, иначе локальная часть email до @. */
export function getUserDisplayName(user: {
  name?: string | null;
  email?: string | null;
}): string {
  const name = user.name?.trim();
  if (name) return name;

  const email = user.email?.trim();
  if (!email) return "";

  return email.split("@")[0] ?? "";
}
