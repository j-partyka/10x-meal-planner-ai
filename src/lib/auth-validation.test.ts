import { describe, it, expect } from "vitest";
import { isValidEmail, isValidPassword, getSignInValidationError, getRegisterValidationError } from "./auth-validation";

describe("auth-validation", () => {
  describe("isValidEmail", () => {
    it("returns true for a valid email", () => {
      expect(isValidEmail("user@example.com")).toBe(true);
      expect(isValidEmail("a@b.co")).toBe(true);
      expect(isValidEmail("user+tag@domain.org")).toBe(true);
    });

    it("returns true for email with leading/trailing whitespace that trims to valid", () => {
      expect(isValidEmail("  user@example.com  ")).toBe(true);
    });

    it("returns false for empty string", () => {
      expect(isValidEmail("")).toBe(false);
    });

    it("returns false for whitespace-only string", () => {
      expect(isValidEmail("   ")).toBe(false);
    });

    it("returns false when @ is missing", () => {
      expect(isValidEmail("userexample.com")).toBe(false);
    });

    it("returns false when domain part is missing", () => {
      expect(isValidEmail("user@")).toBe(false);
    });

    it("returns false when local part is missing", () => {
      expect(isValidEmail("@example.com")).toBe(false);
    });

    it("returns false when TLD is missing", () => {
      expect(isValidEmail("user@example")).toBe(false);
    });

    it("returns false for multiple @ (invalid format)", () => {
      expect(isValidEmail("user@@example.com")).toBe(false);
    });
  });

  describe("isValidPassword", () => {
    it("returns true when length is at least 8", () => {
      expect(isValidPassword("12345678")).toBe(true);
      expect(isValidPassword("longpassword")).toBe(true);
    });

    it("returns false when length is less than 8", () => {
      expect(isValidPassword("")).toBe(false);
      expect(isValidPassword("1234567")).toBe(false);
    });

    it("returns true for exactly 8 characters (boundary)", () => {
      expect(isValidPassword("abcdefgh")).toBe(true);
    });
  });

  describe("getSignInValidationError", () => {
    it("returns null when email and password are valid", () => {
      const result = getSignInValidationError("user@example.com", "password1");
      expect(result).toBeNull();
    });

    it("returns 'Email is required.' when email is empty", () => {
      expect(getSignInValidationError("", "password1")).toBe("Email is required.");
    });

    it("returns 'Email is required.' when email is whitespace-only", () => {
      expect(getSignInValidationError("   ", "password1")).toBe("Email is required.");
    });

    it("returns 'Please enter a valid email address.' when email format is invalid", () => {
      expect(getSignInValidationError("invalid", "password1")).toBe("Please enter a valid email address.");
      expect(getSignInValidationError("user@", "password1")).toBe("Please enter a valid email address.");
    });

    it("returns 'Password is required.' when password is empty", () => {
      expect(getSignInValidationError("user@example.com", "")).toBe("Password is required.");
    });

    it("checks email before password (email error takes precedence when both invalid)", () => {
      expect(getSignInValidationError("", "")).toBe("Email is required.");
    });
  });

  describe("getRegisterValidationError", () => {
    it("returns null when all fields are valid and passwords match", () => {
      const result = getRegisterValidationError("user@example.com", "password1", "password1");
      expect(result).toBeNull();
    });

    it("returns 'Email is required.' when email is empty", () => {
      expect(getRegisterValidationError("", "password1", "password1")).toBe("Email is required.");
    });

    it("returns 'Please enter a valid email address.' when email format is invalid", () => {
      expect(getRegisterValidationError("invalid", "password1", "password1")).toBe(
        "Please enter a valid email address."
      );
    });

    it("returns 'Password is required.' when password is empty", () => {
      expect(getRegisterValidationError("user@example.com", "", "")).toBe("Password is required.");
    });

    it("returns password length message when password has less than 8 characters", () => {
      expect(getRegisterValidationError("user@example.com", "short", "short")).toBe(
        "Password should be at least 8 characters."
      );
    });

    it("returns password length message for exactly 7 characters (boundary)", () => {
      expect(getRegisterValidationError("user@example.com", "1234567", "1234567")).toBe(
        "Password should be at least 8 characters."
      );
    });

    it("returns 'Passwords do not match.' when password and confirmPassword differ", () => {
      expect(getRegisterValidationError("user@example.com", "password1", "password2")).toBe("Passwords do not match.");
    });

    it("checks in order: email → email format → password required → length → match", () => {
      expect(getRegisterValidationError("", "short", "short")).toBe("Email is required.");
      expect(getRegisterValidationError("bad", "short", "short")).toBe("Please enter a valid email address.");
      expect(getRegisterValidationError("a@b.co", "", "")).toBe("Password is required.");
      expect(getRegisterValidationError("a@b.co", "short", "short")).toBe("Password should be at least 8 characters.");
      expect(getRegisterValidationError("a@b.co", "password1", "other")).toBe("Passwords do not match.");
    });
  });
});
