# -*- coding: utf-8 -*-
"""Localized text for rule-based CV suggestions.

The rule-based SuggestionGenerator used to hardcode every message in English,
so a Turkish user reading a Turkish UI got half their analysis (the AI half) in
Turkish and half (these deterministic suggestions) in English. This module
holds each message as a COMPLETE sentence per language rather than fragments to
be concatenated: word order differs across languages, so "base text" + "tail"
would produce broken grammar in Turkish and German.

Keys ending in _tech are used for Software Engineering / Data & Analytics /
Cybersecurity CVs; _general keys are the field-agnostic wording everyone else
gets. {count} is a format placeholder.

SUPPORTED_LANGUAGES mirrors the five UI languages. An unknown language falls
back to English in the generator, never raising.
"""

SUPPORTED_LANGUAGES = ("en", "tr", "de", "fr", "es")

SUGGESTION_TEXTS: dict[str, dict[str, str]] = {
    "en": {
        "summary_missing": (
            "Add a Professional Summary or Objective section at the top of your CV. "
            "A 2-3 sentence summary helps recruiters quickly understand your profile "
            "and is one of the first things ATS systems scan."
        ),
        "skills_missing_tech": (
            "Add a dedicated Skills section listing your technical and soft skills. "
            "Use a comma-separated or bulleted format for easy ATS parsing. "
            "Include specific technologies, programming languages, and tools."
        ),
        "skills_missing_general": (
            "Add a dedicated Skills section listing your technical and soft skills. "
            "Use a comma-separated or bulleted format for easy ATS parsing. "
            "Include the specific tools, software, and methods used in your field."
        ),
        "experience_missing": (
            "Add a Work Experience or Internship section. Even if you're a student, "
            "include internships, part-time jobs, volunteer work, or freelance projects. "
            "Use the format: Job Title | Company | Date Range."
        ),
        "education_missing": (
            "Add an Education section with your degree, university name, "
            "and graduation date. Include your GPA if it's strong (e.g., 3.5+)."
        ),
        "projects_missing_tech": (
            "Consider adding a Projects section to showcase hands-on experience. "
            "Include 2-3 projects with brief descriptions, technologies used, "
            "and links to GitHub repositories if available."
        ),
        "projects_missing_general": (
            "Consider adding a Projects section to showcase hands-on experience. "
            "Include 2-3 projects or works with brief descriptions and links "
            "to a portfolio, showreel, or published pieces if available."
        ),
        "certifications_tech": (
            "Consider adding relevant certifications or online courses "
            "(e.g., AWS, Google, Coursera, Udemy) to strengthen your profile."
        ),
        "certifications_general": (
            "Consider adding relevant certifications or online courses "
            "(e.g., Coursera, Udemy, or recognized certificates in your field) "
            "to strengthen your profile."
        ),
        "ats_email": (
            "Include your email address at the top of your CV. "
            "This is essential for recruiter contact and ATS processing."
        ),
        "ats_contact": (
            "Add contact information (email, phone, LinkedIn) "
            "at the top of your CV for recruiter accessibility."
        ),
        "ats_action_verbs": (
            "Use strong action verbs to describe your achievements: "
            "'Developed', 'Implemented', 'Designed', 'Managed', 'Optimized'. "
            "Avoid passive phrases like 'responsible for' or 'was part of'."
        ),
        "ats_length_short": (
            "Your CV appears too brief. Aim for at least one full page. "
            "Expand on your experiences with specific achievements, "
            "use bullet points, and quantify results where possible."
        ),
        "ats_caps": (
            "Reduce the use of ALL CAPS formatting. Use bold text or "
            "larger font sizes for headers instead - ATS systems may "
            "misinterpret excessive capitalization."
        ),
        "skills_few_tech": (
            "Only {count} recognized skills were detected. "
            "List more specific technical skills (e.g., Python, React, SQL, Docker). "
            "Aim for at least 8-12 relevant skills for a competitive profile."
        ),
        "skills_few_general": (
            "Only {count} recognized skills were detected. "
            "List more of the concrete skills, tools, and software used in your field. "
            "Aim for at least 8-12 relevant skills for a competitive profile."
        ),
        "skills_diversity_tech": (
            "Your skills are concentrated in few categories. "
            "Diversify by adding skills from different areas: "
            "programming languages, frameworks, databases, tools, and soft skills."
        ),
        "skills_diversity_general": (
            "Your skills are concentrated in few categories. "
            "Diversify by adding skills from different areas: "
            "core field skills, tools and software, and transferable soft skills."
        ),
        "quantify_default_tech": (
            "Quantify your achievements in experience descriptions. "
            "Use numbers: 'Improved API response time by 40%', "
            "'Managed a team of 5', 'Served 1000+ daily users'."
        ),
        "quantify_default_general": (
            "Quantify your achievements in experience descriptions. "
            "Use numbers: 'Managed a team of 5', 'Delivered 12 projects', "
            "'Grew the audience by 40%'."
        ),
        "quantify_highlighted": (
            "Your CV needs more specific numbers. We've highlighted sentences that "
            "use strong action verbs but lack quantifiable metrics (numbers, "
            "percentages, or scale). Describe exactly what you achieved."
        ),
        "keywords_missing": (
            "Your CV lacks industry-standard keywords. Review job descriptions "
            "for your target role and incorporate relevant terms naturally. "
            "Keywords help both ATS systems and human reviewers."
        ),
        "default_formatting": (
            "Use consistent formatting throughout: same font, "
            "aligned dates, uniform bullet points, and clear section headers."
        ),
        "default_tailor": (
            "Tailor your CV for each application. Adjust keywords and "
            "highlight the most relevant experience for the specific role."
        ),
        "default_length": (
            "Keep your CV to 1-2 pages. Remove outdated or irrelevant "
            "information and focus on your most impactful experiences."
        ),
    },
    "tr": {
        "summary_missing": (
            "CV'nin en üstüne bir Özet veya Kariyer Hedefi bölümü ekle. "
            "2-3 cümlelik bir özet, işe alım uzmanlarının profilini hızlıca "
            "anlamasını sağlar ve ATS sistemlerinin ilk taradığı yerlerden biridir."
        ),
        "skills_missing_tech": (
            "Teknik ve kişisel becerilerini listeleyen ayrı bir Yetenekler bölümü ekle. "
            "ATS'nin kolay ayrıştırması için virgülle ayrılmış veya madde işaretli bir "
            "biçim kullan. Kullandığın teknolojileri, programlama dillerini ve araçları belirt."
        ),
        "skills_missing_general": (
            "Teknik ve kişisel becerilerini listeleyen ayrı bir Yetenekler bölümü ekle. "
            "ATS'nin kolay ayrıştırması için virgülle ayrılmış veya madde işaretli bir "
            "biçim kullan. Alanında kullandığın araçları, yazılımları ve yöntemleri belirt."
        ),
        "experience_missing": (
            "Bir İş Deneyimi veya Staj bölümü ekle. Öğrenci olsan bile stajları, "
            "yarı zamanlı işleri, gönüllü çalışmaları veya serbest projeleri dahil et. "
            "Şu biçimi kullan: Pozisyon | Şirket | Tarih Aralığı."
        ),
        "education_missing": (
            "Derecen, üniversite adın ve mezuniyet tarihinle bir Eğitim bölümü ekle. "
            "Not ortalaman yüksekse (örneğin 3.5+) onu da belirt."
        ),
        "projects_missing_tech": (
            "Uygulamalı deneyimini göstermek için bir Projeler bölümü eklemeyi düşün. "
            "Kısa açıklamaları, kullandığın teknolojileri ve varsa GitHub bağlantılarını "
            "içeren 2-3 proje ekle."
        ),
        "projects_missing_general": (
            "Uygulamalı deneyimini göstermek için bir Projeler bölümü eklemeyi düşün. "
            "Kısa açıklamaları ve varsa portfolyo, tanıtım videosu ya da yayımlanmış "
            "çalışmalara bağlantıları içeren 2-3 proje veya çalışma ekle."
        ),
        "certifications_tech": (
            "Profilini güçlendirmek için ilgili sertifikaları veya çevrimiçi kursları "
            "(örneğin AWS, Google, Coursera, Udemy) eklemeyi düşün."
        ),
        "certifications_general": (
            "Profilini güçlendirmek için ilgili sertifikaları veya çevrimiçi kursları "
            "(örneğin Coursera, Udemy veya alanında tanınan sertifikalar) eklemeyi düşün."
        ),
        "ats_email": (
            "CV'nin en üstüne e-posta adresini ekle. Bu, işe alım uzmanının seninle "
            "iletişime geçmesi ve ATS'nin işlemesi için gereklidir."
        ),
        "ats_contact": (
            "İşe alım uzmanının kolayca ulaşabilmesi için CV'nin en üstüne iletişim "
            "bilgilerini (e-posta, telefon, LinkedIn) ekle."
        ),
        "ats_action_verbs": (
            "Başarılarını anlatırken güçlü eylem fiilleri kullan: "
            "'Geliştirdim', 'Uyguladım', 'Tasarladım', 'Yönettim', 'İyileştirdim'. "
            "'Sorumluydum' veya 'yer aldım' gibi edilgen ifadelerden kaçın."
        ),
        "ats_length_short": (
            "CV'n fazla kısa görünüyor. En az bir tam sayfa hedefle. "
            "Deneyimlerini somut başarılarla genişlet, madde işaretleri kullan "
            "ve mümkün olduğunca sonuçları sayısallaştır."
        ),
        "ats_caps": (
            "TAMAMEN BÜYÜK HARF kullanımını azalt. Bunun yerine başlıklar için kalın "
            "yazı veya daha büyük punto kullan - ATS sistemleri aşırı büyük harfi "
            "yanlış yorumlayabilir."
        ),
        "skills_few_tech": (
            "Yalnızca {count} tanınan beceri tespit edildi. "
            "Daha fazla somut teknik beceri ekle (örneğin Python, React, SQL, Docker). "
            "Rekabetçi bir profil için en az 8-12 ilgili beceri hedefle."
        ),
        "skills_few_general": (
            "Yalnızca {count} tanınan beceri tespit edildi. "
            "Alanında kullandığın somut becerileri, araçları ve yazılımları daha fazla ekle. "
            "Rekabetçi bir profil için en az 8-12 ilgili beceri hedefle."
        ),
        "skills_diversity_tech": (
            "Becerilerin az sayıda kategoride yoğunlaşmış. Farklı alanlardan beceriler "
            "ekleyerek çeşitlendir: programlama dilleri, çerçeveler, veritabanları, "
            "araçlar ve kişisel beceriler."
        ),
        "skills_diversity_general": (
            "Becerilerin az sayıda kategoride yoğunlaşmış. Farklı alanlardan beceriler "
            "ekleyerek çeşitlendir: temel alan becerileri, araçlar ve yazılımlar ile "
            "aktarılabilir kişisel beceriler."
        ),
        "quantify_default_tech": (
            "Deneyim açıklamalarında başarılarını sayısallaştır. Sayılar kullan: "
            "'API yanıt süresini %40 iyileştirdim', '5 kişilik bir ekibi yönettim', "
            "'Günde 1000+ kullanıcıya hizmet verdim'."
        ),
        "quantify_default_general": (
            "Deneyim açıklamalarında başarılarını sayısallaştır. Sayılar kullan: "
            "'5 kişilik bir ekibi yönettim', '12 proje teslim ettim', "
            "'Kitleyi %40 büyüttüm'."
        ),
        "quantify_highlighted": (
            "CV'nde daha fazla somut sayı gerekiyor. Güçlü eylem fiilleri kullanan ama "
            "ölçülebilir veri (sayı, yüzde veya ölçek) içermeyen cümleleri vurguladık. "
            "Tam olarak neyi başardığını anlat."
        ),
        "keywords_missing": (
            "CV'nde sektör standardı anahtar kelimeler eksik. Hedeflediğin pozisyon için "
            "iş ilanlarını incele ve ilgili terimleri doğal bir şekilde ekle. Anahtar "
            "kelimeler hem ATS sistemlerine hem de insan değerlendiricilere yardımcı olur."
        ),
        "default_formatting": (
            "Baştan sona tutarlı bir biçim kullan: aynı yazı tipi, hizalı tarihler, "
            "tek tip madde işaretleri ve net bölüm başlıkları."
        ),
        "default_tailor": (
            "CV'ni her başvuru için uyarla. Anahtar kelimeleri ayarla ve o pozisyon "
            "için en ilgili deneyimini öne çıkar."
        ),
        "default_length": (
            "CV'ni 1-2 sayfada tut. Güncelliğini yitirmiş veya ilgisiz bilgileri çıkar "
            "ve en etkili deneyimlerine odaklan."
        ),
    },
    "de": {
        "summary_missing": (
            "Fügen Sie oben in Ihrem Lebenslauf einen Abschnitt mit einem beruflichen "
            "Profil oder Ziel hinzu. Eine Zusammenfassung von 2-3 Sätzen hilft Personalern, "
            "Ihr Profil schnell zu erfassen, und gehört zu den ersten Dingen, die ATS-Systeme scannen."
        ),
        "skills_missing_tech": (
            "Fügen Sie einen eigenen Abschnitt für Kenntnisse hinzu, der Ihre fachlichen "
            "und persönlichen Fähigkeiten auflistet. Verwenden Sie eine durch Kommas "
            "getrennte oder eine Aufzählungsform, damit ATS sie leicht auslesen kann. "
            "Nennen Sie konkrete Technologien, Programmiersprachen und Werkzeuge."
        ),
        "skills_missing_general": (
            "Fügen Sie einen eigenen Abschnitt für Kenntnisse hinzu, der Ihre fachlichen "
            "und persönlichen Fähigkeiten auflistet. Verwenden Sie eine durch Kommas "
            "getrennte oder eine Aufzählungsform, damit ATS sie leicht auslesen kann. "
            "Nennen Sie die konkreten Werkzeuge, Programme und Methoden Ihres Fachgebiets."
        ),
        "experience_missing": (
            "Fügen Sie einen Abschnitt für Berufserfahrung oder Praktika hinzu. Auch als "
            "Studierende sollten Sie Praktika, Teilzeitjobs, ehrenamtliche Tätigkeiten oder "
            "freiberufliche Projekte aufnehmen. Format: Position | Unternehmen | Zeitraum."
        ),
        "education_missing": (
            "Fügen Sie einen Abschnitt zur Ausbildung mit Ihrem Abschluss, dem Namen der "
            "Hochschule und dem Abschlussdatum hinzu. Nennen Sie Ihren Notendurchschnitt, "
            "wenn er gut ist."
        ),
        "projects_missing_tech": (
            "Erwägen Sie einen Abschnitt für Projekte, um praktische Erfahrung zu zeigen. "
            "Nehmen Sie 2-3 Projekte mit kurzen Beschreibungen, verwendeten Technologien "
            "und - falls vorhanden - Links zu GitHub-Repositories auf."
        ),
        "projects_missing_general": (
            "Erwägen Sie einen Abschnitt für Projekte, um praktische Erfahrung zu zeigen. "
            "Nehmen Sie 2-3 Projekte oder Arbeiten mit kurzen Beschreibungen und - falls "
            "vorhanden - Links zu einem Portfolio, Showreel oder veröffentlichten Arbeiten auf."
        ),
        "certifications_tech": (
            "Erwägen Sie relevante Zertifikate oder Online-Kurse (z. B. AWS, Google, "
            "Coursera, Udemy), um Ihr Profil zu stärken."
        ),
        "certifications_general": (
            "Erwägen Sie relevante Zertifikate oder Online-Kurse (z. B. Coursera, Udemy "
            "oder anerkannte Zertifikate Ihres Fachgebiets), um Ihr Profil zu stärken."
        ),
        "ats_email": (
            "Geben Sie oben in Ihrem Lebenslauf Ihre E-Mail-Adresse an. Sie ist für die "
            "Kontaktaufnahme durch Personaler und die ATS-Verarbeitung unerlässlich."
        ),
        "ats_contact": (
            "Fügen Sie oben in Ihrem Lebenslauf Kontaktdaten (E-Mail, Telefon, LinkedIn) "
            "hinzu, damit Personaler Sie erreichen können."
        ),
        "ats_action_verbs": (
            "Beschreiben Sie Ihre Erfolge mit starken Handlungsverben: 'Entwickelt', "
            "'Umgesetzt', 'Konzipiert', 'Geleitet', 'Optimiert'. Vermeiden Sie passive "
            "Formulierungen wie 'verantwortlich für' oder 'war Teil von'."
        ),
        "ats_length_short": (
            "Ihr Lebenslauf wirkt zu kurz. Streben Sie mindestens eine volle Seite an. "
            "Führen Sie Ihre Erfahrungen mit konkreten Erfolgen aus, verwenden Sie "
            "Aufzählungspunkte und beziffern Sie Ergebnisse, wo möglich."
        ),
        "ats_caps": (
            "Reduzieren Sie die Verwendung von DURCHGEHENDER GROSSSCHREIBUNG. Verwenden "
            "Sie stattdessen Fettdruck oder größere Schriftgrade für Überschriften - "
            "ATS-Systeme können übermäßige Großschreibung falsch interpretieren."
        ),
        "skills_few_tech": (
            "Es wurden nur {count} erkannte Fähigkeiten gefunden. Nennen Sie mehr konkrete "
            "Fachkenntnisse (z. B. Python, React, SQL, Docker). Streben Sie mindestens "
            "8-12 relevante Fähigkeiten für ein konkurrenzfähiges Profil an."
        ),
        "skills_few_general": (
            "Es wurden nur {count} erkannte Fähigkeiten gefunden. Nennen Sie mehr der "
            "konkreten Fähigkeiten, Werkzeuge und Programme Ihres Fachgebiets. Streben Sie "
            "mindestens 8-12 relevante Fähigkeiten für ein konkurrenzfähiges Profil an."
        ),
        "skills_diversity_tech": (
            "Ihre Fähigkeiten konzentrieren sich auf wenige Kategorien. Erweitern Sie sie "
            "um Fähigkeiten aus verschiedenen Bereichen: Programmiersprachen, Frameworks, "
            "Datenbanken, Werkzeuge und persönliche Fähigkeiten."
        ),
        "skills_diversity_general": (
            "Ihre Fähigkeiten konzentrieren sich auf wenige Kategorien. Erweitern Sie sie "
            "um Fähigkeiten aus verschiedenen Bereichen: fachliche Kernkompetenzen, "
            "Werkzeuge und Programme sowie übertragbare persönliche Fähigkeiten."
        ),
        "quantify_default_tech": (
            "Beziffern Sie Ihre Erfolge in den Erfahrungsbeschreibungen. Nutzen Sie Zahlen: "
            "'API-Antwortzeit um 40 % verbessert', 'Ein Team von 5 Personen geleitet', "
            "'Täglich 1000+ Nutzer betreut'."
        ),
        "quantify_default_general": (
            "Beziffern Sie Ihre Erfolge in den Erfahrungsbeschreibungen. Nutzen Sie Zahlen: "
            "'Ein Team von 5 Personen geleitet', '12 Projekte abgeschlossen', "
            "'Die Zielgruppe um 40 % vergrößert'."
        ),
        "quantify_highlighted": (
            "Ihr Lebenslauf braucht mehr konkrete Zahlen. Wir haben Sätze hervorgehoben, die "
            "starke Handlungsverben verwenden, aber keine messbaren Kennzahlen (Zahlen, "
            "Prozente oder Größenordnungen) enthalten. Beschreiben Sie genau, was Sie erreicht haben."
        ),
        "keywords_missing": (
            "Ihrem Lebenslauf fehlen branchenübliche Schlüsselwörter. Sehen Sie sich "
            "Stellenausschreibungen für Ihre Zielposition an und bauen Sie relevante "
            "Begriffe natürlich ein. Schlüsselwörter helfen sowohl ATS-Systemen als auch "
            "menschlichen Prüfern."
        ),
        "default_formatting": (
            "Verwenden Sie durchgängig eine einheitliche Formatierung: gleiche Schriftart, "
            "einheitlich ausgerichtete Daten, gleichmäßige Aufzählungspunkte und klare "
            "Abschnittsüberschriften."
        ),
        "default_tailor": (
            "Passen Sie Ihren Lebenslauf an jede Bewerbung an. Justieren Sie die "
            "Schlüsselwörter und heben Sie die für die jeweilige Stelle relevanteste "
            "Erfahrung hervor."
        ),
        "default_length": (
            "Halten Sie Ihren Lebenslauf auf 1-2 Seiten. Entfernen Sie veraltete oder "
            "irrelevante Informationen und konzentrieren Sie sich auf Ihre wirkungsvollsten "
            "Erfahrungen."
        ),
    },
    "fr": {
        "summary_missing": (
            "Ajoutez une rubrique Résumé ou Objectif professionnel en haut de votre CV. "
            "Un résumé de 2 à 3 phrases aide les recruteurs à cerner rapidement votre "
            "profil et fait partie des premiers éléments analysés par les systèmes ATS."
        ),
        "skills_missing_tech": (
            "Ajoutez une rubrique Compétences dédiée listant vos compétences techniques et "
            "personnelles. Utilisez un format à puces ou séparé par des virgules pour "
            "faciliter l'analyse par l'ATS. Précisez les technologies, langages de "
            "programmation et outils que vous maîtrisez."
        ),
        "skills_missing_general": (
            "Ajoutez une rubrique Compétences dédiée listant vos compétences techniques et "
            "personnelles. Utilisez un format à puces ou séparé par des virgules pour "
            "faciliter l'analyse par l'ATS. Précisez les outils, logiciels et méthodes "
            "propres à votre domaine."
        ),
        "experience_missing": (
            "Ajoutez une rubrique Expérience professionnelle ou Stages. Même en tant "
            "qu'étudiant, incluez stages, emplois à temps partiel, bénévolat ou projets en "
            "freelance. Format : Poste | Entreprise | Période."
        ),
        "education_missing": (
            "Ajoutez une rubrique Formation avec votre diplôme, le nom de l'établissement "
            "et la date d'obtention. Indiquez votre moyenne si elle est élevée."
        ),
        "projects_missing_tech": (
            "Envisagez d'ajouter une rubrique Projets pour montrer votre expérience "
            "concrète. Incluez 2 à 3 projets avec de brèves descriptions, les technologies "
            "utilisées et, le cas échéant, des liens vers vos dépôts GitHub."
        ),
        "projects_missing_general": (
            "Envisagez d'ajouter une rubrique Projets pour montrer votre expérience "
            "concrète. Incluez 2 à 3 projets ou réalisations avec de brèves descriptions "
            "et, le cas échéant, des liens vers un portfolio, une bande démo ou des "
            "travaux publiés."
        ),
        "certifications_tech": (
            "Envisagez d'ajouter des certifications ou des cours en ligne pertinents "
            "(par ex. AWS, Google, Coursera, Udemy) pour renforcer votre profil."
        ),
        "certifications_general": (
            "Envisagez d'ajouter des certifications ou des cours en ligne pertinents "
            "(par ex. Coursera, Udemy ou des certificats reconnus dans votre domaine) "
            "pour renforcer votre profil."
        ),
        "ats_email": (
            "Indiquez votre adresse e-mail en haut de votre CV. Elle est essentielle pour "
            "que les recruteurs vous contactent et pour le traitement par l'ATS."
        ),
        "ats_contact": (
            "Ajoutez vos coordonnées (e-mail, téléphone, LinkedIn) en haut de votre CV "
            "pour que les recruteurs puissent vous joindre."
        ),
        "ats_action_verbs": (
            "Décrivez vos réalisations avec des verbes d'action forts : 'Développé', "
            "'Mis en œuvre', 'Conçu', 'Géré', 'Optimisé'. Évitez les formulations passives "
            "comme 'responsable de' ou 'a participé à'."
        ),
        "ats_length_short": (
            "Votre CV semble trop bref. Visez au moins une page complète. Développez vos "
            "expériences avec des réalisations concrètes, utilisez des puces et chiffrez "
            "les résultats lorsque c'est possible."
        ),
        "ats_caps": (
            "Réduisez l'usage des MAJUSCULES. Utilisez plutôt le gras ou une police plus "
            "grande pour les titres - les systèmes ATS peuvent mal interpréter un excès "
            "de majuscules."
        ),
        "skills_few_tech": (
            "Seulement {count} compétences reconnues ont été détectées. Ajoutez davantage "
            "de compétences techniques concrètes (par ex. Python, React, SQL, Docker). "
            "Visez au moins 8 à 12 compétences pertinentes pour un profil compétitif."
        ),
        "skills_few_general": (
            "Seulement {count} compétences reconnues ont été détectées. Ajoutez davantage "
            "des compétences, outils et logiciels concrets de votre domaine. Visez au "
            "moins 8 à 12 compétences pertinentes pour un profil compétitif."
        ),
        "skills_diversity_tech": (
            "Vos compétences sont concentrées dans peu de catégories. Diversifiez en "
            "ajoutant des compétences de différents domaines : langages de programmation, "
            "frameworks, bases de données, outils et compétences personnelles."
        ),
        "skills_diversity_general": (
            "Vos compétences sont concentrées dans peu de catégories. Diversifiez en "
            "ajoutant des compétences de différents domaines : compétences clés du métier, "
            "outils et logiciels, et compétences personnelles transférables."
        ),
        "quantify_default_tech": (
            "Chiffrez vos réalisations dans les descriptions d'expérience. Utilisez des "
            "chiffres : 'Amélioré le temps de réponse de l'API de 40 %', 'Géré une équipe "
            "de 5 personnes', 'Servi plus de 1000 utilisateurs par jour'."
        ),
        "quantify_default_general": (
            "Chiffrez vos réalisations dans les descriptions d'expérience. Utilisez des "
            "chiffres : 'Géré une équipe de 5 personnes', 'Livré 12 projets', "
            "'Augmenté l'audience de 40 %'."
        ),
        "quantify_highlighted": (
            "Votre CV a besoin de chiffres plus précis. Nous avons mis en évidence les "
            "phrases qui utilisent des verbes d'action forts mais manquent de mesures "
            "quantifiables (chiffres, pourcentages ou échelle). Décrivez exactement ce "
            "que vous avez accompli."
        ),
        "keywords_missing": (
            "Il manque à votre CV des mots-clés propres au secteur. Consultez des offres "
            "d'emploi pour le poste visé et intégrez naturellement les termes pertinents. "
            "Les mots-clés aident aussi bien les systèmes ATS que les recruteurs humains."
        ),
        "default_formatting": (
            "Utilisez une mise en forme cohérente d'un bout à l'autre : même police, dates "
            "alignées, puces uniformes et titres de rubrique clairs."
        ),
        "default_tailor": (
            "Adaptez votre CV à chaque candidature. Ajustez les mots-clés et mettez en "
            "avant l'expérience la plus pertinente pour le poste concerné."
        ),
        "default_length": (
            "Limitez votre CV à 1 ou 2 pages. Supprimez les informations obsolètes ou non "
            "pertinentes et concentrez-vous sur vos expériences les plus marquantes."
        ),
    },
    "es": {
        "summary_missing": (
            "Añade una sección de Resumen u Objetivo profesional al principio de tu CV. "
            "Un resumen de 2-3 frases ayuda a los reclutadores a entender rápidamente tu "
            "perfil y es una de las primeras cosas que analizan los sistemas ATS."
        ),
        "skills_missing_tech": (
            "Añade una sección de Habilidades específica que enumere tus competencias "
            "técnicas y personales. Usa un formato separado por comas o con viñetas para "
            "facilitar el análisis del ATS. Incluye las tecnologías, lenguajes de "
            "programación y herramientas concretas que dominas."
        ),
        "skills_missing_general": (
            "Añade una sección de Habilidades específica que enumere tus competencias "
            "técnicas y personales. Usa un formato separado por comas o con viñetas para "
            "facilitar el análisis del ATS. Incluye las herramientas, programas y métodos "
            "concretos que se usan en tu campo."
        ),
        "experience_missing": (
            "Añade una sección de Experiencia laboral o Prácticas. Aunque seas estudiante, "
            "incluye prácticas, trabajos a tiempo parcial, voluntariado o proyectos "
            "freelance. Formato: Puesto | Empresa | Período."
        ),
        "education_missing": (
            "Añade una sección de Formación con tu titulación, el nombre de la universidad "
            "y la fecha de graduación. Indica tu nota media si es alta."
        ),
        "projects_missing_tech": (
            "Considera añadir una sección de Proyectos para mostrar experiencia práctica. "
            "Incluye 2-3 proyectos con descripciones breves, las tecnologías utilizadas y, "
            "si los tienes, enlaces a tus repositorios de GitHub."
        ),
        "projects_missing_general": (
            "Considera añadir una sección de Proyectos para mostrar experiencia práctica. "
            "Incluye 2-3 proyectos o trabajos con descripciones breves y, si los tienes, "
            "enlaces a un portafolio, un vídeo de presentación o trabajos publicados."
        ),
        "certifications_tech": (
            "Considera añadir certificaciones o cursos en línea relevantes (por ejemplo, "
            "AWS, Google, Coursera, Udemy) para reforzar tu perfil."
        ),
        "certifications_general": (
            "Considera añadir certificaciones o cursos en línea relevantes (por ejemplo, "
            "Coursera, Udemy o certificados reconocidos en tu campo) para reforzar tu perfil."
        ),
        "ats_email": (
            "Incluye tu dirección de correo electrónico al principio del CV. Es esencial "
            "para que los reclutadores te contacten y para el procesamiento del ATS."
        ),
        "ats_contact": (
            "Añade tus datos de contacto (correo electrónico, teléfono, LinkedIn) al "
            "principio del CV para que los reclutadores puedan localizarte."
        ),
        "ats_action_verbs": (
            "Describe tus logros con verbos de acción potentes: 'Desarrollé', 'Implementé', "
            "'Diseñé', 'Gestioné', 'Optimicé'. Evita expresiones pasivas como 'responsable "
            "de' o 'formé parte de'."
        ),
        "ats_length_short": (
            "Tu CV parece demasiado breve. Apunta al menos a una página completa. Amplía "
            "tus experiencias con logros concretos, usa viñetas y cuantifica los resultados "
            "siempre que sea posible."
        ),
        "ats_caps": (
            "Reduce el uso de MAYÚSCULAS. Utiliza en su lugar negrita o un tamaño de fuente "
            "mayor para los títulos: los sistemas ATS pueden malinterpretar el exceso de "
            "mayúsculas."
        ),
        "skills_few_tech": (
            "Solo se detectaron {count} habilidades reconocidas. Enumera más habilidades "
            "técnicas concretas (por ejemplo, Python, React, SQL, Docker). Apunta al menos "
            "a 8-12 habilidades relevantes para un perfil competitivo."
        ),
        "skills_few_general": (
            "Solo se detectaron {count} habilidades reconocidas. Enumera más de las "
            "habilidades, herramientas y programas concretos de tu campo. Apunta al menos "
            "a 8-12 habilidades relevantes para un perfil competitivo."
        ),
        "skills_diversity_tech": (
            "Tus habilidades se concentran en pocas categorías. Diversifica añadiendo "
            "habilidades de distintas áreas: lenguajes de programación, frameworks, bases "
            "de datos, herramientas y habilidades personales."
        ),
        "skills_diversity_general": (
            "Tus habilidades se concentran en pocas categorías. Diversifica añadiendo "
            "habilidades de distintas áreas: competencias clave del campo, herramientas y "
            "programas, y habilidades personales transferibles."
        ),
        "quantify_default_tech": (
            "Cuantifica tus logros en las descripciones de experiencia. Usa cifras: "
            "'Mejoré el tiempo de respuesta de la API un 40 %', 'Gestioné un equipo de 5 "
            "personas', 'Atendí a más de 1000 usuarios al día'."
        ),
        "quantify_default_general": (
            "Cuantifica tus logros en las descripciones de experiencia. Usa cifras: "
            "'Gestioné un equipo de 5 personas', 'Entregué 12 proyectos', "
            "'Aumenté la audiencia un 40 %'."
        ),
        "quantify_highlighted": (
            "Tu CV necesita cifras más concretas. Hemos resaltado las frases que usan "
            "verbos de acción potentes pero carecen de métricas cuantificables (cifras, "
            "porcentajes o escala). Describe exactamente lo que lograste."
        ),
        "keywords_missing": (
            "A tu CV le faltan palabras clave propias del sector. Revisa ofertas de empleo "
            "para el puesto que buscas e incorpora los términos relevantes de forma natural. "
            "Las palabras clave ayudan tanto a los sistemas ATS como a los revisores humanos."
        ),
        "default_formatting": (
            "Usa un formato coherente en todo el documento: la misma tipografía, fechas "
            "alineadas, viñetas uniformes y encabezados de sección claros."
        ),
        "default_tailor": (
            "Adapta tu CV a cada candidatura. Ajusta las palabras clave y destaca la "
            "experiencia más relevante para el puesto concreto."
        ),
        "default_length": (
            "Mantén tu CV en 1-2 páginas. Elimina la información desactualizada o "
            "irrelevante y céntrate en tus experiencias de mayor impacto."
        ),
    },
}


def texts_for(language: str | None) -> dict[str, str]:
    """Return the message table for a language, falling back to English.

    Never raises: an unknown or None language yields the English table, so a
    caller that somehow passes a bad value degrades to today's behaviour.
    """
    if language and language in SUGGESTION_TEXTS:
        return SUGGESTION_TEXTS[language]
    return SUGGESTION_TEXTS["en"]
