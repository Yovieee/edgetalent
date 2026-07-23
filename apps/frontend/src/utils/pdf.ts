import html2canvas from "html2canvas";
import jsPDF from "jspdf";

/**
 * Captures a DOM element (e.g. certificate layout container) and automatically
 * downloads it as a high-quality PDF file.
 */
export async function downloadCertificateAsPdf(
  element: HTMLElement,
  filename: string = "Certificate.pdf"
): Promise<void> {
  if (!element) return;

  try {
    // Capture element into canvas with high resolution scale
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      logging: false,
      scrollX: 0,
      scrollY: 0,
    });

    const imgData = canvas.toDataURL("image/png");

    // Create A4 Landscape PDF document
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    // Fit image to PDF dimensions
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

    // Ensure filename ends with .pdf
    const cleanFilename = filename.toLowerCase().endsWith(".pdf")
      ? filename
      : `${filename}.pdf`;

    pdf.save(cleanFilename);
  } catch (error) {
    console.error("Error generating certificate PDF:", error);
    alert("Failed to download PDF certificate. Please try again.");
    throw error;
  }
}
