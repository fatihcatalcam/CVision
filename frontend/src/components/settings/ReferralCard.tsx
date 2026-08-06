import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Gift, Copy, Check } from 'lucide-react';
import api from '../../services/api';
import { Card } from '../ui/Card';

interface Referral {
  code: string;
  reward: number;
  rewarded_count: number;
}

/**
 * Invite panel. The copy is careful about WHEN the reward lands, because the
 * gap between inviting and being paid is where a referral scheme loses trust:
 * the credits arrive once the invited person runs their first analysis, not
 * when they sign up. Saying so up front is cheaper than answering it later.
 */
export function ReferralCard() {
  const { t } = useTranslation();
  const [referral, setReferral] = useState<Referral | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.get('/auth/me/referral')
      .then((res) => setReferral(res.data))
      .catch(() => { /* the panel simply stays hidden; nothing here is critical */ });
  }, []);

  if (!referral) return null;

  const link = `${window.location.origin}/register?ref=${referral.code}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success(t('referral.copied'));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t('referral.copyFailed'));
    }
  };

  return (
    <Card id="referral">
      <div className="flex items-start gap-3 mb-6">
        <div className="p-2 rounded-[var(--radius-md)] bg-[#FBF3DB] dark:bg-[#956400]/20 text-[#956400] flex-shrink-0 mt-0.5">
          <Gift className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-base font-bold text-[#111111] dark:text-[#e8e7e4]">
            {t('referral.title')}
          </h2>
          <p className="text-xs text-[#6B6A65] dark:text-[#908d89] mt-0.5">
            {t('referral.desc', { reward: referral.reward })}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          readOnly
          value={link}
          onFocus={(e) => e.currentTarget.select()}
          className="flex-1 bg-[#F7F6F3] dark:bg-[#1c1c1a] border border-[#EAEAEA] dark:border-white/[0.07] rounded-xl h-11 px-3 text-xs text-[#111111] dark:text-[#e8e7e4] font-mono"
        />
        <button
          onClick={copy}
          className="flex items-center gap-1.5 px-4 h-11 rounded-xl bg-[#111111] dark:bg-[#e8e7e4] text-white dark:text-[#111111] text-xs font-bold hover:bg-[#2a2a2a] dark:hover:bg-[#f2f1ee] active:scale-[0.98] transition-all flex-shrink-0"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {t('referral.copy')}
        </button>
      </div>

      <p className="text-[11px] text-[#6B6A65] dark:text-[#908d89] mt-3 leading-relaxed">
        {t('referral.whenPaid')}
      </p>

      <p className="text-sm text-[#111111] dark:text-[#e8e7e4] mt-4">
        {t('referral.earned', {
          count: referral.rewarded_count,
          credits: referral.rewarded_count * referral.reward,
        })}
      </p>
    </Card>
  );
}
