import { Request, Response } from 'express';
import NavLink from '../models/navLink.model';

export const createNavLink = async (req: Request, res: Response): Promise<void> => {
  try {
    const link = await NavLink.create(req.body);
    res.status(201).json({ success: true, message: 'Nav link created', link });
  } catch (error) {
    console.error('Error in createNavLink:', error);
    res.status(500).json({ success: false, message: 'Failed to create nav link', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const getNavLinks = async (req: Request, res: Response): Promise<void> => {
  try {
    const filter: any = { status: 'active' };
    if (req.query.group) filter.group = req.query.group;
    const links = await NavLink.find(filter).sort({ sortOrder: 1 });
    res.status(200).json({ success: true, links });
  } catch (error) {
    console.error('Error in getNavLinks:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch nav links', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const updateNavLink = async (req: Request, res: Response): Promise<void> => {
  try {
    const link = await NavLink.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    if (!link) { res.status(404).json({ message: 'Nav link not found' }); return; }
    res.status(200).json({ success: true, message: 'Nav link updated', link });
  } catch (error) {
    console.error('Error in updateNavLink:', error);
    res.status(500).json({ success: false, message: 'Failed to update nav link', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const deleteNavLink = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.body;
    const link = await NavLink.findByIdAndDelete(id);
    if (!link) { res.status(404).json({ message: 'Nav link not found' }); return; }
    res.status(200).json({ success: true, message: 'Nav link deleted' });
  } catch (error) {
    console.error('Error in deleteNavLink:', error);
    res.status(500).json({ success: false, message: 'Failed to delete nav link', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const reorderNavLinks = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ids } = req.body as { ids: string[] };
    await Promise.all(ids.map((id, index) => NavLink.findByIdAndUpdate(id, { sortOrder: index })));
    res.status(200).json({ success: true, message: 'Nav links reordered' });
  } catch (error) {
    console.error('Error in reorderNavLinks:', error);
    res.status(500).json({ success: false, message: 'Failed to reorder nav links', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};
