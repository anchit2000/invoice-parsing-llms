import React, { useState } from 'react';
import { Upload, FileText, Settings, Database, CheckCircle, XCircle, Download, Plus, Trash2, Edit2, Play, AlertCircle, Eye } from 'lucide-react';


const SchemaList = ({ fields, onEdit, onDelete }) => {
  return (
    <div className="space-y-3">
      {fields.map((field, idx) => (
        <div key={field.id} className="bg-white p-4 rounded-lg shadow border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-gray-800">{field.name}</h4>
                <span className="px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded">
                  {field.type}
                </span>
                {field.required && (
                  <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded">
                    Required
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 mt-1">{field.description}</p>
              {field.validation && (
                <code className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded mt-2 block">
                  {field.validation}
                </code>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onEdit(idx)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded"
              >
                <Edit2 size={16} />
              </button>
              <button
                onClick={() => onDelete(idx)}
                className="p-2 text-red-600 hover:bg-red-50 rounded"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
