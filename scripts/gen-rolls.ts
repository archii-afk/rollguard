import { writeFileSync, mkdirSync } from "node:fs";
import type { Roll, RollEntry, DraftEntry, Household } from "../lib/rolls/types";

function mulberry32(a: number) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const rnd = mulberry32(153112);
const pick = <T,>(xs: T[]) => xs[Math.floor(rnd() * xs.length)];

const MALE = [["Ravi Kumar","ರವಿ ಕುಮಾರ್"],["Suresh Gowda","ಸುರೇಶ್ ಗೌಡ"],["Abdul Kareem","ಅಬ್ದುಲ್ ಕರೀಮ್"],["Manjunath S","ಮಂಜುನಾಥ್ ಎಸ್"],["Joseph D'Souza","ಜೋಸೆಫ್ ಡಿಸೋಜಾ"],["Prakash Naik","ಪ್ರಕಾಶ್ ನಾಯ್ಕ್"],["Imtiyaz Ahmed","ಇಮ್ತಿಯಾಜ್ ಅಹಮದ್"],["Basavaraj H","ಬಸವರಾಜ್ ಹೆಚ್"]];
const FEMALE = [["Lakshmi Devi","ಲಕ್ಷ್ಮಿ ದೇವಿ"],["Shobha Rani","ಶೋಭಾ ರಾಣಿ"],["Fathima Bi","ಫಾತಿಮಾ ಬಿ"],["Geetha M","ಗೀತಾ ಎಂ"],["Mary Fernandes","ಮೇರಿ ಫೆರ್ನಾಂಡಿಸ್"],["Nagamma","ನಾಗಮ್ಮ"],["Rukmini Bai","ರುಕ್ಮಿಣಿ ಬಾಯಿ"],["Ayesha Khanum","ಆಯಿಷಾ ಖಾನಂ"]];
const AC = { acNo: 153, acName: "Shantinagar", partNo: 112 };

const prevEntries: RollEntry[] = []; const draftEntries: DraftEntry[] = []; const households: Household[] = [];
let serial = 1; let draftSerial = 1; let epicSeq = 1;
const epic = (house: number, n: number) => `ZZK${String(house).padStart(2, "0")}${String(n).padStart(5, "0")}`;

// 40 generic households, houses 1..13 and 15..41 (14 is the demo)
for (let house = 1; house <= 41; house++) {
  if (house === 14) continue;
  const n = 2 + Math.floor(rnd() * 4);
  const [headEn, headKn] = pick(MALE);
  const members: RollEntry[] = [];
  for (let i = 0; i < n; i++) {
    const isHead = i === 0; const female = !isHead && rnd() < 0.5;
    const [en, kn] = isHead ? [headEn, headKn] : pick(female ? FEMALE : MALE);
    members.push({ serial: serial++, epic: epic(house, epicSeq++), name: { en, kn },
      relationType: isHead ? "F" : female ? "H" : "F", relationName: { en: isHead ? pick(MALE)[0] : headEn, kn: isHead ? pick(MALE)[1] : headKn },
      houseNo: String(house), age: isHead ? 35 + Math.floor(rnd() * 30) : 18 + Math.floor(rnd() * 50), gender: female ? "F" : "M", partNo: AC.partNo });
  }
  prevEntries.push(...members);
  for (const m of members) {
    const r = rnd(); const d: DraftEntry = { ...m, serial: draftSerial++, age: m.age + 1 };
    if (r < 0.06) d.flag = "S"; else if (r < 0.09) d.flag = "A"; else if (r < 0.11) d.flag = "D";
    if (d.flag) d.reasonCode = `SIR-${d.flag}-BLO`;
    if (r < 0.015) continue; // silently dropped rows exist in the wild
    draftEntries.push(d);
  }
  households.push({ houseNo: String(house), partNo: AC.partNo, members: members.map((m, i) => ({ id: `h${house}m${i}`, name: m.name, age: m.age + 1, gender: m.gender, relationToHead: i === 0 ? "head" : "member", epic: m.epic })) });
}

// Demo household — House 14, the Rafeeq family
const H = "14";
const rafeeqPrev: RollEntry[] = [
  { serial: serial++, epic: "ZZK1400001", name: { en: "Mohammed Rafeeq", kn: "ಮೊಹಮ್ಮದ್ ರಫೀಕ್" }, relationType: "F", relationName: { en: "Abdul Rasheed", kn: "ಅಬ್ದುಲ್ ರಶೀದ್" }, houseNo: H, age: 46, gender: "M", partNo: AC.partNo },
  { serial: serial++, epic: "ZZK1400002", name: { en: "Ameena Begum", kn: "ಅಮೀನಾ ಬೇಗಂ" }, relationType: "H", relationName: { en: "Abdul Rasheed", kn: "ಅಬ್ದುಲ್ ರಶೀದ್" }, houseNo: H, age: 72, gender: "F", partNo: AC.partNo },
  { serial: serial++, epic: "ZZK1400003", name: { en: "Salma Rafeeq", kn: "ಸಲ್ಮಾ ರಫೀಕ್" }, relationType: "H", relationName: { en: "Mohammed Rafeeq", kn: "ಮೊಹಮ್ಮದ್ ರಫೀಕ್" }, houseNo: H, age: 43, gender: "F", partNo: AC.partNo },
  { serial: serial++, epic: "ZZK1400004", name: { en: "Imran Rafeeq", kn: "ಇಮ್ರಾನ್ ರಫೀಕ್" }, relationType: "F", relationName: { en: "Mohammed Rafeeq", kn: "ಮೊಹಮ್ಮದ್ ರಫೀಕ್" }, houseNo: H, age: 22, gender: "M", partNo: AC.partNo },
  { serial: serial++, epic: "ZZK1400005", name: { en: "Farhan Rafeeq", kn: "ಫರ್ಹಾನ್ ರಫೀಕ್" }, relationType: "F", relationName: { en: "Mohammed Rafeeq", kn: "ಮೊಹಮ್ಮದ್ ರಫೀಕ್" }, houseNo: H, age: 26, gender: "M", partNo: AC.partNo },
];
prevEntries.push(...rafeeqPrev);
const [rafeeq, ameena, salma, imran, farhan] = rafeeqPrev;
draftEntries.push(
  { ...rafeeq, serial: draftSerial++, epic: "ZZK1400099", name: { en: "Md. Rafik", kn: "ಮೊ. ರಫಿಕ್" }, age: 47, flag: "DU", reasonCode: "SIR-DU-NAMEMATCH", sourceNote: "Re-enumerated; matched to another elector by name/age" },
  { ...ameena, serial: draftSerial++, age: 73, flag: "D", reasonCode: "SIR-D-BLO", sourceNote: "BLO field report: reported deceased by neighbour" },
  { ...salma, serial: draftSerial++, age: 44 },
  { ...imran, serial: draftSerial++, age: 23, flag: "S", reasonCode: "SIR-S-BLO", sourceNote: "BLO visit: house locked on two visits" },
  { ...farhan, serial: draftSerial++, age: 27, flag: "S", reasonCode: "SIR-S-SELF", sourceNote: "Form 8 shifting request received from Hubballi" },
);
households.push({ houseNo: H, partNo: AC.partNo, members: [
  { id: "rafeeq", name: rafeeq.name, age: 47, gender: "M", relationToHead: "head", epic: rafeeq.epic },
  { id: "ameena", name: ameena.name, age: 73, gender: "F", relationToHead: "mother", epic: ameena.epic },
  { id: "salma", name: salma.name, age: 44, gender: "F", relationToHead: "wife", epic: salma.epic },
  { id: "imran", name: imran.name, age: 23, gender: "M", relationToHead: "son", epic: imran.epic },
  { id: "farhan", name: farhan.name, age: 27, gender: "M", relationToHead: "son", epic: farhan.epic, expectedOutcome: "correct-deletion" },
  { id: "zoya", name: { en: "Zoya Rafeeq", kn: "ಜೋಯಾ ರಫೀಕ್" }, age: 18, gender: "F", relationToHead: "daughter" },
]});

mkdirSync("data", { recursive: true });
const prev: Roll = { vintage: "2025-01", ...AC, entries: prevEntries };
const draft: Roll<DraftEntry> = { vintage: "2026-08-draft", ...AC, entries: draftEntries };
writeFileSync("data/roll-2025.json", JSON.stringify(prev, null, 2));
writeFileSync("data/roll-2026-draft.json", JSON.stringify(draft, null, 2));
writeFileSync("data/households.json", JSON.stringify(households, null, 2));
console.log(`prev=${prevEntries.length} draft=${draftEntries.length} households=${households.length}`);
