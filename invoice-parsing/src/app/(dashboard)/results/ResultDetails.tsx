import React, { useState } from 'react';
import { Upload, FileText, Settings, Database, CheckCircle, XCircle, Download, Plus, Trash2, Edit2, Play, AlertCircle, Eye } from 'lucide-react';


const ResultDetails = ({ result, schema, isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className="p-4 space-y-3">
      {schema.fields.map(field => {
        const value = result.extractedData[field.name];
        const validation = result.validationResults[field.name];
        
        return (
          <div key={field.name} className="border-l-4 pl-4 py-2" style={{
            borderColor: validation?.valid ? '#10b981' : '#ef4444'
          }}>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-700">{field.name}</span>
                  <span className="text-xs text-gray-500">({field.type})</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {Array.isArray(value) ? value.join(', ') : String(value)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {validation?.valid ? (
                  <CheckCircle className="text-green-600" size={20} />
                ) : (
                  <XCircle className="text-red-600" size={20} />
                )}
              </div>
            </div>
            {!validation?.valid && validation?.message && (
              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle size={12} />
                {validation.message}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
};