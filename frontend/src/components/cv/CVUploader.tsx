import { useState, useRef } from 'react';
import type { DragEvent, ChangeEvent } from 'react';
import { UploadCloud, FileText, X, ChevronDown, CheckCircle2, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { saveAnonToken } from '../../services/anonymousAnalysis';

// Domain values are always sent to the backend in English - do not change these
const DOMAIN_VALUES = [
  { value: 'Software Engineering', key: 'softwareEng', emoji: '💻' },
  { value: 'Data & Analytics', key: 'dataAnalytics', emoji: '📊' },
  { value: 'Industrial Engineering', key: 'industrialEng', emoji: '🏭' },
  { value: 'Mechanical Engineering', key: 'mechanicalEng', emoji: '⚙️' },
  { value: 'Electrical Engineering', key: 'electricalEng', emoji: '⚡' },
  { value: 'Civil Engineering', key: 'civilEng', emoji: '🏗️' },
  { value: 'Business & Management', key: 'business', emoji: '📈' },
  { value: 'Marketing & Communications', key: 'marketing', emoji: '📣' },
  { value: 'Finance & Accounting', key: 'finance', emoji: '💰' },
  { value: 'Healthcare & Biomedical', key: 'healthcare', emoji: '🏥' },
  { value: 'Environmental & Energy', key: 'environmental', emoji: '🌱' },
  { value: 'Cybersecurity', key: 'cybersecurity', emoji: '🔒' },
  { value: 'UX / UI Design', key: 'uxui', emoji: '🎨' },
  { value: 'Other', key: 'other', emoji: '✨' },
];

interface CVUploaderProps {
  onUploadSuccess: (idOrToken: string) => void;
  /** When true, suppresses the outer card wrapper so the parent controls padding/bg */
  embedded?: boolean;
  /** When true, uploads via the public /try flow (no auth) and returns a session token. */
  anonymous?: boolean;
}

export function CVUploader({ onUploadSuccess, embedded = false, anonymous = false }: CVUploaderProps) {
  const { t } = useTranslation();
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState('Other');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (f: File): boolean => {
    if (f.type !== 'application/pdf') {
      toast.error(t('uploader.errorPdfOnly'));
      return false;
    }
    if (f.size > 5 * 1024 * 1024) {
      toast.error(t('uploader.errorTooLarge'));
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
      const endpoint = anonymous ? '/public/analyze' : '/cvs/upload';
      const response = await api.post(endpoint, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success(t('uploader.successUpload'));
      if (anonymous) {
        saveAnonToken(response.data.token);
        onUploadSuccess(response.data.token);
      } else {
        onUploadSuccess(response.data.id);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.detail || error.response?.data?.message || t('uploader.errorUpload'));
    } finally {
      setIsUploading(false);
    }
  };

  const selectedDomainObj = DOMAIN_VALUES.find(d => d.value === selectedDomain);

  return (
    <div className={embedded ? 'w-full' : 'w-full surface rounded-2xl p-6 border border-[#EAEAEA] dark:border-white/[0.07]'}>

      {/* Step indicator */}
      <div className="flex items-center gap-0 mb-6">
        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black transition-colors ${file ? 'bg-[#346538] text-white' : 'bg-[#EEF2F8] text-[#1B3A6B] border border-[#1B3A6B]/20'}`}>
            {file ? <CheckCircle2 className="w-3.5 h-3.5" /> : '1'}
          </div>
          <span className="text-xs font-semibold text-[#787774]">{t('uploader.step1')}</span>
        </div>
        <div className={`flex-1 h-px mx-3 transition-colors ${file ? 'bg-[#346538]/30' : 'bg-[#EAEAEA]'}`} />
        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black transition-colors ${selectedDomain ? 'bg-[#EEF2F8] text-[#1B3A6B] border border-[#1B3A6B]/20' : 'bg-[#F7F6F3] dark:bg-white/[0.05] text-[#787774]'}`}>
            2
          </div>
          <span className="text-xs font-semibold text-[#787774]">{t('uploader.step2')}</span>
        </div>
        <div className={`flex-1 h-px mx-3 transition-colors ${isUploading ? 'bg-[#1B3A6B]/30' : 'bg-[#EAEAEA]'}`} />
        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black transition-colors ${isUploading ? 'bg-[#1B3A6B] text-white' : 'bg-[#F7F6F3] dark:bg-white/[0.05] text-[#787774]'}`}>
            3
          </div>
          <span className="text-xs font-semibold text-[#787774]">{t('uploader.step3')}</span>
        </div>
      </div>

      {/* Domain selector */}
      <div className="mb-5">
        <label className="block text-xs font-bold text-[#787774] uppercase tracking-widest mb-2">
          {t('uploader.domainLabel')}
        </label>
        <div className="relative">
          <select
            value={selectedDomain}
            onChange={(e) => setSelectedDomain(e.target.value)}
            className="w-full appearance-none px-4 py-3 pr-10 rounded-xl bg-white dark:bg-[#1c1c1a] border border-[#EAEAEA] dark:border-white/[0.07] text-[#111111] dark:text-[#e8e7e4] font-medium cursor-pointer transition-all hover:border-[#1B3A6B]/40 focus:outline-none focus:border-[#1B3A6B] focus:ring-2 focus:ring-[#EEF2F8] dark:focus:ring-[#4a7dd1]/20"
          >
            {DOMAIN_VALUES.map((d) => (
              <option key={d.value} value={d.value}>
                {d.emoji} {t(`uploader.domains.${d.key}`)}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#787774] pointer-events-none" />
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
              ? 'border-[#1B3A6B] bg-[#EEF2F8] dark:bg-[#1B3A6B]/10 shadow-[0_0_30px_rgba(27,58,107,0.08)]'
              : 'border-[#EAEAEA] dark:border-white/[0.07] hover:border-[#1B3A6B]/40 hover:bg-[#F7F6F3] dark:hover:bg-white/[0.04]'
          }`}
        >
          <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept=".pdf" className="hidden" />

          <div className={`p-4 rounded-2xl mb-4 transition-all duration-300 ${isDragging ? 'bg-[#EEF2F8] dark:bg-[#1B3A6B]/20 text-[#1B3A6B] scale-110' : 'bg-[#F7F6F3] dark:bg-white/[0.05] text-[#787774] dark:text-[#908d89] group-hover:bg-[#EAEAEA] dark:group-hover:bg-white/[0.08] group-hover:text-[#111111] dark:group-hover:text-[#e8e7e4]'}`}>
            <UploadCloud className="w-8 h-8" />
          </div>

          <h3 className="text-base font-bold text-[#111111] dark:text-[#e8e7e4] mb-1">
            {isDragging ? t('uploader.dropActive') : t('uploader.dropHeading')}
          </h3>
          <p className="text-sm text-[#787774] dark:text-[#908d89] mb-5">
            {t('uploader.dropSubtext')}{' '}
            <span className="text-[#1B3A6B] dark:text-[#4a7dd1] font-semibold">{t('uploader.dropBrowse')}</span>
          </p>

          <div className="flex gap-2">
            {[t('uploader.pdfLabel'), t('uploader.maxSize')].map(label => (
              <span key={label} className="px-2.5 py-1 rounded-lg bg-[#F7F6F3] dark:bg-white/[0.05] border border-[#EAEAEA] dark:border-white/[0.07] text-[#787774] text-[10px] font-semibold uppercase tracking-wider">
                {label}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4 animate-in scale-in">
          {/* File preview */}
          <div className="flex items-center gap-3 p-4 bg-[#F7F6F3] dark:bg-[#1c1c1a] rounded-xl border border-[#346538]/20 dark:border-[#346538]/30">
            <div className="p-2.5 bg-[#EDF3EC] text-[#346538] rounded-lg flex-shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[#111111] dark:text-[#e8e7e4] font-semibold text-sm truncate">{file.name}</p>
              <p className="text-[#787774] dark:text-[#908d89] text-xs mt-0.5">
                {(file.size / 1024 / 1024).toFixed(2)} MB · PDF Document
              </p>
            </div>
            <CheckCircle2 className="w-5 h-5 text-[#346538] flex-shrink-0" />
            {!isUploading && (
              <button
                onClick={() => setFile(null)}
                className="p-1.5 text-[#787774] hover:text-[#111111] hover:bg-[#EAEAEA] rounded-lg transition-colors ml-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Selected domain badge */}
          <div className="flex items-center gap-2 px-3 py-2 bg-[#EEF2F8] dark:bg-[#1B3A6B]/20 rounded-xl border border-[#1B3A6B]/15 dark:border-[#1B3A6B]/30">
            <span className="text-lg">{selectedDomainObj?.emoji}</span>
            <div>
              <p className="text-[10px] text-[#787774] dark:text-[#908d89] uppercase font-bold tracking-wider">{t('uploader.targetDomain')}</p>
              <p className="text-sm text-[#1B3A6B] dark:text-[#4a7dd1] font-semibold">
                {selectedDomainObj ? t(`uploader.domains.${selectedDomainObj.key}`) : selectedDomain}
              </p>
            </div>
          </div>

          {/* Upload button */}
          <button
            onClick={triggerUpload}
            disabled={isUploading}
            className="w-full h-12 rounded-xl font-bold text-sm bg-[#111111] text-white hover:bg-[#2a2a2a] active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
          >
            {isUploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {t('uploader.uploadingButton')}
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                {t('uploader.analyzeButton')}
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
