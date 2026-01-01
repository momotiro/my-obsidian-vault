import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn utility function", () => {
  it("should merge class names correctly", () => {
    const result = cn("px-4", "py-2", "bg-blue-500");
    expect(result).toBe("px-4 py-2 bg-blue-500");
  });

  it("should handle conditional classes", () => {
    const result = cn("px-4", false && "hidden", "py-2");
    expect(result).toBe("px-4 py-2");
  });

  it("should merge conflicting Tailwind classes", () => {
    const result = cn("px-2 px-4");
    expect(result).toBe("px-4");
  });
});
