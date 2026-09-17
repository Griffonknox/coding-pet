export const PET_STATES = ["idle", "working", "success", "error"] as const;

export type PetState = (typeof PET_STATES)[number];

export const PET_STATE_LABELS: Record<PetState, string> = {
  idle: "Idle",
  working: "Working",
  success: "Success",
  error: "Error",
};

export const petStateStore = {
  current: "idle" as PetState,
  set(nextState: PetState): PetState {
    this.current = nextState;
    return this.current;
  },
};