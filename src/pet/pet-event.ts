import { petStateStore, type PetState } from "./pet-state";

export const PET_EVENT_TYPES = ["idle", "working", "success", "error"] as const;
const TEMPORARY_STATE_DURATION_MS = 3000;

let temporaryStateTimer: ReturnType<typeof setTimeout> | undefined;

export type PetEventType = (typeof PET_EVENT_TYPES)[number];

export type PetEvent = {
  type: PetEventType;
};

export function parsePetEvent(payload: unknown): PetEvent | null {
  if (typeof payload !== "object" || payload === null || !("type" in payload)) {
    return null;
  }

  const type = payload.type;
  return typeof type === "string" && PET_EVENT_TYPES.includes(type as PetEventType)
    ? { type: type as PetEventType }
    : null;
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
  }

  onStateChange?.();

  if (event.type === "success" || event.type === "error") {
    temporaryStateTimer = setTimeout(() => {
      temporaryStateTimer = undefined;
      petStateStore.set("idle");
      onStateChange?.();
    }, TEMPORARY_STATE_DURATION_MS);
  }

  return currentState;
}
