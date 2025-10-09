import React, { useState } from 'react';
import { Upload, FileText, Settings, Database, CheckCircle, XCircle, Download, Plus, Trash2, Edit2, Play, AlertCircle, Eye } from 'lucide-react';



const ResultsViewer = ({ results, schema }) => {
  const [selectedResult, setSelectedResult] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editedData, setEditedData] = useState({});

  const startEdit = (result) => {
    setSelectedResult(result);
    setEditedData({ ...result.extractedData });
    setEditMode(true);
  };

  const saveEdit = () => {
    selectedResult.extractedData = editedData;
    setEditMode(false);
    setSelectedResult(null);
  };

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
                  <button
                    onClick={() => startEdit(result)}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Edit2 size={16} />
                    Edit
                  </button>
                </div>
              </div>
            </div>
            
            <ResultDetails 
              result={result}
              schema={schema}
              isVisible={selectedResult?.fileId === result.fileId && !editMode}
            />

            {editMode && selectedResult?.fileId === result.fileId && (
              <div className="p-4 space-y-3 bg-blue-50">
                <h4 className="font-semibold text-gray-800 mb-3">Edit Extracted Data</h4>
                {schema.fields.map(field => (
                  <div key={field.name}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {field.name}
                    </label>
                    <input
                      type="text"
                      value={editedData[field.name] || ''}
                      onChange={(e) => setEditedData({ ...editedData, [field.name]: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                ))}
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={saveEdit}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => {
                      setEditMode(false);
                      setSelectedResult(null);
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};