import crypto from "crypto";

const ALGO = "aes-256-gcm";

const getKey = () => {
    const hex = process.env.ENCRYPTION_KEY;
    if (!hex || hex.length !== 64) {
        throw new Error("ENCRYPTION_KEY must be a 64-char hex string (32 bytes). Generate with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"");
    }
    return Buffer.from(hex, "hex");
};

/**
 * Encrypts plaintext → "iv:authTag:ciphertext" (all hex, colon-separated).
 */
export const encrypt = (plaintext) => {
    const key = getKey();
    const iv  = crypto.randomBytes(12);                       // 96-bit IV for GCM
    const cipher = crypto.createCipheriv(ALGO, key, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
    const authTag   = cipher.getAuthTag();
    return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
};

/**
 * Decrypts an "iv:authTag:ciphertext" string back to plaintext.
 */
export const decrypt = (token) => {
    const [ivHex, authTagHex, dataHex] = token.split(":");
    if (!ivHex || !authTagHex || !dataHex) throw new Error("Invalid encrypted token format");
    const key     = getKey();
    const decipher = crypto.createDecipheriv(ALGO, key, Buffer.from(ivHex, "hex"));
    decipher.setAuthTag(Buffer.from(authTagHex, "hex"));
    const decrypted = Buffer.concat([decipher.update(Buffer.from(dataHex, "hex")), decipher.final()]);
    return decrypted.toString("utf8");
};
