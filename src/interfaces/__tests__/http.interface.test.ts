import { describe, test, expect } from "vitest";
import { HttpError } from "../http.interface";

describe("HttpError", () => {
  describe("isClientError", () => {
    test("should return true for 4xx status codes", () => {
      const error400 = new HttpError("Bad Request", 400);
      const error404 = new HttpError("Not Found", 404);
      const error422 = new HttpError("Unprocessable Entity", 422);
      const error499 = new HttpError("Client Error", 499);

      expect(error400.isClientError()).toBe(true);
      expect(error404.isClientError()).toBe(true);
      expect(error422.isClientError()).toBe(true);
      expect(error499.isClientError()).toBe(true);
    });

    test("should return false for 3xx status codes", () => {
      const error300 = new HttpError("Multiple Choices", 300);
      const error301 = new HttpError("Moved Permanently", 301);
      const error399 = new HttpError("Redirection", 399);

      expect(error300.isClientError()).toBe(false);
      expect(error301.isClientError()).toBe(false);
      expect(error399.isClientError()).toBe(false);
    });

    test("should return false for 5xx status codes", () => {
      const error500 = new HttpError("Internal Server Error", 500);
      const error502 = new HttpError("Bad Gateway", 502);
      const error599 = new HttpError("Server Error", 599);

      expect(error500.isClientError()).toBe(false);
      expect(error502.isClientError()).toBe(false);
      expect(error599.isClientError()).toBe(false);
    });

    test("should return false for 2xx status codes", () => {
      const error200 = new HttpError("OK", 200);
      const error201 = new HttpError("Created", 201);
      const error299 = new HttpError("Success", 299);

      expect(error200.isClientError()).toBe(false);
      expect(error201.isClientError()).toBe(false);
      expect(error299.isClientError()).toBe(false);
    });

    test("should return false when status is undefined", () => {
      const errorWithoutStatus = new HttpError("Error without status");

      expect(errorWithoutStatus.isClientError()).toBe(false);
    });
  });

  describe("isServerError", () => {
    test("should return true for 5xx status codes", () => {
      const error500 = new HttpError("Internal Server Error", 500);
      const error502 = new HttpError("Bad Gateway", 502);
      const error599 = new HttpError("Server Error", 599);

      expect(error500.isServerError()).toBe(true);
      expect(error502.isServerError()).toBe(true);
      expect(error599.isServerError()).toBe(true);
    });

    test("should return false for non-5xx status codes", () => {
      const error400 = new HttpError("Bad Request", 400);
      const error200 = new HttpError("OK", 200);
      const error300 = new HttpError("Redirect", 300);

      expect(error400.isServerError()).toBe(false);
      expect(error200.isServerError()).toBe(false);
      expect(error300.isServerError()).toBe(false);
    });

    test("should return false when status is undefined", () => {
      const errorWithoutStatus = new HttpError("Error without status");

      expect(errorWithoutStatus.isServerError()).toBe(false);
    });
  });

  describe("constructor", () => {
    test("should create HttpError with message and status", () => {
      const error = new HttpError("Test error", 404);

      expect(error.message).toBe("Test error");
      expect(error.status).toBe(404);
      expect(error.name).toBe("HttpError");
    });

    test("should create HttpError with message only", () => {
      const error = new HttpError("Test error");

      expect(error.message).toBe("Test error");
      expect(error.status).toBeUndefined();
      expect(error.name).toBe("HttpError");
    });
  });
});
