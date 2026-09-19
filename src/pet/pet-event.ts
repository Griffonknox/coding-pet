import { petStateStore, type PetState } from "./pet-state";
import { petStatsStore } from "./pet-stats";

export const PET_EVENT_TYPES = ["idle", "working", "success", "error"] as const;
const TEMPORARY_STATE_DURATION_MS = 3000;

let temporaryStateTimer: ReturnType<typeof setTimeout> | undefined;

export type PetEventType = (typeof PET_EVENT_TYPES)[number];

export type PetEventUsage = {
  inputTokens?: number;
  outputTokens?: number;
  cacheReadTokens?: number;
  cacheWriteTokens?: number;
  totalTokens?: number;
};

export type PetEvent = {
  type: PetEventType;
  usage?: PetEventUsage;
};

function parseEventUsage(raw: unknown): PetEventUsage | undefined {
  if (typeof raw !== "object" || raw === null) {
    return undefined;
  }

  const usage = raw as Record<string, unknown>;
  const normalized: PetEventUsage = {
    inputTokens: typeof usage.inputTokens === "number" ? usage.inputTokens : undefined,
    outputTokens: typeof usage.outputTokens === "number" ? usage.outputTokens : undefined,
    cacheReadTokens: typeof usage.cacheReadTokens === "number" ? usage.cacheReadTokens : undefined,
    cacheWriteTokens: typeof usage.cacheWriteTokens === "number" ? usage.cacheWriteTokens : undefined,
    totalTokens: typeof usage.totalTokens === "number" ? usage.totalTokens : undefined,
  };

  const hasAnyUsage = Object.values(normalized).some((value) => typeof value === "number");
  return hasAnyUsage ? normalized : undefined;
}

export function parsePetEvent(payload: unknown): PetEvent | null {
  if (typeof payload !== "object" || payload === null || !("type" in payload)) {
    return null;
  }

  const type = payload.type;
  if (typeof type !== "string" || !PET_EVENT_TYPES.includes(type as PetEventType)) {
    return null;
  }

  const usage = "usage" in payload ? parseEventUsage(payload.usage) : undefined;

  return {
    type: type as PetEventType,
    ...(usage ? { usage } : {}),
  };
}

export function handlePetEvent(
  event: PetEvent,
  onStateChange?: () => void,
  options?: { isHarnessEvent?: boolean },
): PetState {
  if (temporaryStateTimer) {
    clearTimeout(temporaryStateTimer);
    temporaryStateTimer = undefined;
  }

  const nextState: PetState = event.type;
  const currentState = petStateStore.set(nextState);

  if (options?.isHarnessEvent) {
    petStateStore.markHarnessReceived();
    petStatsStore.recordHarnessEvent();
    if (event.usage) {
      petStatsStore.recordUsage(event.usage);
    }
  }

  petStatsStore.syncState(nextState);
  onStateChange?.();

  if (event.type === "success" || event.type === "error") {
    temporaryStateTimer = setTimeout(() => {
      temporaryStateTimer = undefined;
      petStateStore.set("idle");
      petStatsStore.syncState("idle");
      onStateChange?.();
    }, TEMPORARY_STATE_DURATION_MS);
  }

  return currentState;
}
