import { describe, it, expect } from "vitest";
import { featureFlags } from "../src/featureFlags";

describe("featureFlags", () => {
  it("should have the correct flags", () => {
    expect(featureFlags.featureA).toBe(true);
    expect(featureFlags.featureB).toBe(false);
    expect(featureFlags.featureC).toBe("potato");
  });
});
