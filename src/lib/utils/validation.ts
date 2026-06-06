// Shared client-side validation helpers.
//
// The email pattern mirrors the WHATWG/HTML5 email format and matches the
// strict validation enforced on the backend (ValidatorUtil.isEmail), so the
// client and server agree on what a "valid" email looks like. This rejects
// malformed addresses such as "test@gmail.com###" or "test@gmail".

const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export function isValidEmail(email: string): boolean {
  if (typeof email !== 'string') return false;
  const value = email.trim();
  if (value.length === 0 || value.length > 254) return false;
  return EMAIL_REGEX.test(value);
}

// Lightweight E.164-style phone check (optional leading +, 8–15 digits).
const PHONE_REGEX = /^\+?[1-9]\d{7,14}$/;

export function isValidPhone(phone: string): boolean {
  if (typeof phone !== 'string') return false;
  return PHONE_REGEX.test(phone.trim().replace(/[\s()-]/g, ''));
}
