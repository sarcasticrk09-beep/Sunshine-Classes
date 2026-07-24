export interface PaymentProvider {
  name: string;
  initiatePayment(amount: number, metadata: { studentId: string; studentName: string; month: string }): Promise<{
    success: boolean;
    qrString?: string;
    gatewayTransactionId?: string;
    instructions?: string;
  }>;
  verifyPayment(transactionId: string): Promise<{
    verified: boolean;
    message?: string;
  }>;
}

export class ManualUPIProvider implements PaymentProvider {
  public name = 'MANUAL';

  public async initiatePayment(amount: number, metadata: { studentId: string; studentName: string; month: string }) {
    // Generate UPI standard deep link for manual scanning
    const payeeAddress = 'sunshine@ybl';
    const payeeName = 'Sunshine Classes';
    const transactionNote = `Fees ${metadata.studentName} ${metadata.month}`;
    const upiLink = `upi://pay?pa=${encodeURIComponent(payeeAddress)}&pn=${encodeURIComponent(payeeName)}&am=${amount}&tn=${encodeURIComponent(transactionNote)}&cu=INR`;

    return {
      success: true,
      qrString: upiLink,
      instructions: `Please pay ₹${amount} using the UPI App of your choice to ${payeeAddress} or scan the QR. Use Note: ${transactionNote}.`
    };
  }

  public async verifyPayment(transactionId: string) {
    // Manual provider requires manual verification, so by default we wait for admin approval
    return {
      verified: false,
      message: 'Pending manual admin verification.'
    };
  }
}

export class RazorpayProvider implements PaymentProvider {
  public name = 'RAZORPAY';

  public async initiatePayment(amount: number, metadata: any) {
    return {
      success: true,
      qrString: `https://api.razorpay.com/v1/payments/mock_qr`,
      gatewayTransactionId: `rzp_order_${Math.random().toString(36).substring(7)}`,
      instructions: 'Pay online securely via Razorpay payment gateway.'
    };
  }

  public async verifyPayment(transactionId: string) {
    // Mock auto-verification for futuristic Razorpay
    return {
      verified: true,
      message: 'Payment verified automatically via webhook.'
    };
  }
}

export class PaymentProviderFactory {
  public static getProvider(name: string): PaymentProvider {
    switch ((name || '').toUpperCase()) {
      case 'RAZORPAY':
        return new RazorpayProvider();
      case 'MANUAL':
      default:
        return new ManualUPIProvider();
    }
  }
}
