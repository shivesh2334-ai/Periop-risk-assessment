export interface PatientData {
  // Demographics
  age: string;
  sex: "male" | "female" | "";
  weight: string;
  height: string;

  // Surgery
  surgeryType: string;
  surgeryUrgency: "elective" | "time_sensitive" | "urgent" | "emergency" | "";
  surgeryRisk: "low" | "intermediate" | "high" | "";
  laparoscopic: boolean;

  // Cardiac history
  knownCAD: boolean;
  priorMI: boolean;
  miTiming: string;
  priorPCI: boolean;
  pciTiming: string;
  pciStentType: "bare_metal" | "drug_eluting" | "balloon_only" | "";
  priorCABG: boolean;
  cabgTiming: string;
  heartFailure: boolean;
  hfType: "HFrEF" | "HFpEF" | "HFmrEF" | "";
  lvef: string;
  valvularDisease: boolean;
  valvularDetails: string;
  atrialFibrillation: boolean;
  priorStroke: boolean;
  strokeTiming: string;
  pulmonaryHypertension: boolean;
  pahSeverity: "mild" | "moderate" | "severe" | "";
  congenitalHeartDisease: boolean;
  chdRisk: "low" | "intermediate" | "high" | "";
  pacemaker: boolean;
  icd: boolean;
  deviceLastChecked: string;
  pacemakerDependent: boolean;

  // Comorbidities
  hypertension: boolean;
  diabetes: boolean;
  diabetesType: "type1" | "type2" | "";
  hba1c: string;
  ckd: boolean;
  ckdStage: string;
  anemia: boolean;
  hemoglobin: string;
  osa: boolean;
  osaOnCPAP: boolean;
  frailty: boolean;
  clinicalFrailtyScale: string;

  // Symptoms
  symptoms: string[];
  newSymptoms: boolean;

  // Functional Capacity - DASI
  dasiAnswers: { [key: string]: boolean };

  // Medications
  aspirin: boolean;
  aspirinDose: string;
  p2y12: boolean;
  p2y12Drug: "clopidogrel" | "ticagrelor" | "prasugrel" | "";
  dualAntiplatelet: boolean;
  anticoagulation: boolean;
  anticoagulantDrug: "warfarin" | "apixaban" | "rivaroxaban" | "dabigatran" | "edoxaban" | "enoxaparin" | "";
  anticoagulantIndication: string;
  inr: string;
  betaBlocker: boolean;
  betaBlockerDrug: string;
  statin: boolean;
  acei: boolean;
  arb: boolean;
  sglt2: boolean;
  sglt2Drug: string;
  diuretic: boolean;
  otherMeds: string;

  // Additional
  additionalNotes: string;
}

export const DASI_QUESTIONS = [
  { id: "q1", text: "Take care of yourself (eating, dressing, bathing, using the toilet)?", mets: 2.75 },
  { id: "q2", text: "Walk indoors such as around your house?", mets: 1.75 },
  { id: "q3", text: "Walk a block or two on level ground?", mets: 2.75 },
  { id: "q4", text: "Climb a flight of stairs or walk up a hill?", mets: 5.5 },
  { id: "q5", text: "Run a short distance?", mets: 8.0 },
  { id: "q6", text: "Do light work around the house like dusting or washing dishes?", mets: 2.7 },
  { id: "q7", text: "Do moderate work around the house like vacuuming, sweeping floors, or carrying in groceries?", mets: 3.5 },
  { id: "q8", text: "Do heavy work around the house like scrubbing floors or lifting and moving heavy furniture?", mets: 8.0 },
  { id: "q9", text: "Do yard work like raking leaves, weeding, or pushing a power mower?", mets: 4.5 },
  { id: "q10", text: "Have sexual relations?", mets: 5.25 },
  { id: "q11", text: "Participate in moderate recreational activities like golf, bowling, dancing, doubles tennis, or throwing a baseball/football?", mets: 6.0 },
  { id: "q12", text: "Participate in strenuous sports like swimming, singles tennis, football, basketball, or skiing?", mets: 7.5 },
];

export const DASI_WEIGHTS: { [key: string]: number } = {
  q1: 2.75, q2: 1.75, q3: 2.75, q4: 5.5, q5: 8.0,
  q6: 2.7, q7: 3.5, q8: 8.0, q9: 4.5, q10: 5.25,
  q11: 6.0, q12: 7.5,
};

export function calculateDASI(answers: { [key: string]: boolean }): number {
  return Object.entries(answers).reduce((sum, [key, val]) => {
    return val ? sum + (DASI_WEIGHTS[key] || 0) : sum;
  }, 0);
}

export function getDASIInterpretation(score: number): {
  label: string;
  mets: number;
  adequate: boolean;
  color: string;
} {
  const mets = 0.43 + 0.074 * score;
  const adequate = score > 34;
  return {
    label: adequate ? "Adequate" : "Poor",
    mets: parseFloat(mets.toFixed(1)),
    adequate,
    color: adequate ? "teal" : "crimson",
  };
}

export function calculateRCRI(data: PatientData): number {
  let score = 0;
  if (data.surgeryRisk === "high") score++;
  if (data.knownCAD || data.priorMI) score++;
  if (data.heartFailure) score++;
  if (data.priorStroke) score++;
  if (data.diabetes) score++;
  if (data.ckd && parseInt(data.ckdStage) >= 3) score++;
  return score;
}

export const SURGERY_RISK_EXAMPLES: Record<string, string[]> = {
  low: [
    "Cataract / Ophthalmologic",
    "Dental procedures",
    "Endoscopy / Colonoscopy",
    "Superficial procedures",
    "Breast surgery",
    "Laparoscopic cholecystectomy",
  ],
  intermediate: [
    "Orthopedic (hip/knee replacement)",
    "Genitourinary (TURP, nephrectomy)",
    "Otolaryngology (ENT)",
    "Abdominal (laparoscopic)",
    "Gynecologic (major)",
    "Neurosurgical (minor)",
  ],
  high: [
    "Suprainguinal vascular (AAA repair)",
    "Major open thoracic",
    "Major open abdominal",
    "Transplant surgery",
    "Neurosurgical (major intracranial)",
    "Peripheral vascular",
  ],
};

export const SYMPTOMS_LIST = [
  "Dyspnea on exertion",
  "Orthopnea",
  "Paroxysmal nocturnal dyspnea",
  "Chest pain / tightness",
  "Angina",
  "Palpitations",
  "Pre-syncope / Syncope",
  "Peripheral edema",
  "Fatigue",
  "Claudication",
];

export const initialPatientData: PatientData = {
  age: "", sex: "", weight: "", height: "",
  surgeryType: "", surgeryUrgency: "", surgeryRisk: "",
  laparoscopic: false,
  knownCAD: false, priorMI: false, miTiming: "",
  priorPCI: false, pciTiming: "", pciStentType: "",
  priorCABG: false, cabgTiming: "",
  heartFailure: false, hfType: "", lvef: "",
  valvularDisease: false, valvularDetails: "",
  atrialFibrillation: false,
  priorStroke: false, strokeTiming: "",
  pulmonaryHypertension: false, pahSeverity: "",
  congenitalHeartDisease: false, chdRisk: "",
  pacemaker: false, icd: false, deviceLastChecked: "", pacemakerDependent: false,
  hypertension: false, diabetes: false, diabetesType: "", hba1c: "",
  ckd: false, ckdStage: "",
  anemia: false, hemoglobin: "",
  osa: false, osaOnCPAP: false,
  frailty: false, clinicalFrailtyScale: "",
  symptoms: [], newSymptoms: false,
  dasiAnswers: {},
  aspirin: false, aspirinDose: "",
  p2y12: false, p2y12Drug: "", dualAntiplatelet: false,
  anticoagulation: false, anticoagulantDrug: "", anticoagulantIndication: "", inr: "",
  betaBlocker: false, betaBlockerDrug: "",
  statin: false, acei: false, arb: false,
  sglt2: false, sglt2Drug: "",
  diuretic: false, otherMeds: "",
  additionalNotes: "",
};
