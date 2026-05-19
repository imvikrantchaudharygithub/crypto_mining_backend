import { Request, Response } from 'express';
import Plan from '../models/plan.model';

export const createPlan = async (req: Request, res: Response): Promise<void> => {
  try {
    const plan = await Plan.create(req.body);
    res.status(201).json({ success: true, message: 'Plan created', plan });
  } catch (error) {
    console.error('Error in createPlan:', error);
    res.status(500).json({ success: false, message: 'Failed to create plan', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const getAllPlans = async (_req: Request, res: Response): Promise<void> => {
  try {
    const plans = await Plan.find({ status: 'active' }).sort({ sortOrder: 1 });
    res.status(200).json({ success: true, plans });
  } catch (error) {
    console.error('Error in getAllPlans:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch plans', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const getPlanBySlug = async (req: Request, res: Response): Promise<void> => {
  try {
    const plan = await Plan.findOne({ slug: req.params.slug, status: 'active' });
    if (!plan) { res.status(404).json({ message: 'Plan not found' }); return; }
    res.status(200).json({ success: true, plan });
  } catch (error) {
    console.error('Error in getPlanBySlug:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch plan', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const updatePlan = async (req: Request, res: Response): Promise<void> => {
  try {
    const plan = await Plan.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    if (!plan) { res.status(404).json({ message: 'Plan not found' }); return; }
    res.status(200).json({ success: true, message: 'Plan updated', plan });
  } catch (error) {
    console.error('Error in updatePlan:', error);
    res.status(500).json({ success: false, message: 'Failed to update plan', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const deletePlan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.body;
    const plan = await Plan.findByIdAndDelete(id);
    if (!plan) { res.status(404).json({ message: 'Plan not found' }); return; }
    res.status(200).json({ success: true, message: 'Plan deleted' });
  } catch (error) {
    console.error('Error in deletePlan:', error);
    res.status(500).json({ success: false, message: 'Failed to delete plan', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const reorderPlans = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ids } = req.body as { ids: string[] };
    await Promise.all(ids.map((id, index) => Plan.findByIdAndUpdate(id, { sortOrder: index })));
    res.status(200).json({ success: true, message: 'Plans reordered' });
  } catch (error) {
    console.error('Error in reorderPlans:', error);
    res.status(500).json({ success: false, message: 'Failed to reorder plans', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};
