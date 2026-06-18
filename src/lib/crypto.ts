import crypto from "crypto";

/**
 * Encrypts plain text using AES-256-GCM with a client-supplied key hex.
 * Returns the format `iv:authTag:ciphertext`
 */
export function encrypt(text: string, keyHex: string): string {
  try {
    const key = Buffer.from(keyHex, "hex");
    if (key.length !== 32) {
      throw new Error("Invalid key length. Must be 32 bytes (64 hex characters).");
    }
    const iv = crypto.randomBytes(12); // Standard 12-byte IV for GCM
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
    
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    
    const authTag = cipher.getAuthTag().toString("hex");
    return `${iv.toString("hex")}:${authTag}:${encrypted}`;
  } catch (error) {
    console.error("Encryption failed:", error);
    throw new Error("Failed to encrypt content");
  }
}

/**
 * Decrypts AES-256-GCM formatted ciphertext using the client-supplied key hex.
 */
export function decrypt(cipherText: string, keyHex: string): string {
  try {
    const parts = cipherText.split(":");
    if (parts.length !== 3) {
      throw new Error("Invalid ciphertext format. Expected iv:authTag:encrypted");
    }
    const [ivHex, authTagHex, encryptedHex] = parts;
    const key = Buffer.from(keyHex, "hex");
    if (key.length !== 32) {
      throw new Error("Invalid key length. Must be 32 bytes (64 hex characters).");
    }
    
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedHex, "hex", "utf8");
    decrypted += decipher.final("utf8");
    
    return decrypted;
  } catch (error) {
    console.error("Decryption failed:", error);
    throw new Error("Failed to decrypt content. Please verify encryption key.");
  }
}
