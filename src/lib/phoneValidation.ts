/**
 * Phone Number Validation Utility for OnePitch Turf Dual WhatsApp Engine
 * Supports Indian mobile numbers (10 digits starting with 6,7,8,9)
 */

export interface PhoneValidationResult {
  isValid: boolean;
  type: "Indian"  | "Invalid";
  raw: string;
  formattedE164: string; // Clean number for wa.me links, e.g., "919952323211"
  displayFormat: string; // Clean human-readable format
  error?: string;
}

/**
 * Validates mobile number for Indian and International formats.
 */
export function validatePhoneNumber(inputPhone: string): PhoneValidationResult {
  if (!inputPhone || typeof inputPhone !== "string") {
    return {
      isValid: false,
      type: "Invalid",
      raw: "",
      formattedE164: "",
      displayFormat: "",
      error: "Phone number is required.",
    };
  }

  const raw = inputPhone.trim();
  // Strip spaces, dashes, brackets, non-alphanumeric except +
  const digitsOnly = raw.replace(/\D/g, "");

  // 1. Check Indian Mobile Number formats
  // Patterns:
  // - 10 digits starting with 6-9 (e.g. 9952323211)
  // - 11 digits starting with 0 followed by 6-9 (e.g. 09952323211)
  // - 12 digits starting with 91 followed by 6-9 (e.g. 919952323211 or +91 9952323211)
  let isIndian = false;
  let indian10Digits = "";

  if (raw.startsWith("+91") || raw.startsWith("91")) {
    const stripped91 = digitsOnly.startsWith("91") ? digitsOnly.slice(2) : digitsOnly;
    if (stripped91.length === 10 && /^[6-9]\d{9}$/.test(stripped91)) {
      isIndian = true;
      indian10Digits = stripped91;
    }
  } else if (digitsOnly.length === 11 && digitsOnly.startsWith("0")) {
    const stripped0 = digitsOnly.slice(1);
    if (/^[6-9]\d{9}$/.test(stripped0)) {
      isIndian = true;
      indian10Digits = stripped0;
    }
  } else if (digitsOnly.length === 10 && /^[6-9]\d{9}$/.test(digitsOnly)) {
    isIndian = true;
    indian10Digits = digitsOnly;
  }

  if (isIndian) {
    const formattedE164 = `91${indian10Digits}`;
    const displayFormat = `+91 ${indian10Digits.slice(0, 5)} ${indian10Digits.slice(5)}`;
    return {
      isValid: true,
      type: "Indian",
      raw,
      formattedE164,
      displayFormat,
    };
  }

  return {
    isValid: false,
    type: "Invalid",
    raw,
    formattedE164: "",
    displayFormat: raw,
    error: "Enter a valid mobile number.",
  };
}

/**
 * Normalizes any phone number into clean WhatsApp E.164 digits format without leading +
 * e.g., "+91 99523 23211" -> "919952323211"
 */
export function formatToE164(phone: string): string {
  const result = validatePhoneNumber(phone);
  if (result.isValid) {
    return result.formattedE164;
  }
  const cleaned = phone.replace(/\D/g, "");
  return cleaned.startsWith("91") ? cleaned : `91${cleaned}`;
}
