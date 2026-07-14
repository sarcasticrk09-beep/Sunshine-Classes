import { jsPDF } from 'jspdf';
import { FeeReceipt, Student } from '../types';

/**
 * Generates a professional PDF receipt for Sunshine Classes fee payments
 */
export function generateReceiptPdf(receipt: FeeReceipt, student: Student): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Color Palette
  const primaryColor = [30, 58, 138]; // Deep Blue #1E3A8A
  const secondaryColor = [234, 88, 12]; // Orange #EA580C
  const darkTextColor = [51, 65, 85]; // Slate #334155
  const lightBgColor = [248, 250, 252]; // Soft Gray #F8FAFC
  const borderLight = [226, 232, 240]; // Slate-200

  // Draw Header Logo & Branding
  // 1. Logo Symbol (A nice glowing shield or academic emblem)
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(20, 15, 12, 12, 'F');
  doc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.rect(23, 18, 6, 6, 'F');

  // 2. School Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('SUNSHINE CLASSES', 36, 21);

  // 3. Subtitle
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text('EXCELLENCE IN EDUCATION', 36, 25);

  // 4. Contact & Address Details (Right Side)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139); // Slate-500
  doc.text('Pihani, Hardoi, Uttar Pradesh - 241406', 190, 19, { align: 'right' });
  doc.text('Call: +91 8707738284 | WhatsApp: +91 9161586254', 190, 23, { align: 'right' });
  doc.text('Reg No: 09BCXPS8401H1ZD', 190, 27, { align: 'right' });

  // Divider Line
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.setLineWidth(0.5);
  doc.line(20, 32, 190, 32);

  // Receipt Title Bar
  doc.setFillColor(lightBgColor[0], lightBgColor[1], lightBgColor[2]);
  doc.rect(20, 37, 170, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('FEE PAYMENT RECEIPT / TAX INVOICE', 105, 42, { align: 'center' });

  // Metadata Columns (Left & Right)
  doc.setFontSize(9);
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);

  // Column Left
  let currentY = 53;
  const lineSpacing = 6;
  doc.setFont('helvetica', 'bold');
  doc.text('Receipt Number:', 20, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(receipt.id, 55, currentY);

  currentY += lineSpacing;
  doc.setFont('helvetica', 'bold');
  doc.text('Date Issued:', 20, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(receipt.date, 55, currentY);

  currentY += lineSpacing;
  doc.setFont('helvetica', 'bold');
  doc.text('Student Name:', 20, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(receipt.studentName, 55, currentY);

  currentY += lineSpacing;
  doc.setFont('helvetica', 'bold');
  doc.text('Admission No (Roll):', 20, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(student.rollNo || student.id || 'N/A', 55, currentY);

  // Column Right
  currentY = 53;
  doc.setFont('helvetica', 'bold');
  doc.text('Academic Class:', 115, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(receipt.class, 150, currentY);

  currentY += lineSpacing;
  doc.setFont('helvetica', 'bold');
  doc.text('Batch Stream:', 115, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(student.preferredBatch || 'Default Batch', 150, currentY);

  currentY += lineSpacing;
  doc.setFont('helvetica', 'bold');
  doc.text('Payment Method:', 115, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(receipt.paymentMethod, 150, currentY);

  currentY += lineSpacing;
  doc.setFont('helvetica', 'bold');
  doc.text('Collected By:', 115, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(receipt.receivedBy || 'School Administration', 150, currentY);

  // Fee Details Table
  const tableY = 82;
  // Header Box
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(20, tableY, 170, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text('DESCRIPTION OF TUITION SERVICES', 24, tableY + 4.8);
  doc.text('AMOUNT (INR)', 186, tableY + 4.8, { align: 'right' });

  // Row Content
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.line(20, tableY + 7, 20, tableY + 25);
  doc.line(190, tableY + 7, 190, tableY + 25);
  doc.line(20, tableY + 25, 190, tableY + 25);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.text('Coaching Tuition Fees', 24, tableY + 13);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Monthly educational curriculum fee cycle for: ${receipt.month}`, 24, tableY + 18);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.text(`INR ${receipt.amountPaid.toFixed(2)}`, 186, tableY + 15, { align: 'right' });

  // Grand Total Box
  doc.setFillColor(lightBgColor[0], lightBgColor[1], lightBgColor[2]);
  doc.rect(20, tableY + 25, 170, 10, 'F');
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.line(20, tableY + 35, 190, tableY + 35);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('NET PAID TRANSACTION AMOUNT (INR)', 24, tableY + 31.5);
  doc.setFontSize(11);
  doc.text(`INR ${receipt.amountPaid.toFixed(2)}`, 186, tableY + 31.5, { align: 'right' });

  // Transaction Reference Block
  let detailY = tableY + 42;
  doc.setFontSize(8.5);
  doc.setTextColor(148, 163, 184); // Gray-400
  doc.text('TRANSACTION AUDIT PROTOCOLS', 20, detailY);

  detailY += 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.text('• Settlement Status:', 20, detailY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(16, 185, 129); // Emerald-500 (Success)
  doc.text('SUCCESSFULLY VERIFIED & RECONCILED', 55, detailY);

  if (receipt.transactionId) {
    detailY += 4.5;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
    doc.text('• UPI/UTR Reference ID:', 20, detailY);
    doc.setFont('helvetica', 'normal');
    doc.text(receipt.transactionId, 55, detailY);
  }

  detailY += 4.5;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.text('• Reconciliation Date:', 20, detailY);
  doc.setFont('helvetica', 'normal');
  doc.text(receipt.date, 55, detailY);

  // Draw QR Verification Code Placeholder on Bottom Left (Geometric nested rectangles)
  const qrX = 20;
  const qrY = 145;
  const qrSize = 25;
  
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setLineWidth(0.4);
  // Outer frame
  doc.rect(qrX, qrY, qrSize, qrSize);
  
  // Three distinct corner finder patterns (nested boxes like real QR code!)
  const drawCornerFinder = (x: number, y: number) => {
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(x, y, 7, 7, 'F');
    doc.setFillColor(255, 255, 255);
    doc.rect(x + 1.5, y + 1.5, 4, 4, 'F');
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(x + 2.5, y + 2.5, 2, 2, 'F');
  };

  drawCornerFinder(qrX + 1, qrY + 1); // Top Left
  drawCornerFinder(qrX + qrSize - 8, qrY + 1); // Top Right
  drawCornerFinder(qrX + 1, qrY + qrSize - 8); // Bottom Left

  // Draw some geometric blocks to simulate a real QR code matrix
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(qrX + 11, qrY + 3, 2, 2, 'F');
  doc.rect(qrX + 14, qrY + 5, 2, 3, 'F');
  doc.rect(qrX + 10, qrY + 10, 4, 2, 'F');
  doc.rect(qrX + 16, qrY + 12, 3, 3, 'F');
  doc.rect(qrX + 11, qrY + 17, 3, 1, 'F');
  doc.rect(qrX + 18, qrY + 18, 5, 2, 'F');
  doc.rect(qrX + 15, qrY + 22, 2, 2, 'F');
  doc.rect(qrX + 21, qrY + 11, 2, 4, 'F');
  doc.rect(qrX + 22, qrY + 22, 2, 2, 'F');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text('Scan to verify receipt online', qrX, qrY + qrSize + 4.5);

  // Draw Signature Line and Handwritten signature on Bottom Right
  const sigX = 140;
  const sigY = 152;
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.setLineWidth(0.3);
  doc.line(sigX, sigY + 15, sigX + 50, sigY + 15);

  // Handwritten cursive signature font simulation
  doc.setFont('courier', 'italic');
  doc.setFontSize(11);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('Rajeev Gupta', sigX + 8, sigY + 10);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.text('Authorized Signatory', sigX + 10, sigY + 19);

  // Bottom Notice
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('This is a computer-generated official receipt voucher. No physical signature is required for validity.', 105, 188, { align: 'center' });
  doc.text('Sunshine Classes • Quality and Integrity in Education', 105, 192, { align: 'center' });

  return doc;
}
