'use client';

import { useState } from 'react';
import AssessmentForm from '@/components/AssessmentForm';
import ReportView from '@/components/ReportView';
import { PatientData } from '@/lib/types';

export default function Home() {
  const [view, setView] = useState<'home' | 'form' | 'report'>('home');
  const [reportData, setReportData] = useState<{ data: PatientData; report: string } | null>(null);

  const handleStartAssessment = () => {
    setView('form');
  };

  const handleFormComplete = (data: PatientData, report: string) => {
    setReportData({ data, report });
    setView('report');
  };

  const handleBack = () => {
    setView('home');
    setReportData(null);
  };

  const handleNewAssessment = () => {
    setView('form');
    setReportData(null);
  };

  if (view === 'form') {
    return <AssessmentForm onComplete={handleFormComplete} onBack={handleBack} />;
  }

  if (view === 'report' && reportData) {
    return (
      <ReportView
        data={reportData.data}
        reportJson={reportData.report}
        onReset={handleBack}
        onNewAssessment={handleNewAssessment}
      />
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card-clinical max-w-md w-full p-8 text-center">
        <h1 className="text-3xl font-bold mb-4">Perioperative Risk Assessment</h1>
        <p className="text-gray-400 mb-6">
          AI-powered cardiac risk assessment for noncardiac surgery patients
        </p>
        <button
          onClick={handleStartAssessment}
          className="w-full px-6 py-3 rounded-lg font-medium transition-all"
          style={{
            background: 'linear-gradient(135deg, #2C7AFF, #1C3870)',
            color: 'white',
            border: '1px solid rgba(44,122,255,0.4)',
            boxShadow: '0 4px 16px rgba(44,122,255,0.2)',
          }}
        >
          Start New Assessment →
        </button>
      </div>
    </div>
  );
}