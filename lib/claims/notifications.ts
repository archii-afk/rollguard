import { DEADLINES } from "./config";
import type { Claim, ClaimState, Notification } from "./types";

type Message = Notification["text"];

const MESSAGES: Record<ClaimState, (claim: Claim) => Message> = {
  DRAFT_PUBLISHED: (claim) => ({
    en: `RollGuard: the draft roll is published. Review the entry for ${claim.memberName}.`,
    kn: `ರೋಲ್‌ಗಾರ್ಡ್: ಕರಡು ಮತದಾರರ ಪಟ್ಟಿ ಪ್ರಕಟವಾಗಿದೆ. ${claim.memberName} ಅವರ ದಾಖಲೆಯನ್ನು ಪರಿಶೀಲಿಸಿ.`,
    hi: `रोलगार्ड: प्रारूप मतदाता सूची प्रकाशित हो गई है। ${claim.memberName} की प्रविष्टि जाँचें।`,
  }),
  CLAIM_DRAFTED: (claim) => ({
    en: `RollGuard: Form ${claim.form} for ${claim.memberName} is ready to review.`,
    kn: `ರೋಲ್‌ಗಾರ್ಡ್: ${claim.memberName} ಅವರ ನಮೂನೆ ${claim.form} ಪರಿಶೀಲನೆಗೆ ಸಿದ್ಧವಾಗಿದೆ.`,
    hi: `रोलगार्ड: ${claim.memberName} का फॉर्म ${claim.form} समीक्षा के लिए तैयार है।`,
  }),
  CLAIM_SUBMITTED: (claim) => ({
    en: `RollGuard: claim ${claim.ackNo} for ${claim.memberName} received. BLO will visit within ${DEADLINES.bloVisitDays} days.`,
    kn: `ರೋಲ್‌ಗಾರ್ಡ್: ${claim.memberName} ಅವರ ಹಕ್ಕು ಅರ್ಜಿ ${claim.ackNo} ಸ್ವೀಕರಿಸಲಾಗಿದೆ. BLO ${DEADLINES.bloVisitDays} ದಿನಗಳಲ್ಲಿ ಭೇಟಿ ನೀಡುತ್ತಾರೆ.`,
    hi: `रोलगार्ड: ${claim.memberName} का दावा ${claim.ackNo} प्राप्त हुआ। BLO ${DEADLINES.bloVisitDays} दिनों में आएंगे।`,
  }),
  BLO_FIELD_VERIFICATION: (claim) => ({
    en: `RollGuard: field verification for ${claim.memberName} has been scheduled. Please keep residence proof ready.`,
    kn: `ರೋಲ್‌ಗಾರ್ಡ್: ${claim.memberName} ಅವರ ಸ್ಥಳ ಪರಿಶೀಲನೆ ನಿಗದಿಯಾಗಿದೆ. ದಯವಿಟ್ಟು ವಾಸದ ಪುರಾವೆಯನ್ನು ಸಿದ್ಧವಾಗಿಡಿ.`,
    hi: `रोलगार्ड: ${claim.memberName} का क्षेत्र सत्यापन तय हो गया है। कृपया निवास प्रमाण तैयार रखें।`,
  }),
  ERO_HEARING_NOTICE: (claim) => ({
    en: `RollGuard: an ERO hearing has been scheduled for ${claim.memberName}. Attend with the supporting documents.`,
    kn: `ರೋಲ್‌ಗಾರ್ಡ್: ${claim.memberName} ಅವರ ERO ವಿಚಾರಣೆ ನಿಗದಿಯಾಗಿದೆ. ಪೂರಕ ದಾಖಲೆಗಳೊಂದಿಗೆ ಹಾಜರಾಗಿ.`,
    hi: `रोलगार्ड: ${claim.memberName} की ERO सुनवाई तय हो गई है। सहायक दस्तावेज़ों के साथ उपस्थित हों।`,
  }),
  ERO_SPEAKING_ORDER: (claim) => ({
    en: `RollGuard: the ERO has issued a reasoned order for ${claim.memberName}.`,
    kn: `ರೋಲ್‌ಗಾರ್ಡ್: ${claim.memberName} ಅವರ ಅರ್ಜಿಗೆ ERO ಕಾರಣಸಹಿತ ಆದೇಶ ನೀಡಿದ್ದಾರೆ.`,
    hi: `रोलगार्ड: ERO ने ${claim.memberName} के दावे पर कारण सहित आदेश जारी किया है।`,
  }),
  RESTORED: (claim) => ({
    en: `RollGuard: ${claim.memberName}'s electoral entry has been restored.`,
    kn: `ರೋಲ್‌ಗಾರ್ಡ್: ${claim.memberName} ಅವರ ಮತದಾರರ ದಾಖಲೆಯನ್ನು ಮರುಸ್ಥಾಪಿಸಲಾಗಿದೆ.`,
    hi: `रोलगार्ड: ${claim.memberName} की मतदाता प्रविष्टि बहाल कर दी गई है।`,
  }),
  REJECTED: (claim) => ({
    en: `RollGuard: ${claim.memberName}'s claim was rejected. An appeal may be filed within ${DEADLINES.appealDays} days.`,
    kn: `ರೋಲ್‌ಗಾರ್ಡ್: ${claim.memberName} ಅವರ ಹಕ್ಕು ಅರ್ಜಿ ತಿರಸ್ಕೃತವಾಗಿದೆ. ${DEADLINES.appealDays} ದಿನಗಳೊಳಗೆ ಮೇಲ್ಮನವಿ ಸಲ್ಲಿಸಬಹುದು.`,
    hi: `रोलगार्ड: ${claim.memberName} का दावा अस्वीकार हुआ। ${DEADLINES.appealDays} दिनों के भीतर अपील की जा सकती है।`,
  }),
  APPEAL_FILED: (claim) => ({
    en: `RollGuard: ${claim.memberName}'s appeal has been filed with the DEO.`,
    kn: `ರೋಲ್‌ಗಾರ್ಡ್: ${claim.memberName} ಅವರ ಮೇಲ್ಮನವಿಯನ್ನು DEO ಅವರಿಗೆ ಸಲ್ಲಿಸಲಾಗಿದೆ.`,
    hi: `रोलगार्ड: ${claim.memberName} की अपील DEO के समक्ष दाखिल कर दी गई है।`,
  }),
  APPEAL_REJECTED: (claim) => ({
    en: `RollGuard: ${claim.memberName}'s appeal was rejected. This demo workflow is now closed.`,
    kn: `ರೋಲ್‌ಗಾರ್ಡ್: ${claim.memberName} ಅವರ ಮೇಲ್ಮನವಿ ತಿರಸ್ಕೃತವಾಗಿದೆ. ಈ ಪ್ರಾತ್ಯಕ್ಷಿಕೆ ಪ್ರಕ್ರಿಯೆ ಈಗ ಮುಕ್ತಾಯವಾಗಿದೆ.`,
    hi: `रोलगार्ड: ${claim.memberName} की अपील अस्वीकार हुई। यह प्रदर्शन प्रक्रिया अब समाप्त है।`,
  }),
};

export function notificationFor(state: ClaimState, claim: Claim, at: Date): Notification {
  return { at: at.toISOString(), channel: "sms", text: MESSAGES[state](claim) };
}
