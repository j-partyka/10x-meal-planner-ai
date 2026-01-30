import { describe, it, expect } from "vitest";
import { jsonResponse, errorResponse } from "./api-responses";

describe("api-responses", () => {
  describe("jsonResponse", () => {
    it("returns Response with given status and JSON body", async () => {
      const body = { data: "value" };
      const status = 200;

      const response = jsonResponse(body, status);

      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe("application/json");
      const parsed = await response.json();
      expect(parsed).toEqual(body);
    });

    it("merges init headers with Content-Type", () => {
      const response = jsonResponse({}, 201, {
        headers: { "X-Custom": "yes" },
      });

      expect(response.headers.get("Content-Type")).toBe("application/json");
      expect(response.headers.get("X-Custom")).toBe("yes");
    });

    it("uses status from first argument", () => {
      const response = jsonResponse({}, 201);
      expect(response.status).toBe(201);
    });
  });

  describe("errorResponse", () => {
    it("returns JSON with error message and status", async () => {
      const response = errorResponse("Bad request", 400);

      expect(response.status).toBe(400);
      expect(response.headers.get("Content-Type")).toBe("application/json");
      const body = await response.json();
      expect(body).toEqual({ error: "Bad request" });
    });

    it("includes details array when provided (400 validation)", async () => {
      const details = [
        { field: "name", message: "Name is required" },
        { field: "quantity", message: "Quantity must be greater than 0" },
      ];

      const response = errorResponse("Validation failed", 400, details);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body).toEqual({
        error: "Validation failed",
        details,
      });
    });

    it("omits details when not provided", async () => {
      const response = errorResponse("Unauthorized", 401);

      const body = await response.json();
      expect(body).toHaveProperty("error", "Unauthorized");
      expect(body).not.toHaveProperty("details");
    });
  });
});
