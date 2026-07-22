import { googleSignInForGmail, getCachedAccessToken, setCachedAccessToken, clearCachedAccessToken, auth } from '../lib/firebase';

export interface GmailProfile {
  emailAddress: string;
  messagesTotal: number;
  threadsTotal: number;
  historyId: string;
}

export interface GmailMessageHeader {
  name: string;
  value: string;
}

export interface GmailMessageSummary {
  id: string;
  threadId: string;
  snippet?: string;
  subject?: string;
  from?: string;
  to?: string;
  date?: string;
  body?: string;
  unread?: boolean;
}

export interface EmailPayload {
  to: string;
  subject: string;
  body: string; // HTML or Plain text
  from?: string;
  cc?: string;
  bcc?: string;
}

/**
 * Encodes email headers and body into base64url RFC 2822 compliant string
 */
function encodeRawEmail({ to, subject, body, from, cc, bcc }: EmailPayload): string {
  const headers = [
    from ? `From: ${from}` : '',
    `To: ${to}`,
    cc ? `Cc: ${cc}` : '',
    bcc ? `Bcc: ${bcc}` : '',
    `Subject: =?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=utf-8',
  ].filter(Boolean);

  const fullMessage = headers.join('\r\n') + '\r\n\r\n' + body;

  const base64Encoded = btoa(unescape(encodeURIComponent(fullMessage)));
  return base64Encoded
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Authenticate with Google OAuth for Gmail
 */
export async function authenticateGmail(): Promise<{ accessToken: string; userEmail: string }> {
  const result = await googleSignInForGmail();
  const email = result.user.email || '';
  return { accessToken: result.accessToken, userEmail: email };
}

/**
 * Get active cached token or prompt sign-in if absent
 */
export async function getOrRequestAccessToken(): Promise<string> {
  const cached = getCachedAccessToken();
  if (cached) return cached;
  const authRes = await authenticateGmail();
  return authRes.accessToken;
}

/**
 * Fetch authenticated user's Gmail profile
 */
export async function fetchGmailProfile(accessToken: string): Promise<GmailProfile> {
  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Failed to fetch Gmail profile (${res.status})`);
  }

  return await res.json();
}

/**
 * Send an email via Gmail REST API
 */
export async function sendGmailMessage(accessToken: string, payload: EmailPayload): Promise<{ id: string; threadId: string }> {
  const raw = encodeRawEmail(payload);

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Failed to send email via Gmail (${res.status})`);
  }

  return await res.json();
}

/**
 * List message summaries from user's inbox or query
 */
export async function listGmailMessages(
  accessToken: string,
  options: { maxResults?: number; q?: string; pageToken?: string } = {}
): Promise<{ messages: GmailMessageSummary[]; nextPageToken?: string }> {
  const params = new URLSearchParams();
  params.set('maxResults', String(options.maxResults || 15));
  if (options.q) params.set('q', options.q);
  if (options.pageToken) params.set('pageToken', options.pageToken);

  const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Failed to list Gmail messages (${res.status})`);
  }

  const data = await res.json();
  if (!data.messages || data.messages.length === 0) {
    return { messages: [], nextPageToken: data.nextPageToken };
  }

  // Fetch headers for each message summary
  const detailsList = await Promise.all(
    data.messages.map(async (m: { id: string }) => {
      try {
        return await fetchGmailMessageHeader(accessToken, m.id);
      } catch {
        return { id: m.id, threadId: m.id, snippet: 'Message details unavailable' };
      }
    })
  );

  return { messages: detailsList, nextPageToken: data.nextPageToken };
}

/**
 * Fetch single message headers and snippet
 */
async function fetchGmailMessageHeader(accessToken: string, messageId: string): Promise<GmailMessageSummary> {
  const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Date`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch message metadata (${res.status})`);
  }

  const data = await res.json();
  const headers: GmailMessageHeader[] = data.payload?.headers || [];
  
  const getHeader = (name: string) => headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

  return {
    id: data.id,
    threadId: data.threadId,
    snippet: data.snippet,
    subject: getHeader('Subject') || '(No Subject)',
    from: getHeader('From') || 'Unknown Sender',
    to: getHeader('To') || '',
    date: getHeader('Date') || '',
    unread: (data.labelIds || []).includes('UNREAD'),
  };
}

/**
 * Fetch full message details including HTML body
 */
export async function fetchFullGmailMessage(accessToken: string, messageId: string): Promise<GmailMessageSummary> {
  const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch message body (${res.status})`);
  }

  const data = await res.json();
  const headers: GmailMessageHeader[] = data.payload?.headers || [];
  const getHeader = (name: string) => headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

  let bodyContent = data.snippet || '';

  // Parse payload body parts
  if (data.payload) {
    bodyContent = parseMessagePayloadBody(data.payload) || data.snippet || '';
  }

  return {
    id: data.id,
    threadId: data.threadId,
    snippet: data.snippet,
    subject: getHeader('Subject') || '(No Subject)',
    from: getHeader('From') || 'Unknown Sender',
    to: getHeader('To') || '',
    date: getHeader('Date') || '',
    body: bodyContent,
    unread: (data.labelIds || []).includes('UNREAD'),
  };
}

function parseMessagePayloadBody(payload: any): string {
  if (payload.body && payload.body.data) {
    return decodeBase64Url(payload.body.data);
  }

  if (payload.parts && payload.parts.length > 0) {
    // Prefer text/html part over text/plain
    const htmlPart = payload.parts.find((p: any) => p.mimeType === 'text/html');
    if (htmlPart && htmlPart.body && htmlPart.body.data) {
      return decodeBase64Url(htmlPart.body.data);
    }

    const textPart = payload.parts.find((p: any) => p.mimeType === 'text/plain');
    if (textPart && textPart.body && textPart.body.data) {
      return `<pre style="font-family: sans-serif; whitespace: pre-wrap;">${decodeBase64Url(textPart.body.data)}</pre>`;
    }

    // Recursive search
    for (const part of payload.parts) {
      const sub = parseMessagePayloadBody(part);
      if (sub) return sub;
    }
  }

  return '';
}

function decodeBase64Url(base64UrlStr: string): string {
  try {
    let base64 = base64UrlStr.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) base64 += '=';
    return decodeURIComponent(
      Array.prototype.map
        .call(atob(base64), (c: string) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
  } catch (e) {
    return 'Unable to render email body content.';
  }
}

/**
 * Pre-formatted ERP Email Templates helper
 */
export function buildERPEmailHtml({
  title,
  studentName,
  contentHtml,
  callToActionText,
  callToActionUrl,
}: {
  title: string;
  studentName: string;
  contentHtml: string;
  callToActionText?: string;
  callToActionUrl?: string;
}): string {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 20px; }
      .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
      .header { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: #ffffff; padding: 24px; text-align: center; }
      .header h1 { margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }
      .header p { margin: 4px 0 0 0; font-size: 13px; opacity: 0.9; }
      .content { padding: 28px 24px; line-height: 1.6; }
      .greeting { font-size: 16px; font-weight: 600; color: #0f172a; margin-bottom: 16px; }
      .body-text { font-size: 14px; color: #334155; margin-bottom: 24px; }
      .btn { display: inline-block; background-color: #2563eb; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px; text-align: center; margin-top: 12px; }
      .footer { background-color: #f1f5f9; padding: 16px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Sunshine Classes Varanasi</h1>
        <p>Official ERP Communication</p>
      </div>
      <div class="content">
        <div class="greeting">Dear ${studentName || 'Student / Parent'},</div>
        <div class="body-text">
          <p style="font-weight: 600; font-size: 15px; color: #1d4ed8; margin-top: 0;">${title}</p>
          ${contentHtml}
        </div>
        ${callToActionUrl ? `<div style="text-align: center;"><a href="${callToActionUrl}" class="btn" target="_blank">${callToActionText || 'Open Student Portal'}</a></div>` : ''}
      </div>
      <div class="footer">
        <p style="margin: 0 0 4px 0;"><strong>Sunshine Classes Varanasi</strong> — CBSE Excellence Institute</p>
        <p style="margin: 0;">Address: Near Lanka Crossing, Varanasi, UP, India | Phone: +91 98765 43210</p>
      </div>
    </div>
  </body>
  </html>
  `;
}
