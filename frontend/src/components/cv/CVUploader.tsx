import { useState, useRef } from 'react';
import type { DragEvent, ChangeEvent } from 'react';
import { UploadCloud, FileText, X, ChevronDown, CheckCircle2, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const DOMAINS = [
  { value: 'Software Engineering', label: 'Software Engineering', emoji: '💻' },
  { value: 'Data & Analytics', label: 'Data & Analytics', emoji: '📊' },
  { value: 'Industrial Engineering', label: 'Industrial Engineering', emoji: '🏭' },
  { value: 'Mechanical Engineering', label: 'Mechanical Engineering', emoji: '⚙️' },
  { value: 'Electrical Engineering', label: 'Electrical Engineering', emoji: '⚡' },
  { value: 'Civil Engineering', label: 'Civil Engineering', emoji: '🏗️' },
  { value: 'Business & Management', label: 'Business & Management', emoji: '📈' },
  { value: 'Marketing & Communications', label: 'Marketing & Communications', emoji: '📣' },
  { value: 'Finance & Accounting', label: 'Finance & Accounting', emoji: '💰' },
  { value: 'Healthcare & Biomedical', label: 'Healthcare & Biomedical', emoji: '🏥' },
  { value: 'Environmental & Energy', label: 'Environmental & Energy', emoji: '🌱' },
  { value: 'Cybersecurity', label: 'Cybersecurity', emoji: '🔒' },
  { value: 'UX / UI Design', label: 'UX / UI Design', emoji: '🎨' },
  { value: 'Other', label: 'Other (AI Auto-Detect)', emoji: '✨' },
];

interface CVUploaderProps {
  onUploadSuccess: (cvId: number) => void;
}

export function CVUploader({ onUploadSuccess }: CVUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState(DOMAINS[0].value);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (f: File): boolean => {
    if (!['application/pdf', 'text/plain'].includes(f.type)) {
      toast.error('Only PDF and TXT files are supported.');
      return false;
    }
    if (f.size > 5 * 1024 * 1024) {
      toast.error('File is too large. Maximum 5MB.');
      return false;
    }
    return true;
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(false); };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped && validateFile(dropped)) setFile(dropped);
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected && validateFile(selected)) setFile(selected);
  };

  const triggerUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('target_domain', selectedDomain);
    try {
      const response = await api.post('/cvs/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('CV uploaded! AI is analyzing...');
      onUploadSuccess(response.data.id);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const selectedDomainObj = DOMAINS.find(d => d.value === selectedDomain);

  return (
    <div className="w-full glass-card rounded-2xl p-6 border border-white/5">

      {/* Step indicator */}
      <div className="flex items-center gap-0 mb-6">
        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black transition-colors ${file ? 'bg-emerald-500 text-white' : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'}`}>
            {file ? <CheckCircle2 className="w-3.5 h-3.5" /> : '1'}
          </div>
          <span className="text-xs font-semibold text-zinc-400">Upload File</span>
        </div>
        <div className={`flex-1 h-px mx-3 transition-colors ${file ? 'bg-emerald-500/30' : 'bg-zinc-800'}`} />
        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black transition-colors ${selectedDomain ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-zinc-800 text-zinc-600'}`}>
            2
          </div>
          <span className="text-xs font-semibold text-zinc-400">Select Domain</span>
        </div>
        <div className={`flex-1 h-px mx-3 transition-colors ${isUploading ? 'bg-indigo-500/30' : 'bg-zinc-800'}`} />
        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black transition-colors ${isUploading ? 'bg-indigo-500 text-white' : 'bg-zinc-800 text-zinc-600'}`}>
            3
          </div>
          <span className="text-xs font-semibold text-zinc-400">Analyze</span>
        </div>
      </div>

      {/* Domain selector */}
      <div className="mb-5">
        <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">
          Target Industry Domain
        </label>
        <div className="relative">
          <select
            value={selectedDomain}
            onChange={(e) => setSelectedDomain(e.target.value)}
            className="w-full appearance-none px-4 py-3 pr-10 rounded-xl bg-[rgba(15,15,24,0.8)] border border-[var(--color-card-border)] text-white font-medium cursor-pointer transition-all hover:border-indigo-500/40 focus:outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/15"
          >
            {DOMAINS.map((d) => (
              <option key={d.value} value={d.value}>{d.emoji} {d.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
        </div>
      </div>

      {/* Upload zone */}
      {!file ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center min-h-[220px] group ${
            isDragging
              ? 'border-indigo-500 bg-indigo-500/5 shadow-[0_0_30px_rgba(99,102,241,0.1)]'
              : 'border-zinc-800 hover:border-zinc-700 hover:bg-white/[0.01]'
          }`}
        >
          <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept=".pdf,.txt" className="hidden" />

          <div className={`p-4 rounded-2xl mb-4 transition-all duration-300 ${isDragging ? 'bg-indigo-500/15 text-indigo-400 scale-110' : 'bg-zinc-900 text-zinc-500 group-hover:bg-zinc-800 group-hover:text-zinc-400'}`}>
            <UploadCloud className="w-8 h-8" />
          </div>

          <h3 className="text-base font-bold text-white mb-1">
            {isDragging ? 'Drop to upload' : 'Upload your CV'}
          </h3>
          <p className="text-sm text-zinc-500 mb-5">
            Drag & drop or <span className="text-indigo-400 font-semibold">browse files</span>
          </p>

          <div className="flex gap-2">
            {['PDF', 'TXT', 'Max 5MB'].map(label => (
              <span key={label} className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-500 text-[10px] font-semibold uppercase tracking-wider">
                {label}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4 animate-in scale-in">
          {/* File preview */}
          <div className="flex items-center gap-3 p-4 bg-zinc-900/80 rounded-xl border border-emerald-500/20">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-lg flex-shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm truncate">{file.name}</p>
              <p className="text-zinc-500 text-xs mt-0.5">
                {(file.size / 1024 / 1024).toFixed(2)} MB · {file.type.includes('pdf') ? 'PDF Document' : 'Text File'}
              </p>
            </div>
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            {!isUploading && (
              <button
                onClick={() => setFile(null)}
                className="p-1.5 text-zinc-600 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors ml-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Selected domain badge */}
          <div className="flex items-center gap-2 px-3 py-2 bg-indigo-500/5 rounded-xl border border-indigo-500/15">
            <span className="text-lg">{selectedDomainObj?.emoji}</span>
            <div>
              <p className="text-[10px] text-zinc-600 uppercase font-bold tracking-wider">Target Domain</p>
              <p className="text-sm text-indigo-300 font-semibold">{selectedDomainObj?.label}</p>
            </div>
          </div>

          {/* Upload button */}
          <button
            onClick={triggerUpload}
            disabled={isUploading}
            className="w-full h-12 rounded-xl font-bold text-sm bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
          >
            {isUploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Uploading & Preparing AI...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Run AI Analysis Engine
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
