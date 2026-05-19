export const env = {
  SECRET_KEY: process.env.SECRET_KEY || '',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '168h',
  SUPER_ADMIN_EMAIL: process.env.SUPER_ADMIN_EMAIL || '',
  SUPER_ADMIN_PASSWORD: process.env.SUPER_ADMIN_PASSWORD || '',
  LEADS_NOTIFY_TO: process.env.LEADS_NOTIFY_TO || '',
  TICKETS_NOTIFY_TO: process.env.TICKETS_NOTIFY_TO || '',
  MAIL_FROM: process.env.MAIL_FROM || 'noreply@cryptominingmiles.in',
};
