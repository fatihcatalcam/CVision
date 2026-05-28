import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { LanguageSwitcher } from '../../components/ui/LanguageSwitcher';

export function TermsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-background)' }}>

      {/* Nav */}
      <header className="sticky top-0 z-50 backdrop-blur-sm border-b border-[#EAEAEA] dark:border-white/[0.07]"
        style={{ background: 'color-mix(in srgb, var(--color-background) 95%, transparent)' }}>
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-[#787774] dark:text-[#908d89] hover:text-[#111111] dark:hover:text-[#e8e7e4] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('common.back')}
          </button>
          <span className="text-sm font-bold text-[#111111] dark:text-[#e8e7e4]">CVision</span>
          <div className="flex items-center gap-1">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-3xl mx-auto px-6 py-14 w-full">
        <div className="mb-10">
          <h1 className="text-3xl font-black text-[#111111] dark:text-[#e8e7e4] tracking-tight mb-2">
            Kullanım Şartları
          </h1>
          <p className="text-sm text-[#787774] dark:text-[#908d89]">Son güncelleme: 28 Mayıs 2025</p>
        </div>

        <div className="space-y-10 text-[#111111] dark:text-[#e8e7e4]">

          <section className="space-y-3">
            <h2 className="text-base font-bold uppercase tracking-wider text-[#787774] dark:text-[#908d89]">1. Kabul</h2>
            <p className="text-sm leading-relaxed text-[#444] dark:text-[#c8c6c3]">
              CVision'a erişerek veya hizmetlerimizi kullanarak bu Kullanım Şartlarını kabul etmiş sayılırsınız. Bu şartları kabul etmiyorsanız lütfen hizmeti kullanmayınız.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold uppercase tracking-wider text-[#787774] dark:text-[#908d89]">2. Hizmet Tanımı</h2>
            <p className="text-sm leading-relaxed text-[#444] dark:text-[#c8c6c3]">
              CVision, yapay zeka teknolojileri kullanarak CV dosyalarınızı analiz eden, ATS uyumluluğunu değerlendiren, kariyer uyumunu ölçen ve kişiselleştirilmiş iyileştirme önerileri sunan bir SaaS platformudur. Hizmet, "olduğu gibi" sunulmaktadır.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold uppercase tracking-wider text-[#787774] dark:text-[#908d89]">3. Hesap Koşulları</h2>
            <ul className="list-disc list-inside space-y-2 text-sm leading-relaxed text-[#444] dark:text-[#c8c6c3]">
              <li>Hesap oluşturmak için 18 yaşını doldurmuş olmanız gerekmektedir.</li>
              <li>Hesap bilgilerinizin doğru ve güncel olması sizin sorumluluğunuzdadır.</li>
              <li>Hesap güvenliğinizi korumak ve şifrenizi gizli tutmak zorundasınız.</li>
              <li>Hesabınızda gerçekleşen tüm işlemlerden siz sorumlusunuz.</li>
              <li>Tek bir kişi birden fazla ücretsiz hesap açamaz.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold uppercase tracking-wider text-[#787774] dark:text-[#908d89]">4. Kabul Edilebilir Kullanım</h2>
            <p className="text-sm leading-relaxed text-[#444] dark:text-[#c8c6c3]">Aşağıdaki kullanımlar kesinlikle yasaktır:</p>
            <ul className="list-disc list-inside space-y-2 text-sm leading-relaxed text-[#444] dark:text-[#c8c6c3]">
              <li>Başkasına ait CV'yi izinsiz yüklemek veya analiz ettirmek</li>
              <li>Hizmeti otomatik araçlar (bot, scraper) ile aşırı yüklemek</li>
              <li>Sistemin güvenliğini test etmek veya açıklarını istismar etmek</li>
              <li>Yanıltıcı, zararlı veya yasadışı içerik yüklemek</li>
              <li>Quota sınırlarını aşmak amacıyla birden fazla hesap oluşturmak</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold uppercase tracking-wider text-[#787774] dark:text-[#908d89]">5. CV Verilerinin Mülkiyeti</h2>
            <p className="text-sm leading-relaxed text-[#444] dark:text-[#c8c6c3]">
              Yüklediğiniz CV dosyaları ve içerikleri size aittir. CVision'a yalnızca hizmeti sunmak amacıyla gerekli sınırlı lisansı vermiş olursunuz. CV içerikleriniz reklam, eğitim verisi veya başka bir amaçla kullanılmaz. Hesabınızı sildiğinizde tüm verileriniz 30 gün içinde kalıcı olarak silinir.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold uppercase tracking-wider text-[#787774] dark:text-[#908d89]">6. Ücretlendirme ve Abonelik</h2>
            <div className="space-y-3 text-sm leading-relaxed text-[#444] dark:text-[#c8c6c3]">
              <p>
                Ücretsiz plan kullanıcıları haftada 3 analiz hakkına sahiptir. Pro plan ücretli aboneliktir ve aktif abonelik süresince geçerlidir.
              </p>
              <p>
                Ödemeler Stripe üzerinden güvenli biçimde işlenir. Aboneliğinizi istediğiniz zaman ayarlar sayfasından iptal edebilirsiniz; iptal sonrası mevcut dönem sonuna kadar Pro erişiminiz devam eder. İptal edilen dönem için iade yapılmaz.
              </p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold uppercase tracking-wider text-[#787774] dark:text-[#908d89]">7. Yapay Zeka Analiz Sonuçları</h2>
            <p className="text-sm leading-relaxed text-[#444] dark:text-[#c8c6c3]">
              CVision tarafından üretilen analiz sonuçları, puanlar, kariyer önerileri ve iyileştirme tavsiyeleri yapay zeka modelleri tarafından otomatik olarak oluşturulur. Bu sonuçlar bilgilendirme amaçlıdır; iş başvurusunun sonucunu veya işe alınmayı garanti etmez. Sonuçların doğruluğu konusunda hiçbir garanti verilmemektedir.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold uppercase tracking-wider text-[#787774] dark:text-[#908d89]">8. Hizmet Kesintileri ve Değişiklikler</h2>
            <p className="text-sm leading-relaxed text-[#444] dark:text-[#c8c6c3]">
              Hizmeti önceden bildirim yapmaksızın geçici olarak durdurma, özellik ekleme/kaldırma veya fiyatlandırmayı değiştirme hakkını saklı tutarız. Önemli değişiklikler için kayıtlı e-posta adresinize bildirim gönderilir.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold uppercase tracking-wider text-[#787774] dark:text-[#908d89]">9. Sorumluluk Sınırlaması</h2>
            <p className="text-sm leading-relaxed text-[#444] dark:text-[#c8c6c3]">
              CVision, hizmet kesintileri, veri kaybı, yapay zeka analiz sonuçlarına dayanılarak alınan kararların sonuçları veya dolaylı zararlar nedeniyle sorumluluk kabul etmez. Toplam sorumluluğumuz, son 12 ay içinde ödediğiniz abonelik ücretiyle sınırlıdır.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold uppercase tracking-wider text-[#787774] dark:text-[#908d89]">10. Hesap Feshi</h2>
            <p className="text-sm leading-relaxed text-[#444] dark:text-[#c8c6c3]">
              Bu şartları ihlal etmeniz durumunda hesabınızı önceden bildirim yapmaksızın askıya alma veya kapatma hakkını saklı tutarız. Siz de dilediğiniz zaman ayarlar sayfasından hesabınızı silebilirsiniz.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold uppercase tracking-wider text-[#787774] dark:text-[#908d89]">11. Uygulanacak Hukuk</h2>
            <p className="text-sm leading-relaxed text-[#444] dark:text-[#c8c6c3]">
              Bu şartlar Türkiye Cumhuriyeti hukukuna tabidir. Anlaşmazlıklarda İstanbul mahkemeleri yetkilidir.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold uppercase tracking-wider text-[#787774] dark:text-[#908d89]">12. İletişim</h2>
            <p className="text-sm leading-relaxed text-[#444] dark:text-[#c8c6c3]">
              Kullanım şartlarına ilişkin sorularınız için:{' '}
              <a href="mailto:fthctlcm@outlook.com" className="text-[#1B3A6B] dark:text-[#4a7dd1] hover:underline font-medium">
                fthctlcm@outlook.com
              </a>
            </p>
          </section>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#EAEAEA] dark:border-white/[0.07] bg-white dark:bg-[#1c1c1a] mt-auto">
        <div className="max-w-3xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-sm font-bold text-[#111111] dark:text-[#e8e7e4]">CVision</span>
          <div className="flex items-center gap-5 text-xs text-[#787774] dark:text-[#908d89]">
            <a href="/privacy" className="hover:text-[#111111] dark:hover:text-[#e8e7e4] transition-colors">{t('common.privacy')}</a>
            <a href="/terms" className="text-[#1B3A6B] dark:text-[#4a7dd1] font-medium">{t('common.terms')}</a>
            <span>{t('common.copyright')}</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
