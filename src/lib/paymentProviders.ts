export interface PaymentRequestParams {
  amount: number;
  studentId: string;
  studentName: string;
  admissionNo: string;
  month: string;
  year: string;
  coachingUpiId: string;
  accountHolderName: string;
}

export interface PaymentRequestResult {
  paymentUrl: string; // The deep link or gateway checkout url
  qrUrl?: string;     // The QR code data (same as paymentUrl or custom)
  providerName: string;
  fieldsNeeded: string[]; // e.g. ["utr", "screenshot"]
  instructions?: string;
  reference: string;
}

export interface PaymentProvider {
  id: string;
  name: string;
  generateRequest(params: PaymentRequestParams): PaymentRequestResult;
}

export class FreeUPIProvider implements PaymentProvider {
  id = 'FREE_UPI';
  name = 'Free UPI QR / Deep Link';

  generateRequest(params: PaymentRequestParams): PaymentRequestResult {
    const sanitizedMonth = params.month.toUpperCase().replace(/\s+/g, '');
    const reference = `FEE-${params.studentId}-${sanitizedMonth}-${params.year}`;
    // Generate standard upi://pay URI
    // upi://pay?pa={UPI_ID}&pn=Sunshine Classes&am={PendingAmount}&cu=INR&tn=FEE-{StudentID}-{Month}-{Year}
    const upiUrl = `upi://pay?pa=${encodeURIComponent(params.coachingUpiId)}&pn=${encodeURIComponent(params.accountHolderName)}&am=${params.amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(reference)}&tr=${encodeURIComponent(reference)}`;

    return {
      paymentUrl: upiUrl,
      qrUrl: upiUrl,
      providerName: this.name,
      fieldsNeeded: ['utr', 'screenshot'],
      reference,
      instructions: `Please scan the QR code to complete payment of ₹${params.amount.toFixed(2)} for ${params.month} ${params.year}.`
    };
  }
}

export class RazorpayProvider implements PaymentProvider {
  id = 'RAZORPAY';
  name = 'Razorpay Gateway';

  generateRequest(params: PaymentRequestParams): PaymentRequestResult {
    const sanitizedMonth = params.month.toUpperCase().replace(/\s+/g, '');
    const reference = `FEE-${params.studentId}-${sanitizedMonth}-${params.year}`;
    const checkoutUrl = `https://checkout.razorpay.com/v1/checkout.html?key=rzp_live_A9B8C7D6E5F4G3&amount=${(params.amount * 100)}&currency=INR&name=Sunshine%20Classes&description=FEE-${params.studentId}-${params.month}`;
    return {
      paymentUrl: checkoutUrl,
      providerName: this.name,
      fieldsNeeded: ['utr'],
      reference,
      instructions: 'Redirecting to Razorpay checkout portal securely...'
    };
  }
}

export class CashfreeProvider implements PaymentProvider {
  id = 'CASHFREE';
  name = 'Cashfree Payments';

  generateRequest(params: PaymentRequestParams): PaymentRequestResult {
    const sanitizedMonth = params.month.toUpperCase().replace(/\s+/g, '');
    const reference = `FEE-${params.studentId}-${sanitizedMonth}-${params.year}`;
    const checkoutUrl = `https://payments.cashfree.com/order/mock?amount=${params.amount}&order_id=FEE-${params.studentId}-${params.month}`;
    return {
      paymentUrl: checkoutUrl,
      providerName: this.name,
      fieldsNeeded: ['utr'],
      reference,
      instructions: 'Opening Cashfree secure gateway payment interface...'
    };
  }
}

export class PhonePeProvider implements PaymentProvider {
  id = 'PHONEPE_GATEWAY';
  name = 'PhonePe Gateway';

  generateRequest(params: PaymentRequestParams): PaymentRequestResult {
    const sanitizedMonth = params.month.toUpperCase().replace(/\s+/g, '');
    const reference = `FEE-${params.studentId}-${sanitizedMonth}-${params.year}`;
    const checkoutUrl = `https://merchants.phonepe.com/pay/mock?amount=${params.amount}&merchant_id=SUNSHINE&transaction_id=FEE-${params.studentId}-${params.month}`;
    return {
      paymentUrl: checkoutUrl,
      providerName: this.name,
      fieldsNeeded: ['utr'],
      reference,
      instructions: 'Opening PhonePe Merchant billing checkout page...'
    };
  }
}

export const getPaymentProvider = (providerId: string): PaymentProvider => {
  switch (providerId) {
    case 'RAZORPAY':
      return new RazorpayProvider();
    case 'CASHFREE':
      return new CashfreeProvider();
    case 'PHONEPE_GATEWAY':
      return new PhonePeProvider();
    case 'FREE_UPI':
    default:
      return new FreeUPIProvider();
  }
};
