import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Link, FileText, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { MatchResultCard } from '../../components/match/MatchResultCard';
import { CoverLetterModal } from '../../components/match/CoverLetterModal';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  fetchUrlText, saveJD, createMatch, createCoverLetter,
  type MatchResponse,
} from '../../services/matchApi';

interface CVOption {
  id: string;
  original_filename: string;
}

type Tab = 'url' | 'text';

export function MatchPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [cvs, setCvs] = useState<CVOption[]>([]);
  const [selectedCvId, setSelectedCvId] = useState<string>('');
  const [tab, setTab] = useState<Tab>('url');
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [fetchedText, setFetchedText] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [isMatching, setIsMatching] = useState(false);
  const [matchResult, setMatchResult] = useState<MatchResponse | null>(null);
  const [matchJdId, setMatchJdId] = useState<string | null>(null);
  const [coverLetterContent, setCoverLetterContent] = useState<string | null>(null);
  const [isGeneratingCoverLetter, setIsGeneratingCoverLetter] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect free users
  useEffect(() => {
    if (user && user.plan_type !== 'premium') {
      navigate('/pricing');
    }
  }, [user, navigate]);

  // Load CVs
  useEffect(() => {
    api.get('/cvs/').then(res => {
      const list: CVOption[] = res.data.cvs || [];
      setCvs(list);
      if (list.length > 0) setSelectedCvId(list[0].id);
    }).catch(() => {});
  }, []);

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
      setMatchResult(match);
      setMatchJdId(jd.id);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr?.response?.data?.message || t('match.matchError'));
    } finally {
      setIsMatching(false);
    }
  };

  const handleGenerateCoverLetter = async () => {
    if (!selectedCvId || !matchJdId) return;
    setIsGeneratingCoverLetter(true);
    try {
      const letter = await createCoverLetter(selectedCvId, matchJdId);
      setCoverLetterContent(letter.content);
    } catch {
      // silent — user can retry
    } finally {
      setIsGeneratingCoverLetter(false);
    }
  };

  const canSubmit = tab === 'url' ? !!fetchedText : text.trim().length >= 50;

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-background)' }}>
      <div className="max-w-5xl mx-auto px-6 py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm mb-6 hover:opacity-70 transition-opacity"
          style={{ color: 'var(--color-muted)' }}
        >
          <ArrowLeft className="w-4 h-4" /> {t('common.back')}
        </button>

        <h1 className="text-2xl font-semibold mb-8" style={{ color: 'var(--color-foreground)' }}>
          {t('match.pageTitle')}
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Inputs */}
          <div className="space-y-6">
            {/* CV selector */}
            {cvs.length > 0 && (
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider block mb-2" style={{ color: 'var(--color-muted)' }}>
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

            {/* JD input */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider block mb-2" style={{ color: 'var(--color-muted)' }}>
                {t('match.jdInputLabel')}
              </label>
              <div className="rounded-[var(--radius-md)] overflow-hidden" style={{ border: '1px solid var(--color-card-border)', background: 'var(--color-card)' }}>
                {/* Tabs */}
                <div className="flex border-b" style={{ borderColor: 'var(--color-card-border)' }}>
                  {(['url', 'text'] as Tab[]).map(t_ => (
                    <button
                      key={t_}
                      onClick={() => { setTab(t_); setFetchedText(null); setFetchError(null); }}
                      className={`flex items-center gap-2 px-4 py-2.5 text-sm border-b-2 transition-colors ${tab === t_ ? 'border-[var(--color-foreground)]' : 'border-transparent'}`}
                      style={{ color: tab === t_ ? 'var(--color-foreground)' : 'var(--color-muted)' }}
                    >
                      {t_ === 'url' ? <Link className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                      {t(`match.${t_}Tab`)}
                    </button>
                  ))}
                </div>

                <div className="p-4 space-y-3">
                  {tab === 'url' ? (
                    <>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={url}
                          onChange={e => setUrl(e.target.value)}
                          placeholder="https://kariyer.net/..."
                          className="flex-1 px-3 py-2 text-sm rounded-[var(--radius-md)] border"
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
                        <p className="text-xs" style={{ color: 'var(--color-success)' }}>✓ {t('match.fetchSuccess')}</p>
                      )}
                    </>
                  ) : (
                    <textarea
                      value={text}
                      onChange={e => setText(e.target.value)}
                      placeholder={t('match.textPlaceholder')}
                      rows={8}
                      className="w-full px-3 py-2 text-sm rounded-[var(--radius-md)] border resize-none"
                      style={{ background: 'var(--color-background)', border: '1px solid var(--color-card-border)', color: 'var(--color-foreground)' }}
                    />
                  )}
                </div>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-error)' }}>
                <AlertCircle className="w-4 h-4" />{error}
              </div>
            )}

            <Button
              size="lg"
              onClick={handleMatch}
              disabled={!canSubmit || isMatching || !selectedCvId}
              loading={isMatching}
              className="w-full"
            >
              {t('match.matchButton')}
            </Button>
          </div>

          {/* Right: Results */}
          <div>
            {matchResult ? (
              <div className="rounded-[var(--radius-md)] p-6" style={{ border: '1px solid var(--color-card-border)', background: 'var(--color-card)' }}>
                <MatchResultCard
                  match={matchResult}
                  onGenerateCoverLetter={handleGenerateCoverLetter}
                  isGeneratingCoverLetter={isGeneratingCoverLetter}
                />
              </div>
            ) : (
              <div className="rounded-[var(--radius-md)] p-6 flex flex-col items-center justify-center min-h-48 text-center" style={{ border: '1px solid var(--color-card-border)', background: 'var(--color-card)' }}>
                <p className="text-sm" style={{ color: 'var(--color-muted)' }}>{t('match.resultsPlaceholder')}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {coverLetterContent && (
        <CoverLetterModal content={coverLetterContent} onClose={() => setCoverLetterContent(null)} />
      )}
    </div>
  );
}
