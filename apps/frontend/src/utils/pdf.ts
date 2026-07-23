import html2canvas from "html2canvas";
import jsPDF from "jspdf";

/**
 * Captures a DOM element (e.g. certificate layout container) and automatically
 * downloads it as a high-quality PDF file with standard A4 landscape scaling.
 */
export async function downloadCertificateAsPdf(
  element: HTMLElement,
  filename: string = "Certificate.pdf"
): Promise<void> {
  if (!element) return;

  try {
    // Capture element into canvas with explicit standard A4 landscape dimensions (1123px x 794px at 96 DPI)
    const canvas = await html2canvas(element, {
      scale: 2, // High resolution (2246x1588) for crisp text and vector graphics
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      logging: false,
      scrollX: 0,
      scrollY: 0,
      windowWidth: 1200,
      windowHeight: 850,
      onclone: (clonedDoc, clonedElement) => {
        // Target the cloned element or query the certificate container
        const target = (clonedElement || clonedDoc.querySelector(".print-certificate-container")) as HTMLElement;
        if (target) {
          // Force standard A4 Landscape dimensions (1123px width x 794px height)
          target.style.width = "1123px";
          target.style.height = "794px";
          target.style.minWidth = "1123px";
          target.style.minHeight = "794px";
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
            parent.style.width = "1123px";
            parent.style.maxWidth = "none";
            parent.style.minWidth = "1123px";
            parent.style.padding = "0";
            parent.style.margin = "0";
            parent.style.overflow = "visible";
            parent = parent.parentElement;
          }
        }
      },
    });

    const imgData = canvas.toDataURL("image/png");

    // Create A4 Landscape PDF document
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    const pdfWidth = pdf.internal.pageSize.getWidth(); // 297 mm
    const pdfHeight = pdf.internal.pageSize.getHeight(); // 210 mm

    // Add standard 15mm margins around the certificate so it is elegantly framed on paper/PDF
    const marginX = 15; // 15mm left & right margins
    const certWidth = pdfWidth - (marginX * 2); // 267 mm width
    const certHeight = certWidth / 1.414; // ~188.8 mm height preserving A4 landscape aspect ratio
    const marginY = (pdfHeight - certHeight) / 2; // ~10.6 mm top & bottom margins (centered)

    // Place certificate inside printable page margins
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

