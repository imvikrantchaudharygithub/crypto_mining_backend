import { Request, Response } from 'express';
import Team from '../models/team.model';
import { uploadCloudinary } from '../services/cloudinaryService';

function coerceBody(raw: Record<string, any>): Record<string, any> {
  const body: Record<string, any> = { ...raw };
  if (typeof body.sortOrder === 'string') body.sortOrder = Number(body.sortOrder) || 0;
  return body;
}

export const createTeamMember = async (req: Request, res: Response): Promise<void> => {
  try {
    const file = req.file as Express.Multer.File | undefined;
    let avatar = '';
    if (file) {
      const result: any = await uploadCloudinary(file, 'crypto-mining/team');
      avatar = result.secure_url;
    }
    const body = coerceBody(req.body);
    const member = await Team.create({ ...body, avatar: avatar || body.avatar || '' });
    res.status(201).json({ success: true, message: 'Team member created', member });
  } catch (error) {
    console.error('Error in createTeamMember:', error);
    res.status(500).json({ success: false, message: 'Failed to create team member', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const getAllTeamMembers = async (req: Request, res: Response): Promise<void> => {
  try {
    const filter: any = {};
    if (req.query.status && req.query.status !== 'all') filter.status = req.query.status;
    else if (!req.query.status) filter.status = 'active';
    const team = await Team.find(filter).sort({ sortOrder: 1, createdAt: 1 });
    res.status(200).json({ success: true, team });
  } catch (error) {
    console.error('Error in getAllTeamMembers:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch team', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const updateTeamMember = async (req: Request, res: Response): Promise<void> => {
  try {
    const file = req.file as Express.Multer.File | undefined;
    const update: any = coerceBody(req.body);
    if (file) {
      const result: any = await uploadCloudinary(file, 'crypto-mining/team');
      update.avatar = result.secure_url;
    }
    const member = await Team.findByIdAndUpdate(req.params.id, { $set: update }, { new: true, runValidators: true });
    if (!member) { res.status(404).json({ message: 'Team member not found' }); return; }
    res.status(200).json({ success: true, message: 'Team member updated', member });
  } catch (error) {
    console.error('Error in updateTeamMember:', error);
    res.status(500).json({ success: false, message: 'Failed to update team member', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const deleteTeamMember = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.body;
    const member = await Team.findByIdAndDelete(id);
    if (!member) { res.status(404).json({ message: 'Team member not found' }); return; }
    res.status(200).json({ success: true, message: 'Team member deleted' });
  } catch (error) {
    console.error('Error in deleteTeamMember:', error);
    res.status(500).json({ success: false, message: 'Failed to delete team member', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const reorderTeamMembers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ids } = req.body as { ids: string[] };
    await Promise.all(ids.map((id, index) => Team.findByIdAndUpdate(id, { sortOrder: index })));
    res.status(200).json({ success: true, message: 'Team reordered' });
  } catch (error) {
    console.error('Error in reorderTeamMembers:', error);
    res.status(500).json({ success: false, message: 'Failed to reorder team', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};
