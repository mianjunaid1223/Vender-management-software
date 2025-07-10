import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Invoice } from './types';
import { format } from 'date-fns';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export function generateInvoicePDF(invoice: Invoice) {
  console.log('Generating PDF for invoice:', invoice);
  
  const doc = new jsPDF();
  let currentY = 20;
  
  // Professional color scheme - subtle and corporate
  const colors = {
    primary: [47, 57, 71] as [number, number, number],      // Professional dark blue-gray
    secondary: [71, 85, 105] as [number, number, number],    // Medium gray
    accent: [148, 163, 184] as [number, number, number],     // Light gray
    background: [249, 250, 251] as [number, number, number], // Very light gray
    border: [226, 232, 240] as [number, number, number]      // Border gray
  };
  
  // Clean, professional header
  const renderHeader = () => {
    // Simple header line
    doc.setDrawColor(...colors.border);
    doc.setLineWidth(0.5);
    doc.line(20, 35, 190, 35);
    
    // Professional title
    doc.setFontSize(28);
    doc.setTextColor(...colors.primary);
    doc.text('INVOICE', 20, 30);
    
    // Invoice number on the right
    if (invoice.invoiceNumber) {
      doc.setFontSize(14);
      doc.setTextColor(...colors.secondary);
      doc.text(`Invoice #${invoice.invoiceNumber}`, 190, 25, { align: 'right' });
    }
    
    // Status (simple text, no badge)
    if (invoice.status) {
      doc.setFontSize(11);
      doc.setTextColor(...colors.secondary);
      doc.text(`Status: ${invoice.status}`, 190, 32, { align: 'right' });
    }
    
    currentY = 50;
  };
  
  // Professional company information
  const renderCompanyInfo = () => {
    const seller = invoice.seller;
    
    if (seller?.name) {
      // Company information - right aligned, clean
      doc.setFontSize(16);
      doc.setTextColor(...colors.primary);
      doc.text(seller.name, 190, currentY, { align: 'right' });
      
      let companyY = currentY + 8;
      doc.setFontSize(10);
      doc.setTextColor(...colors.secondary);
      
      // Clean address format
      if (seller.address) {
        const addressLines = [
          seller.address.street,
          `${seller.address.city}, ${seller.address.state} ${seller.address.zipCode}`,
          seller.address.country
        ].filter(Boolean);
        
        addressLines.forEach(line => {
          if (line) {
            doc.text(line, 190, companyY, { align: 'right' });
            companyY += 6;
          }
        });
      }
      
      // Contact information - professional format
      if (seller.email) {
        doc.text(seller.email, 190, companyY, { align: 'right' });
        companyY += 6;
      }
      if (seller.phone) {
        doc.text(seller.phone, 190, companyY, { align: 'right' });
        companyY += 6;
      }
      if (seller.taxId) {
        doc.text(`Tax ID: ${seller.taxId}`, 190, companyY, { align: 'right' });
        companyY += 6;
      }
    }
    
    currentY = Math.max(currentY + 40, currentY + 20);
  };
  
  // Clean invoice details table
  const renderInvoiceDetails = () => {
    const details = [
      { label: 'Invoice Date:', value: invoice.invoiceDate ? format(new Date(invoice.invoiceDate), 'MMMM dd, yyyy') : null },
      { label: 'Due Date:', value: invoice.invoiceDueDate ? format(new Date(invoice.invoiceDueDate), 'MMMM dd, yyyy') : null },
      { label: 'Purchase Order:', value: invoice.purchaseOrderNumber },
      { label: 'Payment Terms:', value: invoice.paymentTerms }
    ].filter(item => item.value);
    
    if (details.length > 0) {
      doc.setFontSize(10);
      
      details.forEach(detail => {
        doc.setTextColor(...colors.secondary);
        doc.text(detail.label, 20, currentY);
        doc.setTextColor(...colors.primary);
        doc.text(detail.value || '', 80, currentY);
        currentY += 8;
      });
      
      currentY += 10;
    }
  };
  
  // Professional billing information
  const renderBillingInfo = () => {
    const billTo = invoice.buyer;
    const shipTo = invoice.shippingAddress;
    const hasShipping = shipTo && shipTo.street && billTo?.address?.street !== shipTo.street;
    
    // Section header
    doc.setDrawColor(...colors.border);
    doc.setLineWidth(0.5);
    doc.line(20, currentY, 190, currentY);
    currentY += 15;
    
    if (billTo?.name) {
      // Bill To section
      doc.setFontSize(12);
      doc.setTextColor(...colors.primary);
      doc.text('BILL TO', 20, currentY);
      
      let billY = currentY + 8;
      doc.setFontSize(11);
      doc.setTextColor(...colors.primary);
      doc.text(billTo.name, 20, billY);
      
      if (billTo.contactPerson) {
        billY += 6;
        doc.setFontSize(10);
        doc.setTextColor(...colors.secondary);
        doc.text(`Attention: ${billTo.contactPerson}`, 20, billY);
      }
      
      doc.setFontSize(10);
      doc.setTextColor(...colors.secondary);
      billY += 6;
      
      // Clean address format
      const billToInfo = [
        billTo.address?.street,
        billTo.address ? `${billTo.address.city}, ${billTo.address.state} ${billTo.address.zipCode}` : null,
        billTo.address?.country,
        billTo.email,
        billTo.phone,
        billTo.taxId ? `Tax ID: ${billTo.taxId}` : null
      ].filter(Boolean);
      
      billToInfo.forEach(info => {
        if (info) {
          doc.text(info, 20, billY);
          billY += 5;
        }
      });
      
      currentY = Math.max(currentY + 50, billY + 5);
    }
    
    // Ship To section (if different)
    if (hasShipping) {
      const shipStartY = currentY - 50;
      doc.setFontSize(12);
      doc.setTextColor(...colors.primary);
      doc.text('SHIP TO', 110, shipStartY);
      
      let shipY = shipStartY + 8;
      doc.setFontSize(10);
      doc.setTextColor(...colors.secondary);
      
      const shipToInfo = [
        shipTo.street,
        `${shipTo.city}, ${shipTo.state} ${shipTo.zipCode}`,
        shipTo.country
      ].filter(Boolean);
      
      shipToInfo.forEach(info => {
        if (info) {
          doc.text(info, 110, shipY);
          shipY += 5;
        }
      });
    }
    
    currentY += 20;
  };
  
  // Start rendering
  renderHeader();
  renderCompanyInfo();
  renderInvoiceDetails();
  renderBillingInfo();
  
  // Professional items table with page break protection
  const renderItemsTable = () => {
    const items = invoice.items || [];
    if (items.length === 0) return;
    
    const pageHeight = doc.internal.pageSize.height;
    const bottomMargin = 60; // Space for footer and totals
    
    // Check if we need a new page for the table
    if (currentY + 40 > pageHeight - bottomMargin) {
      doc.addPage();
      currentY = 20;
    }
    
    // Table header with professional styling
    doc.setDrawColor(...colors.border);
    doc.setLineWidth(0.5);
    doc.line(20, currentY, 190, currentY);
    
    currentY += 10;
    
    // Column headers
    doc.setFontSize(10);
    doc.setTextColor(...colors.primary);
    doc.text('DESCRIPTION', 20, currentY);
    doc.text('QTY', 130, currentY, { align: 'center' });
    doc.text('RATE', 150, currentY, { align: 'center' });
    doc.text('AMOUNT', 185, currentY, { align: 'right' });
    
    currentY += 5;
    doc.line(20, currentY, 190, currentY);
    currentY += 8;
    
    // Table rows - clean and professional with page break handling
    items.forEach((item, index) => {
      // Check if we need a new page for this row
      if (currentY + 15 > pageHeight - bottomMargin) {
        doc.addPage();
        currentY = 20;
        
        // Repeat headers on new page
        doc.setFontSize(10);
        doc.setTextColor(...colors.primary);
        doc.text('DESCRIPTION', 20, currentY);
        doc.text('QTY', 130, currentY, { align: 'center' });
        doc.text('RATE', 150, currentY, { align: 'center' });
        doc.text('AMOUNT', 185, currentY, { align: 'right' });
        
        currentY += 5;
        doc.setDrawColor(...colors.border);
        doc.setLineWidth(0.5);
        doc.line(20, currentY, 190, currentY);
        currentY += 8;
      }
      
      doc.setFontSize(10);
      doc.setTextColor(...colors.primary);
      
      // Description with proper wrapping
      const description = item.description || 'N/A';
      const maxWidth = 105;
      const wrappedText = doc.splitTextToSize(description, maxWidth);
      
      if (Array.isArray(wrappedText) && wrappedText.length > 1) {
        wrappedText.forEach((line: string, lineIndex: number) => {
          doc.text(line, 20, currentY + (lineIndex * 5));
        });
        currentY += (wrappedText.length - 1) * 5;
      } else {
        doc.text(description, 20, currentY);
      }
      
      // Quantity, rate, and amount
      doc.setTextColor(...colors.secondary);
      doc.text((item.quantity || 0).toString(), 130, currentY, { align: 'center' });
      doc.text(`$${(item.unitPrice || 0).toFixed(2)}`, 150, currentY, { align: 'center' });
      
      doc.setTextColor(...colors.primary);
      doc.text(`$${((item.quantity || 0) * (item.unitPrice || 0)).toFixed(2)}`, 185, currentY, { align: 'right' });
      
      currentY += 12;
    });
    
    // Bottom border
    doc.setDrawColor(...colors.border);
    doc.line(20, currentY, 190, currentY);
    currentY += 15;
  };
  
  // Professional totals section
  const renderTotalsSection = () => {
    const subtotal = (invoice.items || []).reduce((sum: number, item) => sum + ((item.quantity || 0) * (item.unitPrice || 0)), 0);
    const taxAmount = invoice.taxes || 0;
    const discountAmount = invoice.discounts || 0;
    const total = invoice.totalAmount || (subtotal + taxAmount - discountAmount);
    
    // Totals on the right side
    const totalsX = 130;
    doc.setFontSize(10);
    
    // Subtotal
    doc.setTextColor(...colors.secondary);
    doc.text('Subtotal:', totalsX, currentY);
    doc.setTextColor(...colors.primary);
    doc.text(`$${subtotal.toFixed(2)}`, 185, currentY, { align: 'right' });
    currentY += 8;
    
    // Discount (if applicable)
    if (discountAmount > 0) {
      doc.setTextColor(...colors.secondary);
      doc.text('Discount:', totalsX, currentY);
      doc.setTextColor(...colors.primary);
      doc.text(`-$${discountAmount.toFixed(2)}`, 185, currentY, { align: 'right' });
      currentY += 8;
    }
    
    // Tax (if applicable)
    if (taxAmount > 0) {
      doc.setTextColor(...colors.secondary);
      doc.text('Tax:', totalsX, currentY);
      doc.setTextColor(...colors.primary);
      doc.text(`$${taxAmount.toFixed(2)}`, 185, currentY, { align: 'right' });
      currentY += 8;
    }
    
    // Total with line separator
    doc.setDrawColor(...colors.border);
    doc.setLineWidth(0.5);
    doc.line(totalsX, currentY, 185, currentY);
    currentY += 8;
    
    doc.setFontSize(12);
    doc.setTextColor(...colors.primary);
    doc.text('TOTAL:', totalsX, currentY);
    doc.text(`$${total.toFixed(2)}`, 185, currentY, { align: 'right' });
    
    currentY += 20;
  };
  
  // Clean payment information
  const renderPaymentInfo = () => {
    const paymentInfo = [
      { label: 'Payment Method:', value: invoice.paymentMethod },
      { label: 'Payment Status:', value: invoice.paymentStatus }
    ].filter(item => item.value);
    
    if (paymentInfo.length > 0) {
      doc.setFontSize(10);
      
      paymentInfo.forEach(info => {
        doc.setTextColor(...colors.secondary);
        doc.text(info.label, 20, currentY);
        doc.setTextColor(...colors.primary);
        doc.text(info.value, 80, currentY);
        currentY += 8;
      });
      
      currentY += 10;
    }
  };
  
  // Professional notes and terms with page break protection
  const renderNotesAndTerms = () => {
    const sections = [];
    
    if (invoice.termsAndConditions) {
      sections.push({ title: 'Terms and Conditions', content: invoice.termsAndConditions });
    }
    
    if (invoice.notes) {
      sections.push({ title: 'Notes', content: invoice.notes });
    }
    
    sections.forEach((section, index) => {
      if (index > 0) currentY += 15;
      
      // Check if we need a new page for this section
      const pageHeight = doc.internal.pageSize.height;
      const estimatedSectionHeight = 60; // Estimate section height
      
      if (currentY + estimatedSectionHeight > pageHeight - 50) {
        doc.addPage();
        currentY = 20;
      }
      
      // Section separator line
      doc.setDrawColor(...colors.border);
      doc.setLineWidth(0.5);
      doc.line(20, currentY, 190, currentY);
      currentY += 10;
      
      doc.setFontSize(11);
      doc.setTextColor(...colors.primary);
      doc.text(section.title.toUpperCase(), 20, currentY);
      currentY += 8;
      
      doc.setFontSize(10);
      doc.setTextColor(...colors.secondary);
      const wrappedContent = doc.splitTextToSize(section.content, 170);
      
      if (Array.isArray(wrappedContent)) {
        wrappedContent.forEach((line: string) => {
          // Check if we need a new page for each line
          if (currentY > pageHeight - 50) {
            doc.addPage();
            currentY = 20;
          }
          doc.text(line, 20, currentY);
          currentY += 6;
        });
      } else {
        doc.text(wrappedContent, 20, currentY);
        currentY += 6;
      }
      
      currentY += 5;
    });
  };
  
  // Custom fields (if any)
  const renderCustomFields = () => {
    const customFields = invoice.customFields?.filter(field => field.value) || [];
    
    if (customFields.length > 0) {
      // Section separator
      doc.setDrawColor(...colors.border);
      doc.setLineWidth(0.5);
      doc.line(20, currentY, 190, currentY);
      currentY += 10;
      
      doc.setFontSize(11);
      doc.setTextColor(...colors.primary);
      doc.text('ADDITIONAL INFORMATION', 20, currentY);
      currentY += 8;
      
      doc.setFontSize(10);
      customFields.forEach(field => {
        doc.setTextColor(...colors.secondary);
        doc.text(field.name + ':', 20, currentY);
        doc.setTextColor(...colors.primary);
        doc.text(field.value, 80, currentY);
        currentY += 8;
      });
      
      currentY += 10;
    }
  };
  
  // Minimal, professional footer with proper spacing
  const renderFooter = () => {
    const pageHeight = doc.internal.pageSize.height;
    
    // Ensure we have enough space at the bottom (at least 40 units from bottom)
    const minBottomMargin = 40;
    const maxFooterY = pageHeight - minBottomMargin;
    
    // Add extra spacing before footer to prevent content overflow
    currentY += 20;
    
    // Position footer with proper spacing
    const footerY = Math.min(currentY + 25, maxFooterY);
    
    // Check if we need a new page
    if (footerY > maxFooterY) {
      doc.addPage();
      currentY = 20;
      const newFooterY = currentY + 25;
      
      // Footer separator
      doc.setDrawColor(...colors.border);
      doc.setLineWidth(0.5);
      doc.line(20, newFooterY - 10, 190, newFooterY - 10);
      
      // Simple footer text
      doc.setFontSize(9);
      doc.setTextColor(...colors.accent);
      doc.text('Thank you for your business.', 20, newFooterY);
      
      // Generation date (right aligned)
      doc.text(`Generated: ${format(new Date(), 'MMMM dd, yyyy')}`, 190, newFooterY, { align: 'right' });
    } else {
      // Footer separator
      doc.setDrawColor(...colors.border);
      doc.setLineWidth(0.5);
      doc.line(20, footerY - 10, 190, footerY - 10);
      
      // Simple footer text
      doc.setFontSize(9);
      doc.setTextColor(...colors.accent);
      doc.text('Thank you for your business.', 20, footerY);
      
      // Generation date (right aligned)
      doc.text(`Generated: ${format(new Date(), 'MMMM dd, yyyy')}`, 190, footerY, { align: 'right' });
    }
  };
  
  // Execute all rendering functions
  renderItemsTable();
  renderTotalsSection();
  renderPaymentInfo();
  renderNotesAndTerms();
  renderCustomFields();
  renderFooter();
  
  return doc;
}

export function downloadInvoicePDF(invoice: Invoice) {
  const doc = generateInvoicePDF(invoice);
  const filename = `invoice-${invoice.invoiceNumber || invoice.id || 'unknown'}.pdf`;
  doc.save(filename);
}

export function previewInvoicePDF(invoice: Invoice) {
  const doc = generateInvoicePDF(invoice);
  const pdfBlob = doc.output('blob');
  const url = URL.createObjectURL(pdfBlob);
  window.open(url, '_blank');
}

// Helper function to demonstrate dynamic capabilities
export function downloadInvoicePDFWithPreview(invoice: Invoice) {
  console.log('🎨 Generating adaptive professional PDF for:', {
    invoiceNumber: invoice.invoiceNumber,
    status: invoice.status,
    hasCustomFields: invoice.customFields?.length || 0,
    hasShipping: !!invoice.shippingAddress,
    itemCount: invoice.items?.length || 0
  });
  
  return downloadInvoicePDF(invoice);
}
