import { safeJsonParse, SafeJsonParseError } from "../safeJsonParser";

describe("SafeJsonParser", () => {
  describe("safeJsonParse", () => {
    it("should parse valid JSON correctly", () => {
      const validJson = '{"name": "test", "value": 123}';
      const result = safeJsonParse(validJson);
      
      expect(result).toEqual({ name: "test", value: 123 });
    });

    it("should handle Japanese content in JSON", () => {
      const japaneseJson = '{"タイトル": "テストアイデア", "説明": "これはテストです"}';
      const result = safeJsonParse(japaneseJson);
      
      expect(result).toEqual({ 
        "タイトル": "テストアイデア", 
        "説明": "これはテストです" 
      });
    });

    it("should throw SafeJsonParseError for invalid JSON", () => {
      const invalidJson = '{"name": "test", "value": }';
      
      expect(() => safeJsonParse(invalidJson)).toThrow(SafeJsonParseError);
    });

    it("should reject JSON exceeding size limit", () => {
      const largeObject = { data: "A".repeat(2000000) }; // 2MB+ string
      const largeJson = JSON.stringify(largeObject);
      
      expect(() => safeJsonParse(largeJson)).toThrow(SafeJsonParseError);
    });

    it("should reject deeply nested JSON", () => {
      // Create deeply nested object
      let deepObject: any = {};
      let current = deepObject;
      for (let i = 0; i < 1500; i++) {
        current.nested = {};
        current = current.nested;
      }
      current.value = "deep";
      
      const deepJson = JSON.stringify(deepObject);
      expect(() => safeJsonParse(deepJson)).toThrow(SafeJsonParseError);
    });

    it("should sanitize dangerous keys in parsed JSON", () => {
      const jsonWithDangerousKeys = '{"__proto__": {"polluted": true}, "constructor": {"dangerous": true}, "normal": "safe"}';
      const result = safeJsonParse(jsonWithDangerousKeys);
      
      expect(result).not.toHaveProperty("__proto__");
      expect(result).not.toHaveProperty("constructor");
      expect(result).toHaveProperty("normal", "safe");
    });

    it("should handle array JSON safely", () => {
      const arrayJson = '[{"id": 1, "name": "item1"}, {"id": 2, "name": "item2"}]';
      const result = safeJsonParse(arrayJson);
      
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ id: 1, name: "item1" });
    });

    it("should reject JSON with circular references when stringifying", () => {
      const objWithCircular: any = { name: "test" };
      objWithCircular.self = objWithCircular;
      
      expect(() => JSON.stringify(objWithCircular)).toThrow();
    });

    it("should handle null and primitive values", () => {
      expect(safeJsonParse("null")).toBeNull();
      expect(safeJsonParse("true")).toBe(true);
      expect(safeJsonParse("false")).toBe(false);
      expect(safeJsonParse("123")).toBe(123);
      expect(safeJsonParse('"string"')).toBe("string");
    });

    it("should reject empty or whitespace-only input", () => {
      expect(() => safeJsonParse("")).toThrow(SafeJsonParseError);
      expect(() => safeJsonParse("   ")).toThrow(SafeJsonParseError);
      expect(() => safeJsonParse("\n\t")).toThrow(SafeJsonParseError);
    });

    it("should provide meaningful error messages", () => {
      try {
        safeJsonParse('{"invalid": }');
      } catch (error) {
        expect(error).toBeInstanceOf(SafeJsonParseError);
        expect((error as SafeJsonParseError).parseErrorType).toBe("SYNTAX_ERROR");
        expect((error as SafeJsonParseError).message).toContain("JSON");
      }
    });

    it("should handle options parameter", () => {
      const largeJson = JSON.stringify({ data: "A".repeat(100000) });
      
      // Should fail with default limits
      expect(() => safeJsonParse(largeJson)).toThrow();
      
      // Should pass with custom limits
      const result = safeJsonParse(largeJson, { maxSize: 200000 });
      expect(result.data).toBe("A".repeat(100000));
    });
  });

  describe("SafeJsonParseError", () => {
    it("should create error with proper properties", () => {
      const error = new SafeJsonParseError("テストエラー", "SYNTAX_ERROR");
      expect(error.message).toBe("テストエラー");
      expect(error.parseErrorType).toBe("SYNTAX_ERROR");
      expect(error.name).toBe("SafeJsonParseError");
    });
  });
});