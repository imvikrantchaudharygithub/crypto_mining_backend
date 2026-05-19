import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/user.model';
import AuditLog from '../models/auditLog.model';
import { env } from '../config/env';
import { issueResetToken, consumeResetToken } from '../services/tokenStore';
import { sendPasswordReset } from '../services/mailService';

export const adminLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) { res.status(400).json({ message: 'Email and password are required' }); return; }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
    if (!user || !user.isActive) { res.status(401).json({ message: 'Invalid credentials' }); return; }

    const valid = await bcrypt.compare(password, user.passwordHash as string);
    if (!valid) { res.status(401).json({ message: 'Invalid credentials' }); return; }

    const token = jwt.sign({ userId: user._id }, env.SECRET_KEY, { expiresIn: env.JWT_EXPIRES_IN as any });

    await User.findByIdAndUpdate(user._id, { lastLoginAt: new Date() });
    await AuditLog.create({ actor: user._id, actorEmail: user.email, action: 'login', entity: 'User', entityId: String(user._id), ip: req.ip, userAgent: req.headers['user-agent'] });

    res.status(200).json({
      success: true,
      token,
      user: { _id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar },
    });
  } catch (error) {
    console.error('Error in adminLogin:', error);
    res.status(500).json({ success: false, message: 'Login failed', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const adminMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById((req as any).userId);
    if (!user || !user.isActive) { res.status(401).json({ message: 'User not found' }); return; }
    res.status(200).json({ success: true, user: { _id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar } });
  } catch (error) {
    console.error('Error in adminMe:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const adminChangePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) { res.status(400).json({ message: 'Both passwords are required' }); return; }

    const user = await User.findById((req as any).userId).select('+passwordHash');
    if (!user) { res.status(404).json({ message: 'User not found' }); return; }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash as string);
    if (!valid) { res.status(401).json({ message: 'Current password is incorrect' }); return; }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();

    res.status(200).json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error in adminChangePassword:', error);
    res.status(500).json({ success: false, message: 'Failed to change password', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const adminForgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email) { res.status(400).json({ message: 'Email is required' }); return; }

    const user = await User.findOne({ email: email.toLowerCase() });
    // Always return 200 to prevent email enumeration
    if (user && user.isActive) {
      const token = await issueResetToken(String(user._id));
      const resetLink = `${process.env.ADMIN_URL || 'http://localhost:3002'}/reset-password/${token}`;
      await sendPasswordReset(user.email as string, resetLink);
    }

    res.status(200).json({ success: true, message: 'If that email exists, a reset link has been sent.' });
  } catch (error) {
    console.error('Error in adminForgotPassword:', error);
    res.status(500).json({ success: false, message: 'Failed to send reset email', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const adminResetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) { res.status(400).json({ message: 'Token and new password are required' }); return; }

    const userId = await consumeResetToken(token);
    if (!userId) { res.status(400).json({ message: 'Invalid or expired reset token' }); return; }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await User.findByIdAndUpdate(userId, { passwordHash });

    res.status(200).json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    console.error('Error in adminResetPassword:', error);
    res.status(500).json({ success: false, message: 'Failed to reset password', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};
