import type { Ground } from "@/lib/claims";
import type { MemberAssessment, MemberStatus } from "@/lib/diff";

export interface DraftInput {
  assessment: MemberAssessment;
  ground: Ground;
  evidence: string[];
  acName: string;
  partNo: number;
}

export interface DraftField {
  key: string;
  label: string;
  value: string;
}

export interface DraftOutput {
  form: "6" | "8";
  fields: DraftField[];
  declaration: { en: string; kn: string; hi: string };
  evidenceChecklist: string[];
}

export function formFor(status: MemberStatus, ground: Ground): "6" | "8" {
  return status === "DUPLICATE_FLAGGED"
    || status === "DETAILS_CHANGED"
    || ground === "NOT_DUPLICATE"
    || ground === "CORRECT_DETAILS"
    ? "8"
    : "6";
}

function declarationFor(input: DraftInput): DraftOutput["declaration"] {
  const { assessment, ground, acName, partNo } = input;
  const { member } = assessment;
  const name = member.name.en;
  const epic = member.epic ?? "—";
  const houseNo = assessment.draft?.houseNo ?? assessment.previous?.houseNo ?? "—";
  const provenance = assessment.provenance.find(item => item.field === "flag")
    ?? assessment.provenance.at(-1);
  const vintage = provenance?.vintage ?? "2026-08-draft";
  const serial = provenance?.serial ?? assessment.draft?.serial ?? assessment.previous?.serial ?? 0;
  const flag = assessment.draft?.flag ?? provenance?.draft ?? "none";
  const source = `Draft roll ${vintage}, Part ${partNo}, Serial ${serial}, flag ${flag}.`;

  const declarations: Record<Ground, DraftOutput["declaration"]> = {
    ALIVE_RESIDENT: {
      en: `I, ${name}, EPIC ${epic}, declare that I am alive and ordinarily resident at House ${houseNo}, Part ${partNo}, ${acName}. The draft roll (${vintage}, serial ${serial}) wrongly marks me as deceased. No notice was served on me before this deletion. I request restoration of my name under the SIR claims process. ${source}`,
      kn: `ನಾನು ${name}, EPIC ${epic}, ಮನೆ ${houseNo}, ಭಾಗ ${partNo}, ${acName} ನಲ್ಲಿ ಸಾಮಾನ್ಯ ನಿವಾಸಿಯಾಗಿದ್ದು ಜೀವಂತವಾಗಿದ್ದೇನೆ ಎಂದು ಘೋಷಿಸುತ್ತೇನೆ. ಕರಡು ಮತದಾರರ ಪಟ್ಟಿ (${vintage}, ಕ್ರಮ ಸಂಖ್ಯೆ ${serial}) ನನ್ನನ್ನು ತಪ್ಪಾಗಿ ಮೃತರೆಂದು ಗುರುತಿಸಿದೆ. ಈ ತೆಗೆದುಹಾಕುವಿಕೆಗೆ ಮೊದಲು ನನಗೆ ಸೂಚನೆ ನೀಡಲಾಗಿಲ್ಲ. SIR ಹಕ್ಕು ಪ್ರಕ್ರಿಯೆಯಲ್ಲಿ ನನ್ನ ಹೆಸರನ್ನು ಮರುಸ್ಥಾಪಿಸಲು ವಿನಂತಿಸುತ್ತೇನೆ. ${source}`,
      hi: `मैं, ${name}, EPIC ${epic}, घोषणा करता/करती हूँ कि मैं जीवित हूँ और मकान ${houseNo}, भाग ${partNo}, ${acName} का सामान्य निवासी हूँ। मसौदा मतदाता सूची (${vintage}, क्रमांक ${serial}) ने मुझे गलत रूप से मृत चिह्नित किया है। हटाने से पहले मुझे कोई सूचना नहीं दी गई। SIR दावा प्रक्रिया में मेरा नाम बहाल किया जाए। ${source}`,
    },
    NEVER_SHIFTED: {
      en: `I, ${name}, EPIC ${epic}, declare that I have not shifted and remain ordinarily resident at House ${houseNo}, Part ${partNo}, ${acName}. I request correction of the shifted marking and restoration of my entry. ${source}`,
      kn: `ನಾನು ${name}, EPIC ${epic}, ಮನೆ ${houseNo}, ಭಾಗ ${partNo}, ${acName} ನಿಂದ ಸ್ಥಳಾಂತರಗೊಂಡಿಲ್ಲ ಮತ್ತು ಇಲ್ಲಿಯೇ ಸಾಮಾನ್ಯ ನಿವಾಸಿಯಾಗಿದ್ದೇನೆ. ಸ್ಥಳಾಂತರಗೊಂಡಿದ್ದಾರೆ ಎಂಬ ಗುರುತನ್ನು ಸರಿಪಡಿಸಿ ನನ್ನ ದಾಖಲೆಯನ್ನು ಮರುಸ್ಥಾಪಿಸಲು ವಿನಂತಿಸುತ್ತೇನೆ. ${source}`,
      hi: `मैं, ${name}, EPIC ${epic}, मकान ${houseNo}, भाग ${partNo}, ${acName} से स्थानांतरित नहीं हुआ/हुई हूँ और यहीं सामान्य निवासी हूँ। स्थानांतरण का गलत चिह्न सुधारकर मेरी प्रविष्टि बहाल की जाए। ${source}`,
    },
    RESIDENT_WAS_AWAY: {
      en: `I, ${name}, EPIC ${epic}, remain ordinarily resident at House ${houseNo}, Part ${partNo}, ${acName}. I was temporarily away during verification and request restoration of my electoral entry. ${source}`,
      kn: `ನಾನು ${name}, EPIC ${epic}, ಮನೆ ${houseNo}, ಭಾಗ ${partNo}, ${acName} ನ ಸಾಮಾನ್ಯ ನಿವಾಸಿಯಾಗಿದ್ದೇನೆ. ಪರಿಶೀಲನೆಯ ಸಮಯದಲ್ಲಿ ತಾತ್ಕಾಲಿಕವಾಗಿ ಹೊರಗಿದ್ದೆ. ನನ್ನ ಮತದಾರರ ದಾಖಲೆಯನ್ನು ಮರುಸ್ಥಾಪಿಸಲು ವಿನಂತಿಸುತ್ತೇನೆ. ${source}`,
      hi: `मैं, ${name}, EPIC ${epic}, मकान ${houseNo}, भाग ${partNo}, ${acName} का सामान्य निवासी हूँ। सत्यापन के समय अस्थायी रूप से बाहर था/थी। मेरी मतदाता प्रविष्टि बहाल की जाए। ${source}`,
    },
    NOT_DUPLICATE: {
      en: `I, ${name}, EPIC ${epic}, declare that the entry identified in the draft roll belongs to me and is not a duplicate elector. Please correct the duplicate flag while retaining one valid entry at House ${houseNo}, Part ${partNo}, ${acName}. ${source}`,
      kn: `ನಾನು ${name}, EPIC ${epic}, ಕರಡು ಪಟ್ಟಿಯಲ್ಲಿ ಗುರುತಿಸಿದ ದಾಖಲೆ ನನ್ನದೇ ಆಗಿದ್ದು ನಕಲಿ ಮತದಾರರ ದಾಖಲೆಯಲ್ಲ ಎಂದು ಘೋಷಿಸುತ್ತೇನೆ. ಮನೆ ${houseNo}, ಭಾಗ ${partNo}, ${acName} ನಲ್ಲಿ ಒಂದು ಮಾನ್ಯ ದಾಖಲೆಯನ್ನು ಉಳಿಸಿ ನಕಲಿ ಗುರುತನ್ನು ಸರಿಪಡಿಸಿ. ${source}`,
      hi: `मैं, ${name}, EPIC ${epic}, घोषणा करता/करती हूँ कि मसौदा सूची में पहचानी गई प्रविष्टि मेरी है और यह दोहरी मतदाता प्रविष्टि नहीं है। मकान ${houseNo}, भाग ${partNo}, ${acName} में एक वैध प्रविष्टि रखते हुए दोहरेपन का चिह्न सुधारा जाए। ${source}`,
    },
    TURNED_18: {
      en: `I, ${name}, ordinarily resident at House ${houseNo}, Part ${partNo}, ${acName}, have attained voting age and request inclusion in the electoral roll through Form 6. ${source}`,
      kn: `ನಾನು ${name}, ಮನೆ ${houseNo}, ಭಾಗ ${partNo}, ${acName} ನ ಸಾಮಾನ್ಯ ನಿವಾಸಿ. ನಾನು ಮತದಾನದ ವಯಸ್ಸನ್ನು ತಲುಪಿದ್ದು ನಮೂನೆ 6 ಮೂಲಕ ಮತದಾರರ ಪಟ್ಟಿಗೆ ಸೇರಿಸಲು ವಿನಂತಿಸುತ್ತೇನೆ. ${source}`,
      hi: `मैं, ${name}, मकान ${houseNo}, भाग ${partNo}, ${acName} का सामान्य निवासी हूँ। मैंने मतदान की आयु पूरी कर ली है और फॉर्म 6 द्वारा मतदाता सूची में शामिल करने का अनुरोध करता/करती हूँ। ${source}`,
    },
    CORRECT_DETAILS: {
      en: `I, ${name}, EPIC ${epic}, request correction of my electoral roll details for House ${houseNo}, Part ${partNo}, ${acName}. The corrected particulars are stated in this Form 8 and supported by the listed evidence. ${source}`,
      kn: `ನಾನು ${name}, EPIC ${epic}, ಮನೆ ${houseNo}, ಭಾಗ ${partNo}, ${acName} ಗೆ ಸಂಬಂಧಿಸಿದ ನನ್ನ ಮತದಾರರ ಪಟ್ಟಿ ವಿವರಗಳನ್ನು ಸರಿಪಡಿಸಲು ವಿನಂತಿಸುತ್ತೇನೆ. ಸರಿಯಾದ ವಿವರಗಳನ್ನು ಈ ನಮೂನೆ 8 ರಲ್ಲಿ ನೀಡಿದ್ದು ಪಟ್ಟಿಮಾಡಿದ ಸಾಕ್ಷ್ಯಗಳು ಅವನ್ನು ಬೆಂಬಲಿಸುತ್ತವೆ. ${source}`,
      hi: `मैं, ${name}, EPIC ${epic}, मकान ${houseNo}, भाग ${partNo}, ${acName} से संबंधित मतदाता सूची विवरण में सुधार का अनुरोध करता/करती हूँ। सही विवरण इस फॉर्म 8 में दिए गए हैं और सूचीबद्ध साक्ष्य उनका समर्थन करते हैं। ${source}`,
    },
  };

  return declarations[ground];
}

const evidenceByGround: Record<Ground, string[]> = {
  ALIVE_RESIDENT: ["Any photo ID of the elector", "Proof of residence at this address", "Elector to appear before BLO/ERO in person"],
  NEVER_SHIFTED: ["Proof of residence at this address", "Recent correspondence showing this address"],
  RESIDENT_WAS_AWAY: ["Proof of residence at this address", "Evidence explaining temporary absence, if available"],
  NOT_DUPLICATE: ["Copies of the entries marked as possible duplicates", "Identity and residence proof for the retained entry"],
  TURNED_18: ["Proof of age", "Proof of ordinary residence"],
  CORRECT_DETAILS: ["Copy of the roll entry requiring correction", "Document supporting each requested correction"],
};

export function templateDraft(input: DraftInput): DraftOutput {
  const { assessment, ground, acName, partNo } = input;
  const row = assessment.draft ?? assessment.previous;
  return {
    form: formFor(assessment.status, ground),
    fields: [
      { key: "name", label: "Name", value: assessment.member.name.en },
      { key: "epic", label: "EPIC", value: assessment.member.epic ?? "—" },
      { key: "relationName", label: "Relation name", value: row?.relationName.en ?? "—" },
      { key: "houseNo", label: "House number", value: row?.houseNo ?? "—" },
      { key: "partNo", label: "Part number", value: String(partNo) },
      { key: "acName", label: "Assembly constituency", value: acName },
      { key: "age", label: "Age", value: String(assessment.member.age) },
      { key: "ground", label: "Ground", value: ground },
    ],
    declaration: declarationFor(input),
    evidenceChecklist: evidenceByGround[ground],
  };
}
