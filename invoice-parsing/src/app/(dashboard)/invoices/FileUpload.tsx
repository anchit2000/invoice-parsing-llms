import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, Trash2, Play } from 'lucide-react';

interface FileUploadProps {
  schema: any;
  onProcess: (results: any[]) => void;
}

interface FileObject {
  file: File;
  id: number;
  name: string;
  status: string;
}

const FileUpload: React.FC<FileUploadProps> = ({ schema, onProcess }) => {
  const [files, setFiles] = useState<FileObject[]>([]);
  const [processing, setProcessing] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files).map(file => ({
      file,
      id: Date.now() + Math.random(),
      name: file.name,
      status: 'pending'
    }));
    setFiles([...files, ...newFiles]);
  };

  const removeFile = (id: number) => {
    setFiles(files.filter(f => f.id !== id));
  };

  const processFiles = async () => {
    if (files.length === 0) return;
    setProcessing(true);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null;
      const formData = new FormData();
      formData.append('schemaId', schema.id);
      files.forEach(f => formData.append('invoices', f.file));

      const res = await fetch('/api/invoices/upload', {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: formData
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Upload failed');
      }

      // Use synchronous processed results directly
      const uploaded = (data.processed || []).map((p: any) => ({
        fileId: p.invoiceId,
        fileName: p.fileName,
        extractedData: p.extractedData,
        validationResults: Object.fromEntries(
          (p.validation?.results || []).map((vr: any) => [vr.fieldName, { valid: vr.isValid, message: vr.message }])
        ),
        status: 'completed',
        timestamp: new Date().toISOString()
      }));

      setFiles(prev => prev.map(f => ({ ...f, status: 'completed' })));
      onProcess(uploaded);
    } catch (e) {
      console.error(e);
      alert((e as any).message || 'Failed to upload files');
    } finally {
      setProcessing(false);
    }
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

export default FileUpload;