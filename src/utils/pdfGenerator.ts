import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export async function generatePdfFromElement(elementId: string, fileName: string = 'Presupuesto-Silocom.pdf'): Promise<boolean> {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      console.error('Element to export to PDF not found:', elementId);
      return false;
    }

    // Capture the element in high resolution canvas
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'letter');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = pdfWidth - 10; // 5mm margins
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 5;

    // Add first page
    pdf.addImage(imgData, 'PNG', 5, position, imgWidth, imgHeight);
    heightLeft -= (pdfHeight - 10);

    // If multi-page
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 5, position, imgWidth, imgHeight);
      heightLeft -= (pdfHeight - 10);
    }

    pdf.save(fileName);
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    // Fallback to browser print dialog
    window.print();
    return false;
  }
}
