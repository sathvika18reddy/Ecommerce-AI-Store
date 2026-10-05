import crypto from "crypto";

const SECRET_KEY = "12345678901234567890123456789012"; // 32 chars
const IV_LENGTH = 16;

// 🔐 encrypt
export const encryptPassword = (password: string) => {
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(
    "aes-256-cbc",
    Buffer.from(SECRET_KEY),
    iv
  );

  let encrypted = cipher.update(password);
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  return iv.toString("hex") + ":" + encrypted.toString("hex");
};

// 🔓 decrypt
export const decryptPassword = (text: string) => {
  const [ivHex, encryptedHex] = text.split(":");

  const iv = Buffer.from(ivHex, "hex");
  const encryptedText = Buffer.from(encryptedHex, "hex");

  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    Buffer.from(SECRET_KEY),
    iv
  );

  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString();
};