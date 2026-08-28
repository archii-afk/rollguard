import type { Roll, DraftEntry, Household } from "./types";
import prev from "@/data/roll-2025.json";
import draft from "@/data/roll-2026-draft.json";
import households from "@/data/households.json";

export function loadPreviousRoll(): Roll { return prev as Roll; }
export function loadDraftRoll(): Roll<DraftEntry> { return draft as Roll<DraftEntry>; }
export function loadHouseholds(): Household[] { return households as Household[]; }
