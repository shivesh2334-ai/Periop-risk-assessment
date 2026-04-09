🫀**AI-Powered Perioperative Cardiac Risk Assessment Tool**

Built by [EMC Digitals (EasyMyCare)](https://emcdigitals.com) · Dr. Shivesh Kumar

---

## Overview

CardioRisk Pre-Op is a clinical-grade, AI-powered perioperative cardiac risk assessment tool designed for cardiologists, internists, and anesthesiologists. It generates comprehensive, guideline-aligned preoperative cardiac assessments through a structured 5-step clinical intake form.

### Clinical Scope

The tool generates structured reports covering:

- **Risk Stratification** — Overall MACE risk, RCRI score, surgical risk category, key risk drivers
- **Surgery Timing** — Evidence-based timing recommendations (Proceed / Defer / Cancel)
- **Additional Testing** — ECG, Echo, Stress Testing, Coronary CTA, BNP, Troponin
- **Antiplatelet Management** — Aspirin and P2Y12 hold/continue protocols, DAPT management
- **Anticoagulation Management** — Hold schedules, bridging protocols, restarting guidance
- **Medication Management** — Beta-blocker, statin, ACEi/ARB, SGLT2 inhibitor protocols
- **Perioperative Monitoring** — Troponin surveillance, ICU admission, invasive monitoring
- **CIED / Device Management** — Pacemaker and ICD perioperative protocols
- **Frailty & Prehabilitation** — Frailty-based recommendations and prehabilitation components
- **Patient Counselling** — Shared decision-making and informed consent guidance

---

## Guidelines Used

| Guideline | Year |
|-----------|------|
| AHA/ACC/ACS/ASNC/HRS/SCA/SCCT/SCMR/SVM Perioperative Cardiovascular Management | 2024 |
| ESC Guidelines on Cardiovascular Assessment for Noncardiac Surgery | 2022 |
| Canadian Cardiovascular Society Perioperative Cardiac Risk Assessment | 2017 |
| ACC/AHA Guidelines on Dual Antiplatelet Therapy | Current |
| ACC/AHA Perioperative Bridging Anticoagulation | Current |

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| AI Engine | Anthropic Claude claude-opus-4-5 API |
| Deployment | Vercel (Mumbai region - `bom1`) |
| Fonts | Playfair Display + DM Sans + JetBrains Mono |

---

## Clinical Scoring Implemented

### Revised Cardiac Risk Index (RCRI)
Automatically calculated from patient data:
- High-risk surgery (suprainguinal vascular, major open thoracic/abdominal, transplant)
- Ischemic heart disease (CAD / prior MI)
- History of heart failure
- History of cerebrovascular disease (stroke/TIA)
- Insulin-dependent diabetes or treated diabetes
- Preoperative creatinine > 2.0 mg/dL (CKD Stage ≥ 3)

**RCRI Interpretation:**
- 0: ~3.9% MACE risk
- 1: ~6% MACE risk
- 2: ~10.1% MACE risk
- ≥3: ~15% MACE risk

### Duke Activity Status Index (DASI)
Full 12-item DASI questionnaire with weighted scoring:
- Score > 34: Adequate functional capacity (≥4 METs) → May proceed
- Score 25–34: Borderline → Biomarker testing recommended
- Score < 25: Poor functional capacity → Full risk stratification required

---

## Getting Started

### Prerequisites
- Node.js 18+
- Anthropic API key ([console.anthropic.com](https://console.anthropic.com))

### Local Setup

```bash
# Clone the repository
git clone https://github.com/shivesh2334-ai/periop-cardiac-risk.git
cd periop-cardiac-risk

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local and add your ANTHROPIC_API_KEY

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deployment to Vercel

### Option A: Vercel Dashboard (Recommended for iPad)
1. Push to GitHub: `github.com/shivesh2334-ai/periop-cardiac-risk`
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your repository
4. Add environment variable: `ANTHROPIC_API_KEY` = your key
5. Deploy → Mumbai region (`bom1`) is pre-configured in `vercel.json`

### Option B: Vercel CLI
```bash
npm i -g vercel
vercel --prod
```

---

## Project Structure

```
periop-cardiac-risk/
├── app/
│   ├── api/
│   │   └── assess/
│   │       └── route.ts          # Claude API endpoint (streaming)
│   ├── globals.css               # Design system + custom CSS
│   ├── layout.tsx                # Root layout with metadata
│   └── page.tsx                  # Landing page + navigation
├── components/
│   ├── AssessmentForm.tsx        # 5-step clinical intake form
│   └── ReportView.tsx            # Structured report display
├── lib/
│   └── types.ts                  # Types, DASI/RCRI calculations
├── vercel.json                   # Vercel config (Mumbai/bom1 region)
├── next.config.js
├── tailwind.config.js
└── tsconfig.json
```

---

## Clinical Disclaimer

> ⚕️ **This tool is intended as clinical decision support only.** It does not replace the clinical judgment of qualified physicians. All recommendations must be verified against current guidelines and individualized based on direct patient evaluation, local institutional protocols, and the treating clinician's expertise.
>
> This tool is designed for use by licensed healthcare professionals only.

---

## About EMC Digitals

EMC Digitals is the healthcare technology arm of EasyMyCare (EMC), building AI-powered clinical and administrative tools for Indian and subcontinent hospital markets.

**Built with ❤️ in Dwarka, Delhi**

---

## License

MIT License — Free for clinical use. Attribution appreciated.
