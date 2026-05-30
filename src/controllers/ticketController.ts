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
    const tickets = await Ticket.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ success: true, tickets });
  } catch (error) {
    console.error('Error in getTickets:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch tickets', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const getTicketByIdAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) { res.status(404).json({ message: 'Ticket not found' }); return; }
    res.status(200).json({ success: true, ticket });
  } catch (error) {
    console.error('Error in getTicketByIdAdmin:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch ticket', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

const sanitizeUpdatePayload = (body: any) => {
  const allowed = ['status', 'priority', 'assignedTo', 'eta', 'description', 'issueType', 'customer', 'contractId'];
  const out: Record<string, any> = {};
  for (const k of allowed) {
    if (!(k in body)) continue;
    const v = body[k];
    if (k === 'eta') {
      if (v === '' || v === null || v === undefined) { out.eta = null; continue; }
      const d = new Date(v);
      out.eta = isNaN(d.getTime()) ? null : d;
      continue;
    }
    if (k === 'assignedTo') {
      out.assignedTo = (v === null || v === undefined) ? '' : String(v);
      continue;
    }
    out[k] = v;
  }
  return out;
};

export const updateTicket = async (req: Request, res: Response): Promise<void> => {
  try {
    const update = sanitizeUpdatePayload(req.body);
    const prev = await Ticket.findById(req.params.id);
    if (!prev) { res.status(404).json({ message: 'Ticket not found' }); return; }

    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true, runValidators: true }
    );
    if (!ticket) { res.status(404).json({ message: 'Ticket not found' }); return; }

    if (prev.status !== ticket.status) {
      sendTicketStatusUpdate(ticket).catch((err) => console.error('Status update email failed:', err));
    }

    res.status(200).json({ success: true, message: 'Ticket updated', ticket });
  } catch (error) {
    console.error('Error in updateTicket:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = /validation|cast/i.test(message) ? 400 : 500;
    res.status(status).json({ success: false, message: 'Failed to update ticket', error: message });
  }
};

const normalizeStepPayload = (body: any) => {
  const label = body.label ?? body.step?.label ?? '';
  const desc = body.desc ?? body.description ?? body.step?.desc ?? body.step?.description ?? '';
  const time = body.time ?? body.timestamp ?? body.step?.time ?? body.step?.timestamp ?? '';
  const done = Boolean(body.done ?? body.step?.done ?? false);
  const active = Boolean(body.active ?? body.step?.active ?? false);
  return { label, desc, time, done, active };
};

export const addTicketStep = async (req: Request, res: Response): Promise<void> => {
  try {
    const ticketId = req.body.ticketId;
    if (!ticketId) { res.status(400).json({ message: 'ticketId is required' }); return; }

    const step = normalizeStepPayload(req.body);
    if (!step.label) { res.status(400).json({ message: 'step label is required' }); return; }

    const addedBy = typeof (req as any).user?._id === 'string' ? (req as any).user._id : 'dev';

    const ticket = await Ticket.findByIdAndUpdate(
      ticketId,
      { $push: { steps: { ...step, addedBy, occurredAt: new Date() } } },
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
    const { ticketId } = req.body;
    if (!ticketId) { res.status(400).json({ message: 'ticketId is required' }); return; }

    const stepIndex = typeof req.body.stepIndex === 'number' ? req.body.stepIndex : null;
    const stepId = req.body.stepId ?? req.body.update?._id ?? null;
    const step = normalizeStepPayload(req.body);

    let ticket = null;

    if (stepId) {
      const setObj: Record<string, any> = {
        'steps.$.label': step.label,
        'steps.$.desc': step.desc,
        'steps.$.time': step.time,
        'steps.$.done': step.done,
        'steps.$.active': step.active,
      };
      ticket = await Ticket.findOneAndUpdate(
        { _id: ticketId, 'steps._id': stepId },
        { $set: setObj },
        { new: true }
      );
    } else if (stepIndex !== null && stepIndex >= 0) {
      const setObj: Record<string, any> = {
        [`steps.${stepIndex}.label`]: step.label,
        [`steps.${stepIndex}.desc`]: step.desc,
        [`steps.${stepIndex}.time`]: step.time,
        [`steps.${stepIndex}.done`]: step.done,
        [`steps.${stepIndex}.active`]: step.active,
      };
      ticket = await Ticket.findByIdAndUpdate(
        ticketId,
        { $set: setObj },
        { new: true }
      );
    } else {
      res.status(400).json({ message: 'stepIndex or stepId required' });
      return;
    }

    if (!ticket) { res.status(404).json({ message: 'Ticket or step not found' }); return; }
    res.status(200).json({ success: true, message: 'Step updated', ticket });
  } catch (error) {
    console.error('Error in updateTicketStep:', error);
    res.status(500).json({ success: false, message: 'Failed to update step', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const deleteTicketStep = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ticketId } = req.body;
    if (!ticketId) { res.status(400).json({ message: 'ticketId is required' }); return; }

    const stepIndex = typeof req.body.stepIndex === 'number' ? req.body.stepIndex : null;
    const stepId = req.body.stepId ?? null;

    let ticket = null;

    if (stepId) {
      ticket = await Ticket.findByIdAndUpdate(
        ticketId,
        { $pull: { steps: { _id: stepId } } },
        { new: true }
      );
    } else if (stepIndex !== null && stepIndex >= 0) {
      const current = await Ticket.findById(ticketId);
      if (!current) { res.status(404).json({ message: 'Ticket not found' }); return; }
      const steps = (current as any).steps ?? [];
      if (stepIndex >= steps.length) { res.status(404).json({ message: 'Step index out of range' }); return; }
      steps.splice(stepIndex, 1);
      (current as any).steps = steps;
      await current.save();
      ticket = current;
    } else {
      res.status(400).json({ message: 'stepIndex or stepId required' });
      return;
    }

    if (!ticket) { res.status(404).json({ message: 'Ticket not found' }); return; }
    res.status(200).json({ success: true, message: 'Step removed', ticket });
  } catch (error) {
    console.error('Error in deleteTicketStep:', error);
    res.status(500).json({ success: false, message: 'Failed to remove step', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};
