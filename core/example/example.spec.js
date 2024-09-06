import { describe, it, expect } from "vitest";
import { greet } from "./example";

describe("example", () => {
  it("should greet the right person", () => {
    expect(greet("world")).toBe("Hello world");
  });
});
