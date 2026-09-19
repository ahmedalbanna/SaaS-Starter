// In-memory token store for password resets (token -> { email, expiresAt })
// In multi-replica prod, store in database or Redis
const resetTokens = new Map<string, { email: string; expiresAt: number }>();

export function storeResetToken(token: string, email: string, ttlMs: number = 60 * 60 * 1000): void {
  resetTokens.set(token, {
    email: email.toLowerCase(),
    expiresAt: Date.now() + ttlMs,
  });
}

export function verifyResetToken(token: string, email: string): boolean {
  const item = resetTokens.get(token);
  if (!item) return false;
  if (item.email.toLowerCase() !== email.toLowerCase()) return false;
  if (Date.now() > item.expiresAt) {
    resetTokens.delete(token);
    return false;
  }
  return true;
}

export function consumeResetToken(token: string): void {
  resetTokens.delete(token);
}
