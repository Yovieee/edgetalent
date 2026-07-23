import html2canvas from "html2canvas";
import jsPDF from "jspdf";

/**
 * Captures a DOM element (e.g. certificate layout container) and automatically
 * downloads it as a high-quality PDF file formatted for A5 landscape.
 */
export async function downloadCertificateAsPdf(
  element: HTMLElement,
  filename: string = "Certificate.pdf"
): Promise<void> {
  if (!element) return;

  try {
    // Capture element into canvas with explicit A5 landscape dimensions (840px x 594px at 96 DPI)
    const canvas = await html2canvas(element, {
      scale: 2, // High resolution (1680x1188) for crisp text and graphics
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      logging: false,
      scrollX: 0,
      scrollY: 0,
      windowWidth: 1000,
      windowHeight: 700,
      onclone: (clonedDoc, clonedElement) => {
        // Target the cloned element or query the certificate container
        const target = (clonedElement || clonedDoc.querySelector(".print-certificate-container")) as HTMLElement;
        if (target) {
          // Force A5 Landscape dimensions (840px width x 594px height)
          target.style.width = "840px";
          target.style.height = "594px";
          target.style.minWidth = "840px";
          target.style.minHeight = "594px";
          target.style.maxWidth = "none";
          target.style.maxHeight = "none";
          target.style.transform = "none";
          target.style.position = "relative";
          target.style.boxSizing = "border-box";
          target.style.margin = "0";
          target.style.borderRadius = "0";
          target.style.boxShadow = "none";

          // Unconstrain parent container wrappers in cloned document so full width is rendered
          let parent = target.parentElement;
          while (parent && parent !== clonedDoc.body) {
            parent.style.width = "840px";
            parent.style.maxWidth = "none";
            parent.style.minWidth = "840px";
            parent.style.padding = "0";
            parent.style.margin = "0";
            parent.style.overflow = "visible";
            parent = parent.parentElement;
          }
        }
      },
    });

    const imgData = canvas.toDataURL("image/png");

    // Create A5 Landscape PDF document (210mm x 148mm)
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a5",
    });

    const pdfWidth = pdf.internal.pageSize.getWidth(); // 210 mm
    const pdfHeight = pdf.internal.pageSize.getHeight(); // 148 mm

    // Add standard 8mm margins around the certificate for compact, elegant A5 output
    const marginX = 8; // 8mm left & right margins
    const certWidth = pdfWidth - (marginX * 2); // 194 mm width
    const certHeight = certWidth / 1.414; // ~137.2 mm height preserving landscape aspect ratio
    const marginY = (pdfHeight - certHeight) / 2; // ~5.4 mm top & bottom margins (centered)

    // Place certificate inside printable A5 page margins
    pdf.addImage(imgData, "PNG", marginX, marginY, certWidth, certHeight, undefined, "FAST");

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

