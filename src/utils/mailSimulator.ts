export interface SentEmail {
  id: string;
  to: string;
  subject: string;
  body: string;
  link: string;
  timestamp: string;
  type: 'VERIFICATION' | 'PASSWORD_RESET';
}

export const getSentEmails = (): SentEmail[] => {
  const stored = localStorage.getItem('sunshine_sent_emails');
  return stored ? JSON.parse(stored) : [];
};

export const sendSimulatedEmail = (to: string, subject: string, body: string, link: string, type: 'VERIFICATION' | 'PASSWORD_RESET') => {
  const emails = getSentEmails();
  const newEmail: SentEmail = {
    id: `email-${Date.now()}`,
    to,
    subject,
    body,
    link,
    timestamp: new Date().toISOString(),
    type
  };
  localStorage.setItem('sunshine_sent_emails', JSON.stringify([newEmail, ...emails]));
  // Trigger storage event so other components or parts of the app can update
  window.dispatchEvent(new Event('sunshine_emails_updated'));
};

export const clearSentEmails = () => {
  localStorage.removeItem('sunshine_sent_emails');
  window.dispatchEvent(new Event('sunshine_emails_updated'));
};
