export const PET_STATES = ["idle", "working", "success", "error"] as const;

export type PetState = (typeof PET_STATES)[number];
export type HarnessStatus = "connected" | "disconnected";

export const PET_STATE_LABELS: Record<PetState, string> = {
  idle: "Idle",
  working: "Working",
  success: "Success",
  error: "Error",
};

export const petStateStore = {
  current: "idle" as PetState,
  harnessReceived: false,
  harnessStatus: "disconnected" as HarnessStatus,
  set(nextState: PetState): PetState {
    this.current = nextState;
    return this.current;
  },
  setHarnessStatus(status: HarnessStatus): HarnessStatus {
    this.harnessStatus = status;
    this.harnessReceived = status === "connected" || this.harnessReceived;
    return this.harnessStatus;
  },
  markHarnessReceived(status: HarnessStatus = "connected"): HarnessStatus {
    this.harnessStatus = status;
    this.harnessReceived = true;
    return this.harnessStatus;
  },
};