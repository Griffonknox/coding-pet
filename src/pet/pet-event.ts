import { petStateStore, type PetState } from "./pet-state";

export const PET_EVENT_TYPES = ["idle", "working", "success", "error"] as const;

export type PetEventType = (typeof PET_EVENT_TYPES)[number];

export type PetEvent = {
  type: PetEventType;
};

export function handlePetEvent(event: PetEvent): PetState {
  const nextState: PetState = event.type;
  return petStateStore.set(nextState);
}
