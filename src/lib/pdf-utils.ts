import jsPDF from 'jspdf';
import { Contract } from './types';
import { format } from 'date-fns';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export function generateContractPDF(contract: Contract): jsPDF {
  const doc = new jsPDF();
  let yPos = 20;

  // --- Header ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.text('Contract Summary', 105, yPos, { align: 'center' });
  yPos += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(100);
  doc.text(contract.title, 105, yPos, { align: 'center' });
  yPos += 15;

  // --- Main Content Section ---
  const drawSection = (title: string, content: () => void) => {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    doc.text(title, 20, yPos);
    yPos += 2;
    doc.setLineWidth(0.2);
    doc.line(20, yPos, 190, yPos);
    yPos += 8;
    content();
  };

  const addMetadata = (label: string, value: string | number) => {
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

  // Vendor & Contract Info Section
  drawSection('Vendor & Contract Information', () => {
    addMetadata('Vendor Name:', contract.vendorName);
    addMetadata('Contract ID:', contract.id);
    addMetadata('Status:', contract.status);
    yPos += 3;
  });

  // Financials Section
  drawSection('Financial Details', () => {
    addMetadata('Contract Value:', `$${contract.value.toLocaleString()}`);
    addMetadata('Payment Terms:', contract.paymentTerms);
    yPos += 3;
  });

  // Timeline Section
  drawSection('Contract Timeline', () => {
    addMetadata('Start Date:', format(new Date(contract.startDate), 'MMMM dd, yyyy'));
    addMetadata('End Date:', format(new Date(contract.endDate), 'MMMM dd, yyyy'));
    yPos += 3;
  });

  // Description Section
  if (contract.description) {
    drawSection('Description', () => {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(50);
      const descriptionLines = doc.splitTextToSize(contract.description, 165);
      doc.text(descriptionLines, 25, yPos);
      yPos += descriptionLines.length * 5 + 5;
    });
  }

  // --- Footer ---
  const pageHeight = doc.internal.pageSize.height;
  doc.setLineWidth(0.2);
  doc.setDrawColor(150);
  doc.line(20, pageHeight - 25, 190, pageHeight - 25);
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(
    `Generated on: ${format(new Date(), 'MM/dd/yyyy')}`,
    20,
    pageHeight - 20
  );
  doc.text(
    'VendorVerse | Confidential',
    190,
    pageHeight - 20,
    { align: 'right' }
  );

  return doc;
}


export function downloadContractPDF(contract: Contract) {
  const doc = generateContractPDF(contract);
  const filename = `Contract-${contract.vendorName.replace(/\s+/g, '-')}-${contract.id}.pdf`;
  doc.save(filename);
}
