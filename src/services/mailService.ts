import nodemailer from 'nodemailer';
import { env } from '../config/env';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function send(to: string, subject: string, html: string): Promise<void> {
  await transporter.sendMail({ from: env.MAIL_FROM, to, subject, html });
}

export const sendLeadNotification = async (lead: any): Promise<void> => {
  if (!env.LEADS_NOTIFY_TO) return;
  await send(
    env.LEADS_NOTIFY_TO,
    `New lead: ${lead.subject}`,
    `<p><strong>${lead.name}</strong> (${lead.email}) submitted a contact form.</p>
     <p><strong>Subject:</strong> ${lead.subject}</p>
     <p><strong>Message:</strong> ${lead.message}</p>`
  );
};

export const sendTicketConfirmation = async (ticket: any): Promise<void> => {
  await send(
    ticket.customer.email,
    `Ticket ${ticket.ticketId} received — Crypto Mining Miles`,
    `<p>Hi ${ticket.customer.name},</p>
     <p>Your service ticket <strong>${ticket.ticketId}</strong> has been received.</p>
     <p>Issue type: ${ticket.issueType}<br>Priority: ${ticket.priority}</p>
     <p>Track your ticket at <a href="https://cryptominingmiles.in/track-ticket">cryptominingmiles.in/track-ticket</a></p>`
  );
  if (env.TICKETS_NOTIFY_TO) {
    await send(
      env.TICKETS_NOTIFY_TO,
      `New ticket ${ticket.ticketId}: ${ticket.issueType}`,
      `<p>${ticket.customer.name} (${ticket.customer.email}) raised a ${ticket.priority} priority ticket.</p>
       <p>${ticket.description}</p>`
    );
  }
};

export const sendTicketStatusUpdate = async (ticket: any): Promise<void> => {
  await send(
    ticket.customer.email,
    `Ticket ${ticket.ticketId} updated — ${ticket.status}`,
    `<p>Hi ${ticket.customer.name},</p>
     <p>Your ticket <strong>${ticket.ticketId}</strong> status has been updated to <strong>${ticket.status}</strong>.</p>
     <p>Track at <a href="https://cryptominingmiles.in/track-ticket">cryptominingmiles.in/track-ticket</a></p>`
  );
};

export const sendPasswordReset = async (email: string, resetLink: string): Promise<void> => {
  await send(
    email,
    'Reset your Crypto Mining Miles admin password',
    `<p>Click the link below to reset your password (expires in 1 hour):</p>
     <p><a href="${resetLink}">${resetLink}</a></p>`
  );
};

export const sendAdminInvite = async (email: string, name: string, tempPassword: string): Promise<void> => {
  await send(
    email,
    'You have been added to Crypto Mining Miles Admin',
    `<p>Hi ${name},</p>
     <p>Your admin account has been created. Sign in at <a href="https://admin.cryptominingmiles.in/login">admin.cryptominingmiles.in</a></p>
     <p>Temporary password: <strong>${tempPassword}</strong></p>
     <p>Please change your password after signing in.</p>`
  );
};
