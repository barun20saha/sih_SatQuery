import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export async function exportResultsToPDF() {
  const element = document.getElementById('results-content');
  if (!element) return;

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      logging: false,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save('SatQuery_Analysis_Report.pdf');
  } catch (err) {
    console.error('PDF generation error:', err);
  }
}

// Alias fallback to prevent named import mismatches
export const exportToPDF = exportResultsToPDF;