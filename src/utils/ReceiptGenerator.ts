
import { Payment } from '@/utils/PaymentTypes';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// Extend the jsPDF type definition
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export interface ReceiptData {
  payment: Payment;
  tenantName?: string;
  propertyName?: string;
  companyName?: string;
  companyLogo?: string;
  companyAddress?: string;
  paymentMethod?: string;
  notes?: string;
}

export const generateReceipt = (data: ReceiptData): string => {
  const { 
    payment, 
    tenantName = 'Tenant', 
    propertyName = 'Property',
    companyName = 'Property Management',
    companyAddress = '',
    paymentMethod = 'Online Payment',
    notes = '' 
  } = data;
  
  // Create PDF document
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  
  // Add title
  doc.setFontSize(20);
  doc.text('PAYMENT RECEIPT', pageWidth / 2, 20, { align: 'center' });
  
  // Add receipt number and date
  doc.setFontSize(12);
  doc.text(`Receipt No: ${payment.reference}`, 20, 35);
  doc.text(`Date: ${new Date(payment.date).toLocaleDateString()}`, pageWidth - 20, 35, { align: 'right' });
  
  // Add company info
  doc.setFontSize(14);
  doc.text(companyName, 20, 50);
  if (companyAddress) {
    doc.setFontSize(10);
    doc.text(companyAddress, 20, 55);
  }
  
  // Add payment details
  doc.setFontSize(12);
  doc.text('Payment Details', 20, 70);
  
  // Create payment details table
  const paymentDetails = [
    ['Tenant Name', tenantName],
    ['Property', propertyName],
    ['Payment Date', new Date(payment.date).toLocaleDateString()],
    ['Payment Method', paymentMethod],
    ['Payment Reference', payment.reference],
    ['Description', payment.description || payment.category || 'Rent Payment'],
  ];
  
  doc.autoTable({
    startY: 75,
    head: [['Item', 'Details']],
    body: paymentDetails,
    theme: 'grid',
    headStyles: { fillColor: [70, 70, 70] },
    styles: { overflow: 'linebreak' },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 'auto' }
    },
  });
  
  // Add payment amount
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(14);
  doc.text('Amount Paid:', 20, finalY);
  doc.setFontSize(16);
  doc.text(`₦${payment.amount.toLocaleString()}`, pageWidth - 20, finalY, { align: 'right' });
  
  // Add status
  doc.setFontSize(12);
  doc.text('Status:', 20, finalY + 10);
  doc.setTextColor(payment.status === 'successful' ? 0 : 255, payment.status === 'successful' ? 128 : 0, 0);
  doc.text(payment.status.toUpperCase(), 50, finalY + 10);
  doc.setTextColor(0, 0, 0);
  
  // Add notes if available
  if (notes) {
    doc.setFontSize(10);
    doc.text('Notes:', 20, finalY + 20);
    doc.text(notes, 20, finalY + 25);
  }
  
  // Add footer
  doc.setFontSize(8);
  doc.text('Thank you for your payment', pageWidth / 2, finalY + 40, { align: 'center' });
  
  // Return as data URL
  return doc.output('datauristring');
};

export const downloadReceipt = (data: ReceiptData): void => {
  const { payment } = data;
  
  // Create PDF document
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  
  // Add title
  doc.setFontSize(20);
  doc.text('PAYMENT RECEIPT', pageWidth / 2, 20, { align: 'center' });
  
  // Add receipt number and date
  doc.setFontSize(12);
  doc.text(`Receipt No: ${payment.reference}`, 20, 35);
  doc.text(`Date: ${new Date(payment.date).toLocaleDateString()}`, pageWidth - 20, 35, { align: 'right' });
  
  // Add company info
  doc.setFontSize(14);
  doc.text(data.companyName || 'Property Management', 20, 50);
  if (data.companyAddress) {
    doc.setFontSize(10);
    doc.text(data.companyAddress, 20, 55);
  }
  
  // Add payment details
  doc.setFontSize(12);
  doc.text('Payment Details', 20, 70);
  
  // Create payment details table
  const paymentDetails = [
    ['Tenant Name', data.tenantName || 'Tenant'],
    ['Property', data.propertyName || 'Property'],
    ['Payment Date', new Date(payment.date).toLocaleDateString()],
    ['Payment Method', data.paymentMethod || 'Online Payment'],
    ['Payment Reference', payment.reference],
    ['Description', payment.description || payment.category || 'Rent Payment'],
  ];
  
  doc.autoTable({
    startY: 75,
    head: [['Item', 'Details']],
    body: paymentDetails,
    theme: 'grid',
    headStyles: { fillColor: [70, 70, 70] },
    styles: { overflow: 'linebreak' },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 'auto' }
    },
  });
  
  // Add payment amount
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(14);
  doc.text('Amount Paid:', 20, finalY);
  doc.setFontSize(16);
  doc.text(`₦${payment.amount.toLocaleString()}`, pageWidth - 20, finalY, { align: 'right' });
  
  // Add status
  doc.setFontSize(12);
  doc.text('Status:', 20, finalY + 10);
  doc.setTextColor(payment.status === 'successful' ? 0 : 255, payment.status === 'successful' ? 128 : 0, 0);
  doc.text(payment.status.toUpperCase(), 50, finalY + 10);
  doc.setTextColor(0, 0, 0);
  
  // Add notes if available
  if (data.notes) {
    doc.setFontSize(10);
    doc.text('Notes:', 20, finalY + 20);
    doc.text(data.notes, 20, finalY + 25);
  }
  
  // Add footer
  doc.setFontSize(8);
  doc.text('Thank you for your payment', pageWidth / 2, finalY + 40, { align: 'center' });
  
  // Download the PDF
  doc.save(`Receipt-${payment.reference}.pdf`);
};
