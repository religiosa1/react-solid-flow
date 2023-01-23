import { it, describe, beforeAll, afterAll, expect, vi } from "vitest";
import { pause } from "../pause";

const t = 200000;

describe("pause", () => {
  beforeAll(() => { vi.useFakeTimers() });
  afterAll(() => { vi.useRealTimers() });

  it("waits for specified amount of time", async () => {
    const t1 = Date.now();
    pause(t).then(() => {
      const t2 = Date.now();
      expect(t2 - t1).toBe(t);
    });
    vi.advanceTimersByTime(t);
  });

  it("aborts with the correct error.name", async () => {
    const controller = new AbortController();
    const prms = pause(t, { signal: controller.signal });
    controller.abort();
    await expect(prms).rejects.toMatchObject({ name: "AbortError" });
  });

  it("aborts with the provided reason", async () => {
    const controller = new AbortController();
    const prms = pause(t, { signal: controller.signal });
    controller.abort("test");
    await expect(prms).rejects.toBe("test");
  });
});