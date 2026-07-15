import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScanSearch, Check } from 'lucide-react';
import api from '../../services/api';

export interface XrayFinding {
  type: 'column_interleave' | 'image_text_loss' | 'header_footer_content' | string;
  severity: 'high' | 'info' | string;
  page: number;
}

export interface LayoutXray {
  available: boolean;
  reason?: string | null;
  findings: XrayFinding[];
  findings_total: number;
  robot_lines: { t: string; m: boolean }[];
  is_locked: boolean;
}

interface Props {
  xray: LayoutXray;
  /** Hashid CV id for the original-PDF preview (left panel). */
  cvId: string;
}

export function AtsXraySection({ xray, cvId }: Props) {
  const { t } = useTranslation();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!xray.available) return;
    let url: string | null = null;
    let cancelled = false;
    api.get(`/cvs/${cvId}/download`, { responseType: 'blob' })
      .then(res => {
        if (cancelled) return;
        url = window.URL.createObjectURL(
          new Blob([res.data], { type: 'application/pdf' })
        );
        setPdfUrl(url);
      })
      .catch(() => { /* left panel is optional - X-Ray still renders */ });
    return () => {
      cancelled = true;
      if (url) window.URL.revokeObjectURL(url);
    };
  }, [cvId, xray.available]);

  // TXT upload: a single reassurance line, nothing else to show.
  if (!xray.available) {
    if (xray.reason !== 'plain_text') return null; // legacy/error: hide
    return (
      <div className="surface p-4 flex items-center gap-3">
        <span className="w-7 h-7 rounded-full bg-[#EDF3EC] dark:bg-[#346538]/20 flex items-center justify-center shrink-0">
          <Check className="w-4 h-4 text-[#346538] dark:text-[#8fc79a]" />
        </span>
        <p className="text-sm text-[#555555] dark:text-[#c8c6c3]">{t('xray.plainText')}</p>
      </div>
    );
  }

  const clean = xray.findings_total === 0;

  return (
    <div className="surface p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#F7F6F3] dark:bg-white/[0.06] flex items-center justify-center">
            <ScanSearch className="w-4 h-4 text-[#111111] dark:text-[#e8e7e4]" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#787774] dark:text-[#908d89]">{t('xray.label')}</p>
            <h2 className="text-base font-bold text-[#111111] dark:text-[#e8e7e4]">
              {clean ? t('xray.clean') : t('xray.title')}
            </h2>
          </div>
        </div>
        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
          clean
            ? 'bg-[#EDF3EC] text-[#346538] dark:bg-[#346538]/20 dark:text-[#8fc79a]'
            : 'bg-[#F6EEDD] text-[#956400] dark:bg-[#956400]/20 dark:text-[#d9a94e]'
        }`}>
          {clean ? '✓' : t('xray.findingsCount', { count: xray.findings_total })}
        </span>
      </div>

      {/* Split view: original PDF vs the naive-parser simulation */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1 min-w-0 border border-[#EAEAEA] dark:border-white/[0.07] rounded-xl overflow-hidden">
          <div className="px-3 py-1.5 bg-[#F7F6F3] dark:bg-white/[0.04] text-[10px] font-bold tracking-wider text-[#787774] dark:text-[#908d89]">
            {t('xray.yourCv')}
          </div>
          {pdfUrl ? (
            <iframe src={`${pdfUrl}#toolbar=0`} className="w-full h-72 border-0" title="CV preview" />
          ) : (
            <div className="h-72 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-[#EAEAEA] border-t-[#111111] dark:border-white/[0.15] dark:border-t-[#e8e7e4] rounded-full animate-spin" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 border border-[#EAEAEA] dark:border-white/[0.07] rounded-xl overflow-hidden">
          <div className="px-3 py-1.5 bg-[#111111] text-[10px] font-bold tracking-wider text-[#908d89]">
            {t('xray.atsSees')}
          </div>
          <div className="bg-[#1c1c1a] h-72 overflow-y-auto p-3 font-mono text-[11px] leading-relaxed text-[#c8c6c3]">
            {xray.robot_lines.map((line, i) => (
              <div key={i} className={line.m ? 'bg-[#956400]/30 rounded px-1 -mx-1' : ''}>
                {line.t}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Findings */}
      {clean ? (
        <p className="mt-4 text-sm text-[#555555] dark:text-[#c8c6c3] flex items-center gap-2">
          <Check className="w-4 h-4 text-[#346538] dark:text-[#8fc79a] shrink-0" />
          {t('xray.cleanNote')}
        </p>
      ) : (
        <div className="mt-4 space-y-2">
          {xray.findings.map((f, i) => (
            <div
              key={i}
              className={`rounded-xl border border-[#EAEAEA] dark:border-white/[0.07] border-l-[3px] px-4 py-3 bg-[#FBF8F2] dark:bg-white/[0.03] ${
                f.severity === 'high' ? 'border-l-[#956400]' : 'border-l-[#A09D9A]'
              }`}
            >
              <p className="text-[13px] font-bold text-[#111111] dark:text-[#e8e7e4]">
                {t(`xray.finding.${f.type}.title`, { defaultValue: f.type })}
              </p>
              <p className="text-xs text-[#555555] dark:text-[#908d89] mt-0.5">
                {t(`xray.finding.${f.type}.desc`, { defaultValue: '' })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
