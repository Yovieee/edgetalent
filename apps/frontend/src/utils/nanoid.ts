/**
 * Generates an 8-character NanoID using uppercase alphanumeric characters (0-9, A-Z).
 * Useful for easy-to-read, user-friendly, unique certificate Credential IDs.
 */
export function generateNanoId(size: number = 8): string {
  const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let result = "";
  
  if (typeof window !== "undefined" && window.crypto && window.crypto.getRandomValues) {
    const bytes = new Uint8Array(size);
    window.crypto.getRandomValues(bytes);
    for (let i = 0; i < size; i++) {
      result += alphabet[bytes[i] % alphabet.length];
    }
  } else {
    for (let i = 0; i < size; i++) {
      result += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
    }
  }
  
  return result;
}
