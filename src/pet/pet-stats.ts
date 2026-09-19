import type { PetState } from "./pet-state";

const STORAGE_KEY = "coding-pet-stats-v1";

export type PetUsageSummary = {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  totalTokens: number;
};

export type PetStatisticsSnapshot = {
  harnessEvents: number;
  workingMs: number;
  aiUsage: PetUsageSummary;
};

const ZERO_USAGE: PetUsageSummary = {
  inputTokens: 0,
  outputTokens: 0,
  cacheReadTokens: 0,
  cacheWriteTokens: 0,
  totalTokens: 0,
};

function clampNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
    return value;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed >= 0) {
      return parsed;
    }
  }

  return 0;
}

function normalizeUsage(raw: unknown): PetUsageSummary {
  if (typeof raw !== "object" || raw === null) {
    return { ...ZERO_USAGE };
  }

  const usage = raw as Record<string, unknown>;
  const nextUsage: PetUsageSummary = {
    inputTokens: clampNumber(usage.inputTokens ?? usage.input),
    outputTokens: clampNumber(usage.outputTokens ?? usage.output),
    cacheReadTokens: clampNumber(usage.cacheReadTokens ?? usage.cacheRead),
    cacheWriteTokens: clampNumber(usage.cacheWriteTokens ?? usage.cacheWrite),
    totalTokens: clampNumber(usage.totalTokens ?? usage.total),
  };

  const hasExplicitTotal = nextUsage.totalTokens > 0;
  const computedTotal =
    nextUsage.inputTokens +
    nextUsage.outputTokens +
    nextUsage.cacheReadTokens +
    nextUsage.cacheWriteTokens;

  nextUsage.totalTokens = hasExplicitTotal ? nextUsage.totalTokens : computedTotal;

  return nextUsage;
}

const readStorage = (): string | null => {
  if (typeof localStorage === "undefined") {
    return null;
  }

  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
};

const writeStorage = (value: string): void => {
  if (typeof localStorage === "undefined") {
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // Ignore storage errors; prefer keeping the app usable.
  }
};

export const petStatsStore = {
  harnessEvents: 0,
  workingMs: 0,
  aiUsage: { ...ZERO_USAGE },
  workingStartedAt: null as number | null,

  load(): void {
    const raw = readStorage();
    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as Partial<PetStatisticsSnapshot> & {
        workingStartedAt?: number | null;
      };

      this.harnessEvents = Math.max(0, clampNumber(parsed.harnessEvents));
      this.workingMs = Math.max(0, clampNumber(parsed.workingMs));
      this.aiUsage = normalizeUsage(parsed.aiUsage ?? ZERO_USAGE);
      this.workingStartedAt =
        typeof parsed.workingStartedAt === "number" && Number.isFinite(parsed.workingStartedAt)
          ? parsed.workingStartedAt
          : null;
    } catch {
      this.reset();
    }
  },

  reset(): void {
    this.harnessEvents = 0;
    this.workingMs = 0;
    this.aiUsage = { ...ZERO_USAGE };
    this.workingStartedAt = null;
    this.save();
  },

  save(): void {
    const payload: PetStatisticsSnapshot & { workingStartedAt?: number | null } = {
      harnessEvents: this.harnessEvents,
      workingMs: this.workingMs,
      aiUsage: { ...this.aiUsage },
      workingStartedAt: this.workingStartedAt,
    };

    writeStorage(JSON.stringify(payload));
  },

  recordHarnessEvent(): number {
    this.harnessEvents += 1;
    this.save();
    return this.harnessEvents;
  },

  recordUsage(usage: Partial<PetUsageSummary> | undefined): PetUsageSummary {
    if (!usage) {
      return this.aiUsage;
    }

    const nextUsage = normalizeUsage(usage);
    if (nextUsage.inputTokens === 0 && nextUsage.outputTokens === 0 && nextUsage.cacheReadTokens === 0 && nextUsage.cacheWriteTokens === 0 && nextUsage.totalTokens === 0) {
      return this.aiUsage;
    }

    this.aiUsage = {
      inputTokens: this.aiUsage.inputTokens + nextUsage.inputTokens,
      outputTokens: this.aiUsage.outputTokens + nextUsage.outputTokens,
      cacheReadTokens: this.aiUsage.cacheReadTokens + nextUsage.cacheReadTokens,
      cacheWriteTokens: this.aiUsage.cacheWriteTokens + nextUsage.cacheWriteTokens,
      totalTokens: this.aiUsage.totalTokens + nextUsage.totalTokens,
    };

    this.save();
    return this.aiUsage;
  },

  beginWorking(now: number = Date.now()): number | null {
    if (this.workingStartedAt === null) {
      this.workingStartedAt = now;
      this.save();
    }

    return this.workingStartedAt;
  },

  endWorking(now: number = Date.now()): number {
    if (this.workingStartedAt === null) {
      return this.workingMs;
    }

    const elapsed = Math.max(0, now - this.workingStartedAt);
    this.workingMs += elapsed;
    this.workingStartedAt = null;
    this.save();
    return this.workingMs;
  },

  syncState(nextState: PetState, now: number = Date.now()): void {
    if (nextState === "working") {
      this.beginWorking(now);
      return;
    }

    if (this.workingStartedAt !== null) {
      this.endWorking(now);
    }
  },

  finalizeIfNeeded(now: number = Date.now()): void {
    if (this.workingStartedAt !== null) {
      this.endWorking(now);
    }
  },

  getSnapshot(): PetStatisticsSnapshot {
    return {
      harnessEvents: this.harnessEvents,
      workingMs: this.workingMs,
      aiUsage: { ...this.aiUsage },
    };
  },
};

petStatsStore.load();
