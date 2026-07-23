import html2canvas from "html2canvas";
import jsPDF from "jspdf";

/**
 * Computes a SHA-256 content fingerprint hex digest for the certificate payload.
 * This is a lightweight integrity hash (NOT a cryptographic signature — no secret key is involved).
 * It allows offline verification that the certificate content has not been altered post-generation.
 */
export async function computeCertificateFingerprint(
  credId: string,
  recipientName: string,
  courseTitle: string,
  orgName: string = "EdgeTalent Academy"
): Promise<string> {
  const payload = `EDGETALENT_CERTIFICATE::${credId || "GENERIC"}::${recipientName || "RECIPIENT"}::${courseTitle || "COURSE"}::${orgName}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(payload);
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Captures a DOM element (e.g. certificate layout container) and automatically
 * downloads it as a high-quality rasterized PDF file formatted for A5 landscape.
 * Embeds a SHA-256 content fingerprint in PDF metadata for integrity verification.
 */
export async function downloadCertificateAsPdf(
  element: HTMLElement,
  filename: string = "Certificate.pdf"
): Promise<void> {
  if (!element) return;

  try {
    // Extract text content from the certificate container
    const orgName = element.querySelector("span")?.textContent?.trim() || "EdgeTalent Academy";
    const recipientName = element.querySelector("h2")?.textContent?.trim() || "";
    const courseTitle = element.querySelector("h3")?.textContent?.trim() || "";

    // Extract Credential ID if present
    const credIdElement = element.querySelector("span[style*='monospace']");
    const credId = credIdElement?.textContent?.trim() || "";

    // Compute SHA-256 content fingerprint via Web Crypto API
    const fingerprint = await computeCertificateFingerprint(credId, recipientName, courseTitle, orgName);

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

    // Embed content fingerprint metadata into PDF Document Dictionary
    pdf.setProperties({
      title: filename.replace(/\.pdf$/i, ""),
      subject: `EdgeTalent Certificate (ContentFingerprint:${fingerprint})`,
      author: orgName,
      keywords: `Certificate, ContentFingerprint:${fingerprint}, CredentialID:${credId}`,
      creator: "EdgeTalent Certificate Generator v1.0",
    });

    const pdfWidth = pdf.internal.pageSize.getWidth(); // 210 mm
    const pdfHeight = pdf.internal.pageSize.getHeight(); // 148 mm

    // Add standard 8mm margins around the certificate for compact, elegant A5 output
    const marginX = 8; // 8mm left & right margins
    const certWidth = pdfWidth - (marginX * 2); // 194 mm width
    const certHeight = certWidth / 1.414; // ~137.2 mm height preserving landscape aspect ratio
    const marginY = (pdfHeight - certHeight) / 2; // ~5.4 mm top & bottom margins (centered)

    // Place high-resolution certificate image inside printable A5 page margins
    // No invisible text overlay — the PDF is a clean rasterized image to avoid text position mismatches
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

