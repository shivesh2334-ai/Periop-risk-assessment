"use client";

import { useState } from "react";
import { PatientData, initialPatientData, DASI_QUESTIONS, SURGERY_RISK_EXAMPLES, SYMPTOMS_LIST, calculateDASI, calculateRCRI } from "@/lib/types";

// ─── Step Components ───────────────────────────────────────────────────────────

function StepDemographics({ data, onChange }: { data: PatientData; onChange: (d: Partial<PatientData>) => void }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Age (years)" required>
          <input type="number" className="input-clinical" min="18" max="110"
            value={data.age} onChange={e => onChange({ age: e.target.value })} placeholder="e.g. 68" />
        </Field>
        <Field label="Sex" required>
          <select className="input-clinical" value={data.sex}
            onChange={e => onChange({ sex: e.target.value as PatientData["sex"] })}>
            <option value="">Select</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </Field>
        <Field label="Weight (kg)">
          <input type="number" className="input-clinical"
            value={data.weight} onChange={e => onChange({ weight: e.target.value })} placeholder="e.g. 72" />
        </Field>
        <Field label="Height (cm)">
          <input type="number" className="input-clinical"
            value={data.height} onChange={e => onChange({ height: e.target.value })} placeholder="e.g. 168" />
        </Field>
      </div>

      <div className="border-t pt-5" style={{ borderColor: "var(--border)" }}>
        <SectionLabel>Proposed Surgery</SectionLabel>
        <div className="space-y-4 mt-3">
          <Field label="Surgical Procedure" required>
            <input type="text" className="input-clinical"
              value={data.surgeryType}
              onChange={e => onChange({ surgeryType: e.target.value })}
              placeholder="e.g. Right hemicolectomy, Total hip replacement..." />
          </Field>

          <Field label="Urgency of Surgery" required>
            <select className="input-clinical" value={data.surgeryUrgency}
              onChange={e => onChange({ surgeryUrgency: e.target.value as PatientData["surgeryUrgency"] })}>
              <option value="">Select urgency</option>
              <option value="elective">Elective (can be deferred indefinitely)</option>
              <option value="time_sensitive">Time-Sensitive (≤3 months delay safe)</option>
              <option value="urgent">Urgent (2–24 hours)</option>
              <option value="emergency">Emergency (&lt;2 hours)</option>
            </select>
          </Field>

          <Field label="Intrinsic Surgical Risk" required>
            <select className="input-clinical" value={data.surgeryRisk}
              onChange={e => onChange({ surgeryRisk: e.target.value as PatientData["surgeryRisk"] })}>
              <option value="">Select risk category</option>
              <option value="low">Low Risk (&lt;1% MACE) – Ophthalmologic, Dental, Endoscopic</option>
              <option value="intermediate">Intermediate Risk (1–5%) – Orthopedic, ENT, GU, Laparoscopic</option>
              <option value="high">High Risk (&gt;5%) – Vascular, Open thoracic/abdominal, Transplant</option>
            </select>
            {data.surgeryRisk && (
              <div className="mt-2 p-3 rounded-lg" style={{ background: "rgba(44,122,255,0.06)", border: "1px solid var(--border)" }}>
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.3rem" }}>
                  Examples of {data.surgeryRisk} risk procedures:
                </p>
                <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                  {SURGERY_RISK_EXAMPLES[data.surgeryRisk]?.join(" · ")}
                </p>
              </div>
            )}
          </Field>

          <CheckboxItem
            checked={data.laparoscopic}
            onChange={v => onChange({ laparoscopic: v })}
            label="Laparoscopic / Minimally Invasive Approach"
            hint="Approximately half the MACE risk compared to open surgery"
          />
        </div>
      </div>
    </div>
  );
}

function StepCardiacHistory({ data, onChange }: { data: PatientData; onChange: (d: Partial<PatientData>) => void }) {
  return (
    <div className="space-y-5">
      <SectionLabel>Coronary Artery Disease</SectionLabel>
      <div className="space-y-2">
        <CheckboxItem checked={data.knownCAD} onChange={v => onChange({ knownCAD: v })} label="Known CAD (stable)" />
        <CheckboxItem checked={data.priorMI} onChange={v => onChange({ priorMI: v })} label="Prior Myocardial Infarction" />
        {data.priorMI && (
          <div className="ml-6">
            <Field label="Time since MI">
              <input type="text" className="input-clinical" value={data.miTiming}
                onChange={e => onChange({ miTiming: e.target.value })} placeholder="e.g. 3 months ago, 2 years ago" />
            </Field>
          </div>
        )}
        <CheckboxItem checked={data.priorPCI} onChange={v => onChange({ priorPCI: v })} label="Prior PCI / Coronary Stenting" />
        {data.priorPCI && (
          <div className="ml-6 grid grid-cols-2 gap-3">
            <Field label="Time since PCI">
              <input type="text" className="input-clinical" value={data.pciTiming}
                onChange={e => onChange({ pciTiming: e.target.value })} placeholder="e.g. 8 months" />
            </Field>
            <Field label="Stent Type">
              <select className="input-clinical" value={data.pciStentType}
                onChange={e => onChange({ pciStentType: e.target.value as PatientData["pciStentType"] })}>
                <option value="">Select</option>
                <option value="drug_eluting">Drug-Eluting Stent (DES)</option>
                <option value="bare_metal">Bare Metal Stent (BMS)</option>
                <option value="balloon_only">Balloon Angioplasty Only</option>
              </select>
            </Field>
          </div>
        )}
        <CheckboxItem checked={data.priorCABG} onChange={v => onChange({ priorCABG: v })} label="Prior CABG Surgery" />
        {data.priorCABG && (
          <div className="ml-6">
            <Field label="Time since CABG">
              <input type="text" className="input-clinical" value={data.cabgTiming}
                onChange={e => onChange({ cabgTiming: e.target.value })} placeholder="e.g. 3 years ago" />
            </Field>
          </div>
        )}
      </div>

      <div className="border-t pt-4" style={{ borderColor: "var(--border)" }}>
        <SectionLabel>Heart Failure</SectionLabel>
        <CheckboxItem checked={data.heartFailure} onChange={v => onChange({ heartFailure: v })} label="Known Heart Failure" />
        {data.heartFailure && (
          <div className="ml-6 mt-2 grid grid-cols-2 gap-3">
            <Field label="HF Type">
              <select className="input-clinical" value={data.hfType}
                onChange={e => onChange({ hfType: e.target.value as PatientData["hfType"] })}>
                <option value="">Select</option>
                <option value="HFrEF">HFrEF (LVEF &lt;40%)</option>
                <option value="HFmrEF">HFmrEF (LVEF 40–49%)</option>
                <option value="HFpEF">HFpEF (LVEF ≥50%)</option>
              </select>
            </Field>
            <Field label="LVEF (%)">
              <input type="number" className="input-clinical" value={data.lvef}
                onChange={e => onChange({ lvef: e.target.value })} placeholder="e.g. 35" min="10" max="80" />
            </Field>
          </div>
        )}
      </div>

      <div className="border-t pt-4" style={{ borderColor: "var(--border)" }}>
        <SectionLabel>Other Cardiac Conditions</SectionLabel>
        <div className="space-y-2">
          <CheckboxItem checked={data.valvularDisease} onChange={v => onChange({ valvularDisease: v })} label="Valvular Heart Disease" />
          {data.valvularDisease && (
            <div className="ml-6">
              <Field label="Describe valvular disease">
                <input type="text" className="input-clinical" value={data.valvularDetails}
                  onChange={e => onChange({ valvularDetails: e.target.value })}
                  placeholder="e.g. Severe AS (AVA 0.7cm²), Moderate MR, Rheumatic MS" />
              </Field>
            </div>
          )}
          <CheckboxItem checked={data.atrialFibrillation} onChange={v => onChange({ atrialFibrillation: v })} label="Atrial Fibrillation" />
          <CheckboxItem checked={data.priorStroke} onChange={v => onChange({ priorStroke: v })} label="Prior Stroke or TIA" />
          {data.priorStroke && (
            <div className="ml-6">
              <Field label="Time since stroke/TIA">
                <input type="text" className="input-clinical" value={data.strokeTiming}
                  onChange={e => onChange({ strokeTiming: e.target.value })} placeholder="e.g. 6 weeks ago, 2 years" />
              </Field>
            </div>
          )}
          <CheckboxItem checked={data.pulmonaryHypertension} onChange={v => onChange({ pulmonaryHypertension: v })} label="Pulmonary Hypertension" />
          {data.pulmonaryHypertension && (
            <div className="ml-6">
              <Field label="Severity">
                <select className="input-clinical" value={data.pahSeverity}
                  onChange={e => onChange({ pahSeverity: e.target.value as PatientData["pahSeverity"] })}>
                  <option value="">Select</option>
                  <option value="mild">Mild (mPAP 21–30 mmHg)</option>
                  <option value="moderate">Moderate (mPAP 31–45 mmHg)</option>
                  <option value="severe">Severe (mPAP &gt;45 mmHg)</option>
                </select>
              </Field>
            </div>
          )}
          <CheckboxItem checked={data.congenitalHeartDisease} onChange={v => onChange({ congenitalHeartDisease: v })} label="Congenital Heart Disease" />
          <CheckboxItem checked={data.pacemaker} onChange={v => onChange({ pacemaker: v })} label="Permanent Pacemaker" />
          {data.pacemaker && (
            <div className="ml-6 space-y-2">
              <CheckboxItem checked={data.pacemakerDependent}
                onChange={v => onChange({ pacemakerDependent: v })} label="Pacemaker-dependent (no underlying rhythm)" />
              <Field label="Last device check / interrogation">
                <input type="text" className="input-clinical" value={data.deviceLastChecked}
                  onChange={e => onChange({ deviceLastChecked: e.target.value })} placeholder="e.g. 8 months ago" />
              </Field>
            </div>
          )}
          <CheckboxItem checked={data.icd} onChange={v => onChange({ icd: v })} label="ICD (Implantable Cardioverter-Defibrillator)" />
        </div>
      </div>
    </div>
  );
}

function StepComorbidities({ data, onChange }: { data: PatientData; onChange: (d: Partial<PatientData>) => void }) {
  const toggleSymptom = (s: string) => {
    const syms = data.symptoms.includes(s)
      ? data.symptoms.filter(x => x !== s)
      : [...data.symptoms, s];
    onChange({ symptoms: syms });
  };

  return (
    <div className="space-y-5">
      <SectionLabel>Comorbidities</SectionLabel>
      <div className="space-y-2">
        <CheckboxItem checked={data.hypertension} onChange={v => onChange({ hypertension: v })} label="Hypertension" />
        <CheckboxItem checked={data.diabetes} onChange={v => onChange({ diabetes: v })} label="Diabetes Mellitus" />
        {data.diabetes && (
          <div className="ml-6 grid grid-cols-2 gap-3">
            <Field label="Type">
              <select className="input-clinical" value={data.diabetesType}
                onChange={e => onChange({ diabetesType: e.target.value as PatientData["diabetesType"] })}>
                <option value="">Select</option>
                <option value="type1">Type 1</option>
                <option value="type2">Type 2</option>
              </select>
            </Field>
            <Field label="HbA1c (%)">
              <input type="number" className="input-clinical" value={data.hba1c}
                onChange={e => onChange({ hba1c: e.target.value })} placeholder="e.g. 7.8" step="0.1" />
            </Field>
          </div>
        )}
        <CheckboxItem checked={data.ckd} onChange={v => onChange({ ckd: v })} label="Chronic Kidney Disease" />
        {data.ckd && (
          <div className="ml-6">
            <Field label="CKD Stage (or eGFR)">
              <input type="text" className="input-clinical" value={data.ckdStage}
                onChange={e => onChange({ ckdStage: e.target.value })} placeholder="e.g. Stage 3, eGFR 42 mL/min" />
            </Field>
          </div>
        )}
        <CheckboxItem checked={data.anemia} onChange={v => onChange({ anemia: v })} label="Anemia" />
        {data.anemia && (
          <div className="ml-6">
            <Field label="Haemoglobin (g/dL)">
              <input type="number" className="input-clinical" value={data.hemoglobin}
                onChange={e => onChange({ hemoglobin: e.target.value })} placeholder="e.g. 9.8" step="0.1" />
            </Field>
          </div>
        )}
        <CheckboxItem checked={data.osa} onChange={v => onChange({ osa: v })} label="Obstructive Sleep Apnea" />
        {data.osa && (
          <div className="ml-6">
            <CheckboxItem checked={data.osaOnCPAP} onChange={v => onChange({ osaOnCPAP: v })} label="On CPAP therapy" />
          </div>
        )}
        <CheckboxItem checked={data.frailty} onChange={v => onChange({ frailty: v })} label="Frailty (clinical assessment)" />
        {data.frailty && (
          <div className="ml-6">
            <Field label="Clinical Frailty Scale Score (1–9)">
              <select className="input-clinical" value={data.clinicalFrailtyScale}
                onChange={e => onChange({ clinicalFrailtyScale: e.target.value })}>
                <option value="">Select</option>
                <option value="1">1 – Very Fit</option>
                <option value="2">2 – Well</option>
                <option value="3">3 – Managing Well</option>
                <option value="4">4 – Vulnerable</option>
                <option value="5">5 – Mildly Frail</option>
                <option value="6">6 – Moderately Frail</option>
                <option value="7">7 – Severely Frail</option>
                <option value="8">8 – Very Severely Frail</option>
                <option value="9">9 – Terminally Ill</option>
              </select>
            </Field>
          </div>
        )}
      </div>

      <div className="border-t pt-4" style={{ borderColor: "var(--border)" }}>
        <SectionLabel>Current Symptoms</SectionLabel>
        <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.75rem" }}>
          Select all symptoms present at the time of assessment
        </p>
        <div className="grid grid-cols-2 gap-1">
          {SYMPTOMS_LIST.map(s => (
            <label key={s} className="checkbox-item cursor-pointer">
              <input type="checkbox" checked={data.symptoms.includes(s)}
                onChange={() => toggleSymptom(s)} className="rounded" />
              <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>{s}</span>
            </label>
          ))}
        </div>
        <div className="mt-3">
          <CheckboxItem
            checked={data.newSymptoms}
            onChange={v => onChange({ newSymptoms: v })}
            label="Symptoms are NEW or WORSENING (not previously evaluated)"
            hint="New/worsening symptoms require additional cardiac evaluation before proceeding"
          />
        </div>
      </div>
    </div>
  );
}

function StepMedications({ data, onChange }: { data: PatientData; onChange: (d: Partial<PatientData>) => void }) {
  return (
    <div className="space-y-5">
      <SectionLabel>Antiplatelet Therapy</SectionLabel>
      <div className="space-y-2">
        <CheckboxItem checked={data.aspirin} onChange={v => onChange({ aspirin: v })} label="Aspirin" />
        {data.aspirin && (
          <div className="ml-6">
            <Field label="Aspirin dose">
              <select className="input-clinical" value={data.aspirinDose}
                onChange={e => onChange({ aspirinDose: e.target.value })}>
                <option value="">Select dose</option>
                <option value="75">75 mg/day</option>
                <option value="100">100 mg/day</option>
                <option value="150">150 mg/day</option>
                <option value="325">325 mg/day</option>
              </select>
            </Field>
          </div>
        )}
        <CheckboxItem checked={data.p2y12} onChange={v => onChange({ p2y12: v })} label="P2Y12 Inhibitor" />
        {data.p2y12 && (
          <div className="ml-6">
            <Field label="P2Y12 Agent">
              <select className="input-clinical" value={data.p2y12Drug}
                onChange={e => onChange({ p2y12Drug: e.target.value as PatientData["p2y12Drug"] })}>
                <option value="">Select drug</option>
                <option value="clopidogrel">Clopidogrel (Plavix)</option>
                <option value="ticagrelor">Ticagrelor (Brilinta)</option>
                <option value="prasugrel">Prasugrel (Efient)</option>
              </select>
            </Field>
          </div>
        )}
        {data.aspirin && data.p2y12 && (
          <div className="p-3 rounded-lg" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)" }}>
            <p style={{ fontSize: "0.78rem", color: "#F87171", fontWeight: 500 }}>
              ⚠️ Active Dual Antiplatelet Therapy (DAPT) — Critical for perioperative management
            </p>
            <div className="mt-1">
              <CheckboxItem checked={data.dualAntiplatelet}
                onChange={v => onChange({ dualAntiplatelet: v })}
                label="Confirm active DAPT (both drugs being taken together)" />
            </div>
          </div>
        )}
      </div>

      <div className="border-t pt-4" style={{ borderColor: "var(--border)" }}>
        <SectionLabel>Anticoagulation</SectionLabel>
        <CheckboxItem checked={data.anticoagulation} onChange={v => onChange({ anticoagulation: v })} label="On Anticoagulant Therapy" />
        {data.anticoagulation && (
          <div className="ml-6 space-y-3 mt-2">
            <Field label="Anticoagulant Drug">
              <select className="input-clinical" value={data.anticoagulantDrug}
                onChange={e => onChange({ anticoagulantDrug: e.target.value as PatientData["anticoagulantDrug"] })}>
                <option value="">Select agent</option>
                <optgroup label="DOACs">
                  <option value="apixaban">Apixaban (Eliquis)</option>
                  <option value="rivaroxaban">Rivaroxaban (Xarelto)</option>
                  <option value="dabigatran">Dabigatran (Pradaxa)</option>
                  <option value="edoxaban">Edoxaban (Lixiana)</option>
                </optgroup>
                <optgroup label="Injectable / VKA">
                  <option value="warfarin">Warfarin (VKA)</option>
                  <option value="enoxaparin">Enoxaparin (LMWH)</option>
                </optgroup>
              </select>
            </Field>
            <Field label="Indication for Anticoagulation">
              <input type="text" className="input-clinical" value={data.anticoagulantIndication}
                onChange={e => onChange({ anticoagulantIndication: e.target.value })}
                placeholder="e.g. AF (CHA₂DS₂-VASc 4), DVT/PE 3 months ago, Mechanical MVR" />
            </Field>
            {data.anticoagulantDrug === "warfarin" && (
              <Field label="Current INR">
                <input type="number" className="input-clinical" value={data.inr}
                  onChange={e => onChange({ inr: e.target.value })} placeholder="e.g. 2.4" step="0.1" />
              </Field>
            )}
          </div>
        )}
      </div>

      <div className="border-t pt-4" style={{ borderColor: "var(--border)" }}>
        <SectionLabel>Other Cardiac Medications</SectionLabel>
        <div className="space-y-2">
          <CheckboxItem checked={data.betaBlocker} onChange={v => onChange({ betaBlocker: v })} label="Beta-Blocker" />
          {data.betaBlocker && (
            <div className="ml-6">
              <Field label="Agent and dose">
                <input type="text" className="input-clinical" value={data.betaBlockerDrug}
                  onChange={e => onChange({ betaBlockerDrug: e.target.value })}
                  placeholder="e.g. Metoprolol succinate 50mg OD, Carvedilol 12.5mg BD" />
              </Field>
            </div>
          )}
          <CheckboxItem checked={data.statin} onChange={v => onChange({ statin: v })} label="Statin (e.g. Atorvastatin, Rosuvastatin)" />
          <CheckboxItem checked={data.acei} onChange={v => onChange({ acei: v })} label="ACE Inhibitor" />
          <CheckboxItem checked={data.arb} onChange={v => onChange({ arb: v })} label="Angiotensin Receptor Blocker (ARB)" />
          <CheckboxItem checked={data.sglt2} onChange={v => onChange({ sglt2: v })} label="SGLT2 Inhibitor" />
          {data.sglt2 && (
            <div className="ml-6">
              <Field label="Agent">
                <input type="text" className="input-clinical" value={data.sglt2Drug}
                  onChange={e => onChange({ sglt2Drug: e.target.value })}
                  placeholder="e.g. Empagliflozin 10mg, Dapagliflozin 10mg" />
              </Field>
            </div>
          )}
          <CheckboxItem checked={data.diuretic} onChange={v => onChange({ diuretic: v })} label="Diuretic (Furosemide, Torsemide, etc.)" />
        </div>
        <div className="mt-4">
          <Field label="Other relevant medications">
            <textarea className="input-clinical" rows={2} value={data.otherMeds}
              onChange={e => onChange({ otherMeds: e.target.value })}
              placeholder="e.g. Digoxin 0.125mg, Amiodarone 200mg, Ivabradine, NSAIDs..." />
          </Field>
        </div>
      </div>
    </div>
  );
}

function StepFunctionalCapacity({ data, onChange }: { data: PatientData; onChange: (d: Partial<PatientData>) => void }) {
  const toggleDASI = (id: string) => {
    onChange({ dasiAnswers: { ...data.dasiAnswers, [id]: !data.dasiAnswers[id] } });
  };
  const score = calculateDASI(data.dasiAnswers);
  const adequate = score > 34;
  const borderline = score > 25 && score <= 34;

  return (
    <div className="space-y-5">
      <div>
        <SectionLabel>Duke Activity Status Index (DASI)</SectionLabel>
        <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
          Check all activities the patient can perform without symptoms. Higher score = better functional capacity.
        </p>
      </div>

      {/* Live score */}
      <div className="p-4 rounded-xl flex items-center justify-between"
        style={{ background: "rgba(10,22,40,0.9)", border: `1px solid ${adequate ? "rgba(20,184,166,0.4)" : borderline ? "rgba(251,191,36,0.4)" : "rgba(239,68,68,0.4)"}` }}>
        <div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>
            DASI SCORE (Max 58.2)
          </div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "2rem", fontWeight: 700, color: adequate ? "#2DD4BF" : borderline ? "#FBBF24" : "#F87171" }}>
            {score.toFixed(1)}
          </div>
        </div>
        <div className="text-right">
          <div style={{ fontSize: "0.85rem", fontWeight: 600, color: adequate ? "#2DD4BF" : borderline ? "#FBBF24" : "#F87171" }}>
            {adequate ? "ADEQUATE (>4 METs)" : borderline ? "BORDERLINE" : "POOR (<4 METs)"}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
            Functional Capacity
          </div>
          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "0.1rem" }}>
            {adequate ? "May proceed without further testing" : "Further risk stratification indicated"}
          </div>
        </div>
      </div>

      <div className="space-y-1">
        {DASI_QUESTIONS.map((q, i) => (
          <label key={q.id} className="checkbox-item cursor-pointer"
            style={{ animationDelay: `${i * 0.03}s` }}>
            <input type="checkbox" checked={!!data.dasiAnswers[q.id]}
              onChange={() => toggleDASI(q.id)} />
            <div className="flex-1">
              <span style={{ fontSize: "0.83rem", color: "var(--text-secondary)" }}>
                {i + 1}. Can the patient {q.text.toLowerCase()}
              </span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--text-muted)", marginLeft: "0.5rem" }}>
                [{q.mets} METs]
              </span>
            </div>
          </label>
        ))}
      </div>

      <div className="border-t pt-4" style={{ borderColor: "var(--border)" }}>
        <Field label="Additional clinical notes / concerns">
          <textarea className="input-clinical" rows={3} value={data.additionalNotes}
            onChange={e => onChange({ additionalNotes: e.target.value })}
            placeholder="Any additional clinical information, recent investigations, specialist notes, or concerns relevant to perioperative management..." />
        </Field>
      </div>
    </div>
  );
}

// ─── Shared UI Components ────────────────────────────────────────────────────

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label style={{ fontSize: "0.78rem", fontWeight: 500, color: "var(--text-secondary)", display: "block" }}>
        {label} {required && <span style={{ color: "var(--accent-crimson)" }}>*</span>}
      </label>
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontFamily: "var(--font-mono)",
      fontSize: "0.68rem",
      letterSpacing: "0.12em",
      textTransform: "uppercase",
      color: "var(--accent-teal)",
      marginBottom: "0.75rem",
    }}>
      {children}
    </div>
  );
}

function CheckboxItem({ checked, onChange, label, hint }: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <label className="checkbox-item cursor-pointer block">
      <div className="flex items-start gap-2">
        <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}
          className="mt-0.5 flex-shrink-0" />
        <div>
          <div style={{ fontSize: "0.84rem", color: "var(--text-secondary)" }}>{label}</div>
          {hint && <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>{hint}</div>}
        </div>
      </div>
    </label>
  );
}

// ─── Step Config ─────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, title: "Demographics & Surgery", shortTitle: "Patient" },
  { id: 2, title: "Cardiac History", shortTitle: "Cardiac" },
  { id: 3, title: "Comorbidities & Symptoms", shortTitle: "Comorbid" },
  { id: 4, title: "Medications", shortTitle: "Meds" },
  { id: 5, title: "Functional Capacity", shortTitle: "DASI" },
];

// ─── Main Form ────────────────────────────────────────────────────────────────

export default function AssessmentForm({
  onComplete,
  onBack,
}: {
  onComplete: (data: PatientData, report: string) => void;
  onBack: () => void;
}) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<PatientData>(initialPatientData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const updateData = (partial: Partial<PatientData>) => {
    setData(prev => ({ ...prev, ...partial }));
  };

  const validateStep = () => {
    if (step === 1 && (!data.age || !data.sex || !data.surgeryType || !data.surgeryUrgency || !data.surgeryRisk)) {
      return "Please fill in all required fields (marked with *)";
    }
    return "";
  };

  const handleNext = () => {
    const err = validateStep();
    if (err) { setError(err); return; }
    setError("");
    if (step < STEPS.length) setStep(s => s + 1);
    else handleSubmit();
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    let accumulated = "";

    try {
      const res = await fetch("/api/assess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Assessment failed");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ") && line !== "data: [DONE]") {
            try {
              const json = JSON.parse(line.slice(6));
              accumulated += json.text || "";
            } catch { /* skip */ }
          }
        }
      }

      onComplete(data, accumulated);
    } catch (e) {
      setError("Failed to generate assessment. Please check your API key and try again.");
    } finally {
      setLoading(false);
    }
  };

  const progress = (step / STEPS.length) * 100;
  const rcri = calculateRCRI(data);
  const dasiScore = calculateDASI(data.dasiAnswers);

  return (
    <div className="min-h-screen flex flex-col z-10 relative">
      {/* Top bar */}
      <div className="sticky top-0 z-20 px-4 py-3"
        style={{ background: "rgba(5,10,26,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid var(--border)" }}>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <button onClick={onBack}
              style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}
              className="hover:text-white transition-colors">
              ← Back
            </button>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--text-muted)" }}>
              STEP {step} OF {STEPS.length}
            </div>
            <div className="flex items-center gap-2">
              <span className="section-tag">RCRI: {rcri}</span>
              {step === 5 && <span className={`badge-${dasiScore > 34 ? "low" : "high"}`}>DASI: {dasiScore.toFixed(0)}</span>}
            </div>
          </div>
          {/* Steps */}
          <div className="flex gap-1 mb-2">
            {STEPS.map(s => (
              <button
                key={s.id}
                onClick={() => s.id <= step && setStep(s.id)}
                className="flex-1 text-center py-1 rounded transition-all"
                style={{
                  fontSize: "0.62rem",
                  fontFamily: "var(--font-mono)",
                  color: s.id === step ? "var(--accent-teal)" : s.id < step ? "var(--text-secondary)" : "var(--text-muted)",
                  background: s.id === step ? "rgba(20,184,166,0.1)" : "transparent",
                  cursor: s.id <= step ? "pointer" : "default",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                }}
              >
                {s.shortTitle}
              </button>
            ))}
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.25rem" }}>
              {STEPS[step - 1].title}
            </h2>
            <p style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
              {step === 1 && "Patient demographics and surgical procedure details"}
              {step === 2 && "Prior cardiac history, interventions, and risk modifiers"}
              {step === 3 && "Comorbidities, current symptoms, and frailty assessment"}
              {step === 4 && "Current medications — critical for perioperative management"}
              {step === 5 && "Duke Activity Status Index for functional capacity assessment"}
            </p>
          </div>

          <div className="card-clinical p-6 animate-fade-in">
            {step === 1 && <StepDemographics data={data} onChange={updateData} />}
            {step === 2 && <StepCardiacHistory data={data} onChange={updateData} />}
            {step === 3 && <StepComorbidities data={data} onChange={updateData} />}
            {step === 4 && <StepMedications data={data} onChange={updateData} />}
            {step === 5 && <StepFunctionalCapacity data={data} onChange={updateData} />}
          </div>

          {error && (
            <div className="mt-4 p-3 rounded-lg" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", fontSize: "0.82rem", color: "#F87171" }}>
              {error}
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-6">
            <button
              onClick={() => step > 1 ? setStep(s => s - 1) : onBack()}
              className="px-5 py-2.5 rounded-lg transition-all"
              style={{ border: "1px solid var(--border)", color: "var(--text-secondary)", fontSize: "0.85rem" }}
            >
              Back
            </button>
            <button
              onClick={handleNext}
              disabled={loading}
              className="px-7 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2"
              style={{
                background: loading ? "rgba(44,122,255,0.4)" : "linear-gradient(135deg, #2C7AFF, #1C3870)",
                color: "white",
                fontSize: "0.88rem",
                border: "1px solid rgba(44,122,255,0.4)",
                boxShadow: "0 4px 16px rgba(44,122,255,0.2)",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? (
                <>
                  <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating Report...
                </>
              ) : step === STEPS.length ? (
                "Generate Assessment →"
              ) : (
                "Next →"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
