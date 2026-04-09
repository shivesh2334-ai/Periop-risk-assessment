"use client";

import { useEffect, useState, useRef } from "react";
import { PatientData, calculateDASI, calculateRCRI } from "@/lib/types";

interface AssessmentReport {
  riskSummary: {
    overallRisk: string;
    maceRiskPercent: string;
    rcriScore: number;
    rcriRisk: string;
    surgicalRiskCategory: string;
    keyRiskDrivers: string[];
    urgentFlag: boolean;
    urgentReason: string;
  };
  surgeryTiming: {
    recommendation: string;
    timing: string;
    rationale: string;
    deferralDuration: string;
    conditions: string[];
  };
  additionalTesting: {
    ecg: { recommended: boolean; indication: string };
    echo: { recommended: boolean; indication: string; urgency: string };
    stressTesting: { recommended: boolean; modality: string; indication: string };
    coronaryCTA: { recommended: boolean; indication: string };
    bnp: { recommended: boolean; indication: string; threshold: string };
    troponin: { recommended: boolean; indication: string };
    labWork: string[];
    other: string[];
  };
  medicationManagement: {
    antiplatelet: {
      aspirin: { action: string; recommendation: string; holdDays: number | null; rationale: string };
      p2y12: { action: string; drug: string; recommendation: string; holdDays: number | null; bridging: string; rationale: string };
      overallStrategy: string;
    };
    anticoagulation: {
      action: string; drug: string; holdSchedule: string; bridgingIndicated: boolean;
      bridgingAgent: string; bridgingProtocol: string; restarting: string; rationale: string; inrTarget: string;
    };
    betaBlocker: { action: string; recommendation: string; rationale: string };
    statin: { action: string; recommendation: string };
    aceiArb: { action: string; recommendation: string; rationale: string };
    sglt2: { action: string; holdDays: number | null; recommendation: string; rationale: string };
    otherMedications: string;
  };
  perioperativeMonitoring: {
    troponinSurveillance: { recommended: boolean; protocol: string };
    icuAdmission: { recommended: boolean; indication: string };
    invasiveMonitoring: { recommended: boolean; type: string };
    postopCardiology: { recommended: boolean; timing: string };
    specialConsiderations: string[];
  };
  specialConsultations: string[];
  prehabilitation: { recommended: boolean; components: string[]; rationale: string };
  deviceManagement: { applicable: boolean; recommendations: string };
  patientCounseling: { keyPoints: string[]; informedConsent: string; sharedDecisionMaking: string };
  guidelineReferences: string[];
  clinicalNarrative: string;
  disclaimer: string;
}

const RISK_COLORS: Record<string, { color: string; bg: string; border: string }> = {
  LOW: { color: "#2DD4BF", bg: "rgba(20,184,166,0.08)", border: "rgba(20,184,166,0.25)" },
  INTERMEDIATE: { color: "#FBBF24", bg: "rgba(251,191,36,0.08)", border: "rgba(251,191,36,0.25)" },
  HIGH: { color: "#F87171", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.3)" },
  "VERY HIGH": { color: "#EF4444", bg: "rgba(239,68,68,0.15)", border: "rgba(239,68,68,0.4)" },
};

const ACTION_COLORS: Record<string, string> = {
  CONTINUE: "#2DD4BF",
  HOLD: "#FBBF24",
  BRIDGE: "#F87171",
  INITIATE: "#2C7AFF",
  DEFER: "#FBBF24",
  PROCEED: "#2DD4BF",
  "URGENT EVALUATION NEEDED": "#F87171",
  DISCUSS: "#2C7AFF",
  NA: "#4A6080",
};

export default function ReportView({
  data,
  reportJson,
  onReset,
  onNewAssessment,
}: {
  data: PatientData;
  reportJson: string;
  onReset: () => void;
  onNewAssessment: () => void;
}) {
  const [report, setReport] = useState<AssessmentReport | null>(null);
  const [parseError, setParseError] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const cleaned = reportJson.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(cleaned);
      setReport(parsed);
    } catch {
      setParseError(true);
    }
  }, [reportJson]);

  const dasiScore = calculateDASI(data.dasiAnswers);
  const rcriScore = calculateRCRI(data);

  const handlePrint = () => {
    window.print();
  };

  if (parseError) {
    return (
      <div className="min-h-screen flex items-center justify-center z-10 relative px-4">
        <div className="card-clinical p-8 max-w-lg w-full text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", marginBottom: "1rem" }}>
            Report Format Error
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
            The AI response couldn't be parsed. Raw content:
          </p>
          <pre style={{
            background: "rgba(10,22,40,0.8)",
            padding: "1rem",
            borderRadius: "8px",
            fontSize: "0.7rem",
            color: "var(--text-secondary)",
            whiteSpace: "pre-wrap",
            textAlign: "left",
            maxHeight: "200px",
            overflow: "auto",
          }}>
            {reportJson.slice(0, 500)}...
          </pre>
          <button onClick={onNewAssessment} className="mt-4 px-6 py-2 rounded-lg text-white"
            style={{ background: "var(--accent-blue)" }}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center z-10 relative">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Processing assessment...</p>
        </div>
      </div>
    );
  }

  const riskStyle = RISK_COLORS[report.riskSummary.overallRisk] || RISK_COLORS.INTERMEDIATE;
  const timingColor = ACTION_COLORS[report.surgeryTiming.recommendation] || "#FBBF24";

  return (
    <div className="min-h-screen z-10 relative" ref={printRef}>
      {/* Header */}
      <div className="sticky top-0 z-20 px-4 py-3"
        style={{ background: "rgba(5,10,26,0.97)", backdropFilter: "blur(12px)", borderBottom: "1px solid var(--border)" }}>
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <div className="section-tag mb-1">PERIOPERATIVE CARDIAC ASSESSMENT</div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "1rem", color: "var(--text-primary)" }}>
              {data.sex === "male" ? "Male" : "Female"}, {data.age}y — {data.surgeryType || "Noncardiac Surgery"}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg text-xs transition-all"
              style={{ border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
              🖨 Print
            </button>
            <button onClick={onNewAssessment}
              className="px-3 py-1.5 rounded-lg text-xs transition-all"
              style={{ border: "1px solid rgba(44,122,255,0.3)", color: "#7BA7FF" }}>
              New Case
            </button>
            <button onClick={onReset}
              className="px-3 py-1.5 rounded-lg text-xs transition-all"
              style={{ background: "rgba(44,122,255,0.1)", color: "#7BA7FF", border: "1px solid rgba(44,122,255,0.3)" }}>
              ← Home
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

        {/* Urgent Alert */}
        {report.riskSummary.urgentFlag && (
          <div className="p-4 rounded-xl animate-pulse-slow"
            style={{ background: "rgba(239,68,68,0.12)", border: "2px solid rgba(239,68,68,0.5)" }}>
            <div className="flex items-start gap-3">
              <span className="text-2xl">🚨</span>
              <div>
                <div style={{ fontWeight: 700, color: "#F87171", marginBottom: "0.25rem" }}>URGENT CLINICAL ALERT</div>
                <div style={{ fontSize: "0.85rem", color: "#FCA5A5" }}>{report.riskSummary.urgentReason}</div>
              </div>
            </div>
          </div>
        )}

        {/* Risk Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <ScoreCard
            label="Overall MACE Risk"
            value={report.riskSummary.overallRisk}
            sub={report.riskSummary.maceRiskPercent}
            color={riskStyle.color}
            bg={riskStyle.bg}
            border={riskStyle.border}
            large
          />
          <ScoreCard
            label="Surgery Timing"
            value={report.surgeryTiming.recommendation}
            sub={report.surgeryTiming.timing.split(".")[0]}
            color={timingColor}
            bg={`${timingColor}18`}
            border={`${timingColor}40`}
          />
          <ScoreCard
            label="RCRI Score"
            value={`${rcriScore}/6`}
            sub={report.riskSummary.rcriRisk}
            color={rcriScore <= 1 ? "#2DD4BF" : rcriScore <= 2 ? "#FBBF24" : "#F87171"}
            bg={rcriScore <= 1 ? "rgba(20,184,166,0.08)" : rcriScore <= 2 ? "rgba(251,191,36,0.08)" : "rgba(239,68,68,0.08)"}
            border={rcriScore <= 1 ? "rgba(20,184,166,0.25)" : rcriScore <= 2 ? "rgba(251,191,36,0.25)" : "rgba(239,68,68,0.25)"}
          />
          <ScoreCard
            label="DASI Score"
            value={dasiScore.toFixed(0)}
            sub={dasiScore > 34 ? "Adequate FC" : dasiScore > 25 ? "Borderline" : "Poor FC"}
            color={dasiScore > 34 ? "#2DD4BF" : dasiScore > 25 ? "#FBBF24" : "#F87171"}
            bg={dasiScore > 34 ? "rgba(20,184,166,0.08)" : dasiScore > 25 ? "rgba(251,191,36,0.08)" : "rgba(239,68,68,0.08)"}
            border={dasiScore > 34 ? "rgba(20,184,166,0.25)" : dasiScore > 25 ? "rgba(251,191,36,0.25)" : "rgba(239,68,68,0.25)"}
          />
        </div>

        {/* Key Risk Drivers */}
        {report.riskSummary.keyRiskDrivers?.length > 0 && (
          <ReportCard title="Key Risk Drivers" icon="⚡">
            <div className="flex flex-wrap gap-2">
              {report.riskSummary.keyRiskDrivers.map(d => (
                <span key={d} className="badge-intermediate">{d}</span>
              ))}
            </div>
          </ReportCard>
        )}

        {/* Clinical Narrative */}
        <ReportCard title="Clinical Assessment Summary" icon="📝">
          <div style={{ fontSize: "0.87rem", color: "var(--text-secondary)", lineHeight: 1.75, whiteSpace: "pre-wrap" }}>
            {report.clinicalNarrative}
          </div>
        </ReportCard>

        {/* Surgery Timing */}
        <ReportCard title="Surgery Timing & Recommendation" icon="🗓">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <ActionBadge action={report.surgeryTiming.recommendation} />
              <span style={{ fontSize: "0.88rem", color: "var(--text-primary)", fontWeight: 500 }}>
                {report.surgeryTiming.timing}
              </span>
            </div>
            <div className="report-section" style={{ borderLeftColor: timingColor }}>
              <p style={{ fontSize: "0.83rem", color: "var(--text-secondary)", lineHeight: 1.65 }}>
                {report.surgeryTiming.rationale}
              </p>
            </div>
            {report.surgeryTiming.deferralDuration && (
              <InfoRow label="Deferral Period" value={report.surgeryTiming.deferralDuration} />
            )}
            {report.surgeryTiming.conditions?.length > 0 && (
              <div>
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem", fontFamily: "var(--font-mono)" }}>
                  Conditions to Proceed
                </div>
                <ul className="space-y-1">
                  {report.surgeryTiming.conditions.map(c => (
                    <li key={c} style={{ fontSize: "0.83rem", color: "var(--text-secondary)" }}>
                      ✓ {c}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </ReportCard>

        {/* Additional Testing */}
        <ReportCard title="Recommended Investigations" icon="🔬">
          <div className="space-y-2.5">
            {[
              { key: "ecg", label: "12-Lead ECG", data: report.additionalTesting.ecg },
              { key: "echo", label: "Echocardiography", data: report.additionalTesting.echo },
              { key: "stressTesting", label: "Stress Testing", data: report.additionalTesting.stressTesting },
              { key: "coronaryCTA", label: "Coronary CT Angiography", data: report.additionalTesting.coronaryCTA },
              { key: "bnp", label: "Natriuretic Peptide (BNP/NT-proBNP)", data: report.additionalTesting.bnp },
              { key: "troponin", label: "Cardiac Troponin (Baseline)", data: report.additionalTesting.troponin },
            ].map(({ label, data: d }) => (
              d && (
                <TestRow
                  key={label}
                  label={label}
                  recommended={d.recommended}
                  indication={d.indication}
                  extra={"modality" in d ? (d as { modality: string }).modality : "urgency" in d ? (d as { urgency: string }).urgency : "threshold" in d ? (d as { threshold: string }).threshold : ""}
                />
              )
            ))}
            {report.additionalTesting.labWork?.length > 0 && (
              <div className="pt-2 border-t" style={{ borderColor: "var(--border)" }}>
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>
                  Laboratory Investigations
                </div>
                <ul className="space-y-1">
                  {report.additionalTesting.labWork.map(l => (
                    <li key={l} style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>• {l}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </ReportCard>

        {/* Medication Management - Antiplatelet */}
        <ReportCard title="Antiplatelet Management" icon="💊">
          <div className="space-y-4">
            <div className="p-3 rounded-lg" style={{ background: "rgba(44,122,255,0.06)", border: "1px solid rgba(44,122,255,0.15)" }}>
              <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#7BA7FF", marginBottom: "0.4rem" }}>
                Overall Strategy
              </div>
              <p style={{ fontSize: "0.83rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                {report.medicationManagement.antiplatelet.overallStrategy}
              </p>
            </div>

            {report.medicationManagement.antiplatelet.aspirin.action !== "NA" && (
              <MedSection
                drug="Aspirin"
                action={report.medicationManagement.antiplatelet.aspirin.action}
                recommendation={report.medicationManagement.antiplatelet.aspirin.recommendation}
                holdDays={report.medicationManagement.antiplatelet.aspirin.holdDays}
                rationale={report.medicationManagement.antiplatelet.aspirin.rationale}
              />
            )}

            {report.medicationManagement.antiplatelet.p2y12.action !== "NA" && (
              <MedSection
                drug={`P2Y12 – ${report.medicationManagement.antiplatelet.p2y12.drug}`}
                action={report.medicationManagement.antiplatelet.p2y12.action}
                recommendation={report.medicationManagement.antiplatelet.p2y12.recommendation}
                holdDays={report.medicationManagement.antiplatelet.p2y12.holdDays}
                rationale={report.medicationManagement.antiplatelet.p2y12.rationale}
                extra={report.medicationManagement.antiplatelet.p2y12.bridging}
              />
            )}
          </div>
        </ReportCard>

        {/* Anticoagulation */}
        {report.medicationManagement.anticoagulation.action !== "NA" && (
          <ReportCard title="Anticoagulation Management" icon="🩸">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <ActionBadge action={report.medicationManagement.anticoagulation.action} />
                <span style={{ fontSize: "0.88rem", color: "var(--text-primary)", fontWeight: 500 }}>
                  {report.medicationManagement.anticoagulation.drug}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {report.medicationManagement.anticoagulation.holdSchedule && (
                  <InfoRow label="Hold Schedule" value={report.medicationManagement.anticoagulation.holdSchedule} />
                )}
                {report.medicationManagement.anticoagulation.bridgingIndicated && (
                  <div className="p-3 rounded-lg" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)" }}>
                    <div style={{ fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "#F87171", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                      Bridging Anticoagulation Indicated
                    </div>
                    <div style={{ fontSize: "0.83rem", color: "var(--text-secondary)" }}>
                      <strong style={{ color: "var(--text-primary)" }}>Agent:</strong> {report.medicationManagement.anticoagulation.bridgingAgent}
                    </div>
                    <div style={{ fontSize: "0.83rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                      {report.medicationManagement.anticoagulation.bridgingProtocol}
                    </div>
                  </div>
                )}
                {report.medicationManagement.anticoagulation.restarting && (
                  <InfoRow label="Restarting Post-Op" value={report.medicationManagement.anticoagulation.restarting} />
                )}
              </div>
              <div className="report-section">
                <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.65 }}>
                  {report.medicationManagement.anticoagulation.rationale}
                </p>
              </div>
            </div>
          </ReportCard>
        )}

        {/* Other Medications */}
        <ReportCard title="Other Medication Recommendations" icon="💉">
          <div className="space-y-3">
            {[
              { label: "Beta-Blocker", data: report.medicationManagement.betaBlocker },
              { label: "Statin", data: report.medicationManagement.statin },
              { label: "ACEi / ARB", data: report.medicationManagement.aceiArb },
              { label: "SGLT2 Inhibitor", data: report.medicationManagement.sglt2 },
            ].map(({ label, data: d }) => (
              d && d.action !== "NA" && (
                <div key={label} className="flex gap-3 items-start py-2 border-b" style={{ borderColor: "var(--border)" }}>
                  <ActionBadge action={d.action} small />
                  <div className="flex-1">
                    <div style={{ fontSize: "0.83rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.2rem" }}>{label}</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                      {"recommendation" in d ? d.recommendation : ""}
                      {"holdDays" in d && d.holdDays ? ` — Hold ${d.holdDays} days pre-op.` : ""}
                    </div>
                  </div>
                </div>
              )
            ))}
            {report.medicationManagement.otherMedications && (
              <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                {report.medicationManagement.otherMedications}
              </div>
            )}
          </div>
        </ReportCard>

        {/* Perioperative Monitoring */}
        <ReportCard title="Perioperative Monitoring" icon="📊">
          <div className="space-y-3">
            {report.perioperativeMonitoring.troponinSurveillance.recommended && (
              <div className="flex gap-3 items-start">
                <span className="badge-intermediate text-xs flex-shrink-0">TROPONIN</span>
                <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                  {report.perioperativeMonitoring.troponinSurveillance.protocol}
                </span>
              </div>
            )}
            {report.perioperativeMonitoring.icuAdmission.recommended && (
              <div className="flex gap-3 items-start">
                <span className="badge-high text-xs flex-shrink-0">ICU</span>
                <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                  {report.perioperativeMonitoring.icuAdmission.indication}
                </span>
              </div>
            )}
            {report.perioperativeMonitoring.invasiveMonitoring.recommended && (
              <div className="flex gap-3 items-start">
                <span className="badge-intermediate text-xs flex-shrink-0">INVASIVE</span>
                <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                  {report.perioperativeMonitoring.invasiveMonitoring.type}
                </span>
              </div>
            )}
            {report.perioperativeMonitoring.postopCardiology.recommended && (
              <div className="flex gap-3 items-start">
                <span className="badge-low text-xs flex-shrink-0">CARDIOLOGY</span>
                <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                  {report.perioperativeMonitoring.postopCardiology.timing}
                </span>
              </div>
            )}
            {report.perioperativeMonitoring.specialConsiderations?.map(c => (
              <div key={c} style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>• {c}</div>
            ))}
          </div>
        </ReportCard>

        {/* Special Consultations */}
        {report.specialConsultations?.length > 0 && (
          <ReportCard title="Specialist Consultations" icon="👨‍⚕️">
            <ul className="space-y-1.5">
              {report.specialConsultations.map(c => (
                <li key={c} style={{ fontSize: "0.83rem", color: "var(--text-secondary)" }}>
                  <span style={{ color: "#7BA7FF" }}>→</span> {c}
                </li>
              ))}
            </ul>
          </ReportCard>
        )}

        {/* CIED Management */}
        {report.deviceManagement.applicable && (
          <ReportCard title="CIED / Device Management" icon="⚡">
            <p style={{ fontSize: "0.83rem", color: "var(--text-secondary)", lineHeight: 1.65 }}>
              {report.deviceManagement.recommendations}
            </p>
          </ReportCard>
        )}

        {/* Prehabilitation */}
        {report.prehabilitation.recommended && (
          <ReportCard title="Prehabilitation" icon="🏃">
            <div className="space-y-2">
              <p style={{ fontSize: "0.83rem", color: "var(--text-secondary)" }}>{report.prehabilitation.rationale}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {report.prehabilitation.components.map(c => (
                  <span key={c} className="badge-low">{c}</span>
                ))}
              </div>
            </div>
          </ReportCard>
        )}

        {/* Patient Counselling */}
        <ReportCard title="Patient Counselling & Shared Decision Making" icon="🤝">
          <div className="space-y-3">
            <ul className="space-y-1.5">
              {report.patientCounseling.keyPoints.map(p => (
                <li key={p} style={{ fontSize: "0.83rem", color: "var(--text-secondary)" }}>• {p}</li>
              ))}
            </ul>
            {report.patientCounseling.informedConsent && (
              <div className="p-3 rounded-lg mt-2" style={{ background: "rgba(251,191,36,0.07)", border: "1px solid rgba(251,191,36,0.2)" }}>
                <div style={{ fontSize: "0.72rem", color: "#FBBF24", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.3rem" }}>
                  Informed Consent — Key Risk
                </div>
                <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>{report.patientCounseling.informedConsent}</p>
              </div>
            )}
          </div>
        </ReportCard>

        {/* Guideline References */}
        {report.guidelineReferences?.length > 0 && (
          <ReportCard title="Guideline References" icon="📚">
            <ul className="space-y-1">
              {report.guidelineReferences.map(r => (
                <li key={r} style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                  [{report.guidelineReferences.indexOf(r) + 1}] {r}
                </li>
              ))}
            </ul>
          </ReportCard>
        )}

        {/* Disclaimer */}
        <div className="p-4 rounded-xl" style={{ background: "rgba(74,96,128,0.1)", border: "1px solid rgba(74,96,128,0.2)" }}>
          <p style={{ fontSize: "0.73rem", color: "var(--text-muted)", lineHeight: 1.6, textAlign: "center" }}>
            ⚕️ {report.disclaimer}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 pb-8">
          <button onClick={onNewAssessment}
            className="px-6 py-3 rounded-xl text-sm font-medium transition-all"
            style={{ background: "linear-gradient(135deg, #2C7AFF, #1C3870)", color: "white", border: "1px solid rgba(44,122,255,0.4)" }}>
            New Assessment
          </button>
          <button onClick={handlePrint}
            className="px-6 py-3 rounded-xl text-sm font-medium transition-all"
            style={{ border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
            Print / Export PDF
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ScoreCard({ label, value, sub, color, bg, border, large }: {
  label: string; value: string; sub: string;
  color: string; bg: string; border: string; large?: boolean;
}) {
  return (
    <div className="card-clinical p-4 animate-fade-in" style={{ background: bg, borderColor: border }}>
      <div style={{ fontSize: "0.65rem", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: "0.4rem" }}>
        {label}
      </div>
      <div style={{
        fontFamily: "var(--font-display)",
        fontSize: large ? "1.5rem" : "1.3rem",
        fontWeight: 700,
        color,
        lineHeight: 1.1,
        marginBottom: "0.25rem"
      }}>
        {value}
      </div>
      <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", lineHeight: 1.3 }}>
        {sub?.slice(0, 50)}
      </div>
    </div>
  );
}

function ReportCard({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="card-clinical p-5 animate-fade-in">
      <div className="flex items-center gap-2 mb-4 pb-3" style={{ borderBottom: "1px solid var(--border)" }}>
        <span className="text-lg">{icon}</span>
        <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1rem", fontWeight: 600, color: "var(--text-primary)" }}>
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

function ActionBadge({ action, small }: { action: string; small?: boolean }) {
  const color = ACTION_COLORS[action] || "#4A6080";
  return (
    <span style={{
      fontFamily: "var(--font-mono)",
      fontSize: small ? "0.6rem" : "0.68rem",
      fontWeight: 600,
      color,
      background: `${color}18`,
      border: `1px solid ${color}40`,
      padding: "0.2rem 0.6rem",
      borderRadius: "4px",
      whiteSpace: "nowrap",
      flexShrink: 0,
    }}>
      {action}
    </span>
  );
}

function TestRow({ label, recommended, indication, extra }: {
  label: string; recommended: boolean; indication: string; extra?: string;
}) {
  return (
    <div className="flex gap-3 items-start py-2 border-b" style={{ borderColor: "var(--border)" }}>
      <span style={{
        fontFamily: "var(--font-mono)",
        fontSize: "0.65rem",
        fontWeight: 600,
        color: recommended ? "#2DD4BF" : "#4A6080",
        background: recommended ? "rgba(20,184,166,0.1)" : "rgba(74,96,128,0.1)",
        border: `1px solid ${recommended ? "rgba(20,184,166,0.3)" : "rgba(74,96,128,0.2)"}`,
        padding: "0.2rem 0.5rem",
        borderRadius: "4px",
        flexShrink: 0,
        marginTop: "0.1rem",
      }}>
        {recommended ? "YES" : "NO"}
      </span>
      <div>
        <div style={{ fontSize: "0.83rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.1rem" }}>{label}</div>
        <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
          {indication}
          {extra && <span style={{ color: "var(--accent-teal)", marginLeft: "0.5rem" }}>· {extra}</span>}
        </div>
      </div>
    </div>
  );
}

function MedSection({ drug, action, recommendation, holdDays, rationale, extra }: {
  drug: string; action: string; recommendation: string;
  holdDays: number | null; rationale: string; extra?: string;
}) {
  return (
    <div className="p-3 rounded-lg space-y-2" style={{ background: "rgba(10,22,40,0.5)", border: "1px solid var(--border)" }}>
      <div className="flex items-center gap-2">
        <ActionBadge action={action} />
        <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)" }}>{drug}</span>
        {holdDays !== null && holdDays !== undefined && holdDays > 0 && (
          <span style={{ fontSize: "0.72rem", color: "#FBBF24", fontFamily: "var(--font-mono)" }}>
            Hold {holdDays}d pre-op
          </span>
        )}
      </div>
      <p style={{ fontSize: "0.81rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>{recommendation}</p>
      {extra && <p style={{ fontSize: "0.78rem", color: "#7BA7FF" }}>{extra}</p>}
      <p style={{ fontSize: "0.77rem", color: "var(--text-muted)", lineHeight: 1.5 }}>{rationale}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)", flexShrink: 0, paddingTop: "0.1rem" }}>
        {label}:
      </span>
      <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>{value}</span>
    </div>
  );
}
