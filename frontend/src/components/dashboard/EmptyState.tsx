import { Sparkles, TrendingUp, Target, Lightbulb } from 'lucide-react';
import { CVUploader } from '../cv/CVUploader';

interface EmptyStateProps {
  onUploadSuccess: (cvId: string) => void;
}

const BENEFITS = [
  {
    icon: <TrendingUp className="w-4 h-4" />,
    title: 'ATS Skoru',
    desc: 'Filtreleri geçer mi, geçmez mi — anında öğren',
    bg: 'bg-[#EDF3EC] dark:bg-[#346538]/20',
    color: 'text-[#346538] dark:text-[#4ade80]',
  },
  {
    icon: <Target className="w-4 h-4" />,
    title: 'Kariyer Uyumu',
    desc: 'Hedef role ne kadar yakınsın',
    bg: 'bg-[#EEF2F8] dark:bg-[#1B3A6B]/20',
    color: 'text-[#1B3A6B] dark:text-[#4a7dd1]',
  },
  {
    icon: <Lightbulb className="w-4 h-4" />,
    title: 'Öncelikli Adımlar',
    desc: 'Ne yapman gerektiğini tam olarak bil',
    bg: 'bg-amber-50 dark:bg-amber-500/10',
    color: 'text-amber-600 dark:text-amber-400',
  },
];

export function EmptyState({ onUploadSuccess }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-8 py-4 max-w-2xl mx-auto">

      {/* Hero */}
      <div className="text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#EEF2F8] dark:bg-[#1B3A6B]/20 flex items-center justify-center mx-auto mb-5">
          <Sparkles className="w-6 h-6 text-[#1B3A6B] dark:text-[#4a7dd1]" />
        </div>
        <h2 className="text-2xl font-black text-[#111111] dark:text-[#e8e7e4] mb-2 tracking-tight">
          CV'ni yükle, anında geri bildirim al
        </h2>
        <p className="text-sm text-[#787774] dark:text-[#908d89] leading-relaxed max-w-sm mx-auto">
          Yapay zeka CV'ni saniyeler içinde analiz ediyor — güçlü yönler, eksikler ve kişiselleştirilmiş öneriler.
        </p>
      </div>

      {/* Benefit cards */}
      <div className="grid grid-cols-3 gap-3 w-full">
        {BENEFITS.map(({ icon, title, desc, bg, color }) => (
          <div key={title} className="surface p-4 flex flex-col gap-2.5">
            <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center ${color}`}>
              {icon}
            </div>
            <div>
              <p className="text-xs font-bold text-[#111111] dark:text-[#e8e7e4]">{title}</p>
              <p className="text-[11px] text-[#787774] dark:text-[#908d89] mt-0.5 leading-snug">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* AI banner */}
      <div className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/[0.08] border border-amber-500/20">
        <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-amber-400">İlk analizin tamamen AI destekli ve ücretsiz</p>
          <p className="text-xs text-[#787774] dark:text-[#908d89] mt-0.5">
            Kayıt olduktan sonra 3 ücretsiz analiz hakkın var.
          </p>
        </div>
      </div>

      {/* Uploader */}
      <div className="w-full">
        <CVUploader onUploadSuccess={onUploadSuccess} />
      </div>
    </div>
  );
}
