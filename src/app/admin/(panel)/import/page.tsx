'use client';

import { useState, useRef } from 'react';
import { Upload, Download, FileSpreadsheet, CheckCircle, AlertCircle } from 'lucide-react';

interface ImportResult {
  success: boolean;
  message: string;
  details?: {
    campsCreated: number;
    childrenCreated: number;
    errors: string[];
  };
}

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/admin/import', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      setResult(data);
      if (data.success) {
        setFile(null);
        if (fileRef.current) fileRef.current.value = '';
      }
    } catch {
      setResult({ success: false, message: 'Upload failed. Please try again.' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#003439]">Import Data</h1>
        <p className="text-sm text-[#05575c]/60 mt-1">
          Upload a filled Excel template to import camp data
        </p>
      </div>

      {/* Step 1: Download Template */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-4">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#003439] text-white flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold">1</span>
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-bold text-[#003439] mb-1">Download Template</h2>
            <p className="text-sm text-[#05575c]/60 mb-3">
              Download the Excel template, fill it in with your camp data, then upload it below.
            </p>
            <a
              href="/api/admin/template"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#003439] text-white text-sm font-medium rounded-xl hover:bg-[#004a50] transition-colors"
            >
              <Download size={16} />
              Download Template
            </a>
          </div>
        </div>
      </div>

      {/* Step 2: Upload */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-4">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#003439] text-white flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold">2</span>
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-bold text-[#003439] mb-1">Upload Filled Template</h2>
            <p className="text-sm text-[#05575c]/60 mb-3">
              Upload your completed Excel file. The system will create camps, groups, and children automatically.
            </p>

            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                file ? 'border-[#00adb3] bg-[#00adb3]/5' : 'border-gray-200 hover:border-gray-300'
              }`}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const droppedFile = e.dataTransfer.files[0];
                if (droppedFile && (droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.xls'))) {
                  setFile(droppedFile);
                  setResult(null);
                }
              }}
            >
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <FileSpreadsheet size={24} className="text-[#00adb3]" />
                  <div className="text-left">
                    <p className="text-sm font-semibold text-[#003439]">{file.name}</p>
                    <p className="text-xs text-[#05575c]/50">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button
                    onClick={() => { setFile(null); if (fileRef.current) fileRef.current.value = ''; }}
                    className="text-xs text-red-500 hover:text-red-700 ml-4"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <>
                  <Upload size={32} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-sm text-[#05575c]/60 mb-2">
                    Drag and drop your Excel file here, or
                  </p>
                  <label className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-[#003439] text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors cursor-pointer">
                    Browse Files
                    <input
                      ref={fileRef}
                      type="file"
                      accept=".xlsx,.xls"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) { setFile(f); setResult(null); }
                      }}
                    />
                  </label>
                </>
              )}
            </div>

            {file && (
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="mt-4 flex items-center gap-2 px-6 py-2.5 bg-[#00adb3] text-white text-sm font-semibold rounded-xl hover:bg-[#009da3] transition-colors disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload size={16} />
                    Import Data
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Result */}
      {result && (
        <div className={`rounded-xl border p-5 ${
          result.success
            ? 'bg-emerald-50 border-emerald-200'
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-start gap-3">
            {result.success ? (
              <CheckCircle size={20} className="text-emerald-600 mt-0.5" />
            ) : (
              <AlertCircle size={20} className="text-red-600 mt-0.5" />
            )}
            <div>
              <p className={`text-sm font-semibold ${result.success ? 'text-emerald-800' : 'text-red-800'}`}>
                {result.message}
              </p>
              {result.details && (
                <div className="mt-2 text-sm">
                  {result.details.campsCreated > 0 && (
                    <p className="text-emerald-700">Camps created: {result.details.campsCreated}</p>
                  )}
                  {result.details.childrenCreated > 0 && (
                    <p className="text-emerald-700">Children imported: {result.details.childrenCreated}</p>
                  )}
                  {result.details.errors.length > 0 && (
                    <div className="mt-2">
                      <p className="text-red-700 font-medium">Errors:</p>
                      <ul className="list-disc list-inside text-red-600 text-xs mt-1">
                        {result.details.errors.map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
