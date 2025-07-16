import jsPDF from 'jspdf';
import { Contract } from './types';
import { format } from 'date-fns';

// Extend jsPDF type to include autoTable if it's used, though this basic version doesn't.
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export function generateContractPDF(contract: Contract) {
  const doc = new jsPDF();
  let yPos = 20;

  // --- Header ---
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('Contract Summary', 105, yPos, { align: 'center' });
  yPos += 15;
  
  doc.setLineWidth(0.5);
  doc.line(20, yPos - 5, 190, yPos - 5);

  // --- Contract Title ---
  doc.setFontSize(16);
  doc.setFont('helvetica', 'normal');
  doc.text(contract.title, 20, yPos);
  yPos += 10;

  // --- Vendor Details ---
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Vendor:', 20, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(contract.vendorName, 45, yPos);
  yPos += 10;
  
  // --- Metadata Section ---
  const addMetadata = (label: string, value: string | number) => {
    if (value) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(label, 20, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(String(value), 60, yPos);
      yPos += 7;
    }
  };

  addMetadata('Status:', contract.status);
  addMetadata('Value:', `$${contract.value.toLocaleString()}`);
  addMetadata('Start Date:', format(new Date(contract.startDate), 'MMMM dd, yyyy'));
  addMetadata('End Date:', format(new Date(contract.endDate), 'MMMM dd, yyyy'));
  addMetadata('Payment Terms:', contract.paymentTerms);
  yPos += 5;

  // --- Description ---
  if (contract.description) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Description:', 20, yPos);
    yPos += 7;
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const descriptionLines = doc.splitTextToSize(contract.description, 170);
    doc.text(descriptionLines, 20, yPos);
    yPos += descriptionLines.length * 5 + 5;
  }

  // --- Footer ---
  const pageHeight = doc.internal.pageSize.height;
  doc.setLineWidth(0.5);
  doc.line(20, pageHeight - 20, 190, pageHeight - 20);
  doc.setFontSize(8);
  doc.text(`Generated on: ${format(new Date(), 'MM/dd/yyyy')}`, 20, pageHeight - 15);
  doc.text(`Contract ID: ${contract.id}`, 190, pageHeight - 15, { align: 'right' });


  return doc;
}

export function downloadContractPDF(contract: Contract) {
  const doc = generateContractPDF(contract);
  const filename = `contract-${contract.vendorName.replace(/\s+/g, '-')}-${contract.id}.pdf`;
  doc.save(filename);
}
