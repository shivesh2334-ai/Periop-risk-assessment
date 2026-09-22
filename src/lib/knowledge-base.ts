/**
 * Curated perioperative cardiovascular knowledge base.
 * Summaries are decision-support abstractions, not reproduced guideline text.
 * Last clinically reviewed: 2026-09-22.
 */

export type GuidelineChunk = {
  id: string;
  source: string;
  year: string;
  topics: string[];
  text: string;
};

export const GUIDELINE_SOURCES = [
  {
    id: "aha-acc-2024",
    title: "2024 AHA/ACC/ACS/ASNC/HRS/SCA/SCCT/SCMR/SVM Guideline for Perioperative Cardiovascular Management for Noncardiac Surgery",
    url: "https://professional.heart.org/en/science-news/2024-guideline-for-perioperative-cardiovascular-management-for-noncardiac-surgery",
  },
  {
    id: "esc-2022",
    title: "2022 ESC Guidelines on cardiovascular assessment and management of patients undergoing non-cardiac surgery",
    url: "https://www.escardio.org/guidelines/clinical-practice-guidelines/all-esc-practice-guidelines/non-cardiac-surgery/",
  },
  {
    id: "ccs-2017",
    title: "2017 Canadian Cardiovascular Society Guidelines on Perioperative Cardiac Risk Assessment and Management",
    url: "https://ccs.ca/guidelines-and-clinical-practice-update-library/",
  },
] as const;

export const GUIDELINE_CHUNKS: GuidelineChunk[] = [
  {
    id: "stepwise-risk",
    source: "2024 AHA/ACC multisociety guideline",
    year: "2024",
    topics: ["risk", "rcri", "dasi", "functional", "stress", "testing", "surgery"],
    text: "Use a stepwise, team-based assessment. Identify emergency surgery and active/unstable cardiovascular conditions first. For stable patients, combine validated risk estimation, surgical risk, and functional capacity. Order stress testing only in highly selected patients with poor or unknown functional capacity and elevated perioperative risk when the result would change management; do not test routinely for low-risk surgery, low-risk patients, or adequate functional capacity. Apply the same indications for coronary revascularization as outside the surgical setting.",
  },
  {
    id: "active-conditions",
    source: "2024 AHA/ACC multisociety guideline; 2022 ESC guideline",
    year: "2024/2022",
    topics: ["symptoms", "angina", "heart failure", "arrhythmia", "valve", "defer", "urgent"],
    text: "New chest pain or suspected acute coronary syndrome, decompensated heart failure, unstable arrhythmia, and severe symptomatic valvular disease require prompt evaluation. Elective surgery should generally pause while an active cardiovascular condition is evaluated and treated. Emergency surgery proceeds with risk mitigation and multidisciplinary management when delay is more dangerous.",
  },
  {
    id: "biomarkers",
    source: "2024 AHA/ACC multisociety guideline; 2017 CCS guideline",
    year: "2024/2017",
    topics: ["bnp", "nt-probnp", "troponin", "biomarker", "monitoring", "rcri"],
    text: "Preoperative BNP/NT-proBNP or troponin can refine risk in selected patients with elevated clinical risk undergoing elevated-risk surgery. CCS recommends preoperative BNP or NT-proBNP in patients age 65 or older, age 45-64 with significant cardiovascular disease, or RCRI at least 1. CCS thresholds commonly used are BNP 92 ng/L or NT-proBNP 300 ng/L; above threshold, obtain postoperative troponin daily for 48-72 hours. Interpret assays and local protocols.",
  },
  {
    id: "echo",
    source: "2024 AHA/ACC multisociety guideline; 2022 ESC guideline",
    year: "2024/2022",
    topics: ["echo", "heart failure", "dyspnea", "valve", "lvef"],
    text: "Transthoracic echocardiography is appropriate for new or worsening dyspnea, suspected new ventricular dysfunction, or suspected moderate-to-severe valvular disease when the result affects management. Routine repeat assessment of LV function in a stable, asymptomatic patient is not recommended.",
  },
  {
    id: "pci-dapt",
    source: "2024 AHA/ACC multisociety guideline and current ACC/AHA antiplatelet recommendations",
    year: "2024/current",
    topics: ["pci", "stent", "aspirin", "dapt", "clopidogrel", "ticagrelor", "prasugrel", "antiplatelet"],
    text: "After PCI, balance stent thrombosis against bleeding using cardiology, surgery, and anesthesia input. Continue aspirin perioperatively when feasible in patients with prior PCI. If surgery requires interruption of one or more antiplatelet agents within 30 days of bare-metal stent or within 3 months of drug-eluting stent, interruption is potentially harmful; continue DAPT when surgery cannot be deferred if bleeding risk permits. Typical preoperative interruption intervals when interruption is necessary are prasugrel 7 days, clopidogrel 5 days, ticagrelor 3 days, and aspirin about 4-5 days. Individualize for surgery and indication.",
  },
  {
    id: "pci-timing",
    source: "2024 AHA/ACC multisociety guideline",
    year: "2024",
    topics: ["pci", "stent", "timing", "delay", "surgery"],
    text: "For elective noncardiac surgery after drug-eluting stent PCI for acute coronary syndrome, delay about 12 months when antiplatelet interruption is required. After drug-eluting stent PCI for chronic coronary disease, delaying at least 6 months is reasonable. Time-sensitive surgery may be considered at least 3 months after PCI when delaying surgery carries greater risk. Elective surgery requiring antiplatelet interruption within 30 days of any stent is harmful.",
  },
  {
    id: "anticoagulation",
    source: "2024 AHA/ACC multisociety guideline and current perioperative anticoagulation guidance",
    year: "2024/current",
    topics: ["warfarin", "doac", "apixaban", "rivaroxaban", "dabigatran", "edoxaban", "anticoagulation", "bridging"],
    text: "For most patients requiring anticoagulant interruption, stop the oral anticoagulant for a drug-, renal-function-, and bleeding-risk-specific interval and do not bridge. Bridging with heparin can cause harm from increased bleeding. Consider bridging only in selected patients at very high thrombotic risk, such as certain mechanical valves, very recent stroke/systemic embolism, or exceptionally high-risk atrial fibrillation; coordinate with the treating specialist. DOACs are not bridged routinely. Restart only after adequate hemostasis, usually later after high-bleeding-risk procedures.",
  },
  {
    id: "medications",
    source: "2024 AHA/ACC multisociety guideline",
    year: "2024",
    topics: ["beta blocker", "statin", "acei", "arb", "sglt2", "medication"],
    text: "Continue chronic beta-blockers; do not start on the day of surgery. When newly indicated, start sufficiently before surgery to assess tolerability. Continue statins and initiate them when otherwise indicated. Withhold SGLT2 inhibitors 3-4 days before planned surgery to reduce perioperative metabolic acidosis/euglycemic ketoacidosis risk. For selected patients taking renin-angiotensin system inhibitors for hypertension and undergoing elevated-risk surgery, omission about 24 hours before surgery may reduce hypotension; continuation may be reasonable when used for HFrEF.",
  },
  {
    id: "cied",
    source: "2024 AHA/ACC multisociety guideline",
    year: "2024",
    topics: ["pacemaker", "icd", "cied", "device"],
    text: "Create a preoperative CIED plan when electromagnetic interference is expected. Determine device type, indication, dependence, recent interrogation, procedure site, and anticipated electrocautery. Coordinate reprogramming or magnet strategy with the device team, disable ICD tachy-therapies when appropriate, ensure external defibrillation capability, and restore settings after surgery.",
  },
  {
    id: "surveillance",
    source: "2024 AHA/ACC multisociety guideline; 2017 CCS guideline",
    year: "2024/2017",
    topics: ["troponin", "postoperative", "surveillance", "mace"],
    text: "Postoperative troponin surveillance can be reasonable for patients with known cardiovascular disease, age 65 or older, or cardiovascular risk factors undergoing elevated-risk surgery. CCS recommends daily troponin for 48-72 hours in patients with elevated preoperative BNP/NT-proBNP or, when biomarkers were not measured, age 65 or older, age 45-64 with significant cardiovascular disease, or RCRI at least 1.",
  },
  {
    id: "frailty-team",
    source: "2024 AHA/ACC multisociety guideline; 2022 ESC guideline",
    year: "2024/2022",
    topics: ["frailty", "team", "shared decision", "prehabilitation"],
    text: "Frailty, anemia, kidney disease, pulmonary hypertension, congenital heart disease, and complex valvular disease can materially alter perioperative risk. Use multidisciplinary planning and shared decision-making for complex or unstable disease. Optimize reversible conditions and consider prehabilitation when surgery timing permits.",
  },
];

function tokenize(value: string): string[] {
  return value.toLowerCase().match(/[a-z0-9]+/g) ?? [];
}

export function retrieveGuidelineContext(query: string, limit = 6): GuidelineChunk[] {
  const terms = new Set(tokenize(query).filter((word) => word.length > 2));
  return GUIDELINE_CHUNKS
    .map((chunk) => {
      const haystack = tokenize(chunk.topics.join(" ") + " " + chunk.text);
      const score = haystack.reduce((total, word) => total + (terms.has(word) ? 1 : 0), 0);
      return { chunk, score };
    })
    .sort((a, b) => b.score - a.score)
    .filter((item, index) => item.score > 0 || index < 3)
    .slice(0, limit)
    .map((item) => item.chunk);
}

export function formatGuidelineContext(chunks: GuidelineChunk[]): string {
  return chunks.map((chunk) => `[${chunk.id}] ${chunk.source} (${chunk.year}): ${chunk.text}`).join("\n\n");
}
