export const PET_TYPES = ["hamster", "bear", "fox"] as const;

export type PetType = (typeof PET_TYPES)[number];

export interface PetProfile {
  type: PetType;
  name: string;
  emoji: string;
  trait: string;
}

export const PET_TYPE_DETAILS: Record<PetType, PetProfile> = {
  hamster: { type: "hamster", name: "Hamster", emoji: "🐹", trait: "Cute" },
  bear: { type: "bear", name: "Bear", emoji: "🐻", trait: "Tough" },
  fox: { type: "fox", name: "Fox", emoji: "🦊", trait: "Balanced" },
};

export const PET_TYPE_OPTIONS = Object.values(PET_TYPE_DETAILS);
