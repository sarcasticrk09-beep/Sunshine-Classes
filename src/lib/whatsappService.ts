/**
 * WhatsApp Gateway Integration Service
 * Dispatches real outbound alerts and template transactions via the Sunshine full-stack backend
 */

export interface WhatsAppVariables {
  studentName?: string;
  amount?: string | number;
  month?: string;
  className?: string;
  receiptId?: string;
  dueDate?: string;
  timing?: string;
}

/**
 * Standard interpolation helper for template mapping
 */
export function interpolateWhatsAppTemplate(templateStr: string, variables: WhatsAppVariables): string {
  let result = templateStr;
  const mappings: Record<string, any> = {
    studentName: variables.studentName || '',
    amount: variables.amount !== undefined ? String(variables.amount) : '',
    month: variables.month || '',
    className: variables.className || '',
    receiptId: variables.receiptId || '',
    dueDate: variables.dueDate || '',
    timing: variables.timing || '',
  };

  for (const [key, value] of Object.entries(mappings)) {
    const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(placeholder, value);
  }
  return result;
}

/**
 * Dispatches a real WhatsApp message using the full-stack server-side proxy API
 */
export async function sendWhatsAppMessage(params: {
  to: string;
  message: string;
  studentName?: string;
  provider?: 'TWILIO' | 'WHATSAPP_BUSINESS' | 'NONE';
  apiKey?: string;
  phoneNumber?: string;
  accountSid?: string;
  authToken?: string;
  senderNumber?: string;
}): Promise<{ success: boolean; provider: string; log: string; error?: string }> {
  try {
    const response = await fetch('/api/send-whatsapp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    return {
      success: data.success,
      provider: data.provider,
      log: data.log,
    };
  } catch (error: any) {
    console.error('[whatsappService] Dispatch failure:', error);
    return {
      success: false,
      provider: params.provider || 'NONE',
      log: `Request Failed: ${error.message}`,
      error: error.message,
    };
  }
}
