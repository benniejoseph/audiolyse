/**
 * Invoice PDF Renderer
 * Renders professional invoice PDFs using jsPDF
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { InvoiceData, formatCurrency, COMPANY_INFO } from './generator';

// Colors for the invoice
const COLORS = {
  primary: [0, 217, 255] as [number, number, number], // Audiolyse brand cyan
  primaryDark: [0, 150, 180] as [number, number, number],
  dark: [30, 41, 59] as [number, number, number],
  medium: [100, 116, 139] as [number, number, number],
  light: [241, 245, 249] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  success: [34, 197, 94] as [number, number, number],
};

/**
 * Generate invoice PDF from invoice data
 */
export function generateInvoicePDF(invoice: InvoiceData): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPos = margin;

  // ====== HEADER ======
  // Brand gradient header
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageWidth, 45, 'F');
  
  // Company name
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('AUDIOLYSE', margin, 25);
  
  // Invoice label
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('TAX INVOICE', pageWidth - margin, 20, { align: 'right' });
  
  // Invoice number
  doc.setFontSize(10);
  doc.text(invoice.invoiceNumber, pageWidth - margin, 28, { align: 'right' });
  
  // Date
  const invoiceDate = new Date(invoice.date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  doc.text(`Date: ${invoiceDate}`, pageWidth - margin, 36, { align: 'right' });

  yPos = 55;

  // ====== COMPANY & CUSTOMER DETAILS ======
  doc.setTextColor(...COLORS.dark);
  
  // From (Company)
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('FROM:', margin, yPos);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  yPos += 6;
  doc.text(invoice.company.name, margin, yPos);
  yPos += 5;
  invoice.company.address.forEach(line => {
    doc.text(line, margin, yPos);
    yPos += 5;
  });
  doc.text(invoice.company.email, margin, yPos);
  yPos += 5;
  if (invoice.company.gstin) {
    doc.setFontSize(9);
    doc.text(`GSTIN: ${invoice.company.gstin}`, margin, yPos);
  }

  // To (Customer) - right side
  let rightY = 55;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('BILL TO:', pageWidth - margin - 60, rightY);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  rightY += 6;
  doc.text(invoice.customer.name, pageWidth - margin - 60, rightY);
  rightY += 5;
  if (invoice.customer.organizationName) {
    doc.text(invoice.customer.organizationName, pageWidth - margin - 60, rightY);
    rightY += 5;
  }
  doc.text(invoice.customer.email, pageWidth - margin - 60, rightY);

  yPos = Math.max(yPos, rightY) + 15;

  // ====== PAYMENT STATUS BADGE ======
  const statusColor = invoice.paymentStatus === 'paid' ? COLORS.success : COLORS.medium;
  doc.setFillColor(...statusColor);
  doc.roundedRect(pageWidth - margin - 30, yPos - 8, 30, 10, 2, 2, 'F');
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(invoice.paymentStatus.toUpperCase(), pageWidth - margin - 15, yPos - 2, { align: 'center' });

  yPos += 10;

  // ====== LINE ITEMS TABLE ======
  doc.setTextColor(...COLORS.dark);
  
  const tableData = invoice.items.map(item => [
    item.description,
    item.quantity.toString(),
    formatCurrency(item.unitPrice, invoice.currency),
    formatCurrency(item.amount, invoice.currency),
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['Description', 'Qty', 'Unit Price', 'Amount']],
    body: tableData,
    theme: 'plain',
    headStyles: {
      fillColor: COLORS.light,
      textColor: COLORS.dark,
      fontStyle: 'bold',
      fontSize: 10,
      cellPadding: 5,
    },
    bodyStyles: {
      textColor: COLORS.dark,
      fontSize: 10,
      cellPadding: 5,
    },
    columnStyles: {
      0: { cellWidth: 90 },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 35, halign: 'right' },
      3: { cellWidth: 35, halign: 'right' },
    },
    margin: { left: margin, right: margin },
    alternateRowStyles: {
      fillColor: [250, 250, 250],
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // ====== TOTALS SECTION ======
  const totalsX = pageWidth - margin - 70;
  const totalsWidth = 70;
  
  // Subtotal
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal:', totalsX, yPos);
  doc.text(formatCurrency(invoice.subtotal, invoice.currency), totalsX + totalsWidth, yPos, { align: 'right' });
  yPos += 6;

  // Discount (if applicable)
  if (invoice.discount && invoice.discount.amount > 0) {
    doc.setTextColor(...COLORS.success);
    doc.text(invoice.discount.description, totalsX, yPos);
    doc.text(`-${formatCurrency(invoice.discount.amount, invoice.currency)}`, totalsX + totalsWidth, yPos, { align: 'right' });
    yPos += 6;
    doc.setTextColor(...COLORS.dark);
  }

  // Tax (if applicable)
  if (invoice.tax && invoice.tax.amount > 0) {
    doc.text(invoice.tax.name, totalsX, yPos);
    doc.text(formatCurrency(invoice.tax.amount, invoice.currency), totalsX + totalsWidth, yPos, { align: 'right' });
    yPos += 6;
  }

  // Total
  yPos += 2;
  doc.setDrawColor(...COLORS.light);
  doc.line(totalsX, yPos, totalsX + totalsWidth, yPos);
  yPos += 6;
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.primary);
  doc.text('TOTAL:', totalsX, yPos);
  doc.text(formatCurrency(invoice.total, invoice.currency), totalsX + totalsWidth, yPos, { align: 'right' });

  yPos += 20;

  // ====== PAYMENT DETAILS ======
  doc.setTextColor(...COLORS.dark);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Payment Details', margin, yPos);
  
  doc.setFont('helvetica', 'normal');
  yPos += 6;
  doc.text(`Payment ID: ${invoice.paymentId}`, margin, yPos);
  yPos += 5;
  doc.text(`Payment Method: ${invoice.paymentMethod}`, margin, yPos);
  
  if (invoice.billingInterval) {
    yPos += 5;
    doc.text(`Billing: ${invoice.billingInterval === 'annual' ? 'Annual' : 'Monthly'}`, margin, yPos);
  }

  // ====== NOTES ======
  if (invoice.notes) {
    yPos += 15;
    doc.setFillColor(...COLORS.light);
    doc.roundedRect(margin, yPos - 5, pageWidth - (margin * 2), 20, 3, 3, 'F');
    doc.setFontSize(9);
    doc.text(invoice.notes, margin + 5, yPos + 3);
  }

  // ====== FOOTER ======
  const footerY = pageHeight - 20;
  doc.setDrawColor(...COLORS.light);
  doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
  
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.medium);
  doc.text('Thank you for choosing Audiolyse!', pageWidth / 2, footerY, { align: 'center' });
  doc.text('support@audiolyse.com | www.audiolyse.com', pageWidth / 2, footerY + 5, { align: 'center' });
  
  // Add page number
  doc.text(`Page 1 of 1`, pageWidth - margin, footerY, { align: 'right' });

  return doc;
}

/**
 * Generate and download invoice PDF
 */
export function downloadInvoicePDF(invoice: InvoiceData): void {
  const doc = generateInvoicePDF(invoice);
  const fileName = `${invoice.invoiceNumber}.pdf`;
  doc.save(fileName);
}

/**
 * Generate invoice PDF as base64 string (for email attachment)
 */
export function generateInvoicePDFBase64(invoice: InvoiceData): string {
  const doc = generateInvoicePDF(invoice);
  return doc.output('datauristring').split(',')[1]; // Remove data URI prefix
}

/**
 * Generate invoice PDF as blob (for storage upload)
 */
export function generateInvoicePDFBlob(invoice: InvoiceData): Blob {
  const doc = generateInvoicePDF(invoice);
  return doc.output('blob');
}
