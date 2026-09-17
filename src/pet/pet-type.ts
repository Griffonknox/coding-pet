export const PET_TYPES = ["hamster", "bear", "fox"] as const;

export type PetType = (typeof PET_TYPES)[number];

export interface PetProfile {
  type: PetType;
  name: string;
  emoji: string;
}

export const PET_TYPE_DETAILS: Record<PetType, PetProfile> = {
  hamster: { type: "hamster", name: "Hamster", emoji: "🐹" },
  bear: { type: "bear", name: "Bear", emoji: "🐻" },
  fox: { type: "fox", name: "Fox", emoji: "🦊" },
};

export const PET_TYPE_OPTIONS = Object.values(PET_TYPE_DETAILS);
