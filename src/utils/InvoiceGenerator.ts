import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { Invoice, InvoiceItem } from '@/utils/AccountingTypes';

// Extend the jsPDF type definition (already defined in ReceiptGenerator.ts)
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export const generateInvoicePdf = (invoice: Invoice): string => {
  // Create PDF document
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;

  // Add title
  doc.setFontSize(20);
  doc.text('INVOICE', pageWidth / 2, 20, { align: 'center' });

  // Add invoice number and date
  doc.setFontSize(12);
  doc.text(`Invoice No: ${invoice.id}`, 20, 35);
  doc.text(`Date: ${new Date(invoice.date).toLocaleDateString()}`, pageWidth - 20, 35, {
    align: 'right',
  });
  doc.text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`, pageWidth - 20, 40, {
    align: 'right',
  });

  // Add company info
  doc.setFontSize(14);
  doc.text('Property Management System', 20, 50);
  doc.setFontSize(10);
  doc.text('123 Example Street, Lagos, Nigeria', 20, 55);
  doc.text('Email: accounts@propertysystem.com', 20, 60);
  doc.text('Phone: +234 800 000 0000', 20, 65);

  // Add customer info
  doc.setFontSize(12);
  doc.text('BILL TO:', 20, 80);
  doc.setFontSize(10);
  doc.text(`Tenant ID: ${invoice.tenantId}`, 20, 85);
  doc.text(`Property ID: ${invoice.propertyId}`, 20, 90);

  // Create invoice items table
  const tableColumns = [
    { header: 'Description', dataKey: 'description' },
    { header: 'Category', dataKey: 'category' },
    { header: 'Amount (₦)', dataKey: 'amount' },
    { header: 'Qty', dataKey: 'quantity' },
    { header: 'Total (₦)', dataKey: 'total' },
  ];

  const tableRows = invoice.items.map((item) => ({
    description: item.description,
    category: item.category,
    amount: item.amount.toLocaleString(),
    quantity: item.quantity,
    total: item.total.toLocaleString(),
  }));

  doc.autoTable({
    startY: 100,
    head: [tableColumns.map((col) => col.header)],
    body: tableRows.map((row) => tableColumns.map((col) => row[col.dataKey as keyof typeof row])),
    theme: 'grid',
    headStyles: { fillColor: [70, 70, 70] },
    styles: { overflow: 'linebreak' },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 40 },
      2: { cellWidth: 30, halign: 'right' },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 30, halign: 'right' },
    },
  });

  // Add totals
  const finalY = (doc as any).lastAutoTable.finalY + 10;

  doc.text('Subtotal:', 120, finalY);
  doc.text(`₦${invoice.subtotal.toLocaleString()}`, pageWidth - 20, finalY, { align: 'right' });

  doc.text('Tax (7.5%):', 120, finalY + 7);
  doc.text(`₦${invoice.tax.toLocaleString()}`, pageWidth - 20, finalY + 7, { align: 'right' });

  doc.setLineWidth(0.5);
  doc.line(120, finalY + 9, pageWidth - 20, finalY + 9);

  doc.setFont(undefined, 'bold');
  doc.text('TOTAL:', 120, finalY + 16);
  doc.text(`₦${invoice.total.toLocaleString()}`, pageWidth - 20, finalY + 16, { align: 'right' });
  doc.setFont(undefined, 'normal');

  // Add notes
  if (invoice.notes) {
    doc.setFontSize(10);
    doc.text('Notes:', 20, finalY + 30);
    doc.text(invoice.notes, 20, finalY + 35);
  }

  // Add payment instructions
  doc.setFontSize(10);
  doc.text('Payment Instructions:', 20, finalY + 45);
  doc.text(
    'Please make payment through the tenant portal or using the payment options provided.',
    20,
    finalY + 50
  );

  // Add footer
  doc.setFontSize(8);
  doc.text('Thank you for your business', pageWidth / 2, finalY + 65, { align: 'center' });

  // Return as data URL
  return doc.output('datauristring');
};

export const downloadInvoice = (invoice: Invoice): void => {
  // Create PDF
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;

  // Add title
  doc.setFontSize(20);
  doc.text('INVOICE', pageWidth / 2, 20, { align: 'center' });

  // Add invoice number and date
  doc.setFontSize(12);
  doc.text(`Invoice No: ${invoice.id}`, 20, 35);
  doc.text(`Date: ${new Date(invoice.date).toLocaleDateString()}`, pageWidth - 20, 35, {
    align: 'right',
  });
  doc.text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`, pageWidth - 20, 40, {
    align: 'right',
  });

  // Add company info
  doc.setFontSize(14);
  doc.text('Property Management System', 20, 50);
  doc.setFontSize(10);
  doc.text('123 Example Street, Lagos, Nigeria', 20, 55);
  doc.text('Email: accounts@propertysystem.com', 20, 60);
  doc.text('Phone: +234 800 000 0000', 20, 65);

  // Add customer info
  doc.setFontSize(12);
  doc.text('BILL TO:', 20, 80);
  doc.setFontSize(10);
  doc.text(`Tenant ID: ${invoice.tenantId}`, 20, 85);
  doc.text(`Property ID: ${invoice.propertyId}`, 20, 90);

  // Create invoice items table
  const tableColumns = [
    { header: 'Description', dataKey: 'description' },
    { header: 'Category', dataKey: 'category' },
    { header: 'Amount (₦)', dataKey: 'amount' },
    { header: 'Qty', dataKey: 'quantity' },
    { header: 'Total (₦)', dataKey: 'total' },
  ];

  const tableRows = invoice.items.map((item) => ({
    description: item.description,
    category: item.category,
    amount: item.amount.toLocaleString(),
    quantity: item.quantity,
    total: item.total.toLocaleString(),
  }));

  doc.autoTable({
    startY: 100,
    head: [tableColumns.map((col) => col.header)],
    body: tableRows.map((row) => tableColumns.map((col) => row[col.dataKey as keyof typeof row])),
    theme: 'grid',
    headStyles: { fillColor: [70, 70, 70] },
    styles: { overflow: 'linebreak' },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 40 },
      2: { cellWidth: 30, halign: 'right' },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 30, halign: 'right' },
    },
  });

  // Add totals
  const finalY = (doc as any).lastAutoTable.finalY + 10;

  doc.text('Subtotal:', 120, finalY);
  doc.text(`₦${invoice.subtotal.toLocaleString()}`, pageWidth - 20, finalY, { align: 'right' });

  doc.text('Tax (7.5%):', 120, finalY + 7);
  doc.text(`₦${invoice.tax.toLocaleString()}`, pageWidth - 20, finalY + 7, { align: 'right' });

  doc.setLineWidth(0.5);
  doc.line(120, finalY + 9, pageWidth - 20, finalY + 9);

  doc.setFont(undefined, 'bold');
  doc.text('TOTAL:', 120, finalY + 16);
  doc.text(`₦${invoice.total.toLocaleString()}`, pageWidth - 20, finalY + 16, { align: 'right' });
  doc.setFont(undefined, 'normal');

  // Add notes
  if (invoice.notes) {
    doc.setFontSize(10);
    doc.text('Notes:', 20, finalY + 30);
    doc.text(invoice.notes, 20, finalY + 35);
  }

  // Add payment instructions
  doc.setFontSize(10);
  doc.text('Payment Instructions:', 20, finalY + 45);
  doc.text(
    'Please make payment through the tenant portal or using the payment options provided.',
    20,
    finalY + 50
  );

  // Add footer
  doc.setFontSize(8);
  doc.text('Thank you for your business', pageWidth / 2, finalY + 65, { align: 'center' });

  // Download the PDF
  doc.save(`Invoice-${invoice.id}.pdf`);
};
