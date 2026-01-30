/**
 * Client-side validation for login/register forms.
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

export function isValidEmail(value: string): boolean {
  return value.trim() !== "" && EMAIL_REGEX.test(value.trim());
}

export function isValidPassword(value: string): boolean {
  return value.length >= MIN_PASSWORD_LENGTH;
}

export function getSignInValidationError(email: string, password: string): string | null {
  if (!email.trim()) return "Email is required.";
  if (!isValidEmail(email)) return "Please enter a valid email address.";
  if (!password) return "Password is required.";
  return null;
}

export function getRegisterValidationError(email: string, password: string, confirmPassword: string): string | null {
  if (!email.trim()) return "Email is required.";
  if (!isValidEmail(email)) return "Please enter a valid email address.";
  if (!password) return "Password is required.";
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password should be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  if (password !== confirmPassword) return "Passwords do not match.";
  return null;
}
