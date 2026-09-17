const CODING_PET_EVENTS_URL = "http://127.0.0.1:39421/events";

type CodingPetEvent = "idle" | "working" | "success" | "error";

function sendCodingPetEvent(type: CodingPetEvent): void {
  void fetch(CODING_PET_EVENTS_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ type }),
  }).catch(() => {
    // Coding Pet is optional and may not be running.
  });
}

export default function (pi) {
  pi.on("session_start", async (_event, _ctx) => {
    sendCodingPetEvent("idle");
  });

  pi.on("agent_start", async (_event, _ctx) => {
    sendCodingPetEvent("working");
  });

  pi.on("agent_end", async (event, _ctx) => {
    if (event.isTerminal !== false) {
      sendCodingPetEvent("success");
    }
  });

  for (const eventName of ["tool_error", "tool_timeout", "tool_aborted", "tool_blocked"]) {
    pi.on(eventName, async (_event, _ctx) => {
      sendCodingPetEvent("error");
    });
  }
}
