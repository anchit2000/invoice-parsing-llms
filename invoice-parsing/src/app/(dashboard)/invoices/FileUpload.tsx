import React, { useState } from 'react';
import { Upload, FileText, Settings, Database, CheckCircle, XCircle, Download, Plus, Trash2, Edit2, Play, AlertCircle, Eye } from 'lucide-react';


const FileUpload = ({ schema, onProcess }) => {
  const [files, setFiles] = useState([]);
  const [processing, setProcessing] = useState(false);

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files).map(file => ({
      file,
      id: Date.now() + Math.random(),
      name: file.name,
      status: 'pending'
    }));
    setFiles([...files, ...newFiles]);
  };

  const removeFile = (id) => {
    setFiles(files.filter(f => f.id !== id));
  };

  const processFiles = async () => {
    if (files.length === 0) return;
    
    setProcessing(true);
    const results = [];
    
    for (let fileObj of files) {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockResult = {
        fileId: fileObj.id,
        fileName: fileObj.name,
        extractedData: {},
        validationResults: {},
        status: 'completed',
        timestamp: new Date().toISOString()
      };

      schema.fields.forEach(field => {
        let mockValue;
        switch (field.type) {
          case 'number':
          case 'currency':
            mockValue = (Math.random() * 10000).toFixed(2);
            break;
          case 'date':
            mockValue = new Date().toISOString().split('T')[0];
            break;
          case 'email':
            mockValue = 'vendor@example.com';
            break;
          case 'array':
            mockValue = ['Item 1', 'Item 2', 'Item 3'];
            break;
          default:
            mockValue = `Sample ${field.name.replace(/_/g, ' ')}`;
        }
        
        mockResult.extractedData[field.name] = mockValue;
        
        if (field.validation) {
          const isValid = Math.random() > 0.2;
          mockResult.validationResults[field.name] = {
            valid: isValid,
            message: isValid ? 'Validation passed' : 'Validation failed'
          };
        } else {
          mockResult.validationResults[field.name] = {
            valid: true,
            message: 'No validation defined'
          };
        }
      });

      results.push(mockResult);
      setFiles(prev => prev.map(f => 
        f.id === fileObj.id ? { ...f, status: 'completed' } : f
      ));
    }
    
    setProcessing(false);
    onProcess(results);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Upload Invoices</h2>
      
      <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-indigo-500 transition-colors bg-gray-50">
        <Upload className="mx-auto text-gray-400 mb-4" size={48} />
        <label className="cursor-pointer">
          <span className="text-indigo-600 hover:text-indigo-700 font-semibold">
            Click to upload
          </span>
          <span className="text-gray-600"> or drag and drop</span>
          <input
            type="file"
            multiple
            accept=".pdf"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
        <p className="text-sm text-gray-500 mt-2">PDF files only, up to 10MB each</p>
      </div>

      {files.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-700">Uploaded Files ({files.length})</h3>
          {files.map(fileObj => (
            <div key={fileObj.id} className="flex items-center justify-between bg-white p-4 rounded-lg shadow border border-gray-200">
              <div className="flex items-center gap-3">
                <FileText className="text-indigo-600" size={24} />
                <div>
                  <p className="font-medium text-gray-800">{fileObj.name}</p>
                  <p className="text-sm text-gray-500">
                    {fileObj.status === 'pending' && 'Ready to process'}
                    {fileObj.status === 'processing' && 'Processing...'}
                    {fileObj.status === 'completed' && 'Completed'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {fileObj.status === 'completed' && (
                  <CheckCircle className="text-green-600" size={20} />
                )}
                {fileObj.status === 'pending' && (
                  <button
                    onClick={() => removeFile(fileObj.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {files.length > 0 && (
        <button
          onClick={processFiles}
          disabled={processing}
          className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Play size={20} />
          {processing ? 'Processing...' : `Process ${files.length} Invoice${files.length > 1 ? 's' : ''}`}
        </button>
      )}
    </div>
  );
};