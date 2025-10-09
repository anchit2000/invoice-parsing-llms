import React, { useState } from 'react';
import { Upload, FileText, Settings, Database, CheckCircle, XCircle, Download, Plus, Trash2, Edit2, Play, AlertCircle, Eye } from 'lucide-react';


const InvoiceParserApp = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [schema, setSchema] = useState(null);
  const [results, setResults] = useState([]);

  const steps = [
    { num: 1, name: 'Define Schema', icon: Settings },
    { num: 2, name: 'Upload Files', icon: Upload },
    { num: 3, name: 'View Results', icon: Database }
  ];

  const handleSchemaSave = (savedSchema) => {
    setSchema(savedSchema);
    setCurrentStep(2);
  };

  const handleProcess = (processedResults) => {
    setResults(processedResults);
    setCurrentStep(3);
  };

  const resetApp = () => {
    setCurrentStep(1);
    setSchema(null);
    setResults([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">AI Invoice Parser</h1>
          <p className="text-gray-600">Configure, Extract, and Validate Invoice Data with LLMs</p>
        </div>

        <ProgressSteps currentStep={currentStep} steps={steps} />

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {currentStep === 1 && <SchemaBuilder onSave={handleSchemaSave} />}
          {currentStep === 2 && schema && <FileUpload schema={schema} onProcess={handleProcess} />}
          {currentStep === 3 && results.length > 0 && <ResultsViewer results={results} schema={schema} />}
        </div>

        {currentStep > 1 && (
          <div className="text-center mt-6">
            <button
              onClick={resetApp}
              className="px-6 py-2 text-indigo-600 hover:text-indigo-700 font-medium"
            >
              ← Start Over
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoiceParserApp;