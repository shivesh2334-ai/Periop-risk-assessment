import { PatientData, calculateDASI, calculateRCRI } from "@/lib/types";
import { GuidelineChunk } from "@/lib/knowledge-base";

type AnyReport = Record<string, unknown>;

const REF_AHA = "2024 AHA/ACC/ACS/ASNC/HRS/SCA/SCCT/SCMR/SVM Perioperative Cardiovascular Management Guideline";
const REF_ESC = "2022 ESC Noncardiac Surgery Cardiovascular Assessment Guideline";
const REF_CCS = "2017 Canadian Cardiovascular Society Perioperative Cardiac Risk Guideline";
const REF_DAPT = "Current ACC/AHA perioperative antiplatelet recommendations";
const REF_BRIDGE = "Current ACC/AHA perioperative anticoagulation/bridging recommendations";

const activeSymptoms = new Set(["Chest pain / tightness", "Angina", "Pre-syncope / Syncope", "Orthopnea", "Paroxysmal nocturnal dyspnea"]);

function rcriRisk(score: number) {
  if (score === 0) return { percent: "~3.9%", label: "RCRI 0: lower estimated 30-day risk" };
  if (score === 1) return { percent: "~6.0%", label: "RCRI 1: elevated estimated 30-day risk" };
  if (score === 2) return { percent: "~10.1%", label: "RCRI 2: elevated estimated 30-day risk" };
  return { percent: "~15% or higher", label: "RCRI ≥3: high estimated 30-day risk" };
}

function p2y12Hold(drug: PatientData["p2y12Drug"]): number | null {
  return drug === "prasugrel" ? 7 : drug === "clopidogrel" ? 5 : drug === "ticagrelor" ? 3 : null;
}

function patientQuery(data: PatientData): string {
  return [
    data.surgeryRisk, data.surgeryUrgency, ...data.symptoms,
    data.knownCAD && "coronary disease", data.priorPCI && "pci stent dapt",
    data.heartFailure && "heart failure echo", data.valvularDisease && "valve echo",
    data.anticoagulation && `${data.anticoagulantDrug} anticoagulation bridging`,
    data.p2y12 && `${data.p2y12Drug} antiplatelet`,
    data.sglt2 && "sglt2 medication", (data.pacemaker || data.icd) && "cied device",
    data.frailty && "frailty prehabilitation",
  ].filter(Boolean).join(" ");
}

export function makeRetrievalQuery(data: PatientData): string {
  return patientQuery(data);
}

export function buildLocalAssessment(data: PatientData, chunks: GuidelineChunk[]): AnyReport {
  const rcri = calculateRCRI(data);
  const dasi = calculateDASI(data.dasiAnswers);
  const risk = rcriRisk(rcri);
  const age = Number(data.age || 0);
  const hasActiveSymptoms = data.newSymptoms || data.symptoms.some((symptom) => activeSymptoms.has(symptom));
  const emergency = data.surgeryUrgency === "emergency";
  const elevatedSurgery = data.surgeryRisk === "high";
  const poorCapacity = dasi <= 34;
  const urgentFlag = hasActiveSymptoms || (data.heartFailure && data.newSymptoms) ||
    (data.valvularDisease && /severe|symptomatic/i.test(data.valvularDetails || ""));
  const overallRisk = urgentFlag || rcri >= 3 ? "HIGH" : rcri >= 1 || elevatedSurgery ? "INTERMEDIATE" : "LOW";
  const biomarkerEligible = elevatedSurgery && (age >= 65 || rcri >= 1 || data.knownCAD || data.heartFailure || data.priorStroke);
  const echoRecommended = data.newSymptoms || (data.heartFailure && !data.lvef) || data.valvularDisease;
  const stressRecommended = !emergency && !urgentFlag && elevatedSurgery && poorCapacity && rcri >= 1;
  const surveillance = elevatedSurgery && (age >= 65 || rcri >= 1 || data.knownCAD || data.heartFailure);
  const p2Hold = p2y12Hold(data.p2y12Drug);
  const recentPCI = data.priorPCI && /day|week|1 month|2 month|3 month/i.test(data.pciTiming || "");
  const veryHighThrombotic = /mechanical|recent stroke|systemic embol/i.test(data.anticoagulantIndication || "");
  const bridge = data.anticoagulantDrug === "warfarin" && veryHighThrombotic;
  const keyRiskDrivers = [
    elevatedSurgery && "High-risk surgery",
    rcri > 0 && `RCRI score ${rcri}`,
    poorCapacity && "Poor or uncertain functional capacity",
    data.knownCAD && "Coronary artery disease",
    data.heartFailure && "Heart failure",
    data.ckd && "Chronic kidney disease",
    data.diabetes && "Diabetes",
    data.frailty && "Frailty",
    hasActiveSymptoms && "New or potentially active cardiovascular symptoms",
  ].filter(Boolean) as string[];

  const proceed = emergency ? "PROCEED" : urgentFlag ? "URGENT EVALUATION NEEDED" : recentPCI && data.dualAntiplatelet ? "DEFER" : "PROCEED";
  const sourceRefs = Array.from(new Set(chunks.map((chunk) => `${chunk.source} (${chunk.year}; KB:${chunk.id})`)));

  return {
    generationMode: "LOCAL_KNOWLEDGE_BASE",
    riskSummary: {
      overallRisk,
      maceRiskPercent: risk.percent,
      rcriScore: rcri,
      rcriRisk: risk.label,
      surgicalRiskCategory: (data.surgeryRisk || "intermediate").toUpperCase(),
      keyRiskDrivers: keyRiskDrivers.length ? keyRiskDrivers : ["No major entered clinical risk driver"],
      urgentFlag,
      urgentReason: urgentFlag ? "Possible active cardiovascular condition or new/worsening symptoms; clinician assessment is required before elective surgery." : "",
    },
    surgeryTiming: {
      recommendation: proceed,
      timing: emergency ? "Do not delay life-saving surgery for routine cardiac testing; use perioperative risk mitigation." :
        urgentFlag ? "Pause elective surgery pending focused cardiovascular evaluation." :
        recentPCI && data.dualAntiplatelet ? "Confirm PCI date, indication, stent type, bleeding risk, and minimum DAPT duration with cardiology." :
        "Proceed after routine optimization and the treating team's final review.",
      rationale: emergency ? "Emergency status takes priority; manage cardiovascular risk concurrently." :
        urgentFlag ? "AHA/ACC and ESC stepwise pathways prioritize assessment of active cardiovascular conditions." :
        "No entered feature mandates routine delay; testing should be ordered only if it will change management.",
      deferralDuration: recentPCI ? "Depends on PCI indication and timing: commonly 12 months after DES for ACS, 6 months after DES for chronic coronary disease, or at least 3 months for time-sensitive surgery after PCI." : "",
      conditions: ["Confirm history, examination, ECG/laboratory data, procedure bleeding risk, renal function, and medication list.", "Use multidisciplinary discussion when cardiac and surgical risks compete."],
    },
    additionalTesting: {
      ecg: { recommended: age >= 65 || data.knownCAD || data.heartFailure || elevatedSurgery, indication: "Reasonable as a baseline when cardiovascular disease, symptoms, advanced age, or elevated-risk surgery is present; not routine for asymptomatic low-risk surgery." },
      echo: { recommended: echoRecommended, indication: echoRecommended ? "New/worsening symptoms, heart failure without recent LV assessment, or valvular disease may change management." : "Routine LV-function reassessment is not indicated in a stable asymptomatic patient.", urgency: hasActiveSymptoms ? "URGENT" : "ROUTINE" },
      stressTesting: { recommended: stressRecommended, modality: stressRecommended ? "Select exercise or pharmacologic imaging based on exercise ability, ECG interpretability, and local expertise" : "Not routinely indicated", indication: stressRecommended ? "Elevated clinical/surgical risk with poor functional capacity; perform only if the result will change management." : "No routine testing for low-risk surgery, low clinical risk, or adequate functional capacity." },
      coronaryCTA: { recommended: false, indication: "Not routine; consider selectively when coronary assessment is otherwise indicated and the result would alter management." },
      bnp: { recommended: biomarkerEligible, indication: biomarkerEligible ? "Risk refinement before elevated-risk surgery." : "Not routinely required from the entered risk profile.", threshold: "CCS reference thresholds: BNP ≥92 ng/L or NT-proBNP ≥300 ng/L; apply assay/local protocol." },
      troponin: { recommended: biomarkerEligible, indication: biomarkerEligible ? "Baseline value may aid risk stratification and interpretation of postoperative surveillance." : "Not routinely required for low-risk patients/procedures." },
      labWork: ["CBC: assess anemia", "Creatinine/eGFR and electrolytes: renal risk and medication interruption planning", "Glucose/HbA1c when diabetes control is relevant"],
      other: [],
    },
    medicationManagement: {
      antiplatelet: {
        aspirin: {
          action: data.aspirin ? (data.priorPCI ? "CONTINUE" : "DISCUSS") : "DISCUSS",
          recommendation: data.aspirin ? (data.priorPCI ? "Continue perioperatively if bleeding risk permits; involve cardiology for high-bleeding-risk surgery." : "Balance the indication against procedure-specific bleeding risk; do not apply a universal stop rule.") : "No aspirin entered; do not initiate solely for surgery without another indication.",
          holdDays: data.aspirin && !data.priorPCI ? 4 : null,
          rationale: "Management depends on indication, prior PCI, time from PCI, and procedural bleeding risk.",
        },
        p2y12: {
          action: data.p2y12 ? (recentPCI ? "DISCUSS" : "HOLD") : "NA",
          drug: data.p2y12Drug || "None",
          recommendation: data.p2y12 ? "Obtain cardiology/surgery/anesthesia agreement before interruption, especially after PCI." : "No P2Y12 inhibitor entered.",
          holdDays: data.p2y12 ? p2Hold : null,
          bridging: "Antiplatelet bridging is not routine; reserve any exceptional strategy for specialist-led very-high-thrombotic-risk cases.",
          rationale: "Typical recovery intervals are ticagrelor 3 days, clopidogrel 5 days, and prasugrel 7 days; stent thrombosis risk may override routine interruption.",
        },
        overallStrategy: data.dualAntiplatelet ? "Active DAPT: verify PCI indication/date and defer elective interruption during the high-risk stent period when possible." : "Individualize antiplatelet management to ischemic indication and surgical bleeding risk.",
      },
      anticoagulation: {
        action: !data.anticoagulation ? "NA" : bridge ? "BRIDGE" : "HOLD",
        drug: data.anticoagulantDrug || "None",
        holdSchedule: data.anticoagulation ? "Use drug-, kidney-function-, neuraxial-anesthesia-, and bleeding-risk-specific interruption timing; confirm locally before prescribing." : "Not applicable.",
        bridgingIndicated: bridge,
        bridgingAgent: bridge ? "Short-acting heparin per specialist/local protocol" : "",
        bridgingProtocol: bridge ? "Specialist-directed only after confirming very high thromboembolic risk and procedural bleeding risk." : "No routine heparin bridging; DOACs are not routinely bridged.",
        restarting: "Restart after adequate surgical hemostasis; timing depends on procedure bleeding risk and anesthetic plan.",
        rationale: "Routine bridging increases bleeding and is not recommended for most patients; reserve for selected very-high-thrombotic-risk patients.",
        inrTarget: data.anticoagulantDrug === "warfarin" ? "Verify indication-specific target and acceptable preoperative INR with the procedural team." : "N/A",
      },
      betaBlocker: {
        action: data.betaBlocker ? "CONTINUE" : "NA",
        recommendation: data.betaBlocker ? "Continue chronic therapy and avoid abrupt withdrawal; monitor heart rate and blood pressure." : "Do not start on the day of surgery. If newly indicated, start early enough to assess tolerability.",
        rationale: "Continuation is recommended; immediate preoperative initiation can cause harm.",
      },
      statin: { action: data.statin ? "CONTINUE" : (data.knownCAD ? "INITIATE" : "NA"), recommendation: data.statin ? "Continue perioperatively." : data.knownCAD ? "Assess for guideline-directed statin therapy independent of surgery." : "Initiate only if otherwise clinically indicated." },
      aceiArb: {
        action: (data.acei || data.arb) ? (data.heartFailure && data.hfType === "HFrEF" ? "CONTINUE" : "HOLD DAY OF SURGERY") : "NA",
        recommendation: (data.acei || data.arb) ? (data.heartFailure && data.hfType === "HFrEF" ? "Continuation may be reasonable for HFrEF; coordinate with anesthesia and monitor hypotension." : "For hypertension and elevated-risk surgery, consider omitting about 24 hours pre-op to reduce hypotension.") : "Not applicable.",
        rationale: "The indication and risk of intraoperative hypotension determine management.",
      },
      sglt2: {
        action: data.sglt2 ? "HOLD" : "NA",
        holdDays: data.sglt2 ? 3 : null,
        recommendation: data.sglt2 ? "Withhold 3-4 days before planned surgery; use 4 days for ertugliflozin and follow local diabetes protocol." : "Not applicable.",
        rationale: "Reduces risk of perioperative euglycemic ketoacidosis/metabolic acidosis.",
      },
      otherMedications: "Complete medication reconciliation, including insulin, diuretics, and over-the-counter agents, using anesthesia and institutional protocols.",
    },
    perioperativeMonitoring: {
      troponinSurveillance: { recommended: surveillance, protocol: surveillance ? "Obtain postoperative troponin at 24 and 48 hours (up to 72 hours per local/CCS pathway) and assess any rise clinically." : "Routine surveillance is not indicated for the entered low-risk profile." },
      icuAdmission: { recommended: overallRisk === "HIGH" && elevatedSurgery, indication: overallRisk === "HIGH" && elevatedSurgery ? "High patient and procedural risk; determine ICU/HDU need with anesthesia and surgery." : "No automatic ICU indication from entered data." },
      invasiveMonitoring: { recommended: data.pulmonaryHypertension && data.pahSeverity === "severe", type: data.pulmonaryHypertension && data.pahSeverity === "severe" ? "Individualized hemodynamic monitoring under anesthesia/cardiology guidance" : "Routine noninvasive monitoring" },
      postopCardiology: { recommended: overallRisk === "HIGH" || data.knownCAD || data.heartFailure, timing: "Early review for symptoms, hemodynamic instability, arrhythmia, or troponin elevation." },
      specialConsiderations: ["Promptly evaluate postoperative chest pain, dyspnea, hypotension, arrhythmia, or troponin elevation.", "Use procedure-specific venous thromboembolism prophylaxis."],
    },
    specialConsultations: [
      urgentFlag && "Cardiology: evaluate possible active cardiovascular condition before elective surgery",
      data.anticoagulation && "Anticoagulation service/anesthesia: finalize interruption and restart plan",
      (data.priorPCI && (data.p2y12 || data.dualAntiplatelet)) && "Interventional cardiology: assess stent thrombosis risk before antiplatelet interruption",
    ].filter(Boolean),
    prehabilitation: {
      recommended: data.frailty || data.anemia || poorCapacity,
      components: ["Medication optimization", "Anemia/nutrition assessment", "Exercise and respiratory optimization as feasible", "Smoking/alcohol intervention when applicable"],
      rationale: "Optimize reversible risk factors when surgery timing permits; do not delay urgent surgery for prehabilitation alone.",
    },
    deviceManagement: {
      applicable: data.pacemaker || data.icd,
      recommendations: (data.pacemaker || data.icd) ? "Confirm device type, dependence, last interrogation, surgical site, and EMI exposure. Arrange a documented magnet/reprogramming plan, external defibrillation availability, ICD tachy-therapy management, and postoperative restoration/check." : "No CIED entered.",
    },
    patientCounseling: {
      keyPoints: ["Explain that risk scores support but do not replace clinical assessment.", "Discuss the cardiac risk of proceeding, the risk of delay, and bleeding/thrombotic trade-offs.", "Provide clear written medication stop/restart instructions after the treating team confirms them."],
      informedConsent: `Discuss an estimated RCRI-associated 30-day risk of ${risk.percent}, while noting that individual and procedure-specific risk may differ.`,
      sharedDecisionMaking: "Use cardiology, anesthesia, surgery, and patient preferences for complex or competing risks.",
    },
    guidelineReferences: sourceRefs.length ? sourceRefs : [REF_AHA, REF_ESC, REF_CCS, REF_DAPT, REF_BRIDGE],
    clinicalNarrative: `Local knowledge-base assessment: RCRI is ${rcri}, DASI is ${dasi.toFixed(1)}, and the entered surgical category is ${data.surgeryRisk || "not specified"}. Overall risk is classified as ${overallRisk.toLowerCase()} based on entered data. ${urgentFlag ? "Potential active cardiovascular symptoms require focused clinician evaluation before elective surgery." : "No entered active cardiovascular condition automatically mandates delay."}\n\nTesting should be selective and ordered only when it can change management. Medication decisions—especially antiplatelet and anticoagulant interruption—require confirmation of indication, timing, renal function, bleeding risk, and local protocols. This fallback does not use a generative API and deliberately avoids unsupported individualized dosing.`,
    disclaimer: "This knowledge-base-generated assessment is clinical decision support only, is not a diagnosis or prescription, and may omit patient-specific factors. A qualified clinician must verify all recommendations against the current source guideline, local protocol, procedure bleeding risk, renal function, and direct patient evaluation.",
  };
}
