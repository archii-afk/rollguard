export type Flag = "A" | "S" | "D" | "DU";

export interface BiName {
  en: string;
  kn: string;
}

export interface RollEntry {
  serial: number;
  epic: string;
  name: BiName;
  relationType: "F" | "M" | "H" | "W" | "O";
  relationName: BiName;
  houseNo: string;
  age: number;
  gender: "M" | "F" | "O";
  partNo: number;
}

export interface DraftEntry extends RollEntry {
  flag?: Flag;
  reasonCode?: string;
  sourceNote?: string;
}

export interface Roll<E extends RollEntry = RollEntry> {
  vintage: string;
  acNo: number;
  acName: string;
  partNo: number;
  entries: E[];
}

export interface HouseholdMember {
  id: string;
  name: BiName;
  age: number;
  gender: "M" | "F" | "O";
  relationToHead: string;
  epic?: string;
  expectedOutcome?: "correct-deletion";
}

export interface Household {
  houseNo: string;
  partNo: number;
  members: HouseholdMember[];
}
