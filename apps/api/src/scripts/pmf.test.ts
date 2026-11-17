import { eq } from "drizzle-orm";
import { v7 as uuidv7 } from "uuid";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createDb, type Db } from "../db/client";
import { cases, corrections, replayJobs, runs } from "../db/schema";
import { startTestApp, TEST_DATABASE_URL, type TestContext } from "../test/harness";
import { isoWeekStart, pmf } from "./pmf";

/**
 * These numbers decide whether Shireen keeps building this, so the line between "someone tried it"
 * and "a team ships through it" has to be exact, and a metric that has never produced output is
 * not a metric. Everything below pins where that line sits.
 */
describe("isoWeekStart", () => {
  it("gives the Monday of an ISO week", () => {
    // 2026-W01 begins Monday 29 December 2025: the week holding the first Thursday of 2026.
    expect(new Date(isoWeekStart(2026, 1)).toISOString().slice(0, 10)).toBe("2025-12-29");
    expect(new Date(isoWeekStart(2026, 47)).toISOString().slice(0, 10)).toBe("2026-11-16");
    expect(new Date(isoWeekStart(2027, 1)).toISOString().slice(0, 10)).toBe("2027-01-04");
  });
});

const DAY = 86_400_000;
const ago = (d: number) => new Date(Date.now() - d * DAY);

describe("pmf", () => {
  let ctx: TestContext;
  let db: Db;
  let end: () => Promise<void>;

  beforeAll(async () => {
    ctx = await startTestApp();
    const conn = createDb(TEST_DATABASE_URL, { max: 1 });
    db = conn.db;
    end = () => conn.sql.end();
  });
  afterAll(async () => {
    await end();
    await ctx.close();
  });
  // Each case seeds the whole world it asserts on; leftovers from the last one would answer for it.
  beforeEach(async () => {
    await db.delete(replayJobs).where(eq(replayJobs.projectId, ctx.projectId));
    await db.delete(corrections).where(eq(corrections.projectId, ctx.projectId));
    await db.delete(runs).where(eq(runs.projectId, ctx.projectId));
  });

  async function replay(ci: Record<string, unknown> | null, daysAgo: number, pass = true) {
    await db.insert(replayJobs).values({
      id: uuidv7(),
      projectId: ctx.projectId,
      targetModel: "fake/fake-triage-weak",
      mode: "step",
      status: "completed",
      ci,
      summary: { gate: { pass } },
      createdAt: ago(daysAgo),
    });
  }

  async function correction(actor: string | null, daysAgo: number, source: "ui" | "sdk" | "implicit" = "ui") {
    const runId = uuidv7();
    await db.insert(runs).values({
      id: runId,
      projectId: ctx.projectId,
      agent: "triage",
      status: "completed",
      input: {},
      startedAt: ago(daysAgo),
    });
    await db.insert(corrections).values({
      id: uuidv7(),
      projectId: ctx.projectId,
      runId,
      kind: "edit",
      actor,
      source,
      createdAt: ago(daysAgo),
    });
  }

  it("calls a hand-run replay a trial, not a gate", async () => {
    await replay(null, 2);
    const [p] = await pmf(db);
    expect(p?.gate.stage).toBe("manual");
  });

  it("does not count CI on a feature branch as gating", async () => {
    await replay({ provider: "github", event: "pull_request", baseRef: "feat/x", defaultBranch: "main" }, 2);
    const [p] = await pmf(db);
    expect(p?.gate.stage).toBe("ci");
  });

  it("counts pull requests into the default branch, but not as production until they persist", async () => {
    const pr = {
      provider: "github",
      repo: "acme/app",
      event: "pull_request",
      baseRef: "main",
      defaultBranch: "main",
    };
    await replay(pr, 3);
    const [p] = await pmf(db);
    expect(p?.gate.stage).toBe("gating");
    expect(p?.gate.repos).toEqual(["acme/app"]);
  });

  it("is production once the gate has run for a month and ran again this week", async () => {
    const pr = {
      provider: "github",
      repo: "acme/app",
      event: "pull_request",
      baseRef: "main",
      defaultBranch: "main",
    };
    await replay(pr, 40);
    await replay(pr, 1, false);
    const [p] = await pmf(db);
    expect(p?.gate.stage).toBe("production");
    expect(p?.gate.daysGating).toBeGreaterThanOrEqual(30);
    // A gate that has failed a build is a gate somebody had to answer to.
    expect(p?.gate.blockedARelease).toBe(true);
  });

  it("goes back to gating when the gate stopped running — somebody removed it", async () => {
    const pr = { provider: "github", event: "pull_request", baseRef: "main", defaultBranch: "main" };
    await replay(pr, 60);
    await replay(pr, 20);
    const [p] = await pmf(db);
    expect(p?.gate.stage).toBe("gating");
  });

  it("counts only people, and only from week four, as retention", async () => {
    await correction("dana@acme.com", 40);
    await correction("dana@acme.com", 38);
    // Week one is the honeymoon and does not count; these two are inside it.
    await correction("dana@acme.com", 5);
    await correction(null, 5, "sdk"); // the SDK is not a person
    const [p] = await pmf(db);
    expect(p?.corrections.weeksSinceFirst).toBeGreaterThanOrEqual(5);
    expect(p?.corrections.perWeekFromWeekFour).toBeGreaterThan(0);
  });

  it("lists who may answer the survey: two corrections in the last fortnight", async () => {
    await correction("dana@acme.com", 3);
    await correction("dana@acme.com", 2);
    await correction("sam@acme.com", 1); // one is not enough
    const [p] = await pmf(db);
    const actors = p?.eligible.map((e) => e.actor) ?? [];
    expect(actors).toContain("dana@acme.com");
    expect(actors).not.toContain("sam@acme.com");
  });

  it("measures the corpus against the switching-cost floor", async () => {
    const [before] = await pmf(db);
    expect(before?.corpus.overFloor).toBe(false);
    expect(before?.corpus.floor).toBe(200);
  });
});
