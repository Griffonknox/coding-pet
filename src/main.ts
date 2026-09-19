import { PET_STATE_LABELS, petStateStore, type PetState } from "./pet/pet-state";
import { handlePetEvent, parsePetEvent } from "./pet/pet-event";
import { listen } from "@tauri-apps/api/event";
import { isTauri } from "@tauri-apps/api/core";
import {
  PET_TYPE_DETAILS,
  PET_TYPE_OPTIONS,
  type PetType,
} from "./pet/pet-type";
import { petStatsStore } from "./pet/pet-stats";

const HAMSTER_IMAGE_URL = new URL("./assets/pets/hamster.png", import.meta.url).href;

const appState: {
  selectedPet: PetType | null;
  showControls: boolean;
} = {
  selectedPet: "hamster",
  showControls: false,
};

const appElement = document.querySelector("#app");

function renderPetImage(type: PetType, className: string): string {
  return type === "hamster"
    ? `<img class="${className} hamster-image" src="${HAMSTER_IMAGE_URL}" alt="Hamster" />`
    : `<span class="${className}">${PET_TYPE_DETAILS[type].emoji}</span>`;
}

function toggleControls(): void {
  appState.showControls = !appState.showControls;
  render();
}

function setSelectedPet(type: PetType): void {
  appState.selectedPet = type;
  handlePetEvent({ type: "idle" }, render);
  appState.showControls = false;
  render();
}

function renderSelection(): string {
  return `
    <main class="pet-shell">
      <div class="pet-stage empty-stage selection-stage">
        <div class="selection-content">
          <div class="selection-heading">
            <span class="selection-mark">🐾</span>
            <h1>Choose your Coding Pet</h1>
            <p>Pick your coding companion</p>
          </div>

          <div class="pet-choice-grid" aria-label="Choose your pet">
            ${PET_TYPE_OPTIONS.map(
              (pet) => `
                <button
                  type="button"
                  class="pet-choice"
                  data-pet-choice="${pet.type}"
                  aria-label="Choose ${pet.name}"
                >
                  <span class="pet-choice-emoji">${pet.emoji}</span>
                  <span class="pet-choice-name">${pet.name}</span>
                </button>
              `,
            ).join("")}
          </div>

        </div>
      </div>
    </main>
  `;
}

function formatCompactNumber(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }

  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }

  return value.toString();
}

function formatWorkingDuration(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }

  return `${seconds}s`;
}

function renderPetView(): string {
  const pet = appState.selectedPet ? PET_TYPE_DETAILS[appState.selectedPet] : null;
  const stats = petStatsStore.getSnapshot();

  if (!pet) {
    return renderSelection();
  }

  return `
    <main class="pet-shell">
      <div class="pet-stage" aria-live="polite">
        <div class="pet-focus" aria-label="${pet.name}">
          <div class="pet-avatar">${renderPetImage(pet.type, "pet-avatar-visual")}</div>
          <div class="pet-status-row">
            <span
              class="harness-indicator ${petStateStore.harnessStatus === "connected" ? "received" : ""}"
              aria-label="${petStateStore.harnessStatus === "connected" ? "Harness connected" : "Harness disconnected"}"
              title="${petStateStore.harnessStatus === "connected" ? "Harness connected" : "Harness disconnected"}"
            ></span>
            <div class="state-pill state-${petStateStore.current}">${PET_STATE_LABELS[petStateStore.current]}</div>
          </div>
        </div>

        <div class="hover-controls ${appState.showControls ? "is-open" : ""}">
          ${appState.showControls
            ? `
              <div class="control-group state-group" aria-label="Change pet state">
                ${Object.entries(PET_STATE_LABELS)
                  .map(
                    ([state, label]) => `
                      <button
                        type="button"
                        class="mini-button state-option ${petStateStore.current === state ? "selected" : ""}"
                        data-state="${state}"
                        aria-label="Set state to ${label}"
                        title="${label}"
                      >
                        ${label.slice(0, 1)}
                      </button>
                    `,
                  )
                  .join("")}
                <button type="button" class="mini-button action-button" data-action="collapse-controls" aria-label="Hide controls" title="Hide controls">
                  ←
                </button>
              </div>
              <div class="stats-inline" aria-live="polite">
                <div class="stats-row"><span>Events</span><strong>${stats.harnessEvents}</strong></div>
                <div class="stats-row"><span>Working</span><strong>${formatWorkingDuration(stats.workingMs)}</strong></div>
                <div class="stats-row"><span>AI Usage</span><strong>${formatCompactNumber(stats.aiUsage.totalTokens)}</strong></div>
              </div>
            `
            : `
              <button type="button" class="cog-button" data-action="toggle-controls" aria-label="Open options" title="Options">
                ⚙
              </button>
            `}
        </div>
      </div>
    </main>
  `;
}

function render(): void {
  if (!appElement) {
    return;
  }

  appElement.innerHTML = appState.selectedPet ? renderPetView() : renderSelection();

  const petStage = appElement.querySelector(".pet-stage");
  petStage?.addEventListener("mouseleave", () => {
    appState.showControls = false;
    render();
  });

  appElement.querySelectorAll("[data-pet]").forEach((button) => {
    button.addEventListener("click", () => {
      const type = button.getAttribute("data-pet") as PetType;
      setSelectedPet(type);
    });
  });

  appElement.querySelectorAll("[data-state]").forEach((button) => {
    button.addEventListener("click", () => {
      const state = button.getAttribute("data-state") as PetState;
      handlePetEvent({ type: state }, render);
      render();
    });
  });

  appElement.querySelectorAll("[data-pet-choice]").forEach((button) => {
    button.addEventListener("click", () => {
      const type = button.getAttribute("data-pet-choice") as PetType;
      setSelectedPet(type);
    });
  });

  const toggleButtons = appElement.querySelectorAll("[data-action='toggle-controls']");
  toggleButtons.forEach((button) => {
    button.addEventListener("click", () => {
      toggleControls();
    });
  });

  const collapseButtons = appElement.querySelectorAll("[data-action='collapse-controls']");
  collapseButtons.forEach((button) => {
    button.addEventListener("click", () => {
      appState.showControls = false;
      render();
    });
  });
}

if (isTauri()) {
  void listen<unknown>("pet-event", ({ payload }) => {
    const event = parsePetEvent(payload);
    if (event) {
      handlePetEvent(event, render, { isHarnessEvent: true });
      render();
    }
  });
}

window.addEventListener("beforeunload", () => {
  petStatsStore.finalizeIfNeeded();
});

render();
