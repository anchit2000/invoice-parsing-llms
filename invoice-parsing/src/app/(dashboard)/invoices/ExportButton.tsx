import React, { useState } from 'react';
import { Download } from 'lucide-react';

interface ExportButtonProps {
  results: any[];
  schema: any;
}

const ExportButton: React.FC<ExportButtonProps> = ({ results, schema }) => {
  const exportResults = (format: string) => {
    let content: string, filename: string, type: string;
    
    if (format === 'json') {
      content = JSON.stringify(results, null, 2);
      filename = 'invoice_results.json';
      type = 'application/json';
    } else if (format === 'csv') {
      const headers = schema.fields.map((f: any) => f.name).join(',');
      const rows = results.map((r: any) => 
        schema.fields.map((f: any) => JSON.stringify(r.extractedData[f.name])).join(',')
      );
      content = [headers, ...rows].join('\n');
      filename = 'invoice_results.csv';
      type = 'text/csv';
    } else {
      return;
    }
    
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={() => exportResults('json')}
        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        <Download size={18} />
        JSON
      </button>
      <button
        onClick={() => exportResults('csv')}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        <Download size={18} />
        CSV
      </button>
    </div>
  );
};

export default ExportButton;