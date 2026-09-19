const CODING_PET_EVENTS_URL = "http://127.0.0.1:39421/events";

type CodingPetEvent = "idle" | "working" | "success" | "error";
type HarnessStatus = "connected" | "disconnected";

type GenericUsage = {
  inputTokens?: number;
  outputTokens?: number;
  cacheReadTokens?: number;
  cacheWriteTokens?: number;
  totalTokens?: number;
};

function extractUsage(event: unknown): GenericUsage | undefined {
  if (!event || typeof event !== "object") {
    return undefined;
  }

  const candidate = event as Record<string, unknown>;
  const possibleUsageObjects = [
    candidate.usage,
    candidate.message && typeof candidate.message === "object" ? (candidate.message as Record<string, unknown>).usage : undefined,
    candidate.telemetry && typeof candidate.telemetry === "object" ? (candidate.telemetry as Record<string, unknown>).usage : undefined,
  ];

  for (const source of possibleUsageObjects) {
    if (!source || typeof source !== "object") {
      continue;
    }

    const usage = source as Record<string, unknown>;
    const normalized: GenericUsage = {
      inputTokens: typeof usage.input === "number" ? usage.input : undefined,
      outputTokens: typeof usage.output === "number" ? usage.output : undefined,
      cacheReadTokens: typeof usage.cacheRead === "number" ? usage.cacheRead : undefined,
      cacheWriteTokens: typeof usage.cacheWrite === "number" ? usage.cacheWrite : undefined,
      totalTokens: typeof usage.totalTokens === "number" ? usage.totalTokens : undefined,
    };

    if (Object.values(normalized).some((value) => typeof value === "number")) {
      return normalized;
    }
  }

  return undefined;
}

function sendCodingPetEvent(
  type: CodingPetEvent,
  usage?: GenericUsage,
  harnessStatus?: HarnessStatus,
): void {
  const payload = usage ? { type, usage, ...(harnessStatus ? { harnessStatus } : {}) } : { type, ...(harnessStatus ? { harnessStatus } : {}) };

  void fetch(CODING_PET_EVENTS_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  }).catch(() => {
    // Coding Pet is optional and may not be running.
  });
}

export default function (pi) {
  pi.on("session_start", async (_event, _ctx) => {
    sendCodingPetEvent("idle", undefined, "connected");
  });

  pi.on("session_shutdown", async (_event, _ctx) => {
    sendCodingPetEvent("idle", undefined, "disconnected");
  });

  pi.on("agent_start", async (_event, _ctx) => {
    sendCodingPetEvent("working");
  });

  pi.on("agent_end", async (event, _ctx) => {
    if (event.isTerminal !== false) {
      sendCodingPetEvent("success", extractUsage(event), "connected");
    }
  });

  for (const eventName of ["tool_error", "tool_timeout", "tool_aborted", "tool_blocked"]) {
    pi.on(eventName, async (event, _ctx) => {
      sendCodingPetEvent("error", extractUsage(event), "connected");
    });
  }
}
