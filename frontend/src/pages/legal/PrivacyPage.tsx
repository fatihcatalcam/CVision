import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { LanguageSwitcher } from '../../components/ui/LanguageSwitcher';

export function PrivacyPage() {
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
            Gizlilik Politikası
          </h1>
          <p className="text-sm text-[#787774] dark:text-[#908d89]">Son güncelleme: 28 Mayıs 2025</p>
        </div>

        <div className="prose-custom space-y-10 text-[#111111] dark:text-[#e8e7e4]">

          <section className="space-y-3">
            <h2 className="text-base font-bold uppercase tracking-wider text-[#787774] dark:text-[#908d89]">1. Giriş</h2>
            <p className="text-sm leading-relaxed text-[#444] dark:text-[#c8c6c3]">
              CVision ("biz", "hizmet"), yapay zeka destekli CV analiz platformudur. Bu Gizlilik Politikası, hizmetimizi kullandığınızda hangi kişisel verileri topladığımızı, bu verileri nasıl işlediğimizi ve haklarınızı açıklamaktadır. 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) kapsamında veri sorumlusu sıfatıyla hareket etmekteyiz.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold uppercase tracking-wider text-[#787774] dark:text-[#908d89]">2. Topladığımız Veriler</h2>
            <div className="space-y-4 text-sm leading-relaxed text-[#444] dark:text-[#c8c6c3]">
              <div className="surface p-4 space-y-1">
                <p className="font-semibold text-[#111111] dark:text-[#e8e7e4]">Hesap Bilgileri</p>
                <p>Ad, soyad ve e-posta adresi — kayıt sırasında alınır, kimlik doğrulama ve iletişim amacıyla kullanılır.</p>
              </div>
              <div className="surface p-4 space-y-1">
                <p className="font-semibold text-[#111111] dark:text-[#e8e7e4]">CV Dosyaları</p>
                <p>Yüklediğiniz PDF dosyaları yapay zeka analizi için işlenir. Dosyalar şifrelenmiş depolama alanında saklanır ve yalnızca size ait analiz sonuçlarını üretmek için kullanılır. Üçüncü taraflarla paylaşılmaz.</p>
              </div>
              <div className="surface p-4 space-y-1">
                <p className="font-semibold text-[#111111] dark:text-[#e8e7e4]">Analiz Sonuçları</p>
                <p>ATS skoru, anahtar kelime analizi, kariyer önerileri ve iyileştirme önerileri hesabınıza bağlı olarak saklanır.</p>
              </div>
              <div className="surface p-4 space-y-1">
                <p className="font-semibold text-[#111111] dark:text-[#e8e7e4]">Teknik Veriler</p>
                <p>IP adresi, tarayıcı türü ve kullanım logları — hizmet güvenliği ve performans izleme amacıyla otomatik olarak toplanır.</p>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold uppercase tracking-wider text-[#787774] dark:text-[#908d89]">3. Verilerin Kullanım Amacı</h2>
            <ul className="list-disc list-inside space-y-2 text-sm leading-relaxed text-[#444] dark:text-[#c8c6c3]">
              <li>CV analizi ve yapay zeka raporlarının oluşturulması</li>
              <li>Hesap yönetimi ve kimlik doğrulama</li>
              <li>Hizmet kalitesini artırmak için anonim kullanım istatistikleri</li>
              <li>Güvenlik olaylarının tespiti ve önlenmesi</li>
              <li>Yasal yükümlülüklerin yerine getirilmesi</li>
            </ul>
            <p className="text-sm leading-relaxed text-[#444] dark:text-[#c8c6c3]">
              Verilerinizi reklam amaçlı kullanmıyor, üçüncü taraf reklam ağlarıyla paylaşmıyor ve satmıyoruz.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold uppercase tracking-wider text-[#787774] dark:text-[#908d89]">4. Veri Saklama Süresi</h2>
            <p className="text-sm leading-relaxed text-[#444] dark:text-[#c8c6c3]">
              Hesabınız aktif olduğu sürece verileriniz saklanır. Hesabınızı sildiğinizde kişisel verileriniz ve CV dosyalarınız 30 gün içinde kalıcı olarak silinir. Yasal yükümlülük gerektiren veriler ilgili mevzuatta öngörülen süre boyunca saklanabilir.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold uppercase tracking-wider text-[#787774] dark:text-[#908d89]">5. Üçüncü Taraf Hizmetleri</h2>
            <p className="text-sm leading-relaxed text-[#444] dark:text-[#c8c6c3]">
              Hizmetimiz aşağıdaki üçüncü taraf altyapılarını kullanmaktadır:
            </p>
            <div className="surface p-4 space-y-2 text-sm text-[#444] dark:text-[#c8c6c3]">
              <p><span className="font-semibold text-[#111111] dark:text-[#e8e7e4]">Anthropic Claude API</span> — CV içeriğinin yapay zeka ile analizi için. CV verileri analiz amacıyla iletilir, model eğitiminde kullanılmaz.</p>
              <p><span className="font-semibold text-[#111111] dark:text-[#e8e7e4]">Google OAuth</span> — İsteğe bağlı Google ile giriş özelliği için. Yalnızca kimlik doğrulama kapsamında ad ve e-posta alınır.</p>
              <p><span className="font-semibold text-[#111111] dark:text-[#e8e7e4]">Stripe</span> — Pro plan ödemeleri için. Ödeme bilgileri yalnızca Stripe tarafından işlenir; kart numarası sunucularımızda saklanmaz.</p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold uppercase tracking-wider text-[#787774] dark:text-[#908d89]">6. KVKK Kapsamındaki Haklarınız</h2>
            <p className="text-sm leading-relaxed text-[#444] dark:text-[#c8c6c3]">
              6698 sayılı KVKK'nın 11. maddesi uyarınca aşağıdaki haklara sahipsiniz:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm leading-relaxed text-[#444] dark:text-[#c8c6c3]">
              <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
              <li>İşlenmişse buna ilişkin bilgi talep etme</li>
              <li>İşlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme</li>
              <li>Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme</li>
              <li>Eksik veya yanlış işlenmişse düzeltilmesini isteme</li>
              <li>Yasal koşullar çerçevesinde silinmesini veya yok edilmesini isteme</li>
              <li>İşleme itiraz etme ve zararın giderilmesini talep etme</li>
            </ul>
            <p className="text-sm leading-relaxed text-[#444] dark:text-[#c8c6c3]">
              Bu haklarınızı kullanmak için aşağıdaki iletişim adresimize başvurabilirsiniz.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold uppercase tracking-wider text-[#787774] dark:text-[#908d89]">7. Çerezler</h2>
            <p className="text-sm leading-relaxed text-[#444] dark:text-[#c8c6c3]">
              Oturum yönetimi için zorunlu çerezler kullanılmaktadır. Analitik veya pazarlama çerezi kullanılmamaktadır.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold uppercase tracking-wider text-[#787774] dark:text-[#908d89]">8. İletişim</h2>
            <p className="text-sm leading-relaxed text-[#444] dark:text-[#c8c6c3]">
              Gizlilik politikamıza ilişkin sorularınız veya KVKK kapsamındaki talepleriniz için:{' '}
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
            <a href="/privacy" className="text-[#1B3A6B] dark:text-[#4a7dd1] font-medium">{t('common.privacy')}</a>
            <a href="/terms" className="hover:text-[#111111] dark:hover:text-[#e8e7e4] transition-colors">{t('common.terms')}</a>
            <span>{t('common.copyright')}</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
