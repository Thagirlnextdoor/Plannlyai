import { describe, expect, test } from "vitest";
import { offlinePlan, offlineSplit } from "../lib/ai";
import { parseScheduleRequest, proposeSlots } from "../lib/schedule";
import { parseWorkflowRequest } from "../lib/workflows";

describe("offline plan", () => {
  test("builds milestone > monthly > weekly > daily > tiny tree", async () => {
    const { nodes, provider } = await import("../lib/ai").then((m) => m.generatePlan({ goalTitle: "Test goal" }));
    expect(provider).toBe("offline");
    expect(nodes.length).toBeGreaterThanOrEqual(2);
    const m = nodes[0];
    expect(m.type).toBe("milestone");
    const mo = m.children![0];
    expect(mo.type).toBe("monthly");
    const w = mo.children![0];
    expect(w.type).toBe("weekly");
    const d = w.children![0];
    expect(["daily", "tiny"]).toContain(d.type);
  });

  test("split returns small concrete steps", () => {
    const steps = offlineSplit("Prepare presentation");
    expect(steps.length).toBeGreaterThanOrEqual(3);
    expect(steps.join(" ")).toMatch(/5 min|smallest/i);
  });

  test("plan titles carry the goal", () => {
    expect(JSON.stringify(offlinePlan({ goalTitle: "Run a marathon" }))).toMatch(/marathon/);
  });
});

describe("savings commitments", () => {
  test("extracts amounts and cadences into dated tasks", async () => {
    const { nodes } = await import("../lib/ai").then((m) =>
      m.generatePlan({ goalTitle: "Make my hair", context: "saving N3500 every 3 days, and saving N10,000 every week" })
    );
    const flat = JSON.stringify(nodes);
    expect(flat).toMatch(/₦3,500/);
    expect(flat).toMatch(/₦10,000/);
    expect(flat).toMatch(/every 3 days/);
    expect(flat).toMatch(/due \d/);
    const saveMilestone = nodes.find((n) => n.title.startsWith("Save consistently"));
    expect(saveMilestone).toBeDefined();
  });

  test("generic goals still get the classic tree", async () => {
    const { nodes } = await import("../lib/ai").then((m) => m.generatePlan({ goalTitle: "Learn chess" }));
    expect(nodes[0].type).toBe("milestone");
    expect(JSON.stringify(nodes)).not.toMatch(/Save ₦/);
  });
});

describe("schedule parser", () => {
  test("tomorrow", () => {
    const { title, baseDate } = parseScheduleRequest("Schedule call with Sarah tomorrow");
    expect(title.toLowerCase()).toContain("sarah");
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    expect(baseDate.toDateString()).toBe(tomorrow.toDateString());
  });

  test("in N days", () => {
    const { baseDate } = parseScheduleRequest("Review in 3 days");
    const d = new Date();
    d.setDate(d.getDate() + 3);
    expect(baseDate.toDateString()).toBe(d.toDateString());
  });

  test("proposes 3 one-hour slots", () => {
    const slots = proposeSlots(new Date());
    expect(slots).toHaveLength(3);
    for (const s of slots) expect(s.endsAt.getTime() - s.startsAt.getTime()).toBe(3600_000);
  });
});

describe("workflow parser", () => {
  test("monday reset ritual", () => {
    const { name, steps } = parseWorkflowRequest("Every Monday I review goals, check emails and plan my week");
    expect(name).toBe("Monday Weekly Reset");
    expect(steps).toHaveLength(7);
  });

  test("generic fallback splits steps", () => {
    const { steps } = parseWorkflowRequest("Water plants, take out trash, lock doors");
    expect(steps.length).toBeGreaterThanOrEqual(2);
  });
});
