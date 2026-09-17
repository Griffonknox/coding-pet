import { petStateStore, type PetState } from "./pet-state";

export const PET_EVENT_TYPES = ["idle", "working", "success", "error"] as const;

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

export function handlePetEvent(event: PetEvent): PetState {
  const nextState: PetState = event.type;
  return petStateStore.set(nextState);
}
