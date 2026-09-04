// Emails com acesso liberado (tiragens ILIMITADAS): pulam o paywall (3 grátis)
// e também o limite diário do servidor (5/dia do premium). Para virar VIP, a
// pessoa precisa estar LOGADA com um destes emails.
//
// Para liberar mais alguém, basta adicionar o email nesta lista (em minúsculas).
export const VIP_EMAILS: string[] = [
  'renovabio520@gmail.com',
];

export function isVipEmail(email?: string | null): boolean {
  if (!email) return false;
  return VIP_EMAILS.includes(email.trim().toLowerCase());
}
