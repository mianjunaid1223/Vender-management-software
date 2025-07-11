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
  
  // Professional color scheme - enhanced with status and element colors
  const colors = {
    primary: [47, 57, 71] as [number, number, number],      // Professional dark blue-gray
    secondary: [71, 85, 105] as [number, number, number],    // Medium gray
    accent: [148, 163, 184] as [number, number, number],     // Light gray
    background: [249, 250, 251] as [number, number, number], // Very light gray
    border: [226, 232, 240] as [number, number, number],     // Border gray
    
    // Status colors
    statusPaid: [34, 197, 94] as [number, number, number],   // Green
    statusOverdue: [239, 68, 68] as [number, number, number], // Red
    statusPending: [251, 146, 60] as [number, number, number], // Orange
    statusDraft: [156, 163, 175] as [number, number, number], // Gray
    
    // Financial colors
    discount: [239, 68, 68] as [number, number, number],     // Red for discounts
    tax: [59, 130, 246] as [number, number, number],         // Blue for taxes
    total: [16, 185, 129] as [number, number, number],       // Green for total
    subtotal: [107, 114, 128] as [number, number, number],   // Gray for subtotal
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
    
    // Status (simple text with color coding)
    if (invoice.status) {
      doc.setFontSize(11);
      
      // Set color based on status
      let statusColor = colors.secondary;
      switch (invoice.status.toLowerCase()) {
        case 'paid':
          statusColor = colors.statusPaid;
          break;
        case 'overdue':
          statusColor = colors.statusOverdue;
          break;
        case 'pending':
        case 'unpaid':
          statusColor = colors.statusPending;
          break;
        case 'draft':
          statusColor = colors.statusDraft;
          break;
        default:
          statusColor = colors.secondary;
      }
      
      doc.setTextColor(...statusColor);
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
    
    // Table rows - clean and professional with alternating colors
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
      
      // Subtle alternating row background
      if (index % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(20, currentY - 3, 170, 12, 'F');
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
      
      // Quantity, rate, and amount with enhanced styling
      doc.setTextColor(...colors.secondary);
      doc.text((item.quantity || 0).toString(), 130, currentY, { align: 'center' });
      doc.text(`$${(item.unitPrice || 0).toFixed(2)}`, 150, currentY, { align: 'center' });
      
      // Amount in primary color for emphasis
      doc.setTextColor(...colors.primary);
      doc.setFont('helvetica', 'bold');
      doc.text(`$${((item.quantity || 0) * (item.unitPrice || 0)).toFixed(2)}`, 185, currentY, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      
      currentY += 10;
    });
    
    // Bottom border
    doc.setDrawColor(...colors.border);
    doc.line(20, currentY, 190, currentY);
    currentY += 10; // Reduced from 15
  };
  
  // Professional totals section with color-coded amounts
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
    doc.setTextColor(...colors.subtotal);
    doc.text(`$${subtotal.toFixed(2)}`, 185, currentY, { align: 'right' });
    currentY += 6;
    
    // Discount (if applicable) - Red color for discounts
    if (discountAmount > 0) {
      doc.setTextColor(...colors.secondary);
      doc.text('Discount:', totalsX, currentY);
      doc.setTextColor(...colors.discount);
      
      // Check if discount is percentage-based or fixed amount
      const isPercentageDiscount = invoice.discountRate && invoice.discountRate > 0;
      if (isPercentageDiscount) {
        doc.text(`-$${discountAmount.toFixed(2)} (${invoice.discountRate}%)`, 185, currentY, { align: 'right' });
      } else {
        doc.text(`-$${discountAmount.toFixed(2)}`, 185, currentY, { align: 'right' });
      }
      currentY += 6;
    }
    
    // Tax (if applicable) - Blue color for taxes
    if (taxAmount > 0) {
      doc.setTextColor(...colors.secondary);
      doc.text('Tax:', totalsX, currentY);
      doc.setTextColor(...colors.tax);
      
      // Check if tax is percentage-based or fixed amount
      const isPercentage = invoice.taxRate && invoice.taxRate > 0;
      if (isPercentage) {
        doc.text(`$${taxAmount.toFixed(2)} (${invoice.taxRate}%)`, 185, currentY, { align: 'right' });
      } else {
        doc.text(`$${taxAmount.toFixed(2)}`, 185, currentY, { align: 'right' });
      }
      currentY += 6;
    }
    
    // Total with line separator - Green color for emphasis
    doc.setDrawColor(...colors.border);
    doc.setLineWidth(0.5);
    doc.line(totalsX, currentY + 2, 185, currentY + 2);
    currentY += 8;
    
    doc.setFontSize(12);
    doc.setTextColor(...colors.secondary);
    doc.text('TOTAL:', totalsX, currentY);
    doc.setTextColor(...colors.total);
    doc.text(`$${total.toFixed(2)}`, 185, currentY, { align: 'right' });
    
    currentY += 15;
  };
  
  // Clean payment information with color-coded status
  const renderPaymentInfo = () => {
    const paymentInfo = [
      { label: 'Payment Method:', value: invoice.paymentMethod },
      { label: 'Payment Status:', value: invoice.paymentStatus, isStatus: true }
    ].filter(item => item.value);
    
    if (paymentInfo.length > 0) {
      doc.setFontSize(10);
      
      paymentInfo.forEach(info => {
        doc.setTextColor(...colors.secondary);
        doc.text(info.label, 20, currentY);
        
        // Color code payment status
        if (info.isStatus) {
          let statusColor = colors.primary;
          switch (info.value?.toLowerCase()) {
            case 'paid':
              statusColor = colors.statusPaid;
              break;
            case 'overdue':
              statusColor = colors.statusOverdue;
              break;
            case 'pending':
            case 'partial':
              statusColor = colors.statusPending;
              break;
            default:
              statusColor = colors.primary;
          }
          doc.setTextColor(...statusColor);
        } else {
          doc.setTextColor(...colors.primary);
        }
        
        doc.text(info.value, 80, currentY);
        currentY += 6;
      });
      
      currentY += 8;
    }
  };
  
  // Professional notes and terms with optimized spacing
  const renderNotesAndTerms = () => {
    const sections = [];
    
    if (invoice.termsAndConditions) {
      sections.push({ title: 'Terms and Conditions', content: invoice.termsAndConditions });
    }
    
    if (invoice.notes) {
      sections.push({ title: 'Notes', content: invoice.notes });
    }
    
    sections.forEach((section, index) => {
      if (index > 0) currentY += 10; // Reduced spacing
      
      // Check if we need a new page for this section
      const pageHeight = doc.internal.pageSize.height;
      const estimatedSectionHeight = 40; // Reduced estimate
      
      if (currentY + estimatedSectionHeight > pageHeight - 30) {
        doc.addPage();
        currentY = 20;
      }
      
      // Section separator line
      doc.setDrawColor(...colors.border);
      doc.setLineWidth(0.5);
      doc.line(20, currentY, 190, currentY);
      currentY += 8; // Reduced from 10
      
      doc.setFontSize(11);
      doc.setTextColor(...colors.primary);
      doc.text(section.title.toUpperCase(), 20, currentY);
      currentY += 6; // Reduced from 8
      
      doc.setFontSize(10);
      doc.setTextColor(...colors.secondary);
      const wrappedContent = doc.splitTextToSize(section.content, 170);
      
      if (Array.isArray(wrappedContent)) {
        wrappedContent.forEach((line: string) => {
          // Check if we need a new page for each line
          if (currentY > pageHeight - 30) {
            doc.addPage();
            currentY = 20;
          }
          doc.text(line, 20, currentY);
          currentY += 5; // Reduced from 6
        });
      } else {
        doc.text(wrappedContent, 20, currentY);
        currentY += 5;
      }
      
      currentY += 3; // Reduced from 5
    });
  };
  
  // Custom fields with optimized spacing
  const renderCustomFields = () => {
    const customFields = invoice.customFields?.filter(field => field.value) || [];
    
    if (customFields.length > 0) {
      // Section separator
      doc.setDrawColor(...colors.border);
      doc.setLineWidth(0.5);
      doc.line(20, currentY, 190, currentY);
      currentY += 8; // Reduced from 10
      
      doc.setFontSize(11);
      doc.setTextColor(...colors.primary);
      doc.text('ADDITIONAL INFORMATION', 20, currentY);
      currentY += 6; // Reduced from 8
      
      doc.setFontSize(10);
      customFields.forEach(field => {
        doc.setTextColor(...colors.secondary);
        doc.text(field.name + ':', 20, currentY);
        doc.setTextColor(...colors.primary);
        doc.text(field.value, 80, currentY);
        currentY += 6; // Reduced from 8
      });
      
      currentY += 5; // Reduced from 10
    }
  };
  
  // Minimal, professional footer with optimized spacing
  const renderFooter = () => {
    const pageHeight = doc.internal.pageSize.height;
    const minBottomMargin = 25;
    const maxFooterY = pageHeight - minBottomMargin;
    
    // Only add minimal spacing before footer
    currentY += 10;
    
    // Calculate footer position - use current position if it fits, otherwise use bottom
    const footerY = Math.min(currentY + 15, maxFooterY);
    
    // Only create new page if absolutely necessary
    if (currentY + 20 > pageHeight - minBottomMargin) {
      doc.addPage();
      const newFooterY = 30; // Start footer early on new page
      
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
