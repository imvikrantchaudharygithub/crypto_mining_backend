import { Request, Response } from 'express';
import Ticket from '../models/ticket.model';
import { mintTicketId } from '../services/ticketIdService';
import { sendTicketConfirmation, sendTicketStatusUpdate } from '../services/mailService';

export const createTicket = async (req: Request, res: Response): Promise<void> => {
  try {
    const { customer, issueType, description } = req.body;
    if (!customer?.name || !customer?.email || !issueType || !description) {
      res.status(400).json({ message: 'customer.name, customer.email, issueType, and description are required' });
      return;
    }

    const ticketId = await mintTicketId();
    const ticket = await Ticket.create({ ...req.body, ticketId });

    sendTicketConfirmation(ticket).catch((err) => console.error('Ticket confirmation email failed:', err));

    res.status(201).json({ success: true, message: 'Ticket submitted', ticketId });
  } catch (error) {
    console.error('Error in createTicket:', error);
    res.status(500).json({ success: false, message: 'Failed to create ticket', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const getTicketById = async (req: Request, res: Response): Promise<void> => {
  try {
    const ticket = await Ticket.findOne({ ticketId: req.params.ticketId }).select('-assignedTo -__v');
    if (!ticket) { res.status(404).json({ message: 'Ticket not found' }); return; }
    res.status(200).json({ success: true, ticket });
  } catch (error) {
    console.error('Error in getTicketById:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch ticket', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const getTickets = async (req: Request, res: Response): Promise<void> => {
  try {
    const filter: any = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.priority) filter.priority = req.query.priority;
    const tickets = await Ticket.find(filter).populate('assignedTo', 'name email').sort({ createdAt: -1 });
    res.status(200).json({ success: true, tickets });
  } catch (error) {
    console.error('Error in getTickets:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch tickets', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const getTicketByIdAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const ticket = await Ticket.findById(req.params.id).populate('assignedTo', 'name email').populate('steps.addedBy', 'name');
    if (!ticket) { res.status(404).json({ message: 'Ticket not found' }); return; }
    res.status(200).json({ success: true, ticket });
  } catch (error) {
    console.error('Error in getTicketByIdAdmin:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch ticket', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const updateTicket = async (req: Request, res: Response): Promise<void> => {
  try {
    const prev = await Ticket.findById(req.params.id);
    const ticket = await Ticket.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    if (!ticket) { res.status(404).json({ message: 'Ticket not found' }); return; }

    if (prev?.status !== ticket.status) {
      sendTicketStatusUpdate(ticket).catch((err) => console.error('Status update email failed:', err));
    }

    res.status(200).json({ success: true, message: 'Ticket updated', ticket });
  } catch (error) {
    console.error('Error in updateTicket:', error);
    res.status(500).json({ success: false, message: 'Failed to update ticket', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const addTicketStep = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ticketId, step } = req.body;
    const ticket = await Ticket.findByIdAndUpdate(
      ticketId,
      { $push: { steps: { ...step, addedBy: req.user?._id, occurredAt: new Date() } } },
      { new: true }
    );
    if (!ticket) { res.status(404).json({ message: 'Ticket not found' }); return; }
    res.status(200).json({ success: true, message: 'Step added', ticket });
  } catch (error) {
    console.error('Error in addTicketStep:', error);
    res.status(500).json({ success: false, message: 'Failed to add step', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const updateTicketStep = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ticketId, stepId, update } = req.body;
    const ticket = await Ticket.findOneAndUpdate(
      { _id: ticketId, 'steps._id': stepId },
      { $set: { 'steps.$': { ...update, _id: stepId } } },
      { new: true }
    );
    if (!ticket) { res.status(404).json({ message: 'Ticket or step not found' }); return; }
    res.status(200).json({ success: true, message: 'Step updated', ticket });
  } catch (error) {
    console.error('Error in updateTicketStep:', error);
    res.status(500).json({ success: false, message: 'Failed to update step', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const deleteTicketStep = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ticketId, stepId } = req.body;
    const ticket = await Ticket.findByIdAndUpdate(
      ticketId,
      { $pull: { steps: { _id: stepId } } },
      { new: true }
    );
    if (!ticket) { res.status(404).json({ message: 'Ticket not found' }); return; }
    res.status(200).json({ success: true, message: 'Step removed', ticket });
  } catch (error) {
    console.error('Error in deleteTicketStep:', error);
    res.status(500).json({ success: false, message: 'Failed to remove step', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};
