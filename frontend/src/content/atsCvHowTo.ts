import type { GuideSection } from './atsGuide';

/**
 * The /ats-uyumlu-cv-nasil-hazirlanir guide.
 *
 * Deliberately a different page from /how-ats-works, not a keyword variant of
 * it. That one answers "what is this system and why did it reject me"; this one
 * answers "what do I type, in what order". Two intents, two pages. Four
 * near-identical pages built around "ATS CV analizi", "özgeçmiş ATS kontrolü"
 * and so on would be doorway pages, which Google names and penalises.
 *
 * Same tr/en-only rule as atsGuide.ts: the languages without URLs of their own
 * cannot rank for this, and the page does not exist for them at all.
 */

const tr: GuideSection[] = [
  {
    heading: 'Önce doğru dosyayla başlayın',
    intro:
      'ATS uyumlu bir CV, sade görünen bir CV değildir; makinenin sonuna kadar okuyabildiği bir CV\'dir. En büyük kayıplar daha ilk adımda, dosyayı seçerken yaşanır.',
    items: [
      {
        title: 'Tek sütunlu, düz bir şablon seçin',
        body:
          'Yan panelli, iki sütunlu ve kutulu şablonlar tarayıcıda güzel görünür, ayrıştırıcıda dağılır. Metin soldan sağa okunduğu için sol sütundaki bir satır sağdakiyle birleşir ve ortaya anlamsız diziler çıkar. Word veya Google Docs\'un boş bir belgesi, çoğu ücretli şablondan daha güvenlidir.',
      },
      {
        title: 'Standart bir font kullanın ve fontu gömün',
        body:
          'Arial, Calibri, Helvetica, Times gibi yaygın fontlar her sistemde doğru çözülür. PDF dışa aktarırken font gömme seçeneğini açık bırakın; kapalıyken Türkçe karakterler bozuk kodlanır ve "mühendis" kelimesi çıkarılan metinde "mhendis" olur. Bu hâliyle o kelimeyle yapılan hiçbir arama sizi bulamaz.',
      },
      {
        title: 'PDF olarak kaydedin, metin seçilebilir olsun',
        body:
          'Kaydettikten sonra PDF\'i açın ve bir kelimeyi fareyle seçmeye çalışın. Seçemiyorsanız belge bir görselden ibarettir ve sistem tek kelime bile okuyamaz. İlan açıkça .doc ya da .txt istiyorsa istediğini verin; istemiyorsa PDF en güvenli seçimdir.',
      },
    ],
  },
  {
    heading: 'Bölümleri sistemin tanıdığı adlarla yazın',
    intro:
      'Ayrıştırıcı CV\'nizi başlıklara bakarak parçalara ayırır. Tanımadığı bir başlık, altındaki her şeyin sınıflandırılamaması demektir — yani o deneyim hiç yazılmamış gibi olur.',
    items: [
      {
        title: 'Beklenen başlıkları kullanın',
        body:
          'Deneyim (ya da İş Deneyimi), Eğitim, Beceriler, Projeler, Sertifikalar, Diller. "Yolculuğum", "Neler Yapabilirim", "Hakkımda Birkaç Kelime" gibi yaratıcı başlıklar bu eşleşmeyi bozar. Yaratıcılığı başlıkta değil, maddelerin içinde kullanın.',
      },
      {
        title: 'İletişim bilgilerini sayfanın gövdesine yazın',
        body:
          'Ad, telefon, e-posta, şehir ve LinkedIn adresiniz en üstte, normal metin akışında olmalı. Word\'ün üstbilgi (header) alanına yazılan iletişim bilgileri teknik olarak sayfa gövdesinin dışındadır ve birçok ayrıştırıcı tarafından hiç okunmaz; kayıt "iletişim bilgisi eksik" olarak işaretlenir.',
      },
      {
        title: 'Tarihleri tek bir biçimde yazın',
        body:
          '"01/2023 – 06/2025" ya da "Ocak 2023 – Haziran 2025" — hangisini seçerseniz seçin, CV boyunca değiştirmeyin. Karışık biçimler toplam deneyim sürenizin yanlış hesaplanmasına yol açar. Hâlâ çalışıyorsanız bitiş yerine "Devam ediyor" yazın.',
      },
    ],
  },
  {
    heading: 'İlanın diliyle konuşun',
    intro:
      'Anahtar kelime doldurma değil, eşleştirme. Sistem CV\'nizi ilanın metniyle karşılaştırır; aynı şeyi farklı kelimeyle anlatıyorsanız eşleşme oluşmaz.',
    items: [
      {
        title: 'Terimi ilanda geçtiği hâliyle bir kez yazın',
        body:
          'İlan "veri analizi" diyorsa CV\'nizde yalnızca "data analytics" yazmak yetmez; ikisini de geçirin. Kısaltmayı ve açılımını birlikte kullanmak en güvenlisidir: "SEO (arama motoru optimizasyonu)", "İK (insan kaynakları)".',
      },
      {
        title: 'Becerileri cümlenin içine yedirin',
        body:
          'Sonda uzun bir beceri listesi bulunması iyidir, ama aynı becerilerin deneyim maddelerinizin içinde de geçmesi gerekir. "Python" kelimesinin yalnızca listede geçmesi, onu gerçekten kullandığınızı göstermez; işe alım uzmanı arama yaptığında bağlamıyla birlikte görmek ister.',
      },
      {
        title: 'Seviyeleri kelimeyle yazın',
        body:
          'Grafik çubuklar ve yıldızlar ayrıştırıcı için görünmezdir; en iyi ihtimalle sadece "İngilizce" kelimesi okunur. Bunun yerine "İngilizce — ileri seviye (C1)", "Almanca — orta seviye (B1)" yazın.',
      },
    ],
  },
  {
    heading: 'Maddeleri sonuçla yazın',
    intro:
      'Buraya kadar olan her şey CV\'nizin okunmasını sağlar. Bu bölüm, okunduktan sonra ne olacağını belirler — ve ATS aşamasını geçmenin amacı zaten budur.',
    items: [
      {
        title: 'Fiil ile başlayın, sonuçla bitirin',
        body:
          '"Raporlama süreçlerinden sorumluydum" bir görev tanımıdır. "Aylık raporlama süresini 3 günden 4 saate indirdim" bir sonuçtur. İkincisi hem insana bir şey anlatır hem de içinde doğal olarak daha fazla anahtar kelime taşır.',
      },
      {
        title: 'Sayı bulun',
        body:
          'Her maddede sayı olmak zorunda değil, ama hiç olmaması dikkat çeker. Kaç kişilik ekip, kaç kullanıcı, yüzde kaç artış, ne kadar süre. Kesin rakamı bilmiyorsanız makul bir aralık verin; uydurmayın.',
      },
      {
        title: 'Rol başına 3–5 madde yeterli',
        body:
          'Uzun listeler okunmaz ve en güçlü maddenizi zayıflarının arasında kaybeder. En son ve en ilgili rol için 4–5, eskiler için 2–3 madde iyi bir dengedir.',
      },
    ],
    outro:
      'Bir sayfa mı iki sayfa mı sorusunun ATS açısından bir cevabı yok; sistem sayfa saymaz. İnsan açısından ise kural basittir: 5–7 yıla kadar bir sayfa, sonrası için iki sayfa fazlasıyla yeter.',
  },
  {
    heading: 'Göndermeden önce kontrol edin',
    intro:
      'Son adım, tahmin etmeyi bırakıp bakmaktır. CV\'nizin sistemin gözünde nasıl göründüğünü göndermeden önce görmek istersiniz.',
    items: [
      {
        title: 'Düz metne çevirip okuyun',
        body:
          'PDF\'inizin içeriğini bir metin düzenleyiciye yapıştırın. Sırasını kaybeden bölümler, birbirine giren satırlar ve kaybolan başlıklar orada hemen görünür. Bu, ayrıştırıcının gördüğüne en yakın manzaradır.',
      },
      {
        title: 'İlana karşı test edin',
        body:
          'Her başvuru için CV\'yi baştan yazmanız gerekmez, ama hedeflediğiniz ilana karşı bir kez kontrol etmeniz gerekir: hangi anahtar kelimeler eksik, hangi bölüm zayıf kalıyor. CVision bunu ücretsiz analizde yapar ve eksikleri madde madde gösterir.',
      },
    ],
  },
];

const en: GuideSection[] = [
  {
    heading: 'Start with the right file',
    intro:
      'An ATS-friendly CV is not a plain-looking CV; it is one the machine can read all the way through. Most of the damage is done at the first step, when you pick the file.',
    items: [
      {
        title: 'Choose a single-column, plain template',
        body:
          'Sidebars, two columns and boxed sections look good in a browser and fall apart in a parser. Text is read left to right, so a line in the left column merges with whatever sits beside it and produces strings that mean nothing. A blank Word or Google Docs document is safer than most paid templates.',
      },
      {
        title: 'Use a standard font and embed it',
        body:
          'Arial, Calibri, Helvetica and Times decode correctly everywhere. Leave font embedding on when you export the PDF; without it, accented characters are encoded wrongly and a word comes out mangled in the extracted text - and no search for the correct spelling will ever find you.',
      },
      {
        title: 'Save as PDF, with selectable text',
        body:
          'Open the saved PDF and try to select a word with your mouse. If you cannot, the document is just a picture and the system will read nothing at all. If the ad explicitly asks for .doc or .txt, give it what it asks for; otherwise PDF is the safest choice.',
      },
    ],
  },
  {
    heading: 'Name your sections what the system expects',
    intro:
      'A parser splits your CV by its headings. A heading it does not recognise means everything under it goes unclassified - which is the same as not having written it.',
    items: [
      {
        title: 'Use the expected headings',
        body:
          'Experience (or Work Experience), Education, Skills, Projects, Certifications, Languages. Creative headings like "My Journey" or "What I Can Do" break the match. Put the creativity in the bullets, not in the labels.',
      },
      {
        title: 'Keep contact details in the page body',
        body:
          'Name, phone, email, city and LinkedIn belong at the top, in the normal flow of the page. Contact details typed into a Word header sit outside the page body and are invisible to many parsers; the record comes back flagged as missing contact information.',
      },
      {
        title: 'Write dates one way',
        body:
          '"01/2023 – 06/2025" or "January 2023 – June 2025" - whichever you pick, never change it mid-document. Mixed formats lead to your total experience being calculated wrongly. If you are still in the role, write "Present" rather than leaving the end blank.',
      },
    ],
  },
  {
    heading: 'Speak the job ad\'s language',
    intro:
      'This is matching, not keyword stuffing. The system compares your CV to the text of the ad; if you describe the same thing in different words, no match forms.',
    items: [
      {
        title: 'Use the term exactly as the ad writes it, at least once',
        body:
          'If the ad says "data analysis", writing only "analytics" is not enough - include both. Spelling out an acronym alongside itself is the safest form: "SEO (search engine optimisation)", "HR (human resources)".',
      },
      {
        title: 'Work skills into the sentences',
        body:
          'A skills list at the end is good, but the same skills need to appear inside your experience bullets too. "Python" in a list does not show you used it; a recruiter searching for it wants to see it in context.',
      },
      {
        title: 'Write levels as words',
        body:
          'Bars and stars are invisible to a parser; at best the word "English" survives. Write "English — advanced (C1)", "German — intermediate (B1)" instead.',
      },
    ],
  },
  {
    heading: 'Write bullets that end in a result',
    intro:
      'Everything above gets your CV read. This part decides what happens once it is - which is the entire point of getting past the ATS.',
    items: [
      {
        title: 'Open with a verb, close with an outcome',
        body:
          '"Responsible for reporting processes" is a job description. "Cut monthly reporting from 3 days to 4 hours" is a result. The second tells a human something, and naturally carries more of the keywords too.',
      },
      {
        title: 'Find a number',
        body:
          'Not every bullet needs one, but none at all is conspicuous. Team size, users, percentage change, time saved. If you do not know the exact figure, give a defensible range - do not invent one.',
      },
      {
        title: 'Three to five bullets per role',
        body:
          'Long lists go unread and bury your strongest bullet among weaker ones. Four or five for the most recent and most relevant role, two or three for older ones, is a good balance.',
      },
    ],
    outro:
      'One page or two makes no difference to an ATS - it does not count pages. For a human the rule is simple: one page up to five to seven years of experience, two beyond that is plenty.',
  },
  {
    heading: 'Check it before you send it',
    intro:
      'The last step is to stop guessing and look. You want to see how your CV appears to the system before you apply, not after.',
    items: [
      {
        title: 'Paste it into a plain text editor',
        body:
          'Copy the contents of your PDF into any text editor. Sections that lose their order, lines that run into each other and headings that vanish all show up immediately. It is the closest view you get of what the parser sees.',
      },
      {
        title: 'Test it against the ad',
        body:
          'You do not need to rewrite your CV for every application, but you do need to check it against the one you are targeting: which keywords are missing, which section is thin. CVision does this in the free analysis and lists the gaps.',
      },
    ],
  },
];

export const ATS_CV_HOWTO: Partial<Record<string, GuideSection[]>> = { tr, en };
