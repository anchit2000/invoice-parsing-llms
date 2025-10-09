import React, { useState } from 'react';
import { FileText, Eye, Edit2 } from 'lucide-react';
import ExportButton from './ExportButton';

interface ResultsViewerProps {
  results: any[];
  schema: any;
}

const ResultsViewer: React.FC<ResultsViewerProps> = ({ results, schema }) => {
  const [selectedResult, setSelectedResult] = useState<any>(null);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Extraction Results</h2>
        <ExportButton results={results} schema={schema} />
      </div>

      <div className="grid gap-4">
        {results.map((result) => (
          <div key={result.fileId} className="bg-white rounded-xl shadow-lg border border-gray-200">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <FileText className="text-indigo-600" size={24} />
                  <div>
                    <h3 className="font-semibold text-gray-800">{result.fileName}</h3>
                    <p className="text-sm text-gray-500">{new Date(result.timestamp).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedResult(selectedResult?.fileId === result.fileId ? null : result)}
                    className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    <Eye size={16} />
                    {selectedResult?.fileId === result.fileId ? 'Hide' : 'View'}
                  </button>
                </div>
              </div>
            </div>
            
            {selectedResult?.fileId === result.fileId && (
              <div className="p-4">
                <h4 className="font-semibold text-gray-800 mb-3">Extracted Data</h4>
                <div className="grid gap-2">
                  {Object.entries(result.extractedData).map(([key, value]) => (
                    <div key={key} className="flex justify-between py-2 border-b border-gray-100">
                      <span className="font-medium text-gray-600">{key}:</span>
                      <span className="text-gray-800">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResultsViewer;