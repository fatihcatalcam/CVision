import { useState, useRef } from 'react';
import type { DragEvent, ChangeEvent } from 'react';
import { UploadCloud, FileText, X, ChevronDown, CheckCircle2, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { saveAnonToken } from '../../services/anonymousAnalysis';
import { ANALYSIS_COST, UNLOCK_COST } from '../../constants/credits';

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
  { value: 'Media & Creative', key: 'media', emoji: '🎬' },
  { value: 'Journalism & Broadcasting', key: 'journalism', emoji: '📰' },
  { value: 'Legal', key: 'legal', emoji: '⚖️' },
  { value: 'Education', key: 'education', emoji: '🎓' },
  { value: 'Healthcare & Clinical', key: 'clinical', emoji: '🩺' },
  { value: 'Sales & Business Development', key: 'sales', emoji: '🤝' },
  { value: 'Hospitality & Tourism', key: 'hospitality', emoji: '🏨' },
  { value: 'Retail & Customer Service', key: 'retail', emoji: '🛍️' },
  { value: 'Architecture & Design', key: 'architecture', emoji: '📐' },
  { value: 'Skilled Trades & Technical', key: 'trades', emoji: '🔧' },
  { value: 'Public Sector & NGO', key: 'publicSector', emoji: '🏛️' },
  { value: 'Other', key: 'other', emoji: '✨' },
];

interface CVUploaderProps {
  onUploadSuccess: (idOrToken: string) => void;
  /** When true, suppresses the outer card wrapper so the parent controls padding/bg */
  embedded?: boolean;
  /** When true, uploads via the public /try flow (no auth) and returns a session token. */
  anonymous?: boolean;
  /**
   * The anonymous daily allowance is used up (HTTP 429).
   *
   * Only the /try flow can hit this, and the toast alone left the visitor on a
   * page whose one button would keep failing. The caller decides where they go
   * next - which for /try is the signup that removes the limit.
   */
  onLimitReached?: () => void;
}

export function CVUploader({
  onUploadSuccess, embedded = false, anonymous = false, onLimitReached,
}: CVUploaderProps) {
  const { t, i18n } = useTranslation();
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState('Other');
  // Normal buys the analysis; Pro buys it with the full report already open.
  // Both routes exist because the report can also be unlocked afterwards - this
  // is the same 3 credits, just decided up front by someone who already knows
  // they want the whole thing.
  //
  // Pro is preselected. Normal was the default and almost nobody moved off it,
  // then unlocked the report afterwards anyway - the same 3 credits spent in
  // two steps, with a locked page in between. A default that charges more has
  // to be honest about it, so the price sits on the card AND on the button
  // ("Analyse my CV - 3 credits"), and switching back is one click.
  const [tier, setTier] = useState<'normal' | 'pro'>('pro');
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
    // Localizes the rule-based suggestions to the language the user is viewing
    // the site in. i18n.language can carry a region (e.g. "en-US"); the backend
    // only knows the base code, and unknown values fall back to English there.
    formData.append('ui_language', i18n.language.split('-')[0]);
    if (!anonymous) formData.append('tier', tier);
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
      // Anonymous daily limit reached. Saying so and leaving the visitor on a
      // page whose only button now fails is a dead end; the toast survives the
      // navigation (Toaster lives at the app root), so they arrive at signup
      // still reading why.
      if (anonymous && error.response?.status === 429) {
        toast.error(t('try.rateLimited'));
        onLimitReached?.();
      } else {
        toast.error(error.response?.data?.detail || error.response?.data?.message || t('uploader.errorUpload'));
      }
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
          <span className="text-xs font-semibold text-[#6B6A65]">{t('uploader.step1')}</span>
        </div>
        <div className={`flex-1 h-px mx-3 transition-colors ${file ? 'bg-[#346538]/30' : 'bg-[#EAEAEA]'}`} />
        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black transition-colors ${selectedDomain ? 'bg-[#EEF2F8] text-[#1B3A6B] border border-[#1B3A6B]/20' : 'bg-[#F7F6F3] dark:bg-white/[0.05] text-[#6B6A65]'}`}>
            2
          </div>
          <span className="text-xs font-semibold text-[#6B6A65]">{t('uploader.step2')}</span>
        </div>
        <div className={`flex-1 h-px mx-3 transition-colors ${isUploading ? 'bg-[#1B3A6B]/30' : 'bg-[#EAEAEA]'}`} />
        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black transition-colors ${isUploading ? 'bg-[#1B3A6B] text-white' : 'bg-[#F7F6F3] dark:bg-white/[0.05] text-[#6B6A65]'}`}>
            3
          </div>
          <span className="text-xs font-semibold text-[#6B6A65]">{t('uploader.step3')}</span>
        </div>
      </div>

      {/* Domain selector */}
      <div className="mb-5">
        <label className="block text-xs font-bold text-[#6B6A65] uppercase tracking-widest mb-2">
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
          <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6A65] pointer-events-none" />
        </div>
      </div>

      {/* Tier choice, shown before the file is picked rather than after. The
          price is the first thing worth knowing about an analysis, and the
          version that only appeared once a file was selected read as if there
          were no choice at all. Anonymous /try has no balance to spend, so it
          never appears there. */}
      {!anonymous && (
        <div className="grid grid-cols-2 gap-2 mb-5">
          {([
            { key: 'normal' as const, cost: ANALYSIS_COST },
            { key: 'pro' as const, cost: ANALYSIS_COST + UNLOCK_COST },
          ]).map(({ key, cost }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTier(key)}
              aria-pressed={tier === key}
              className={`text-left p-3 rounded-xl border transition-all ${
                tier === key
                  ? 'border-[#111111] dark:border-[#e8e7e4] bg-[#F7F6F3] dark:bg-[#272725]'
                  : 'border-[#8A8985] dark:border-white/[0.36] hover:bg-[#F7F6F3] dark:hover:bg-[#272725]'
              }`}
            >
              <span className="flex items-center justify-between gap-2 mb-0.5">
                <span className="text-sm font-bold text-[#111111] dark:text-[#e8e7e4]">
                  {t(`uploader.tier.${key}Title`)}
                </span>
                <span className="text-xs font-mono font-bold text-[#956400] whitespace-nowrap">
                  {t('uploader.tier.cost', { cost })}
                </span>
              </span>
              <span className="block text-[11px] leading-snug text-[#6B6A65] dark:text-[#908d89]">
                {t(`uploader.tier.${key}Desc`)}
              </span>
            </button>
          ))}
        </div>
      )}

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

          <div className={`p-4 rounded-2xl mb-4 transition-all duration-300 ${isDragging ? 'bg-[#EEF2F8] dark:bg-[#1B3A6B]/20 text-[#1B3A6B] scale-110' : 'bg-[#F7F6F3] dark:bg-white/[0.05] text-[#6B6A65] dark:text-[#908d89] group-hover:bg-[#EAEAEA] dark:group-hover:bg-white/[0.08] group-hover:text-[#111111] dark:hover:text-[#e8e7e4] dark:group-hover:text-[#e8e7e4]'}`}>
            <UploadCloud className="w-8 h-8" />
          </div>

          <h3 className="text-base font-bold text-[#111111] dark:text-[#e8e7e4] mb-1">
            {isDragging ? t('uploader.dropActive') : t('uploader.dropHeading')}
          </h3>
          <p className="text-sm text-[#6B6A65] dark:text-[#908d89] mb-5">
            {t('uploader.dropSubtext')}{' '}
            <span className="text-[#1B3A6B] dark:text-[#4a7dd1] font-semibold">{t('uploader.dropBrowse')}</span>
          </p>

          <div className="flex gap-2">
            {[t('uploader.pdfLabel'), t('uploader.maxSize')].map(label => (
              <span key={label} className="px-2.5 py-1 rounded-lg bg-[#F7F6F3] dark:bg-white/[0.05] border border-[#EAEAEA] dark:border-white/[0.07] text-[#6B6A65] text-[10px] font-semibold uppercase tracking-wider">
                {label}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4 animate-in">
          {/* File preview */}
          <div className="flex items-center gap-3 p-4 bg-[#F7F6F3] dark:bg-[#1c1c1a] rounded-xl border border-[#346538]/20 dark:border-[#346538]/30">
            <div className="p-2.5 bg-[#EDF3EC] text-[#346538] rounded-lg flex-shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[#111111] dark:text-[#e8e7e4] font-semibold text-sm truncate">{file.name}</p>
              <p className="text-[#6B6A65] dark:text-[#908d89] text-xs mt-0.5">
                {(file.size / 1024 / 1024).toFixed(2)} MB · PDF Document
              </p>
            </div>
            <CheckCircle2 className="w-5 h-5 text-[#346538] flex-shrink-0" />
            {!isUploading && (
              <button
                onClick={() => setFile(null)}
                className="p-1.5 text-[#6B6A65] hover:text-[#111111] dark:hover:text-[#e8e7e4] hover:bg-[#EAEAEA] rounded-lg transition-colors ml-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Selected domain badge */}
          <div className="flex items-center gap-2 px-3 py-2 bg-[#EEF2F8] dark:bg-[#1B3A6B]/20 rounded-xl border border-[#1B3A6B]/15 dark:border-[#1B3A6B]/30">
            <span className="text-lg">{selectedDomainObj?.emoji}</span>
            <div>
              <p className="text-[10px] text-[#6B6A65] dark:text-[#908d89] uppercase font-bold tracking-wider">{t('uploader.targetDomain')}</p>
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
                {anonymous
                  ? t('uploader.analyzeButton')
                  : t('uploader.analyzeButtonCost', {
                      cost: tier === 'pro' ? ANALYSIS_COST + UNLOCK_COST : ANALYSIS_COST,
                    })}
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
