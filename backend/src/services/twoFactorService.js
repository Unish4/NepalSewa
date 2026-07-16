import { generateSecret as otplibGenerateSecret, generateURI, verifySync } from "otplib";
import QRCode from "qrcode";
import crypto from "crypto";
import { encrypt, decrypt } from "../utils/cryptoUtils.js";
import { hashToken } from "../utils/tokenUtils.js"; 

const SERVICE_NAME = "NepalSewa";

export const generateSecret = () => otplibGenerateSecret();

export const buildQrCodeDataUrl = async (email, secret) => {
  const otpauth = generateURI({
    issuer: SERVICE_NAME,
    label: email,
    secret,
  });
  return QRCode.toDataURL(otpauth);
};

export const verifyToken = (token, secret) => {
  try {
    return !!verifySync({ token, secret })?.valid;
  } catch {
    return false;
  }
};

export const generateBackupCodes = () =>
  Array.from({ length: 8 }, () => crypto.randomBytes(5).toString("hex"));

export const hashBackupCode = (code) => hashToken(code);
export { encrypt as encryptSecret, decrypt as decryptSecret };
