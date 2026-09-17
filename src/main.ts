type PetType = "hamster" | "bear" | "fox";
type PetState = "idle" | "working" | "success" | "error";

interface PetDefinition {
  type: PetType;
  name: string;
  emoji: string;
  trait: string;
}

const pets: PetDefinition[] = [
  { type: "hamster", name: "Hamster", emoji: "🐹", trait: "Cute" },
  { type: "bear", name: "Bear", emoji: "🐻", trait: "Tough" },
  { type: "fox", name: "Fox", emoji: "🦊", trait: "Balanced" },
];

const stateLabels: Record<PetState, string> = {
  idle: "Idle",
  working: "Working",
  success: "Success",
  error: "Error",
};

const appState: {
  selectedPet: PetType | null;
  petState: PetState;
} = {
  selectedPet: null,
  petState: "idle",
};

const appElement = document.querySelector("#app");

function setSelectedPet(type: PetType): void {
  appState.selectedPet = type;
  appState.petState = "idle";
  render();
}

function setPetState(state: PetState): void {
  appState.petState = state;
  render();
}

function renderSelection(): string {
  return `
    <main class="pet-app">
      <header class="app-header">
        <span class="eyebrow">Coding Pet</span>
        <h1>Choose your companion</h1>
      </header>

      <section class="pet-options" aria-label="Select a pet">
        ${pets
          .map(
            (pet) => `
              <button
                class="pet-card"
                type="button"
                data-pet="${pet.type}"
                aria-label="Select ${pet.name}"
              >
                <span class="pet-emoji">${pet.emoji}</span>
                <span class="pet-name">${pet.name}</span>
                <span class="pet-trait">${pet.trait}</span>
              </button>
            `,
          )
          .join("")}
      </section>
    </main>
  `;
}

function renderPetView(): string {
  const pet = pets.find((candidate) => candidate.type === appState.selectedPet);

  if (!pet) {
    return renderSelection();
  }

  return `
    <main class="pet-app compact">
      <header class="app-header">
        <span class="eyebrow">Coding Pet</span>
      </header>

      <section class="pet-display" aria-live="polite">
        <div class="pet-avatar" aria-label="${pet.name}">${pet.emoji}</div>
        <h2>${pet.name}</h2>
        <p class="pet-trait">${pet.trait}</p>
        <div class="state-panel">
          <span class="state-label">Current state</span>
          <strong class="state-value state-${appState.petState}">${stateLabels[appState.petState]}</strong>
        </div>
      </section>

      <section class="state-controls" aria-label="Change pet state">
        ${Object.entries(stateLabels)
          .map(
            ([state, label]) => `
              <button
                type="button"
                class="state-button ${appState.petState === state ? "active" : ""}"
                data-state="${state}"
              >
                ${label}
              </button>
            `,
          )
          .join("")}
      </section>

      <button type="button" class="secondary-button" data-action="change-pet">
        Choose another pet
      </button>
    </main>
  `;
}

function render(): void {
  if (!appElement) {
    return;
  }

  appElement.innerHTML = appState.selectedPet ? renderPetView() : renderSelection();

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

  const changePetButton = appElement.querySelector("[data-action='change-pet']");
  changePetButton?.addEventListener("click", () => {
    appState.selectedPet = null;
    appState.petState = "idle";
    render();
  });
}

render();
