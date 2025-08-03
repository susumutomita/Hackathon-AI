import { describe, test, expect, vi, beforeEach } from "vitest";
import { AxiosAdapter } from "../axios.adapter";
import axios from "axios";

// Mock axios
vi.mock("axios");

describe("AxiosAdapter", () => {
  let adapter: AxiosAdapter;
  let mockAxiosInstance: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create mock axios instance
    mockAxiosInstance = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    };

    // Mock axios.create to return our mock instance
    (axios.create as any).mockReturnValue(mockAxiosInstance);
  });

  describe("constructor", () => {
    test("should create axios instance with default config", () => {
      adapter = new AxiosAdapter();

      expect(axios.create).toHaveBeenCalledWith({
        baseURL: undefined,
        timeout: undefined,
        headers: undefined,
      });
    });

    test("should create axios instance with custom config", () => {
      const config = {
        baseURL: "https://api.example.com",
        timeout: 5000,
        headers: { "X-API-Key": "test-key" },
      };

      adapter = new AxiosAdapter(config);

      expect(axios.create).toHaveBeenCalledWith(config);
    });
  });

  describe("get method", () => {
    beforeEach(() => {
      adapter = new AxiosAdapter();
    });

    test("should make GET request successfully", async () => {
      const mockData = { id: 1, name: "Test" };
      const mockResponse = {
        data: mockData,
        status: 200,
        statusText: "OK",
        headers: { "content-type": "application/json" },
        config: {},
      };

      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await adapter.get("/test");

      expect(mockAxiosInstance.get).toHaveBeenCalledWith("/test", {});
      expect(result).toEqual({
        data: mockData,
        status: 200,
        statusText: "OK",
        headers: { "content-type": "application/json" },
      });
    });

    test("should handle GET request with config", async () => {
      const mockResponse = {
        data: { success: true },
        status: 200,
        statusText: "OK",
        headers: {},
        config: {},
      };

      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const config = {
        headers: { Authorization: "Bearer token" },
        params: { page: 1 },
      };

      await adapter.get("/test", config);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith("/test", config);
    });

    test("should handle GET request error", async () => {
      const mockError = {
        response: {
          data: { error: "Not found" },
          status: 404,
          statusText: "Not Found",
          headers: {},
        },
        message: "Request failed",
        isAxiosError: true,
      };

      mockAxiosInstance.get.mockRejectedValue(mockError);

      await expect(adapter.get("/test")).rejects.toThrow();
    });
  });

  describe("post method", () => {
    beforeEach(() => {
      adapter = new AxiosAdapter();
    });

    test("should make POST request successfully", async () => {
      const postData = { name: "New Item" };
      const mockResponse = {
        data: { id: 2, ...postData },
        status: 201,
        statusText: "Created",
        headers: {},
        config: {},
      };

      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const result = await adapter.post("/items", postData);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        "/items",
        postData,
        {},
      );
      expect(result.status).toBe(201);
      expect(result.data).toEqual({ id: 2, name: "New Item" });
    });

    test("should handle POST request with config", async () => {
      const postData = { email: "test@example.com" };
      const config = {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      };
      const mockResponse = {
        data: { success: true },
        status: 200,
        statusText: "OK",
        headers: {},
        config: {},
      };

      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      await adapter.post("/auth", postData, config);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        "/auth",
        postData,
        config,
      );
    });
  });

  describe("put method", () => {
    beforeEach(() => {
      adapter = new AxiosAdapter();
    });

    test("should make PUT request successfully", async () => {
      const putData = { id: 1, name: "Updated Item" };
      const mockResponse = {
        data: putData,
        status: 200,
        statusText: "OK",
        headers: {},
        config: {},
      };

      mockAxiosInstance.put.mockResolvedValue(mockResponse);

      const result = await adapter.put("/items/1", putData);

      expect(mockAxiosInstance.put).toHaveBeenCalledWith(
        "/items/1",
        putData,
        {},
      );
      expect(result.data).toEqual(putData);
    });

    test("should handle PUT request error", async () => {
      const putData = { id: 1, name: "Updated Item" };
      const axiosError = new Error("Put failed");
      (axiosError as any).isAxiosError = true;
      (axiosError as any).response = {
        status: 400,
        statusText: "Bad Request",
        data: { error: "Invalid data" },
      };

      mockAxiosInstance.put.mockRejectedValue(axiosError);
      (axios.isAxiosError as any).mockReturnValue(true);

      await expect(adapter.put("/items/1", putData)).rejects.toThrow();
    });
  });

  describe("delete method", () => {
    beforeEach(() => {
      adapter = new AxiosAdapter();
    });

    test("should make DELETE request successfully", async () => {
      const mockResponse = {
        data: null,
        status: 204,
        statusText: "No Content",
        headers: {},
        config: {},
      };

      mockAxiosInstance.delete.mockResolvedValue(mockResponse);

      const result = await adapter.delete("/items/1");

      expect(mockAxiosInstance.delete).toHaveBeenCalledWith("/items/1", {});
      expect(result.status).toBe(204);
    });

    test("should handle delete error", async () => {
      const axiosError = new Error("Delete failed");
      (axiosError as any).isAxiosError = true;
      (axiosError as any).response = {
        status: 404,
        statusText: "Not Found",
        data: { error: "Item not found" },
      };

      mockAxiosInstance.delete.mockRejectedValue(axiosError);
      (axios.isAxiosError as any).mockReturnValue(true);

      await expect(adapter.delete("/items/1")).rejects.toThrow("Delete failed");
    });
  });

  describe("error handling", () => {
    beforeEach(() => {
      adapter = new AxiosAdapter();
    });

    test("should handle network error", async () => {
      const networkError = new Error("Network Error");
      (networkError as any).isAxiosError = true;
      (networkError as any).code = "ECONNREFUSED";

      mockAxiosInstance.get.mockRejectedValue(networkError);

      await expect(adapter.get("/test")).rejects.toThrow();
    });

    test("should handle timeout error", async () => {
      const timeoutError = new Error("Timeout");
      (timeoutError as any).isAxiosError = true;
      (timeoutError as any).code = "ECONNABORTED";

      mockAxiosInstance.get.mockRejectedValue(timeoutError);

      await expect(adapter.get("/test")).rejects.toThrow();
    });

    test("should handle non-axios error", async () => {
      const genericError = new Error("Something went wrong");

      mockAxiosInstance.get.mockRejectedValue(genericError);

      await expect(adapter.get("/test")).rejects.toThrow(
        "Something went wrong",
      );
    });

    test("should handle axios error with response details", async () => {
      const axiosError = new Error("Request failed");
      (axiosError as any).isAxiosError = true;
      (axiosError as any).response = {
        status: 400,
        statusText: "Bad Request",
        data: { message: "Invalid input" },
      };

      // Mock axios.isAxiosError to return true for our error
      (axios.isAxiosError as any).mockReturnValue(true);

      mockAxiosInstance.post.mockRejectedValue(axiosError);

      try {
        await adapter.post("/test", { data: "test" });
        // Should not reach here
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error.name).toBe("HttpError");
        expect(error.message).toBe("Request failed");
        expect(error.status).toBe(400);
        expect(error.statusText).toBe("Bad Request");
        expect(error.response).toEqual({ message: "Invalid input" });
        expect(error.cause).toBe(axiosError);
      }
    });
  });
});
