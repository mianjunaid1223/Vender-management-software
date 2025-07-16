import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Contract, Invoice } from './types';
import { format } from 'date-fns';
import { fetchCompany } from './data';

// Helper to format currency
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
};

// --- Contract PDF Generation ---
export async function generateContractPDF(contract: Contract): Promise<jsPDF> {
  const doc = new jsPDF();
  let yPos = 20;

  const company = await fetchCompany();

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.text('Contract Summary', 105, yPos, { align: 'center' });
  yPos += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(100);
  doc.text(contract.title, 105, yPos, { align: 'center' });
  yPos += 15;

  const drawSection = (title: string, content: () => void) => {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    doc.text(title, 20, yPos);
    yPos += 2;
    doc.setLineWidth(0.2);
    doc.line(20, 190, yPos, yPos);
    yPos += 8;
    content();
  };

  const addMetadata = (label: string, value: string | number | undefined) => {
    if (value) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(50);
      doc.text(label, 25, yPos);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0);
      doc.text(String(value), 70, yPos);
      yPos += 7;
    }
  };

  // Parties Section
  drawSection('Parties Involved', () => {
    if (company) {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(50);
        doc.text('Client:', 25, yPos);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0);
        doc.text(company.name, 70, yPos);
        yPos += 5;
        if(company.primaryAddress) {
             doc.text(`${company.primaryAddress.street}, ${company.primaryAddress.city}, ${company.primaryAddress.state}`, 70, yPos);
             yPos += 5;
        }
    }
    yPos += 3;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(50);
    doc.text('Vendor:', 25, yPos);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0);
    doc.text(contract.vendorName, 70, yPos);
    yPos += 7;
  });
  
  yPos += 5;

  drawSection('Contract Details', () => {
    addMetadata('Contract ID:', contract.id);
    addMetadata('Status:', contract.status);
    addMetadata('Contract Value:', formatCurrency(contract.value));
    addMetadata('Payment Terms:', contract.paymentTerms);
    addMetadata('Start Date:', format(new Date(contract.startDate), 'MMMM dd, yyyy'));
    addMetadata('End Date:', format(new Date(contract.endDate), 'MMMM dd, yyyy'));
    yPos += 3;
  });

  if (contract.description) {
    drawSection('Description / Scope of Work', () => {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(50);
      const descriptionLines = doc.splitTextToSize(contract.description, 165);
      doc.text(descriptionLines, 25, yPos);
      yPos += descriptionLines.length * 5 + 5;
    });
  }

  const pageHeight = doc.internal.pageSize.height;
  doc.setLineWidth(0.2);
  doc.setDrawColor(150);
  doc.line(20, pageHeight - 25, 190, pageHeight - 25);
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(`Generated on: ${format(new Date(), 'MM/dd/yyyy')}`, 20, pageHeight - 20);
  doc.text('VendorVerse | Confidential', 190, pageHeight - 20, { align: 'right' });

  return doc;
}

export async function downloadContractPDF(contract: Contract) {
  const doc = await generateContractPDF(contract);
  const filename = `Contract-${contract.vendorName.replace(/\s+/g, '-')}-${contract.id}.pdf`;
  doc.save(filename);
}

// --- Invoice PDF Generation ---
export function generateInvoicePDF(invoice: Invoice): jsPDF {
  const doc = new jsPDF();
  let yPos = 20;

  // Header
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', 20, yPos);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Invoice #: ${invoice.invoiceNumber}`, 20, yPos + 8);
  doc.text(`Status: ${invoice.status}`, 20, yPos + 14);

  // Seller info
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  const seller = invoice.seller || { name: "Your Company" };
  const sellerAddress = seller.address ? `${seller.address.street}, ${seller.address.city}` : '';
  doc.text(seller.name, 190, yPos, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.text(sellerAddress, 190, yPos + 5, { align: 'right' });
  
  yPos += 30;

  // Buyer info and dates
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('BILL TO', 20, yPos);
  
  doc.setFont('helvetica', 'normal');
  const buyer = invoice.buyer || { name: invoice.vendorName };
  const buyerAddress = buyer.address ? `${buyer.address.street}\n${buyer.address.city}, ${buyer.address.state} ${buyer.address.zipCode}` : '';
  doc.text(buyer.name, 20, yPos + 6);
  if (buyerAddress) {
    doc.text(buyerAddress, 20, yPos + 12);
  }

  const invoiceDate = `Invoice Date: ${format(new Date(invoice.invoiceDate), 'MMM dd, yyyy')}`;
  const dueDate = `Due Date: ${format(new Date(invoice.invoiceDueDate), 'MMM dd, yyyy')}`;
  const terms = `Payment Terms: ${invoice.paymentTerms}`;

  doc.text(invoiceDate, 190, yPos, { align: 'right' });
  doc.text(dueDate, 190, yPos + 6, { align: 'right' });
  doc.text(terms, 190, yPos + 12, { align: 'right' });
  
  yPos += 30;

  // Items table
  const tableBody = (invoice.items || []).map(item => [
    item.description,
    item.quantity.toString(),
    formatCurrency(item.unitPrice),
    formatCurrency(item.total)
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['Description', 'Quantity', 'Unit Price', 'Total']],
    body: tableBody,
    theme: 'striped',
    headStyles: { fillColor: [34, 43, 62] },
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Totals section
  const totals = [
    ['Subtotal', formatCurrency(invoice.subtotal)],
    ['Taxes', formatCurrency(invoice.taxes)],
    ['Discounts', `-${formatCurrency(invoice.discounts)}`],
    ['Total Amount', formatCurrency(invoice.totalAmount)],
  ];

  autoTable(doc, {
    startY: yPos,
    body: totals,
    theme: 'plain',
    tableWidth: 60,
    margin: { left: 130 },
    bodyStyles: { fontStyle: 'bold' },
  });
  
  // Footer
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(10);
  doc.setTextColor(150);
  doc.text('Thank you for your business!', 105, pageHeight - 15, { align: 'center' });

  return doc;
}

export function downloadInvoicePDF(invoice: Invoice) {
  const doc = generateInvoicePDF(invoice);
  const filename = `Invoice-${invoice.invoiceNumber}.pdf`;
  doc.save(filename);
}

export function previewInvoicePDF(invoice: Invoice) {
  const doc = generateInvoicePDF(invoice);
  doc.output('dataurlnewwindow');
}
