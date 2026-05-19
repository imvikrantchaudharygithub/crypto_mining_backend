import { Request, Response } from 'express';
import Lead from '../models/lead.model';
import { sendLeadNotification } from '../services/mailService';

export const createLead = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !subject || !message) {
      res.status(400).json({ message: 'Name, email, subject, and message are required' });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) { res.status(400).json({ message: 'Invalid email address' }); return; }

    const lead = await Lead.create({
      ...req.body,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    sendLeadNotification(lead).catch((err) => console.error('Lead notification failed:', err));

    res.status(201).json({ success: true, message: 'Your message has been received. We will be in touch shortly.' });
  } catch (error) {
    console.error('Error in createLead:', error);
    res.status(500).json({ success: false, message: 'Failed to submit enquiry', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const getLeads = async (req: Request, res: Response): Promise<void> => {
  try {
    const filter: any = {};
    if (req.query.status) filter.status = req.query.status;
    const leads = await Lead.find(filter).populate('assignedTo', 'name email').sort({ createdAt: -1 });
    res.status(200).json({ success: true, leads });
  } catch (error) {
    console.error('Error in getLeads:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch leads', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const getLeadById = async (req: Request, res: Response): Promise<void> => {
  try {
    const lead = await Lead.findById(req.params.id).populate('assignedTo', 'name email').populate('notes.author', 'name');
    if (!lead) { res.status(404).json({ message: 'Lead not found' }); return; }
    res.status(200).json({ success: true, lead });
  } catch (error) {
    console.error('Error in getLeadById:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch lead', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const updateLead = async (req: Request, res: Response): Promise<void> => {
  try {
    const lead = await Lead.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    if (!lead) { res.status(404).json({ message: 'Lead not found' }); return; }
    res.status(200).json({ success: true, message: 'Lead updated', lead });
  } catch (error) {
    console.error('Error in updateLead:', error);
    res.status(500).json({ success: false, message: 'Failed to update lead', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const addLeadNote = async (req: Request, res: Response): Promise<void> => {
  try {
    const { leadId, body } = req.body;
    const lead = await Lead.findByIdAndUpdate(
      leadId,
      { $push: { notes: { author: req.user?._id, body, at: new Date() } } },
      { new: true }
    );
    if (!lead) { res.status(404).json({ message: 'Lead not found' }); return; }
    res.status(200).json({ success: true, message: 'Note added', lead });
  } catch (error) {
    console.error('Error in addLeadNote:', error);
    res.status(500).json({ success: false, message: 'Failed to add note', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const deleteLead = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.body;
    const lead = await Lead.findByIdAndDelete(id);
    if (!lead) { res.status(404).json({ message: 'Lead not found' }); return; }
    res.status(200).json({ success: true, message: 'Lead deleted' });
  } catch (error) {
    console.error('Error in deleteLead:', error);
    res.status(500).json({ success: false, message: 'Failed to delete lead', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};
