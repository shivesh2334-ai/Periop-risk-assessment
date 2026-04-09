import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { PatientData, calculateDASI, calculateRCRI } from "@/lib/types";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

function buildSystemPrompt(): string {
  return `You are an expert perioperative cardiologist AI assistant. You provide comprehensive preoperative cardiac risk assessments based on:

1. **2024 AHA/ACC/ACS/ASNC/HRS/SCA/SCCT/SCMR/SVM Guideline for Perioperative Cardiovascular Management for Noncardiac Surgery** (Thompson A et al., Circulation 2024; 150:e351)
2. **2022 ESC Guidelines on cardiovascular assessment and management of patients undergoing non-cardiac surgery** (Halvorsen S et al., Eur Heart J 2022; 43:3826)
3. **Canadian Cardiovascular Society Guidelines on Perioperative Cardiac Risk Assessment** (Duceppe E et al., Can J Cardiol 2017; 33:17)
4. **ACC/AHA Guidelines on Dual Antiplatelet Therapy and Noncardiac Surgery**
5. **Current evidence on perioperative anticoagulation bridging**

Your response must be a structured clinical report in the following EXACT JSON format. Be clinically precise, specific, and evidence-based. Reference specific guideline recommendations where applicable.

Return ONLY valid JSON, no markdown code blocks, no preamble:

{
  "riskSummary": {
    "overallRisk": "LOW | INTERMEDIATE | HIGH | VERY HIGH",
    "maceRiskPercent": "<estimated % range>",
    "rcriScore": <number>,
    "rcriRisk": "<risk description>",
    "surgicalRiskCategory": "LOW | INTERMEDIATE | HIGH",
    "keyRiskDrivers": ["<driver1>", "<driver2>"],
    "urgentFlag": <boolean>,
    "urgentReason": "<reason if urgent>"
  },
  "surgeryTiming": {
    "recommendation": "PROCEED | DEFER | URGENT EVALUATION NEEDED | CANCEL",
    "timing": "<specific recommendation>",
    "rationale": "<clinical rationale with guideline reference>",
    "deferralDuration": "<if applicable>",
    "conditions": ["<condition for proceeding>"]
  },
  "additionalTesting": {
    "ecg": { "recommended": <boolean>, "indication": "<reason>" },
    "echo": { "recommended": <boolean>, "indication": "<reason>", "urgency": "ROUTINE | URGENT" },
    "stressTesting": { "recommended": <boolean>, "modality": "<preferred modality>", "indication": "<reason>" },
    "coronaryCTA": { "recommended": <boolean>, "indication": "<reason>" },
    "bnp": { "recommended": <boolean>, "indication": "<reason>", "threshold": "<cutoff values>" },
    "troponin": { "recommended": <boolean>, "indication": "<reason>" },
    "labWork": ["<test>: <indication>"],
    "other": ["<test>: <indication>"]
  },
  "medicationManagement": {
    "antiplatelet": {
      "aspirin": {
        "action": "CONTINUE | HOLD | DISCUSS",
        "recommendation": "<specific recommendation>",
        "holdDays": <number or null>,
        "rationale": "<evidence-based rationale>"
      },
      "p2y12": {
        "action": "CONTINUE | HOLD | DISCUSS | NA",
        "drug": "<drug name>",
        "recommendation": "<specific recommendation>",
        "holdDays": <number or null>,
        "bridging": "<bridging strategy if needed>",
        "rationale": "<evidence-based rationale with stent considerations>"
      },
      "overallStrategy": "<overall antiplatelet management summary>"
    },
    "anticoagulation": {
      "action": "CONTINUE | HOLD | BRIDGE | NA",
      "drug": "<drug name>",
      "holdSchedule": "<specific hold schedule with days>",
      "bridgingIndicated": <boolean>,
      "bridgingAgent": "<bridging agent if applicable>",
      "bridgingProtocol": "<detailed bridging protocol>",
      "restarting": "<when and how to restart>",
      "rationale": "<rationale including indication, bleed vs clot risk>",
      "inrTarget": "<if on warfarin>"
    },
    "betaBlocker": {
      "action": "CONTINUE | INITIATE | HOLD | NA",
      "recommendation": "<specific recommendation>",
      "rationale": "<rationale>"
    },
    "statin": {
      "action": "CONTINUE | INITIATE | NA",
      "recommendation": "<specific recommendation>"
    },
    "aceiArb": {
      "action": "CONTINUE | HOLD DAY OF SURGERY | NA",
      "recommendation": "<specific recommendation>",
      "rationale": "<rationale>"
    },
    "sglt2": {
      "action": "HOLD | CONTINUE | NA",
      "holdDays": <number or null>,
      "recommendation": "<specific recommendation>",
      "rationale": "<DKA/euglycemic risk rationale>"
    },
    "otherMedications": "<any other medication recommendations>"
  },
  "perioperativeMonitoring": {
    "troponinSurveillance": { "recommended": <boolean>, "protocol": "<timing>" },
    "icuAdmission": { "recommended": <boolean>, "indication": "<reason>" },
    "invasiveMonitoring": { "recommended": <boolean>, "type": "<type>" },
    "postopCardiology": { "recommended": <boolean>, "timing": "<timing>" },
    "specialConsiderations": ["<consideration>"]
  },
  "specialConsultations": ["<consultation>: <reason>"],
  "prehabilitation": {
    "recommended": <boolean>,
    "components": ["<component>"],
    "rationale": "<rationale>"
  },
  "deviceManagement": {
    "applicable": <boolean>,
    "recommendations": "<CIED-specific recommendations if applicable>"
  },
  "patientCounseling": {
    "keyPoints": ["<point>"],
    "informedConsent": "<key risk to discuss>",
    "sharedDecisionMaking": "<recommendation>"
  },
  "guidelineReferences": ["<specific guideline reference>"],
  "clinicalNarrative": "<2-3 paragraph comprehensive clinical summary integrating all findings, written for a cardiologist>",
  "disclaimer": "This AI-generated assessment is intended as clinical decision support only. Final perioperative management decisions must be made by qualified clinicians after direct patient evaluation."
}`;
}

function buildUserPrompt(data: PatientData, dasiScore: number, rcriScore: number): string {
  const dasiInterpretation = dasiScore > 34 ? "ADEQUATE (>4 METs)" : dasiScore > 25 ? "BORDERLINE POOR" : "POOR (<4 METs)";

  return `Generate a comprehensive perioperative cardiac risk assessment for the following patient:

## PATIENT DEMOGRAPHICS
- Age: ${data.age} years | Sex: ${data.sex?.toUpperCase()}
- Weight: ${data.weight} kg | Height: ${data.height} cm

## PROPOSED SURGERY
- Procedure: ${data.surgeryType}
- Urgency: ${data.surgeryUrgency?.replace("_", " ").toUpperCase()}
- Surgical Risk Category: ${data.surgeryRisk?.toUpperCase()}
- Approach: ${data.laparoscopic ? "Laparoscopic/Minimally Invasive" : "Open"}

## CALCULATED SCORES
- RCRI Score: ${rcriScore}/6
- DASI Score: ${dasiScore.toFixed(1)}/58.2 → Functional Capacity: ${dasiInterpretation}

## CARDIAC HISTORY
- Coronary Artery Disease: ${data.knownCAD ? "YES" : "NO"}
- Prior MI: ${data.priorMI ? `YES (${data.miTiming || "timing unknown"})` : "NO"}
- Prior PCI: ${data.priorPCI ? `YES (${data.pciTiming || "timing unknown"}, ${data.pciStentType || "stent type unknown"})` : "NO"}
- Prior CABG: ${data.priorCABG ? `YES (${data.cabgTiming || "timing unknown"})` : "NO"}
- Heart Failure: ${data.heartFailure ? `YES (${data.hfType || "type unknown"}, LVEF: ${data.lvef || "unknown"}%)` : "NO"}
- Valvular Heart Disease: ${data.valvularDisease ? `YES - ${data.valvularDetails}` : "NO"}
- Atrial Fibrillation: ${data.atrialFibrillation ? "YES" : "NO"}
- Prior Stroke/TIA: ${data.priorStroke ? `YES (${data.strokeTiming || "timing unknown"})` : "NO"}
- Pulmonary Hypertension: ${data.pulmonaryHypertension ? `YES (${data.pahSeverity || "severity unknown"})` : "NO"}
- Congenital Heart Disease: ${data.congenitalHeartDisease ? `YES (Risk: ${data.chdRisk})` : "NO"}
- Pacemaker: ${data.pacemaker ? `YES (Pacemaker-dependent: ${data.pacemakerDependent ? "YES" : "NO"}, Last checked: ${data.deviceLastChecked || "unknown"})` : "NO"}
- ICD: ${data.icd ? `YES (Last checked: ${data.deviceLastChecked || "unknown"})` : "NO"}

## COMORBIDITIES
- Hypertension: ${data.hypertension ? "YES" : "NO"}
- Diabetes Mellitus: ${data.diabetes ? `YES (${data.diabetesType || "type unknown"}, HbA1c: ${data.hba1c || "unknown"}%)` : "NO"}
- CKD: ${data.ckd ? `YES (Stage ${data.ckdStage || "unknown"})` : "NO"}
- Anemia: ${data.anemia ? `YES (Hb: ${data.hemoglobin || "unknown"} g/dL)` : "NO"}
- Obstructive Sleep Apnea: ${data.osa ? `YES (CPAP: ${data.osaOnCPAP ? "YES" : "NO"})` : "NO"}
- Frailty: ${data.frailty ? `YES (Clinical Frailty Scale: ${data.clinicalFrailtyScale || "not scored"}/9)` : "NO"}

## CURRENT SYMPTOMS
- Active Symptoms: ${data.symptoms.length > 0 ? data.symptoms.join(", ") : "None reported"}
- New/Worsening Symptoms: ${data.newSymptoms ? "YES" : "NO"}

## CURRENT MEDICATIONS
### Antiplatelet Therapy:
- Aspirin: ${data.aspirin ? `YES (${data.aspirinDose || "dose unknown"} mg/day)` : "NO"}
- P2Y12 Inhibitor: ${data.p2y12 ? `YES - ${data.p2y12Drug}` : "NO"}
- Dual Antiplatelet Therapy (DAPT): ${data.dualAntiplatelet ? "YES - ACTIVE DAPT" : "NO"}

### Anticoagulation:
- Anticoagulant: ${data.anticoagulation ? `YES - ${data.anticoagulantDrug} (Indication: ${data.anticoagulantIndication || "not specified"})` : "NO"}
- INR (if on warfarin): ${data.inr || "N/A"}

### Other Cardiac Medications:
- Beta-Blocker: ${data.betaBlocker ? `YES - ${data.betaBlockerDrug || "unspecified"}` : "NO"}
- Statin: ${data.statin ? "YES" : "NO"}
- ACE Inhibitor: ${data.acei ? "YES" : "NO"}
- ARB: ${data.arb ? "YES" : "NO"}
- SGLT2 Inhibitor: ${data.sglt2 ? `YES - ${data.sglt2Drug || "unspecified"}` : "NO"}
- Diuretic: ${data.diuretic ? "YES" : "NO"}
- Other Medications: ${data.otherMeds || "None"}

## ADDITIONAL CLINICAL NOTES
${data.additionalNotes || "None provided"}

Please provide a comprehensive perioperative cardiac risk assessment with specific, actionable recommendations based on the 2024 AHA/ACC guidelines and other current evidence. Pay special attention to antiplatelet and anticoagulation management given the specific indications and surgical bleeding risk.`;
}

export async function POST(req: NextRequest) {
  try {
    const data: PatientData = await req.json();
    const dasiScore = calculateDASI(data.dasiAnswers);
    const rcriScore = calculateRCRI(data);

    const stream = await client.messages.stream({
      model: "claude-opus-4-5",
      max_tokens: 4000,
      system: buildSystemPrompt(),
      messages: [
        {
          role: "user",
          content: buildUserPrompt(data, dasiScore, rcriScore),
        },
      ],
    });

    const encoder = new TextEncoder();

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (
              chunk.type === "content_block_delta" &&
              chunk.delta.type === "text_delta"
            ) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`)
              );
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Assessment error:", error);
    return NextResponse.json(
      { error: "Assessment failed. Please check your API key and try again." },
      { status: 500 }
    );
  }
}
