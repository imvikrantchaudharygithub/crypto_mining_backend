import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import User from '../models/user.model';
import { sendAdminInvite } from '../services/mailService';

export const createAdminUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, role } = req.body;
    if (!name || !email) { res.status(400).json({ message: 'Name and email are required' }); return; }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) { res.status(400).json({ message: 'User with this email already exists' }); return; }

    const tempPassword = crypto.randomBytes(8).toString('hex');
    const passwordHash = await bcrypt.hash(tempPassword, 12);
    const user = await User.create({ name, email: email.toLowerCase(), passwordHash, role: role || 'editor' });

    await sendAdminInvite(email, name, tempPassword);

    res.status(201).json({ success: true, message: 'User created and invite sent', user: { _id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    console.error('Error in createAdminUser:', error);
    res.status(500).json({ success: false, message: 'Failed to create user', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const getAdminUsers = async (_req: Request, res: Response): Promise<void> => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, users });
  } catch (error) {
    console.error('Error in getAdminUsers:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch users', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const getAdminUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) { res.status(404).json({ message: 'User not found' }); return; }
    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error('Error in getAdminUserById:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const updateAdminUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    if (!user) { res.status(404).json({ message: 'User not found' }); return; }
    res.status(200).json({ success: true, message: 'User updated', user });
  } catch (error) {
    console.error('Error in updateAdminUser:', error);
    res.status(500).json({ success: false, message: 'Failed to update user', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const deactivateAdminUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.body;
    const user = await User.findByIdAndUpdate(id, { isActive: false }, { new: true });
    if (!user) { res.status(404).json({ message: 'User not found' }); return; }
    res.status(200).json({ success: true, message: 'User deactivated' });
  } catch (error) {
    console.error('Error in deactivateAdminUser:', error);
    res.status(500).json({ success: false, message: 'Failed to deactivate user', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const resendInvite = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.body;
    const user = await User.findById(id);
    if (!user) { res.status(404).json({ message: 'User not found' }); return; }

    const tempPassword = crypto.randomBytes(8).toString('hex');
    const passwordHash = await bcrypt.hash(tempPassword, 12);
    await User.findByIdAndUpdate(id, { passwordHash });
    await sendAdminInvite(user.email as string, user.name as string, tempPassword);

    res.status(200).json({ success: true, message: 'Invite resent' });
  } catch (error) {
    console.error('Error in resendInvite:', error);
    res.status(500).json({ success: false, message: 'Failed to resend invite', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};
