import { PET_STATE_LABELS, petStateStore, type PetState } from "./pet/pet-state";
import {
  PET_TYPE_DETAILS,
  PET_TYPE_OPTIONS,
  type PetType,
} from "./pet/pet-type";

const appState: {
  selectedPet: PetType | null;
  showControls: boolean;
} = {
  selectedPet: null,
  showControls: false,
};

const appElement = document.querySelector("#app");

function toggleControls(): void {
  appState.showControls = !appState.showControls;
  render();
}

function setSelectedPet(type: PetType): void {
  appState.selectedPet = type;
  petStateStore.set("idle");
  appState.showControls = false;
  render();
}

function setPetState(state: PetState): void {
  petStateStore.set(state);
  render();
}

function renderSelection(): string {
  return `
    <main class="pet-shell">
      <div class="pet-stage empty-stage">
        <div class="pet-focus">
          <span class="pet-emoji large">🐾</span>
        </div>

        <div class="hover-controls ${appState.showControls ? "is-open" : ""}">
          ${appState.showControls
            ? `
              <div class="control-group pet-group" aria-label="Choose a pet">
                ${PET_TYPE_OPTIONS.map(
                  (pet) => `
                    <button
                      type="button"
                      class="mini-button pet-option"
                      data-pet="${pet.type}"
                      aria-label="Select ${pet.name}"
                      title="${pet.name}"
                    >
                      ${pet.emoji}
                    </button>
                  `,
                ).join("")}
                <button type="button" class="mini-button action-button" data-action="collapse-controls" aria-label="Hide controls" title="Hide controls">
                  ←
                </button>
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

function renderPetView(): string {
  const pet = appState.selectedPet ? PET_TYPE_DETAILS[appState.selectedPet] : null;

  if (!pet) {
    return renderSelection();
  }

  return `
    <main class="pet-shell">
      <div class="pet-stage" aria-live="polite">
        <div class="pet-focus" aria-label="${pet.name}">
          <div class="pet-avatar">${pet.emoji}</div>
          <div class="state-pill state-${petStateStore.current}">${PET_STATE_LABELS[petStateStore.current]}</div>
        </div>

        <div class="hover-controls ${appState.showControls ? "is-open" : ""}">
          ${appState.showControls
            ? `
              <div class="control-group pet-group" aria-label="Choose a pet">
                ${PET_TYPE_OPTIONS.map(
                  (option) => `
                    <button
                      type="button"
                      class="mini-button pet-option ${option.type === pet.type ? "selected" : ""}"
                      data-pet="${option.type}"
                      aria-label="Select ${option.name}"
                      title="${option.name}"
                    >
                      ${option.emoji}
                    </button>
                  `,
                ).join("")}
              </div>

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
      setPetState(state);
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

render();
