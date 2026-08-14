/**
 * The long-form half of the /how-ats-works guide.
 *
 * It lives here rather than in the i18n bundles for one reason: the locale
 * parity test requires every key to exist in all five languages, and this is
 * ~1000 words per language. Spanish, German and French have no URLs of their
 * own (see i18n/routes.ts), so nothing here could ever rank for them - writing
 * and then maintaining three translations nobody reads is cost with no return.
 *
 * The guide's original six sections stay in tr.ts/en.ts/es.ts/de.ts/fr.ts,
 * untouched. A French visitor therefore keeps exactly the page they have
 * today; the two languages with URLs get more. Adding a language later means
 * adding a key below, and nothing else.
 *
 * Everything here is rendered by HowAtsWorksPage AND emitted by
 * scripts/prerender.ts. Prerendered text the mounted app does not also show is
 * text Google discards when it renders the page for real.
 */

export type GuideItem = { title: string; body: string };

export type GuideSection = {
  heading: string;
  intro?: string;
  /** Rendered as h3 + paragraph pairs. */
  items?: GuideItem[];
  /** Plain paragraphs after the items. */
  outro?: string;
};

const tr: GuideSection[] = [
  {
    heading: 'Hangi ATS ne yapar: Workday, Greenhouse, Lever, Taleo, iCIMS',
    intro:
      'Hepsi aynı şeyi yapmaz. "ATS" tek bir yazılım değil, benzer işi farklı katılıkta yapan bir yazılım ailesidir; hangisine başvurduğunuz CV\'nizin nasıl okunacağını doğrudan değiştirir. Türkiye\'de kurumsal başvuruların büyük kısmı aşağıdaki beş sistemden birine düşer.',
    items: [
      {
        title: 'Workday',
        body:
          'Büyük kurumların en yaygın tercihi. Başvuru sırasında CV\'nizi ayrıştırıp formu sizin yerinize doldurmaya çalışır, sonra alanları onaylamanızı ister. Bu, ayrıştırmanın sonucunu kendi gözünüzle görebildiğiniz nadir bir andır: form yanlış dolduysa sistem CV\'nizi yanlış okumuş demektir. Formu düzeltip geçmeyin — asıl düzeltilmesi gereken CV\'dir, çünkü aynı dosya bir sonraki şirkette de aynı şekilde okunacaktır.',
      },
      {
        title: 'Greenhouse',
        body:
          'Teknoloji şirketlerinde yaygın. Ayrıştırması iyidir ve kendi başına otomatik ret üretmez; eleme büyük ölçüde işe alım uzmanının aramalarıyla olur. Burada belirleyici olan anahtar kelimenin tam yazımıdır: uzman "React" diye aradığında CV\'nizde yalnızca "React.js" geçiyorsa sonuçlara çıkmayabilirsiniz. Terimi ilanda yazdığı gibi, bir kez de olsa aynen kullanın.',
      },
      {
        title: 'Lever',
        body:
          'Greenhouse\'a yakın bir mantıkta çalışır ve aday havuzunu arama üzerine kurar. Geçmiş başvurularınızı da aynı havuzda tutar; bu yüzden bir şirkete ikinci kez başvurduğunuzda eski CV\'niz de görünür. Güncel olmayan bir sürümü havuzda bırakmamak için başvurularınızı aynı dosyayla yapmak işinize yarar.',
      },
      {
        title: 'Taleo',
        body:
          'Oracle\'ın eski ama hâlâ çok yaygın sistemi; bankacılık, telekom, sigorta ve büyük perakendede sık karşınıza çıkar. Ayrıştırıcısı buradaki en katı olanıdır. Tablolar, metin kutuları ve iki sütunlu düzenler en çok burada dağılır; grafik olarak çizilmiş beceri çubukları ise hiç okunmaz. CV\'nizin en sade sürümünü gerektiren sistem budur.',
      },
      {
        title: 'iCIMS',
        body:
          'Kurumsal tarafta yaygın bir diğer sistem. Başvuru formunda sıklıkla ek eleme soruları sorar ve bunlara verdiğiniz cevaplar CV\'nizden önce değerlendirilir. Deneyim yılı ya da çalışma izni gibi bir soruya dikkatsiz verilmiş cevap, CV\'niz hiç okunmadan elenmenize yol açabilir.',
      },
    ],
    outro:
      'Ortak nokta şu: hiçbiri CV\'nizi sizin gördüğünüz gibi görmez. Hepsi önce düz metne indirger. Bu yüzden en katı sisteme göre hazırlanmış bir CV diğerlerinde de sorunsuz çalışır; tersi doğru değildir.',
  },
  {
    heading: 'Türkçe CV\'lerde ATS taramasını bozan biçim hataları',
    intro:
      'Aşağıdakiler CV\'nize bakınca görünmez, çünkü siz tasarladığınız PDF\'i görürsünüz; sistem ise ondan çıkardığı düz metni. Sıralama, gerçek analizlerde en sık rastladığımız düzenden gidiyor.',
    items: [
      {
        title: 'İki sütunlu şablonlar',
        body:
          'Şablon sitelerinin en popüler tasarımı ve ATS açısından en riskli olanı. Ayrıştırıcı metni soldan sağa okur; iki sütun varsa sol sütunun bir satırıyla sağ sütunun aynı hizadaki satırı birleşir. Sonuçta "Python İstanbul Üniversitesi" gibi hiçbir anlamı olmayan diziler ortaya çıkar ve beceri listeniz eğitim bilginizin içinde kaybolur.',
      },
      {
        title: 'Üstbilgi ve altbilgideki iletişim bilgileri',
        body:
          'Word ve Google Docs\'ta üstbilgi (header) alanına yazılan ad, telefon ve e-posta birçok ayrıştırıcı tarafından hiç okunmaz — çünkü teknik olarak sayfa gövdesinin dışındadır. Sistem sizi bulamadığı için kayıt "iletişim bilgisi eksik" olarak işaretlenir. İletişim satırınız her zaman sayfanın normal metin akışında, en üstte olmalıdır.',
      },
      {
        title: 'Tablolar',
        body:
          'Deneyimi ya da becerileri hizalamak için tablo kullanmak yaygın bir alışkanlıktır. Ayrıştırıcılar tabloyu ya hücre hücre düzleştirir ya da tamamen atlar; iki durumda da tarihlerle iş unvanları arasındaki ilişki kopar. Aynı hizalamayı sekme ya da basit paragraflarla yapmak güvenlidir.',
      },
      {
        title: 'Görsel olarak dışa aktarılmış PDF',
        body:
          'Canva, Figma veya benzeri bir tasarım aracından "resim olarak" çıkan PDF\'lerde metin diye bir şey yoktur; sayfa tek bir görseldir. Sistem tek kelime bile okuyamaz ve CV\'niz boş bir belge olarak kaydedilir. Kontrolü basittir: PDF\'i açıp bir kelimeyi fareyle seçmeyi deneyin. Seçemiyorsanız ATS de okuyamıyor demektir.',
      },
      {
        title: 'Türkçe karakterler ve gömülü olmayan fontlar',
        body:
          'Fontu gömmeyen bir PDF dışa aktarımında ç, ğ, ı, ö, ş, ü harfleri bozuk kodlanabilir. Ekranda doğru görünür, ancak çıkarılan metinde "mhendis" ya da "gelitirme" gibi sakat kelimeler oluşur. Bu hâliyle "mühendis" araması sizi bulamaz. PDF\'i standart bir font (Arial, Calibri, Times) ile ve font gömme açıkken kaydedin.',
      },
      {
        title: 'Beceri çubukları ve grafikler',
        body:
          '"İngilizce ●●●●○" ya da yüzdelik bir çubuk, ayrıştırıcı için hiçbir şey ifade etmez; en iyi ihtimalle sadece "İngilizce" kelimesi okunur, seviye bilgisi kaybolur. Seviyeyi kelimeyle yazın: "İngilizce — ileri seviye (C1)". Aynısı yıldızlı beceri değerlendirmeleri için de geçerlidir.',
      },
    ],
    outro:
      'Bunların hepsi biçim sorunudur; yani içeriğiniz güçlüyken bile elenmenize yol açabilirler. CVision\'ın ATS X-Ray özelliği tam da bu iki görüntüyü yan yana koyar: sizin gördüğünüz CV ve yazılımın gerçekten okuduğu hâli.',
  },
  {
    heading: 'Başvurmadan önce: kısa kontrol listesi',
    intro:
      'Bir CV\'yi ATS açısından güvenli hâle getirmek için gereken her şey aşağıda. Tasarımdan tamamen vazgeçmeniz gerekmiyor; sadece metnin makine tarafından okunabilir kalması gerekiyor.',
    items: [
      {
        title: 'Tek sütun, standart başlıklar',
        body:
          'Bölüm başlıklarını beklenen isimlerle yazın: Deneyim, Eğitim, Beceriler, Projeler, Sertifikalar. "Yolculuğum" ya da "Neler Yapabilirim" gibi yaratıcı başlıklar sistemin bölümü tanımasını engeller ve o bölüm hiç sayılmaz.',
      },
      {
        title: 'İlandaki terimleri birebir kullanın',
        body:
          'İlan "veri analizi" diyorsa CV\'nizde "data analytics" yazmak yetmez; her ikisini de geçirin. Kısaltmayı ve açılımını birlikte yazmak en güvenlisidir: "SEO (arama motoru optimizasyonu)".',
      },
      {
        title: 'Tarihleri tutarlı yazın',
        body:
          'Tek bir biçim seçin ve CV boyunca değiştirmeyin: "01/2023 – 06/2025" ya da "Ocak 2023 – Haziran 2025". Karışık biçimler deneyim sürenizin yanlış hesaplanmasına yol açar.',
      },
      {
        title: 'Sonuçları sayısallaştırın',
        body:
          '"Raporlama süreçlerini iyileştirdim" yerine "aylık raporlama süresini 3 günden 4 saate indirdim". Bu ATS puanını doğrudan yükseltmez, ama CV insana ulaştığında farkı yaratan tek şeydir — ve ATS aşamasını geçmenin amacı zaten budur.',
      },
      {
        title: 'PDF olarak kaydedin, aksi istenmedikçe',
        body:
          'PDF, biçimin her cihazda aynı kalmasını sağlar ve modern ayrıştırıcıların tamamı okur. İlan açıkça .doc veya .txt istiyorsa istediğini verin; istemiyorsa PDF en güvenli seçimdir.',
      },
      {
        title: 'Göndermeden önce test edin',
        body:
          'Son adım, CV\'yi hedeflediğiniz ilana karşı denemektir. Eksik anahtar kelimeleri ve biçim sorunlarını başvurduktan sonra değil, önce görmek istersiniz.',
      },
    ],
  },
];

const en: GuideSection[] = [
  {
    heading: 'What each ATS actually does: Workday, Greenhouse, Lever, Taleo, iCIMS',
    intro:
      '"ATS" is not one piece of software. It is a family of systems doing similar work with very different strictness, and which one you applied through changes how your CV gets read. Most corporate applications land in one of these five.',
    items: [
      {
        title: 'Workday',
        body:
          'The most common choice at large employers. It parses your CV and tries to fill the application form for you, then asks you to confirm the fields. That is one of the few moments you get to see parsing output with your own eyes: if the form came out wrong, the system read your CV wrong. Do not just fix the form and move on - fix the CV, because the same file will be read the same way at the next company.',
      },
      {
        title: 'Greenhouse',
        body:
          'Common in tech. It parses well and does not auto-reject on its own; screening happens mostly through recruiter searches. What decides your fate here is the exact spelling of a keyword: if a recruiter searches "React" and your CV only ever says "React.js", you may not appear at all. Use the term once exactly as the job ad writes it.',
      },
      {
        title: 'Lever',
        body:
          'Works on similar principles to Greenhouse and is built around searching a candidate pool. It keeps your past applications in that same pool, so applying to a company twice means an older CV of yours is visible too. Applying with the same up-to-date file each time keeps a stale version from representing you.',
      },
      {
        title: 'Taleo',
        body:
          "Oracle's older system, still very widely used in banking, telecoms, insurance and large retail. Its parser is the strictest of the group. Tables, text boxes and two-column layouts break here more than anywhere else, and skill bars drawn as graphics are not read at all. This is the system that demands the plainest version of your CV.",
      },
      {
        title: 'iCIMS',
        body:
          'Another common enterprise system. It often adds knockout questions to the application form, and your answers are evaluated before your CV is. A careless answer about years of experience or work authorisation can end the application before anyone reads a word you wrote.',
      },
    ],
    outro:
      'The common thread: none of them sees your CV the way you do. All of them reduce it to plain text first. A CV built for the strictest parser works everywhere else; the reverse is not true.',
  },
  {
    heading: 'The formatting mistakes that break ATS parsing',
    intro:
      'None of these are visible when you look at your own CV, because you see the PDF you designed and the system sees the plain text it extracted. Ordered roughly by how often they show up in real analyses.',
    items: [
      {
        title: 'Two-column templates',
        body:
          'The most popular design on template sites and the riskiest one for ATS. Parsers read left to right; with two columns, a line from the left column merges with whatever sits beside it on the right. You end up with strings like "Python University of Istanbul", and your skills list disappears into your education.',
      },
      {
        title: 'Contact details in the header or footer',
        body:
          'A name, phone number and email typed into the header area in Word or Google Docs are invisible to many parsers, because technically they sit outside the page body. The system cannot find you, so the record is flagged as missing contact information. Your contact line belongs in the normal text flow, at the top of the page.',
      },
      {
        title: 'Tables',
        body:
          'Using a table to align roles and dates is a common habit. Parsers either flatten it cell by cell or skip it entirely, and either way the link between a job title and its dates is lost. The same alignment done with tabs or plain paragraphs is safe.',
      },
      {
        title: 'PDFs exported as images',
        body:
          'A PDF exported "as an image" from Canva, Figma or a similar tool contains no text at all - the page is one picture. The system reads nothing and stores your CV as an empty document. The check takes a second: open the PDF and try to select a word with your mouse. If you cannot, neither can the ATS.',
      },
      {
        title: 'Non-embedded fonts and accented characters',
        body:
          'When a PDF is exported without embedding its fonts, accented characters can be encoded wrongly. It looks correct on screen, but the extracted text comes out mangled, and a search for the correct spelling will never find you. Save with a standard font (Arial, Calibri, Times) and font embedding on.',
      },
      {
        title: 'Skill bars and charts',
        body:
          '"English ●●●●○" or a percentage bar means nothing to a parser; at best the word "English" survives and the level is lost. Write the level as words: "English — advanced (C1)". The same goes for star ratings.',
      },
    ],
    outro:
      "Every one of these is a formatting problem, which means they can get a strong candidate rejected. CVision's ATS X-Ray puts the two views side by side: the CV you see, and the text the software actually reads.",
  },
  {
    heading: 'Before you apply: a short checklist',
    intro:
      'Everything it takes to make a CV safe for ATS. You do not have to give up on design - the text just has to stay machine-readable.',
    items: [
      {
        title: 'One column, standard headings',
        body:
          'Name your sections what the system expects: Experience, Education, Skills, Projects, Certifications. Creative headings like "My Journey" stop the parser recognising the section, and a section it cannot recognise does not count.',
      },
      {
        title: 'Mirror the wording in the job ad',
        body:
          'If the ad says "data analysis", writing only "analytics" is not enough - include both. Spelling out an acronym alongside itself is the safest form: "SEO (search engine optimisation)".',
      },
      {
        title: 'Keep dates consistent',
        body:
          'Pick one format and never change it: "01/2023 – 06/2025" or "January 2023 – June 2025". Mixed formats lead to your total experience being calculated wrongly.',
      },
      {
        title: 'Quantify outcomes',
        body:
          '"Improved the reporting process" becomes "cut monthly reporting from 3 days to 4 hours". This does not raise your ATS score directly, but it is the thing that matters once a human sees the CV - which is the entire point of getting past the ATS.',
      },
      {
        title: 'Save as PDF, unless told otherwise',
        body:
          'PDF keeps the formatting identical on every device and every modern parser reads it. If the ad explicitly asks for .doc or .txt, give it what it asks for; otherwise PDF is the safest choice.',
      },
      {
        title: 'Test it before you send it',
        body:
          'The last step is running the CV against the job ad you are targeting. You want to see the missing keywords and formatting problems before you apply, not after.',
      },
    ],
  },
];

/**
 * Extra sections by language. Absent means the page renders only its original
 * six sections, which is exactly what those languages show today - deliberately
 * NOT falling back to English, because half a page in another language is worse
 * than the shorter page a visitor already has.
 */
export const ATS_GUIDE_EXTRA: Partial<Record<string, GuideSection[]>> = { tr, en };
