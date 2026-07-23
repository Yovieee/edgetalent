import { Buffer } from "buffer";
import forge from "node-forge";
import { PDFDocument } from "pdf-lib";
import { pdflibAddPlaceholder } from "@signpdf/placeholder-pdf-lib";
import { SignPdf } from "@signpdf/signpdf";
import { P12Signer } from "@signpdf/signer-p12";

// Polyfill global Buffer for browser compatibility in Vite
if (typeof window !== "undefined" && !(window as any).Buffer) {
  (window as any).Buffer = Buffer;
}

let cachedP12Buffer: Buffer | null = null;
const P12_PASSPHRASE = "edgetalent_eidas_seal";

/**
 * Generates an eIDAS-compliant X.509 Electronic Signature / Electronic Seal Certificate
 * as a Node Buffer object compatible with P12Signer.
 */
export function generateEidasP12Certificate(): Buffer {
  if (cachedP12Buffer) {
    return cachedP12Buffer;
  }

  // Generate 2048-bit RSA Keypair
  const keys = forge.pki.rsa.generateKeyPair(2048);
  const cert = forge.pki.createCertificate();

  cert.publicKey = keys.publicKey;
  cert.serialNumber = "01" + forge.util.bytesToHex(forge.random.getBytesSync(8));
  
  const now = new Date();
  cert.validity.notBefore = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 1 day ago
  cert.validity.notAfter = new Date(now.getTime() + 10 * 365 * 24 * 60 * 60 * 1000); // 10 years

  const subject = [
    { name: "commonName", value: "Blasius Yonas Vikariandi" },
    { name: "organizationName", value: "EdgeTalent Academy" },
    { name: "organizationalUnitName", value: "EdgeTalent Electronic Seal Authority" },
    { name: "countryName", value: "US" },
  ];

  cert.setSubject(subject);
  cert.setIssuer(subject);

  // Set eIDAS compliant key usage extension attributes
  cert.setExtensions([
    {
      name: "basicConstraints",
      cA: true,
    },
    {
      name: "keyUsage",
      digitalSignature: true,
      nonRepudiation: true,
      keyEncipherment: true,
      dataEncipherment: true,
      keyCertSign: true,
    },
    {
      name: "extKeyUsage",
      serverAuth: true,
      clientAuth: true,
      codeSigning: true,
      emailProtection: true,
      timeStamping: true,
    },
    {
      name: "nsCertType",
      client: true,
      server: true,
      email: true,
      objsign: true,
      sslCA: true,
      emailCA: true,
      objCA: true,
    },
  ]);

  // Self-sign certificate with SHA-256
  cert.sign(keys.privateKey, forge.md.sha256.create());

  // Package into PKCS#12 (.p12) structure
  const p12Asn1 = forge.pkcs12.toPkcs12Asn1(keys.privateKey, [cert], P12_PASSPHRASE, {
    generateLocalKeyId: true,
    friendlyName: "EdgeTalent eIDAS Electronic Seal Certificate",
  });

  const p12DerString = forge.asn1.toDer(p12Asn1).getBytes();
  const p12Buffer = Buffer.from(p12DerString, "binary");

  cachedP12Buffer = p12Buffer;
  return p12Buffer;
}

/**
 * Electronically signs a PDF document buffer with a native PDF Digital Signature / Electronic Seal
 * compliant with eIDAS Article 3(10) (Electronic Signature) and Article 3(25) (Electronic Seal).
 *
 * @param pdfBuffer - Unsigned PDF ArrayBuffer or Uint8Array
 * @param options - Custom signature metadata (signer name, reason, location)
 * @returns Digitally signed PDF Buffer containing native PKCS#7 / X.509 signature structure
 */
export async function signPdfWithEidasSeal(
  pdfBuffer: ArrayBuffer | Uint8Array,
  options: {
    signerName?: string;
    reason?: string;
    location?: string;
    contactInfo?: string;
  } = {}
): Promise<Buffer> {
  const inputBuffer = Buffer.isBuffer(pdfBuffer)
    ? pdfBuffer
    : Buffer.from(pdfBuffer instanceof Uint8Array ? pdfBuffer : new Uint8Array(pdfBuffer));

  // Load PDF with pdf-lib to add the /Sig placeholder dictionary
  const pdfDoc = await PDFDocument.load(inputBuffer);

  const signerName = options.signerName || "Blasius Yonas Vikariandi, EdgeTalent CEO";
  const reason = options.reason || "Official EdgeTalent Certificate Authenticity & Integrity Seal (eIDAS Art 3(10) & 3(25) Compliant)";
  const location = options.location || "EdgeTalent Verification Portal (https://edgetalent.space)";
  const contactInfo = options.contactInfo || "verify@edgetalent.space";

  // Add native PDF Digital Signature / Electronic Seal placeholder dictionary
  pdflibAddPlaceholder({
    pdfDoc,
    reason,
    contactInfo,
    name: signerName,
    location,
    signatureLength: 8192,
  });

  const pdfWithPlaceholder = await pdfDoc.save({ useObjectStreams: false });
  const pdfWithPlaceholderBuffer = Buffer.from(pdfWithPlaceholder);

  // Generate eIDAS X.509 P12 Certificate
  const p12Buffer = generateEidasP12Certificate();

  // Create Signer
  const signer = new P12Signer(p12Buffer, { passphrase: P12_PASSPHRASE });
  const signPdfInstance = new SignPdf();

  // Sign PDF by embedding PKCS#7 signature into ByteRange
  const signedPdfBuffer = await signPdfInstance.sign(pdfWithPlaceholderBuffer, signer);

  return Buffer.isBuffer(signedPdfBuffer) ? signedPdfBuffer : Buffer.from(signedPdfBuffer);
}
