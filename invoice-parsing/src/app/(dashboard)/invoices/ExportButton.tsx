import React, { useState } from 'react';
import { Upload, FileText, Settings, Database, CheckCircle, XCircle, Download, Plus, Trash2, Edit2, Play, AlertCircle, Eye } from 'lucide-react';


const ExportButton = ({ results, schema }) => {
  const exportResults = (format) => {
    let content, filename, type;
    
    if (format === 'json') {
      content = JSON.stringify(results, null, 2);
      filename = 'invoice_results.json';
      type = 'application/json';
    } else if (format === 'csv') {
      const headers = schema.fields.map(f => f.name).join(',');
      const rows = results.map(r => 
        schema.fields.map(f => JSON.stringify(r.extractedData[f.name])).join(',')
      );
      content = [headers, ...rows].join('\n');
      filename = 'invoice_results.csv';
      type = 'text/csv';
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