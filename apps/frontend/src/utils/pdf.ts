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

/** A measured text element from the cloned DOM, stored in normalized (0–1) coordinates. */
interface TextLayer {
  text: string;
  /** X position normalized to container width (0–1). Interpretation depends on align. */
  nx: number;
  /** Y baseline position normalized to container height (0–1). */
  ny: number;
  /** Font size normalized to container height (0–1). */
  nFontSize: number;
  align: "center" | "left" | "right";
}

/**
 * Measures a DOM element's text position relative to a container and returns
 * normalized coordinates suitable for mapping onto the PDF page.
 */
function measureElement(
  el: Element | null,
  containerRect: DOMRect,
  clonedDoc: Document,
  align: "center" | "left" | "right" = "center",
  textOverride?: string
): TextLayer | null {
  if (!el) return null;
  const text = textOverride ?? el.textContent?.trim() ?? "";
  if (!text) return null;

  const rect = el.getBoundingClientRect();
  const style = clonedDoc.defaultView?.getComputedStyle(el);
  const fontSize = parseFloat(style?.fontSize || "16");

  // Horizontal position relative to container, based on alignment
  let px: number;
  if (align === "center") px = rect.left + rect.width / 2 - containerRect.left;
  else if (align === "right") px = rect.right - containerRect.left;
  else px = rect.left - containerRect.left;

  // Vertical baseline: approximate at top-of-element + ascender (≈ 80% of fontSize)
  // For elements with vertical padding, the text sits inside the content box,
  // so we use (top + bottom) / 2 + fontSize * 0.3 as a stable baseline estimate.
  const midY = (rect.top + rect.bottom) / 2 - containerRect.top;
  const py = midY + fontSize * 0.3;

  return {
    text,
    nx: px / containerRect.width,
    ny: py / containerRect.height,
    nFontSize: fontSize / containerRect.height,
    align,
  };
}

/**
 * Captures a DOM element (e.g. certificate layout container) and automatically
 * downloads it as a high-quality PDF file formatted for A5 landscape.
 * An invisible text layer is overlaid using dynamically measured DOM positions
 * so selectable text aligns precisely with the rasterized image.
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

    // Collect dynamically measured text positions from the cloned DOM.
    // These are populated inside the onclone callback and consumed after canvas creation.
    const textLayers: TextLayer[] = [];

    // Fixed container dimensions used in onclone (A5 landscape at 96 DPI)
    const CONTAINER_W = 840;
    const CONTAINER_H = 594;

    // Capture element into canvas
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      logging: false,
      scrollX: 0,
      scrollY: 0,
      windowWidth: 1000,
      windowHeight: 700,
      onclone: (clonedDoc, clonedElement) => {
        const target = (clonedElement || clonedDoc.querySelector(".print-certificate-container")) as HTMLElement;
        if (!target) return;

        // Force A5 Landscape dimensions
        target.style.width = `${CONTAINER_W}px`;
        target.style.height = `${CONTAINER_H}px`;
        target.style.minWidth = `${CONTAINER_W}px`;
        target.style.minHeight = `${CONTAINER_H}px`;
        target.style.maxWidth = "none";
        target.style.maxHeight = "none";
        target.style.transform = "none";
        target.style.position = "relative";
        target.style.boxSizing = "border-box";
        target.style.margin = "0";
        target.style.borderRadius = "0";
        target.style.boxShadow = "none";

        // Unconstrain parent container wrappers so full width is rendered
        let parent = target.parentElement;
        while (parent && parent !== clonedDoc.body) {
          parent.style.width = `${CONTAINER_W}px`;
          parent.style.maxWidth = "none";
          parent.style.minWidth = `${CONTAINER_W}px`;
          parent.style.padding = "0";
          parent.style.margin = "0";
          parent.style.overflow = "visible";
          parent = parent.parentElement;
        }

        // --- Measure text element positions after layout is forced ---
        const cRect = target.getBoundingClientRect();
        const m = (el: Element | null, align: "center" | "left" | "right" = "center", textOverride?: string) =>
          measureElement(el, cRect, clonedDoc, align, textOverride);

        // 1. Organization name (span inside the blue badge)
        const orgSpan = target.querySelector('span[style*="letter-spacing"]');
        const orgLayer = m(orgSpan);
        if (orgLayer) textLayers.push(orgLayer);

        // 2. "CERTIFICATE OF COMPLETION" heading
        const h1 = target.querySelector("h1");
        const h1Layer = m(h1);
        if (h1Layer) textLayers.push(h1Layer);

        // 3. "THIS OFFICIAL CREDENTIAL IS PROUDLY PRESENTED TO" subtitle
        //    It's the first <p> with uppercase tracking inside the main body section
        const allPs = target.querySelectorAll("p");
        for (const p of allPs) {
          const txt = p.textContent?.trim() || "";
          if (txt.startsWith("THIS OFFICIAL CREDENTIAL")) {
            const layer = m(p);
            if (layer) textLayers.push(layer);
            break;
          }
        }

        // 4. Recipient name (h2)
        const h2 = target.querySelector("h2");
        const h2Layer = m(h2);
        if (h2Layer) textLayers.push(h2Layer);

        // 5. "for successfully completing..." paragraph
        for (const p of allPs) {
          const txt = p.textContent?.trim() || "";
          if (txt.startsWith("for successfully completing")) {
            const layer = m(p);
            if (layer) textLayers.push(layer);
            break;
          }
        }

        // 6. Course title (h3)
        const h3 = target.querySelector("h3");
        const h3Layer = m(h3);
        if (h3Layer) textLayers.push(h3Layer);

        // 7. Skill badges (each ✓ Skill span)
        const skillSpans = target.querySelectorAll('span[style*="border: 1px solid"]');
        for (const span of skillSpans) {
          const layer = m(span);
          if (layer) textLayers.push(layer);
        }

        // 8. Credential ID label + value (left-aligned, bottom area)
        const monoSpans = target.querySelectorAll('span[style*="monospace"]');
        for (const ms of monoSpans) {
          // The credential ID container div holds the label and value
          const container = ms.closest("div");
          if (container) {
            const layer = m(container, "left");
            if (layer) textLayers.push(layer);
            break;
          }
        }

        // 9. Issue date and expiration date rows
        //    Find divs containing "Issue Date:" or "Expiration Date:" text
        const bottomDivs = target.querySelectorAll("div");
        for (const div of bottomDivs) {
          const txt = div.textContent?.trim() || "";
          if ((txt.includes("Issue Date:") || txt.includes("Expiration Date:")) && div.children.length <= 3) {
            const layer = m(div, "left");
            if (layer) textLayers.push(layer);
          }
        }

        // 10. Signatory name (right-aligned)
        const allDivs = target.querySelectorAll("div");
        for (const div of allDivs) {
          const txt = div.textContent?.trim() || "";
          if (txt === "Blasius Yonas Vikariandi" && div.children.length === 0) {
            const layer = m(div, "right");
            if (layer) textLayers.push(layer);
          }
          if (txt === "EdgeTalent CEO" && div.children.length === 0) {
            const layer = m(div, "right");
            if (layer) textLayers.push(layer);
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

    const pdfWidth = pdf.internal.pageSize.getWidth();   // 210 mm
    const pdfHeight = pdf.internal.pageSize.getHeight();  // 148 mm

    // Certificate image area with 8mm margins
    const marginX = 8;
    const certWidth = pdfWidth - (marginX * 2);           // 194 mm
    const certHeight = certWidth / 1.414;                  // ~137.2 mm
    const marginY = (pdfHeight - certHeight) / 2;          // ~5.4 mm

    // Place high-resolution certificate image
    pdf.addImage(imgData, "PNG", marginX, marginY, certWidth, certHeight, undefined, "FAST");

    // --- Overlay invisible selectable text layer using measured positions ---
    // PDF Text Rendering Mode 3 = invisible (neither fill nor stroke)
    (pdf.internal as any).out("3 Tr");

    // Conversion factor: normalized font size → jsPDF points
    // nFontSize is relative to container height; certHeight is in mm; 1pt = 0.3528mm
    const fontSizeScale = certHeight / 0.3528;

    for (const layer of textLayers) {
      // Convert normalized coordinates to PDF mm
      const pdfX = marginX + layer.nx * certWidth;
      const pdfY = marginY + layer.ny * certHeight;
      const pdfFontPt = layer.nFontSize * fontSizeScale;

      if (pdfFontPt < 2 || pdfFontPt > 60) continue; // skip implausible sizes

      pdf.setFontSize(pdfFontPt);
      pdf.text(layer.text, pdfX, pdfY, { align: layer.align });
    }

    // Restore standard text rendering mode
    (pdf.internal as any).out("0 Tr");

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

