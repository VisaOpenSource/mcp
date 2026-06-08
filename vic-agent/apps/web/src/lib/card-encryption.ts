/**
 * Client-side card encryption.
 *
 * Raw card data (PAN, expiry, CVV) must never cross the LangGraph stream in
 * cleartext, nor be persisted. We encrypt the card payload in the browser with
 * an RSA-OAEP (SHA-256) public key (safe to ship in the bundle) and submit only
 * the resulting ciphertext as `private_encryptedCardData`. The agent decrypts it
 * in memory immediately before tokenization and then purges it from state.
 *
 * The public key is provided via NEXT_PUBLIC_CARD_ENC_PUBLIC_KEY as a base64
 * SPKI (DER) string. The matching private key lives only on the agent.
 */

export interface RawCardData {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardholderName: string;
}

function base64ToArrayBuffer(b64: string): ArrayBuffer {
  const binary = atob(b64.replace(/\s+/g, ""));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

function arrayBufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.length; i++)
    binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

let cachedKey: CryptoKey | null = null;

async function importPublicKey(): Promise<CryptoKey> {
  if (cachedKey) return cachedKey;

  const spkiB64 = process.env.NEXT_PUBLIC_CARD_ENC_PUBLIC_KEY;
  if (!spkiB64) {
    throw new Error(
      "NEXT_PUBLIC_CARD_ENC_PUBLIC_KEY is not configured; cannot encrypt card data.",
    );
  }
  if (typeof window === "undefined" || !window.crypto?.subtle) {
    throw new Error("Web Crypto API is not available in this environment.");
  }

  cachedKey = await window.crypto.subtle.importKey(
    "spki",
    base64ToArrayBuffer(spkiB64),
    { name: "RSA-OAEP", hash: "SHA-256" },
    false,
    ["encrypt"],
  );
  return cachedKey;
}

/**
 * Encrypt raw card data and return a base64 ciphertext string.
 * The cleartext `card` argument must not be persisted by the caller.
 */
export async function encryptCardData(card: RawCardData): Promise<string> {
  const key = await importPublicKey();
  const plaintext = new TextEncoder().encode(
    JSON.stringify({
      cardNumber: card.cardNumber,
      expiryDate: card.expiryDate,
      cvv: card.cvv,
      cardholderName: card.cardholderName,
    }),
  );
  const ciphertext = await window.crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    key,
    plaintext,
  );
  return arrayBufferToBase64(ciphertext);
}
