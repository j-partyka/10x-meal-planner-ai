import { describe, it, expect } from "vitest";
import { mapSignInError, mapSignUpError } from "./auth-errors";

const SIGN_IN_MESSAGE = "Invalid email or password.";
const EMAIL_EXISTS_MESSAGE = "An account with this email already exists.";
const WEAK_PASSWORD_MESSAGE = "Password should be at least 8 characters.";
const GENERIC_MESSAGE = "Something went wrong. Please try again.";

describe("auth-errors", () => {
  describe("mapSignInError", () => {
    it("always returns the same user-facing message (never leaks raw error)", () => {
      expect(mapSignInError(null)).toBe(SIGN_IN_MESSAGE);
      expect(mapSignInError(undefined)).toBe(SIGN_IN_MESSAGE);
      expect(mapSignInError(new Error("Invalid login"))).toBe(SIGN_IN_MESSAGE);
      expect(mapSignInError({ message: "Email not confirmed", code: "email_not_confirmed" })).toBe(SIGN_IN_MESSAGE);
    });
  });

  describe("mapSignUpError", () => {
    it("returns GENERIC_MESSAGE when error is null or undefined", () => {
      expect(mapSignUpError(null)).toBe(GENERIC_MESSAGE);
      expect(mapSignUpError(undefined)).toBe(GENERIC_MESSAGE);
    });

    it("returns GENERIC_MESSAGE when error is not an object", () => {
      expect(mapSignUpError("string")).toBe(GENERIC_MESSAGE);
      expect(mapSignUpError(42)).toBe(GENERIC_MESSAGE);
    });

    it("returns EMAIL_EXISTS_MESSAGE when message includes 'already registered'", () => {
      expect(mapSignUpError({ message: "User already registered" })).toBe(EMAIL_EXISTS_MESSAGE);
    });

    it("returns EMAIL_EXISTS_MESSAGE when message includes 'already exists'", () => {
      expect(mapSignUpError({ message: "Email already exists" })).toBe(EMAIL_EXISTS_MESSAGE);
    });

    it("returns EMAIL_EXISTS_MESSAGE when message includes 'user already registered'", () => {
      expect(mapSignUpError({ message: "user already registered" })).toBe(EMAIL_EXISTS_MESSAGE);
    });

    it("returns EMAIL_EXISTS_MESSAGE when code is 'user_already_exists'", () => {
      expect(mapSignUpError({ code: "user_already_exists" })).toBe(EMAIL_EXISTS_MESSAGE);
    });

    it("returns EMAIL_EXISTS_MESSAGE when status is 422", () => {
      expect(mapSignUpError({ status: 422 })).toBe(EMAIL_EXISTS_MESSAGE);
    });

    it("returns EMAIL_EXISTS_MESSAGE for case-insensitive message match", () => {
      expect(mapSignUpError({ message: "ALREADY REGISTERED" })).toBe(EMAIL_EXISTS_MESSAGE);
    });

    it("returns WEAK_PASSWORD_MESSAGE when message includes 'password' and '8'", () => {
      expect(mapSignUpError({ message: "Password must be at least 8 characters" })).toBe(WEAK_PASSWORD_MESSAGE);
    });

    it("returns WEAK_PASSWORD_MESSAGE when message includes 'password' and 'length'", () => {
      expect(mapSignUpError({ message: "Password length too short" })).toBe(WEAK_PASSWORD_MESSAGE);
    });

    it("returns WEAK_PASSWORD_MESSAGE when message includes 'password' and 'least'", () => {
      expect(mapSignUpError({ message: "Password should be at least 8 chars" })).toBe(WEAK_PASSWORD_MESSAGE);
    });

    it("returns WEAK_PASSWORD_MESSAGE when code is 'weak_password'", () => {
      expect(mapSignUpError({ code: "weak_password" })).toBe(WEAK_PASSWORD_MESSAGE);
    });

    it("returns WEAK_PASSWORD_MESSAGE when message includes 'password should be'", () => {
      expect(mapSignUpError({ message: "Password should be stronger" })).toBe(WEAK_PASSWORD_MESSAGE);
    });

    it("returns GENERIC_MESSAGE for unknown error shape", () => {
      expect(mapSignUpError({ message: "Something else", code: "other" })).toBe(GENERIC_MESSAGE);
    });

    it("email-exists branch takes precedence over weak-password when both match", () => {
      expect(
        mapSignUpError({
          message: "user already registered",
          code: "weak_password",
        })
      ).toBe(EMAIL_EXISTS_MESSAGE);
    });
  });
});
