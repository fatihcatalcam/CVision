import type { GuideSection } from './atsGuide';

/**
 * /on-yazi-ornekleri - cover letter examples, in Turkish only.
 *
 * Turkish searches for cover letter examples ("ön yazı örnekleri" and its
 * variants) run to about 3,000 a month, and the product writes cover letters,
 * so the page answers the search with real examples and points at the feature.
 *
 * There is deliberately no English version and no hreflang: a translated page
 * would be a thin copy of a Turkish one, and hreflang is only for pages that
 * really are each other's translation. See TURKISH_ONLY_PATHS in
 * i18n/routes.ts. Because the page has no other language, its copy lives here
 * rather than in the i18n bundles, where the parity test would demand it in
 * all five.
 *
 * The letters are invented. They carry no made-up figures: where a real one
 * belongs there is a [N] for the reader's own.
 */

export const COVER_LETTER_PAGE = {
  metaTitle: 'Ön Yazı Örnekleri: İş Başvurusu İçin 6 Hazır Örnek | CVision',
  metaDescription:
    'Yeni mezun, satış, muhasebe, yazılım, müşteri hizmetleri ve staj başvurusu için 6 ön yazı örneği. İyi bir ön yazının yapısı ve Kariyer.net için kısa örnekler.',
  back: 'Ana sayfaya dön',
  title: 'Ön yazı örnekleri',
  definition:
    'Ön yazı, CV\'nizle birlikte gönderdiğiniz ve bu işe neden başvurduğunuzu anlatan kısa bir mektuptur. CV ne yaptığınızı listeler; ön yazı ise bunun ilandaki işle nasıl örtüştüğünü birkaç paragrafta gösterir. Aşağıda iyi bir ön yazının nasıl kurulduğunu, farklı pozisyonlar için altı örneği ve iş sitelerindeki kısa ön yazı alanı için iki kısa örneği bulacaksınız.',
  ctaTitle: 'İlana özel ön yazını CVision hazırlasın',
  ctaButton: 'Ön yazı oluştur',
  ctaNote:
    'CVision önce CV\'ni ilanla eşleştirir, sonra o ilana özel bir ön yazı yazar. Eşleştirme ve ön yazı 2\'şer kredidir.',
} as const;

const signature = 'Saygılarımla,\n[Ad Soyad]\n[Telefon]';

export const COVER_LETTER_EXAMPLES: GuideSection[] = [
  {
    heading: 'İyi bir ön yazı nasıl kurulur?',
    intro:
      'İşe alım uzmanı ön yazıyı genellikle CV\'den önce ve hızlıca okur. Bu yüzden her paragrafın tek bir işi olsun. Çoğu ön yazı dört bölümle yetinir.',
    items: [
      {
        title: 'Hitap',
        body:
          'İlanı yayımlayan kişinin adını biliyorsanız adıyla hitap edin: "Sayın Ayşe Yılmaz". Bilmiyorsanız "Sayın İşe Alım Ekibi" ya da daha samimi bir şirkette "Merhaba" yeterlidir.',
      },
      {
        title: 'Neden bu ilan?',
        body:
          'İlk paragrafta hangi pozisyona başvurduğunuzu ve bu ilanı neden seçtiğinizi söyleyin. İlandan ya da şirketten somut bir ayrıntı yakalayın. Her şirkete aynen gönderilebilecek bir cümle, okuyana hiçbir şey söylemez.',
      },
      {
        title: 'Uygunluğunuzu gösteren iki üç kanıt',
        body:
          'İlanda en çok vurgulanan iki üç şartı seçin ve her biri için geçmişinizden bir örnek verin: nerede, ne yaptınız, sonucu ne oldu. CV\'nizi tekrar etmeyin; oradaki bir maddeyi seçip biraz açın.',
      },
      {
        title: 'Kapanış',
        body:
          'Görüşmeye hazır olduğunuzu söyleyin ve teşekkür edin. Altına adınızı ve telefonunuzu yazın. Bir sayfayı geçmeyin; üç dört kısa paragraf çoğu ilan için yeterlidir.',
      },
    ],
    outro:
      'Aşağıdaki örneklerde kişiler ve şirketler uydurmadır. Köşeli parantez içindeki yerleri kendi bilgilerinizle doldurun. Rakam yazacaksanız yalnızca gerçek ve doğrulayabileceğiniz rakamları kullanın.',
  },
  {
    heading: '6 ön yazı örneği',
    intro:
      'Her örnek aynı yapıyı izler ama başka bir işe göre yazılmıştır. Size en yakın olanı seçin, kendi ilanınıza ve deneyiminize göre değiştirin.',
    items: [
      {
        title: 'Yeni mezun ön yazı örneği',
        body: 'İlk işine başvuran, iş deneyimi az ama okulda ilgili bir proje yapmış bir aday için.',
        example: [
          'Sayın İşe Alım Ekibi,',
          '',
          '[Şirket Adı] bünyesinde açılan Satın Alma Uzman Yardımcısı pozisyonu için başvuruyorum. Bu yaz Endüstri Mühendisliği bölümünden mezun oldum. İlanda tedarikçi takibinin ve raporlamanın öne çıkması, okulda en çok ilgimi çeken konularla doğrudan örtüşüyor.',
          '',
          'Bitirme projemde orta ölçekli bir üreticinin satın alma sürecini inceledim. Siparişlerin onay aşamasında nerede beklediğini çıkardım ve bunu izlemek için Excel\'de basit bir takip tablosu hazırladım. Firma bu tabloyu proje bittikten sonra da kullanmaya devam etti.',
          '',
          'Üçüncü sınıfta bir lojistik firmasında yaptığım stajda tedarikçi tekliflerini karşılaştırma tablosuna geçirdim ve haftalık raporun hazırlanmasına yardım ettim. Düzenli kayıt tutmanın ve gecikmeyi zamanında haber vermenin bu işin yarısı olduğunu orada öğrendim.',
          '',
          'Satın almayı içeriden öğrenebileceğim bir ekipte çalışmak istiyorum. Uygun görürseniz bir görüşmede projemi ayrıntılı anlatmaktan memnuniyet duyarım.',
          '',
          signature,
        ].join('\n'),
      },
      {
        title: 'Satış ön yazı örneği',
        body: 'Bayi ya da saha satışında deneyimli, bölgeyi tanıyan bir aday için.',
        example: [
          'Sayın [Yetkili Adı],',
          '',
          '[Şirket Adı]\'nın Ege bölgesi için aradığı Saha Satış Temsilcisi ilanına başvuruyorum. Üç yıldır bir yapı malzemeleri firmasında bayilerle çalışıyorum. İlanda istediğiniz iki şey, bölgeyi tanımak ve yeni bayi açmak, zaten her gün yaptığım işler.',
          '',
          'Şu an [N] bayiden oluşan bir portföyü yönetiyorum. Bayilerimi her ay ziyaret ediyor, siparişlerini ve stok durumlarını CRM\'e işliyorum. Geçen yıl daha önce hiç satış yapmadığımız iki ilçede yeni bayilerle anlaştım; ikisi de bugün düzenli sipariş veriyor.',
          '',
          'Satışta en çok önem verdiğim şey, verdiğim teslim tarihini tutmak. Bir siparişin gecikeceğini öğrendiğimde bayiyi, kendi müşterisi sormadan önce arıyorum. Bu alışkanlık sayesinde zor dönemlerde de bayilerle ilişkim bozulmadı.',
          '',
          'Ürünlerinizin bayi kanalında büyümesinde pay sahibi olmak isterim. Görüşme için size uygun bir zamanı bekliyorum.',
          '',
          signature,
        ].join('\n'),
      },
      {
        title: 'Muhasebe ön yazı örneği',
        body: 'Mali müşavirlik bürosundan bir şirketin muhasebe ekibine geçmek isteyen bir aday için.',
        example: [
          'Sayın İşe Alım Ekibi,',
          '',
          '[Şirket Adı]\'nda açık olan Muhasebe Uzmanı pozisyonu için başvuruyorum. Dört yıldır bir mali müşavirlik bürosunda farklı sektörlerden şirketlerin defterlerini tutuyorum. İlanda istediğiniz Logo deneyimi ve KDV beyannamesi hazırlama, her ay düzenli olarak yaptığım işler.',
          '',
          'Büroda [N] şirketin cari hesap mutabakatlarını, banka hareketlerini ve aylık beyannamelerini hazırlıyorum. Geçen yıl müşterilerimiz e-fatura ve e-arşive geçerken muhasebe tarafındaki işleri ben yürüttüm ve kayıtların yeni sisteme eksiksiz aktarıldığını tek tek kontrol ettim. SGK bildirgelerinde ve e-defter kapanışlarında da görev alıyorum.',
          '',
          'Hataları ay sonunu beklemeden yakalamaya çalışırım. Bunun için haftalık kontrol listeleri hazırladım; mutabakat farklarını artık ortaya çıktıkları hafta kapatıyoruz. Bu sayede ay sonu kapanışı daha az düzeltmeyle bitiyor.',
          '',
          'Tek bir şirketin muhasebesini baştan sona üstlenmek istiyorum; ilanınızı bu yüzden önemsiyorum. Değerlendirmeniz için teşekkür ederim.',
          '',
          signature,
        ].join('\n'),
      },
      {
        title: 'Yazılım geliştirici ön yazı örneği',
        body: 'Birkaç yıllık deneyimi olan ve bir ürün ekibine katılmak isteyen bir backend geliştirici için.',
        example: [
          'Merhaba,',
          '',
          '[Şirket Adı]\'nda açık olan Backend Geliştirici pozisyonuna başvuruyorum. İlanda öne çıkan Python, PostgreSQL ve REST API tasarımı, iki yıldır her gün kullandığım araçlar.',
          '',
          'Şu an bir e-ticaret firmasında sipariş ve stok servislerinden sorumlu ekipteyim. Sipariş servisindeki yavaş sorguları inceleyip indeksleri yeniden düzenledim ve sayfaların yanıt süresi belirgin biçimde kısaldı. Ödeme sağlayıcısı entegrasyonunu yazarken de tekrar gönderilen bir isteğin müşteriden iki kez ödeme almasını engelleyen bir yapı kurdum. İki değişikliği de canlıya almadan önce yük testleriyle doğruladım.',
          '',
          'Kod incelemelerini önemsiyorum. Ekipte test yazmayı alışkanlık hâline getirmek için birim testi şablonları hazırladım ve yeni katılan iki geliştiricinin projeye alışmasına yardım ettim. Çalışmalarımın bir kısmını GitHub profilimde görebilirsiniz: [GitHub bağlantısı]',
          '',
          'Ürününüz büyürken altyapı tarafında sorumluluk almak isterim. Teknik görüşme için hazırım.',
          '',
          signature,
        ].join('\n'),
      },
      {
        title: 'Müşteri hizmetleri ön yazı örneği',
        body: 'Çağrı merkezinde ya da destek hattında deneyimi olan bir aday için.',
        example: [
          'Sayın İşe Alım Ekibi,',
          '',
          '[Şirket Adı] müşteri hizmetleri ekibinde açılan Müşteri Temsilcisi pozisyonu için başvuruyorum. İki yıldır bir internet servis sağlayıcısının destek hattında çalışıyorum; telefon, canlı destek ve e-posta kanallarının üçünde de görev aldım.',
          '',
          'Aramalarımın büyük kısmı, sorunu çözülmediği için ikinci kez arayan müşterilerden geliyor. Bu aramalarda önce eski kayıtları okuyorum, böylece müşteri aynı şeyi bana bir kez daha anlatmak zorunda kalmıyor. Teknik ekibe aktardığım her kaydı, müşteriyi ne zaman arayacağımı yazarak kapatıyor ve o aramayı mutlaka yapıyorum.',
          '',
          'Ekip liderim beni yeni başlayan temsilcilerin eğitimine dahil etti. Sık gelen sorular için hazırladığım kısa yanıt rehberi bugün de ekipte kullanılıyor; yeni sorular geldikçe onu güncelliyorum.',
          '',
          'İlanınızda vardiyalı çalışma ve hafta sonu nöbeti olduğunu gördüm; ikisine de uygunum. Daha geniş bir ürün yelpazesi olan bir ekipte çalışmak istiyorum. Görüşme için bana ulaşabilirsiniz.',
          '',
          signature,
        ].join('\n'),
      },
      {
        title: 'Staj başvurusu ön yazı örneği',
        body: 'Zorunlu ya da gönüllü staj arayan bir üniversite öğrencisi için.',
        example: [
          'Sayın İşe Alım Ekibi,',
          '',
          '[Üniversite Adı] Bilgisayar Mühendisliği bölümünde üçüncü sınıf öğrencisiyim ve [Şirket Adı]\'nın yaz stajı programına başvuruyorum. Zorunlu stajımı gerçek bir ürün geliştiren bir ekipte yapmak istiyorum. İlanınızda stajyerlerin canlı projelerde çalıştığını okumam, başvurmamda belirleyici oldu.',
          '',
          'Derslerin dışında kendi projelerimi geliştiriyorum. Son olarak öğrenci kulübümüzün etkinlik kayıtlarını toplayan küçük bir web uygulaması yazdım; arayüzünü React ile, sunucu tarafını Node.js ile kurdum. Uygulama iki dönemdir kulübün etkinliklerinde kullanılıyor.',
          '',
          'Ekip hâlinde çalışmayı bir hackathonda öğrendim. Dört kişilik ekibimizle çalışan bir prototip çıkardık ve jüriye sunumu ben yaptım. İşi baştan bölüşmenin ve birbirimize sık sık haber vermenin ne kadar zaman kazandırdığını orada gördüm.',
          '',
          'Staj boyunca hem kod yazmayı hem de bir ekibin nasıl çalıştığını yakından görmek istiyorum. Haziran ile Eylül arasında tam zamanlı çalışabilirim. Değerlendirmeniz için teşekkür ederim.',
          '',
          signature,
        ].join('\n'),
      },
    ],
  },
  {
    heading: 'Kariyer.net ve iş siteleri için kısa ön yazı örnekleri',
    intro:
      'Kariyer.net gibi sitelerde başvuru sırasında kısa bir ön yazı alanı çıkar. Buraya uzun mektubu yapıştırmayın. İki üç cümlede pozisyonu, en güçlü uygunluğunuzu ve görüşmeye hazır olduğunuzu yazmanız yeterli.',
    items: [
      {
        title: 'Deneyimli aday için kısa ön yazı',
        body: 'İlanın istediği deneyime doğrudan sahip olan biri için.',
        example:
          'Merhaba, Muhasebe Uzmanı ilanınız için başvuruyorum. Dört yıldır bir mali müşavirlik bürosunda beyanname ve mutabakat işlerini yürütüyorum; ilanda istediğiniz Logo ve e-fatura deneyimine sahibim. Görüşme için uygun olduğum zamanları paylaşabilirim.',
      },
      {
        title: 'Yeni mezun için kısa ön yazı',
        body: 'Deneyimi az, ama ilgili bir işte çalışmış biri için.',
        example:
          'Merhaba, bu yıl İşletme bölümünden mezun oldum ve Satış Asistanı ilanınıza başvuruyorum. Üniversitede iki yıl yarı zamanlı olarak mağaza satışında çalıştım ve müşteriyle yüz yüze çalışmayı seviyorum. Ayrıntıları CV\'mde bulabilirsiniz, değerlendirmeniz için teşekkürler.',
      },
    ],
  },
];
