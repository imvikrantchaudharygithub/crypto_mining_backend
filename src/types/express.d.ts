declare global {
  namespace Express {
    interface Request {
      userId?: string | number;
      user?: { _id: string; role: 'super-admin' | 'editor' | 'support' };
      rawBody?: Buffer;
    }
  }
}
export {};
