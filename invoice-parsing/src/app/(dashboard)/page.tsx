'use client'

import React, { useState } from 'react';
import ProgressSteps from './invoices/ProgressSteps';
import SchemaBuilder from './schemas/SchemaBuilder';
import FileUpload from './invoices/FileUpload';
import ResultsViewer from './invoices/ResultsViewer';

export default function DashboardPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [schema, setSchema] = useState<any | null>(null);
  const [results, setResults] = useState<any[]>([]);

  const steps = [
    { num: 1, name: 'Define Schema', icon: () => <span className="font-bold">1</span> },
    { num: 2, name: 'Upload Files', icon: () => <span className="font-bold">2</span> },
    { num: 3, name: 'View Results', icon: () => <span className="font-bold">3</span> },
  ];

  const handleSchemaSave = (savedSchema: any) => {
    setSchema(savedSchema);
    setCurrentStep(2);
  };

  const handleProcess = (processedResults: any[]) => {
    setResults(processedResults);
    setCurrentStep(3);
  };

  const resetFlow = () => {
    setCurrentStep(1);
    setSchema(null);
    setResults([]);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Invoice Parsing</h1>
          <p className="text-gray-600">Define a schema, upload invoices, and review results</p>
        </div>

        <ProgressSteps currentStep={currentStep} steps={steps as any} />

        <div className="bg-white rounded-2xl shadow p-6">
          {currentStep === 1 && (
            <SchemaBuilder onSave={handleSchemaSave} />
          )}

          {currentStep === 2 && schema && (
            <FileUpload schema={schema} onProcess={handleProcess} />
          )}

          {currentStep === 3 && results.length > 0 && (
            <ResultsViewer results={results} schema={schema} />
          )}
        </div>

        {currentStep > 1 && (
          <div className="text-center mt-6">
            <button
              onClick={resetFlow}
              className="px-6 py-2 text-indigo-600 hover:text-indigo-700 font-medium"
            >
              ← Start Over
            </button>
          </div>
        )}
      </div>
    </div>
  );
}