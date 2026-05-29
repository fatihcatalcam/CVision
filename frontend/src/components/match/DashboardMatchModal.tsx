import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Link, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { fetchUrlText, saveJD, createMatch, type MatchResponse } from '../../services/matchApi';

interface CVOption {
  id: string;
  original_filename: string;
}

interface DashboardMatchModalProps {
  cvs: CVOption[];
  defaultCvId: string;
  onClose: () => void;
  onMatchComplete: (match: MatchResponse, jdId: string, cvId: string) => void;
}

type Tab = 'url' | 'text';

export function DashboardMatchModal({ cvs, defaultCvId, onClose, onMatchComplete }: DashboardMatchModalProps) {
  const { t } = useTranslation();
  const [selectedCvId, setSelectedCvId] = useState(defaultCvId);
  const [tab, setTab] = useState<Tab>('url');
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [fetchedText, setFetchedText] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [isMatching, setIsMatching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFetchUrl = async () => {
    if (!url.trim()) return;
    setIsFetching(true);
    setFetchError(null);
    setFetchedText(null);
    try {
      const result = await fetchUrlText(url.trim());
      if (!result.supported || !result.extracted_text) {
        setFetchError(result.message || t('match.fetchError'));
      } else {
        setFetchedText(result.extracted_text);
      }
    } catch {
      setFetchError(t('match.fetchError'));
    } finally {
      setIsFetching(false);
    }
  };

  const handleMatch = async () => {
    const rawText = tab === 'url' ? fetchedText : text.trim();
    if (!rawText || rawText.length < 50) { setError(t('match.textTooShort')); return; }
    if (!selectedCvId) { setError(t('match.noCvSelected')); return; }
    setIsMatching(true);
    setError(null);
    try {
      const jd = await saveJD({ raw_text: rawText, url: tab === 'url' ? url : undefined });
      const match = await createMatch(selectedCvId, jd.id);
      onMatchComplete(match, jd.id, selectedCvId);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || t('match.matchError'));
    } finally {
      setIsMatching(false);
    }
  };

  const canSubmit = tab === 'url' ? !!fetchedText : text.trim().length >= 50;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="w-full max-w-lg rounded-[var(--radius-lg)] shadow-xl" style={{ background: 'var(--color-card)', border: '1px solid var(--color-card-border)' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--color-card-border)' }}>
          <h2 className="font-semibold text-base" style={{ color: 'var(--color-foreground)' }}>{t('match.modalTitle')}</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-[#F1F1EF] dark:hover:bg-white/[0.06] transition-colors">
            <X className="w-4 h-4" style={{ color: 'var(--color-muted)' }} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* CV selector - only shown if multiple CVs */}
          {cvs.length > 1 && (
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider block mb-1.5" style={{ color: 'var(--color-muted)' }}>
                {t('match.selectCv')}
              </label>
              <select
                value={selectedCvId}
                onChange={e => setSelectedCvId(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-[var(--radius-md)] border"
                style={{ background: 'var(--color-background)', border: '1px solid var(--color-card-border)', color: 'var(--color-foreground)' }}
              >
                {cvs.map(cv => (
                  <option key={cv.id} value={cv.id}>{cv.original_filename}</option>
                ))}
              </select>
            </div>
          )}

          {/* Tabs */}
          <div>
            <div className="flex border-b mb-3" style={{ borderColor: 'var(--color-card-border)' }}>
              {(['url', 'text'] as Tab[]).map(t_ => (
                <button
                  key={t_}
                  onClick={() => { setTab(t_); setFetchedText(null); setFetchError(null); setError(null); }}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t_ ? 'border-[var(--color-foreground)]' : 'border-transparent'}`}
                  style={{ color: tab === t_ ? 'var(--color-foreground)' : 'var(--color-muted)' }}
                >
                  {t_ === 'url' ? <Link className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                  {t(`match.${t_}Tab`)}
                </button>
              ))}
            </div>

            {tab === 'url' ? (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    placeholder="https://kariyer.net/..."
                    className="flex-1 px-3 py-2 text-sm rounded-[var(--radius-md)] border outline-none"
                    style={{ background: 'var(--color-background)', border: '1px solid var(--color-card-border)', color: 'var(--color-foreground)' }}
                    onKeyDown={e => e.key === 'Enter' && handleFetchUrl()}
                  />
                  <Button size="sm" onClick={handleFetchUrl} disabled={isFetching || !url.trim()} loading={isFetching}>
                    {t('match.fetchButton')}
                  </Button>
                </div>
                {fetchError && (
                  <div className="flex items-start gap-2 p-2.5 rounded text-xs" style={{ background: 'var(--color-error-bg)', color: 'var(--color-error)' }}>
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />{fetchError}
                  </div>
                )}
                {fetchedText && (
                  <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-success)' }}>
                    <CheckCircle className="w-3.5 h-3.5" />{t('match.fetchSuccess')}
                  </div>
                )}
              </div>
            ) : (
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder={t('match.textPlaceholder')}
                rows={7}
                className="w-full px-3 py-2 text-sm rounded-[var(--radius-md)] border outline-none resize-none"
                style={{ background: 'var(--color-background)', border: '1px solid var(--color-card-border)', color: 'var(--color-foreground)' }}
              />
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-error)' }}>
              <AlertCircle className="w-4 h-4" />{error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-5 border-t" style={{ borderColor: 'var(--color-card-border)' }}>
          <Button variant="ghost" size="sm" onClick={onClose}>{t('common.cancel')}</Button>
          <Button size="sm" onClick={handleMatch} disabled={!canSubmit || isMatching} loading={isMatching}>
            {t('match.matchButton')}
          </Button>
        </div>
      </div>
    </div>
  );
}
