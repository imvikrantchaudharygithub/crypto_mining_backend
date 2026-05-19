import Counter from '../models/counter.model';

export const mintTicketId = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const counter = await Counter.findOneAndUpdate(
    { _id: `ticket-${year}` },
    { $inc: { seq: 1 } },
    { upsert: true, new: true }
  );
  return `CMM-${year}-${String(counter!.seq).padStart(4, '0')}`;
};
