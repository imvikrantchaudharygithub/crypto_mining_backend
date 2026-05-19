import crypto from 'crypto';

interface ResetEntry {
  tokenHash: string;
  userId: string;
  expiresAt: number;
}

const store: Record<string, ResetEntry> = {};

export const issueResetToken = async (userId: string): Promise<string> => {
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  store[tokenHash] = { tokenHash, userId, expiresAt: Date.now() + 60 * 60 * 1000 }; // 1h
  return token;
};

export const consumeResetToken = async (token: string): Promise<string | null> => {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const entry = store[tokenHash];
  if (!entry || entry.expiresAt < Date.now()) return null;
  delete store[tokenHash];
  return entry.userId;
};
