import React from 'react';

interface ResultDetailsProps {
  result: any;
  schema: any;
  isVisible: boolean;
}

const ResultDetails: React.FC<ResultDetailsProps> = ({ result, schema, isVisible }) => {
  if (!isVisible) return null;

  return (
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
  );
};

export default ResultDetails;