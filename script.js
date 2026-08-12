
(() => {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {

    /* =========================================================
       ELEMENTS
    ========================================================= */

    const form = document.getElementById('cv-form');

    const experienceList =
      document.getElementById('experience-list');

    const educationList =
      document.getElementById('education-list');

    const experienceTemplate =
      document.getElementById('experience-entry-template');

    const educationTemplate =
      document.getElementById('education-entry-template');

    const sheet =
      document.getElementById('cv-sheet');

    const out = {
      name: document.getElementById('out-name'),
      title: document.getElementById('out-title'),
      contact: document.getElementById('out-contact'),
      summary: document.getElementById('out-summary'),
      experience: document.getElementById('out-experience'),
      education: document.getElementById('out-education'),
      skills: document.getElementById('out-skills'),
      languages: document.getElementById('out-languages')
    };

    const sections = {
      experience: document.getElementById('section-experience'),
      education: document.getElementById('section-education'),
      skills: document.getElementById('section-skills'),
      languages: document.getElementById('section-languages')
    };

    const generateBtn =
      document.getElementById('generate-btn');

    const printBtn =
      document.getElementById('print-btn');

    const downloadPdfBtn =
      document.getElementById('download-pdf-btn');

    const newCvBtn =
      document.getElementById('new-cv-btn');

    const saveCvBtn =
      document.getElementById('save-cv-btn');

    const myCvsBtn =
      document.getElementById('my-cvs-btn');

    const savedCvsList =
      document.getElementById('saved-cvs-list');

    const templateSelect =
      document.getElementById('cv-template');

    if (!form || !sheet) {
      console.error(
        'CV Genius AI: Required elements are missing.'
      );
      return;
    }


    /* =========================================================
       TRANSLATIONS
    ========================================================= */

    const translations = {

      ar: {
        direction: 'rtl',
        pageTitle: 'CV Genius AI — منشئ السيرة الذاتية',

        chooseLanguage: 'اختر اللغة',
        editorLabel: 'محرر السيرة الذاتية',

        subtitle:
          'أنشئ سيرتك الذاتية الاحترافية باستخدام الذكاء الاصطناعي. عدّل بياناتك وشاهد المعاينة مباشرة.',

        personal: 'البيانات الشخصية',

        targetJob: 'الوظيفة المستهدفة',
        chooseJob: 'اختر وظيفة',

        softwareEngineer: 'مهندس برمجيات',
        receptionist: 'موظف استقبال',
        accountant: 'محاسب',
        teacher: 'مدرس',
        marketing: 'أخصائي تسويق',
        other: 'وظيفة أخرى',

        fullName: 'الاسم الكامل',
        fullNamePlaceholder: 'مثال: أحمد محمد',

        jobTitle: 'المسمى الوظيفي',
        jobTitlePlaceholder: 'مثال: مهندس برمجيات',

        email: 'البريد الإلكتروني',
        phone: 'رقم الهاتف',

        location: 'الموقع',
        locationPlaceholder: 'الجزائر، الجزائر',

        summary: 'نبذة مختصرة',
        summaryPlaceholder:
          'اكتب نبذة قصيرة عن خبرتك وأهدافك المهنية...',

        experience: 'الخبرة المهنية',
        addExperience: '+ إضافة خبرة',

        education: 'التعليم',
        addEducation: '+ إضافة مؤهل تعليمي',

        skills: 'المهارات',
        skillsLabel: 'المهارات مفصولة بفواصل',

        skillsPlaceholder:
          'إدارة المشاريع، البرمجة، التصميم، التواصل',

        languages: 'اللغات',
        languagesLabel: 'اللغات مع مستوى الإتقان',

        languagesPlaceholder:
          'العربية — ممتاز، الإنجليزية — متقدم، الفرنسية — متوسط',

        cvTemplate: 'قالب السيرة الذاتية',
        templateLabel: 'اختر نمط السيرة',

        classic: 'كلاسيكي',
        modern: 'حديث',
        minimal: 'بسيط',

        generate: 'إنشاء السيرة الذاتية',
        improving: 'جارٍ تحسين السيرة بالذكاء الاصطناعي...',
        generated: 'تم إنشاء السيرة الذاتية ✓',

        print: 'طباعة / حفظ PDF',

        download: 'تنزيل PDF',
        creatingPdf: 'جارٍ إنشاء PDF...',
        downloaded: 'تم تنزيل PDF ✓',

        newCv: 'سيرة ذاتية جديدة',

        saveCv: 'حفظ السيرة الذاتية',
        saved: 'تم الحفظ ✓',

        myCvs: 'سيرتي الذاتية',

        preview: '02 — المعاينة المباشرة',
        previewAria: 'معاينة السيرة الذاتية',

        namePlaceholder: 'اسمك',
        titlePlaceholder: 'المسمى الوظيفي',
        contactPlaceholder:
          'البريد الإلكتروني · الهاتف · الموقع',

        position: 'المسمى الوظيفي',

        company: 'الشركة',
        companyPlaceholder: 'مثال: شركة تقنية',

        dates: 'الفترة الزمنية',
        datesPlaceholder: '2022 — حتى الآن',

        description: 'الوصف والإنجازات',
        descriptionPlaceholder:
          'اكتب أهم المهام والإنجازات التي حققتها...',

        removeExperience: 'حذف هذه الخبرة',

        degree: 'المؤهل أو التخصص',
        degreePlaceholder:
          'مثال: ليسانس في علوم الحاسوب',

        school: 'المؤسسة التعليمية',
        schoolPlaceholder:
          'مثال: جامعة الجزائر',

        year: 'السنة',
        removeEducation: 'حذف هذا المؤهل',

        qualification: 'المؤهل',

        noSavedCvs:
          'لا توجد سير ذاتية محفوظة حتى الآن.',

        load: 'تحميل',
        delete: 'حذف',

        enterName:
          'يرجى إدخال اسمك الكامل قبل حفظ السيرة الذاتية.',

        newConfirm:
          'هل تريد بدء سيرة ذاتية جديدة؟ سيتم حذف البيانات الحالية غير المحفوظة.',

        deleteConfirm:
          'هل تريد حذف هذه السيرة الذاتية المحفوظة؟',

        pdfLibraryError:
          'مكتبة PDF غير متوفرة. يرجى التحقق من اتصال الإنترنت والمحاولة مرة أخرى.',

        pdfError:
          'تعذر إنشاء ملف PDF. يرجى المحاولة مرة أخرى.',

        aiError:
          'حدث خطأ أثناء تحسين السيرة الذاتية بالذكاء الاصطناعي.',

        aiEmpty:
          'لم يتم الحصول على نتيجة من الذكاء الاصطناعي.'
      },

      fr: {
        direction: 'ltr',
        pageTitle: 'CV Genius AI — Créateur de CV',

        chooseLanguage: 'Choisir la langue',
        editorLabel: 'Éditeur de CV',

        subtitle:
          'Créez votre CV professionnel avec l’intelligence artificielle. Modifiez vos informations et visualisez le résultat en direct.',

        personal: 'Informations personnelles',

        targetJob: 'Poste recherché',
        chooseJob: 'Choisir un poste',

        softwareEngineer: 'Ingénieur logiciel',
        receptionist: 'Réceptionniste',
        accountant: 'Comptable',
        teacher: 'Enseignant',
        marketing: 'Spécialiste marketing',
        other: 'Autre poste',

        fullName: 'Nom complet',
        fullNamePlaceholder: 'Exemple : Ahmed Mohamed',

        jobTitle: 'Intitulé du poste',
        jobTitlePlaceholder: 'Exemple : Ingénieur logiciel',

        email: 'E-mail',
        phone: 'Téléphone',

        location: 'Localisation',
        locationPlaceholder: 'Alger, Algérie',

        summary: 'Résumé professionnel',
        summaryPlaceholder:
          'Écrivez un court résumé de votre expérience et de vos objectifs professionnels...',

        experience: 'Expérience professionnelle',
        addExperience: '+ Ajouter une expérience',

        education: 'Formation',
        addEducation: '+ Ajouter une formation',

        skills: 'Compétences',
        skillsLabel:
          'Compétences séparées par des virgules',

        skillsPlaceholder:
          'Gestion de projet, programmation, design, communication',

        languages: 'Langues',
        languagesLabel:
          'Langues avec niveau de maîtrise',

        languagesPlaceholder:
          'Arabe — Excellent, Anglais — Avancé, Français — Intermédiaire',

        cvTemplate: 'Modèle de CV',
        templateLabel:
          'Choisir le style du CV',

        classic: 'Classique',
        modern: 'Moderne',
        minimal: 'Minimaliste',

        generate: 'Créer le CV',
        improving: 'Amélioration du CV par IA...',
        generated: 'CV créé ✓',

        print: 'Imprimer / Enregistrer en PDF',

        download: 'Télécharger PDF',
        creatingPdf: 'Création du PDF...',
        downloaded: 'PDF téléchargé ✓',

        newCv: 'Nouveau CV',

        saveCv: 'Enregistrer le CV',
        saved: 'Enregistré ✓',

        myCvs: 'Mes CV',

        preview: '02 — Aperçu en direct',
        previewAria: 'Aperçu du CV',

        namePlaceholder: 'Votre nom',
        titlePlaceholder: 'Intitulé du poste',

        contactPlaceholder:
          'E-mail · téléphone · localisation',

        position: 'Intitulé du poste',

        company: 'Entreprise',
        companyPlaceholder:
          'Exemple : Entreprise technologique',

        dates: 'Période',
        datesPlaceholder:
          '2022 — Aujourd’hui',

        description: 'Description et réalisations',
        descriptionPlaceholder:
          'Décrivez vos principales tâches et réalisations...',

        removeExperience:
          'Supprimer cette expérience',

        degree: 'Diplôme ou spécialité',
        degreePlaceholder:
          'Exemple : Licence en informatique',

        school: 'Établissement',
        schoolPlaceholder:
          'Exemple : Université d’Alger',

        year: 'Année',
        removeEducation:
          'Supprimer cette formation',

        qualification: 'Diplôme',

        noSavedCvs:
          'Aucun CV enregistré pour le moment.',

        load: 'Charger',
        delete: 'Supprimer',

        enterName:
          'Veuillez saisir votre nom complet avant d’enregistrer le CV.',

        newConfirm:
          'Commencer un nouveau CV ? Les données actuelles non enregistrées seront supprimées.',

        deleteConfirm:
          'Supprimer ce CV enregistré ?',

        pdfLibraryError:
          'La bibliothèque PDF n’est pas disponible. Vérifiez votre connexion Internet et réessayez.',

        pdfError:
          'Impossible de créer le fichier PDF. Veuillez réessayer.',

        aiError:
          'Une erreur est survenue lors de l’amélioration du CV par IA.',

        aiEmpty:
          'Aucun résultat reçu de l’intelligence artificielle.'
      },

      en: {
        direction: 'ltr',
        pageTitle: 'CV Genius AI — Resume Builder',

        chooseLanguage: 'Choose language',
        editorLabel: 'Resume Editor',

        subtitle:
          'Create your professional resume with AI. Edit your information and see the preview instantly.',

        personal: 'Personal Information',

        targetJob: 'Target Job',
        chooseJob: 'Choose a job',

        softwareEngineer: 'Software Engineer',
        receptionist: 'Receptionist',
        accountant: 'Accountant',
        teacher: 'Teacher',
        marketing: 'Marketing Specialist',
        other: 'Other',

        fullName: 'Full Name',
        fullNamePlaceholder:
          'Example: Ahmed Mohamed',

        jobTitle: 'Job Title',
        jobTitlePlaceholder:
          'Example: Software Engineer',

        email: 'Email',
        phone: 'Phone',

        location: 'Location',
        locationPlaceholder:
          'Algiers, Algeria',

        summary: 'Professional Summary',
        summaryPlaceholder:
          'Write a short summary of your experience and career goals...',

        experience: 'Work Experience',
        addExperience: '+ Add Experience',

        education: 'Education',
        addEducation: '+ Add Education',

        skills: 'Skills',
        skillsLabel:
          'Skills separated by commas',

        skillsPlaceholder:
          'Project management, programming, design, communication',

        languages: 'Languages',
        languagesLabel:
          'Languages with proficiency level',

        languagesPlaceholder:
          'Arabic — Excellent, English — Advanced, French — Intermediate',

        cvTemplate: 'Resume Template',
        templateLabel:
          'Choose resume style',

        classic: 'Classic',
        modern: 'Modern',
        minimal: 'Minimal',

        generate: 'Create Resume',
        improving: 'Improving resume with AI...',
        generated: 'Resume Created ✓',

        print: 'Print / Save PDF',

        download: 'Download PDF',
        creatingPdf: 'Creating PDF...',
        downloaded: 'PDF Downloaded ✓',

        newCv: 'New Resume',

        saveCv: 'Save Resume',
        saved: 'Saved ✓',

        myCvs: 'My Resumes',

        preview: '02 — Live Preview',
        previewAria: 'Resume Preview',

        namePlaceholder: 'Your Name',
        titlePlaceholder: 'Job Title',

        contactPlaceholder:
          'email · phone · location',

        position: 'Job Title',

        company: 'Company',
        companyPlaceholder:
          'Example: Technology Company',

        dates: 'Dates',
        datesPlaceholder:
          '2022 — Present',

        description: 'Description & Achievements',
        descriptionPlaceholder:
          'Write your main responsibilities and achievements...',

        removeExperience:
          'Remove this experience',

        degree: 'Degree or Specialization',
        degreePlaceholder:
          'Example: Bachelor’s in Computer Science',

        school: 'Educational Institution',
        schoolPlaceholder:
          'Example: University of Algiers',

        year: 'Year',
        removeEducation:
          'Remove this education',

        qualification: 'Qualification',

        noSavedCvs:
          'No saved resumes yet.',

        load: 'Load',
        delete: 'Delete',

        enterName:
          'Please enter your full name before saving the resume.',

        newConfirm:
          'Start a new resume? Your current unsaved data will be cleared.',

        deleteConfirm:
          'Delete this saved resume?',

        pdfLibraryError:
          'The PDF library is not available. Please check your internet connection and try again.',

        pdfError:
          'Unable to create the PDF. Please try again.',

        aiError:
          'An error occurred while improving the resume with AI.',

        aiEmpty:
          'No result was received from the AI.'
      }
    };


    /* =========================================================
       CURRENT LANGUAGE
    ========================================================= */

    let currentLanguage =
      localStorage.getItem('cvGeniusAI_language') || 'ar';

    if (!translations[currentLanguage]) {
      currentLanguage = 'ar';
    }


    function t(key) {
      return (
        translations[currentLanguage]?.[key] ||
        translations.ar[key] ||
        key
      );
    }


    /* =========================================================
       HELPERS
    ========================================================= */

    function setText(selector, text) {
      document
        .querySelectorAll(selector)
        .forEach(element => {
          element.textContent = text;
        });
    }


    function setPlaceholder(selector, text) {
      document
        .querySelectorAll(selector)
        .forEach(element => {
          element.placeholder = text;
        });
    }


    function getValue(id) {
      const element =
        document.getElementById(id);

      return element
        ? String(element.value || '').trim()
        : '';
    }


    function escapeHTML(value) {
      const div =
        document.createElement('div');

      div.textContent =
        value ?? '';

      return div.innerHTML;
    }


    function splitList(value) {
      return String(value || '')
        .split(',')
        .map(item => item.trim())
        .filter(Boolean);
    }


    /* =========================================================
       LANGUAGE SELECTOR
    ========================================================= */

    function createLanguageSelector() {

      const existingSelectors =
        document.querySelectorAll(
          '#language-selector, #language-select'
        );

      if (existingSelectors.length) {
        setupExistingLanguageSelectors();
        return;
      }

      const wrapper =
        document.createElement('div');

      wrapper.id =
        'language-selector';

      wrapper.style.cssText = `
        display:flex;
        align-items:center;
        gap:8px;
        margin-bottom:24px;
        flex-wrap:wrap;
      `;

      const label =
        document.createElement('span');

      label.id =
        'language-label';

      label.textContent =
        t('chooseLanguage');

      const select =
        document.createElement('select');

      select.id =
        'language-select';

      select.innerHTML = `
        <option value="ar">العربية</option>
        <option value="fr">Français</option>
        <option value="en">English</option>
      `;

      select.value =
        currentLanguage;

      select.addEventListener(
        'change',
        () => changeLanguage(select.value)
      );

      wrapper.appendChild(label);
      wrapper.appendChild(select);

      const editor =
        document.querySelector('.editor');

      if (editor) {
        editor.insertBefore(
          wrapper,
          editor.firstElementChild
        );
      }
    }


    function setupExistingLanguageSelectors() {

      const selectors =
        document.querySelectorAll(
          '#language-select, [data-language-select], .language-select'
        );

      selectors.forEach(select => {

        if (!select.dataset.languageReady) {

          select.dataset.languageReady =
            'true';

          select.value =
            currentLanguage;

          select.addEventListener(
            'change',
            () => changeLanguage(select.value)
          );
        }
      });


      const buttons =
        document.querySelectorAll(
          '[data-language], [data-lang]'
        );

      buttons.forEach(button => {

        if (!button.dataset.languageReady) {

          button.dataset.languageReady =
            'true';

          button.addEventListener(
            'click',
            event => {

              event.preventDefault();

              const lang =
                button.dataset.language ||
                button.dataset.lang;

              if (translations[lang]) {
                changeLanguage(lang);
              }
            }
          );
        }
      });
    }


    function changeLanguage(language) {

      if (!translations[language]) {
        return;
      }

      currentLanguage =
        language;

      localStorage.setItem(
        'cvGeniusAI_language',
        currentLanguage
      );

      applyLanguage();
      render();
      renderSavedCVs();
    }


    /* =========================================================
       APPLY LANGUAGE
    ========================================================= */

    function applyLanguage() {

      const isArabic =
        currentLanguage === 'ar';

      document.documentElement.lang =
        currentLanguage;

      document.documentElement.dir =
        isArabic ? 'rtl' : 'ltr';

      document.body.dir =
        isArabic ? 'rtl' : 'ltr';

      document.title =
        t('pageTitle');


      document
        .querySelectorAll(
          '#language-label, [data-language-label]'
        )
        .forEach(element => {
          element.textContent =
            t('chooseLanguage');
        });


      document
        .querySelectorAll(
          '#language-select, [data-language-select], .language-select'
        )
        .forEach(select => {
          select.value =
            currentLanguage;
        });


      setText(
        '.editor__subtitle',
        t('subtitle')
      );


      const editor =
        document.querySelector('.editor');

      if (editor) {
        editor.setAttribute(
          'aria-label',
          t('editorLabel')
        );
      }

/* =====================================================
   TRANSLATE FORM SECTIONS & FIELD LABELS
===================================================== */

function setGroupLegend(elementId, translationKey) {

  const element =
    document.getElementById(elementId);

  if (!element) {
    return;
  }

  const group =
    element.closest('.field-group');

  if (!group) {
    return;
  }

  const legend =
    group.querySelector('legend');

  if (legend) {
    legend.textContent =
      t(translationKey);
  }
}


/* ---------- Section legends ---------- */

setGroupLegend(
  'targetJob',
  'personal'
);

setGroupLegend(
  'experience-list',
  'experience'
);

setGroupLegend(
  'education-list',
  'education'
);

setGroupLegend(
  'skills',
  'skills'
);

setGroupLegend(
  'languages',
  'languages'
);

setGroupLegend(
  'cv-template',
  'cvTemplate'
);


/* ---------- Personal information labels ---------- */

const personalFields = {
  targetJob: 'targetJob',
  fullName: 'fullName',
  jobTitle: 'jobTitle',
  email: 'email',
  phone: 'phone',
  location: 'location',
  summary: 'summary'
};

Object.entries(personalFields)
  .forEach(([id, translationKey]) => {

    const element =
      document.getElementById(id);

    if (!element) {
      return;
    }

    const field =
      element.closest('.field');

    if (!field) {
      return;
    }

    const label =
      field.querySelector('.field__label');

    if (label) {
      label.textContent =
        t(translationKey);
    }

  });
      
      const jobSelect =
        document.getElementById('targetJob');

      if (jobSelect) {

        const jobKeys = {
          '': 'chooseJob',
          'Software Engineer': 'softwareEngineer',
          'Receptionist': 'receptionist',
          'Accountant': 'accountant',
          'Teacher': 'teacher',
          'Marketing Specialist': 'marketing',
          'Other': 'other'
        };

        Array.from(jobSelect.options)
          .forEach(option => {

            const key =
              jobKeys[option.value];

            if (key) {
              option.textContent =
                t(key);
            }
          });
      }


      setPlaceholder(
        '#fullName',
        t('fullNamePlaceholder')
      );

      setPlaceholder(
        '#jobTitle',
        t('jobTitlePlaceholder')
      );

      setPlaceholder(
        '#location',
        t('locationPlaceholder')
      );

      setPlaceholder(
        '#summary',
        t('summaryPlaceholder')
      );

      setPlaceholder(
        '#email',
        'name@example.com'
      );

      setPlaceholder(
        '#phone',
        '+213 555 123 456'
      );


      const skillsGroup =
        document.getElementById('skills')
          ?.closest('.field-group');

      if (skillsGroup) {

        const label =
          skillsGroup.querySelector('.field__label');

        if (label) {
          label.textContent =
            t('skillsLabel');
        }
      }

      setPlaceholder(
        '#skills',
        t('skillsPlaceholder')
      );


      const languagesGroup =
        document.getElementById('languages')
          ?.closest('.field-group');

      if (languagesGroup) {

        const label =
          languagesGroup.querySelector('.field__label');

        if (label) {
          label.textContent =
            t('languagesLabel');
        }
      }

      setPlaceholder(
        '#languages',
        t('languagesPlaceholder')
      );


      const templateGroup =
        document.getElementById('cv-template')
          ?.closest('.field-group');

      if (templateGroup) {

        const label =
          templateGroup.querySelector('.field__label');

        if (label) {
          label.textContent =
            t('templateLabel');
        }
      }


      if (templateSelect) {

        const templateKeys = {
          classic: 'classic',
          modern: 'modern',
          minimal: 'minimal'
        };

        Array.from(templateSelect.options)
          .forEach(option => {

            const key =
              templateKeys[option.value];

            if (key) {
              option.textContent =
                t(key);
            }
          });
      }


      document
        .querySelectorAll('[data-add="experience"]')
        .forEach(button => {
          button.textContent =
            t('addExperience');
        });


      document
        .querySelectorAll('[data-add="education"]')
        .forEach(button => {
          button.textContent =
            t('addEducation');
        });


      if (generateBtn) {
        generateBtn.textContent =
          t('generate');
      }

      if (printBtn) {
        printBtn.textContent =
          t('print');
      }

      if (
        downloadPdfBtn &&
        !downloadPdfBtn.disabled
      ) {
        downloadPdfBtn.textContent =
          t('download');
      }

      if (newCvBtn) {
        newCvBtn.textContent =
          t('newCv');
      }

      if (
        saveCvBtn &&
        !saveCvBtn.disabled
      ) {
        saveCvBtn.textContent =
          t('saveCv');
      }

      if (myCvsBtn) {
        myCvsBtn.textContent =
          t('myCvs');
      }


      const preview =
        document.querySelector('.preview');

      if (preview) {
        preview.setAttribute(
          'aria-label',
          t('previewAria')
        );
      }


      setText(
        '.preview__mark',
        t('preview')
      );


            translateTemplates();
      translateExistingEntries();
    }
    


    /* =========================================================
       TEMPLATE TRANSLATION
    ========================================================= */

    function translateTemplates() {

      if (experienceTemplate) {

        const root =
          experienceTemplate.content;

        const labels =
          root.querySelectorAll('.field__label');

        if (labels[0])
          labels[0].textContent =
            t('position');

        if (labels[1])
          labels[1].textContent =
            t('company');

        if (labels[2])
          labels[2].textContent =
            t('dates');

        if (labels[3])
          labels[3].textContent =
            t('description');


        const inputs =
          root.querySelectorAll(
            'input, textarea'
          );

        if (inputs[0])
          inputs[0].placeholder =
            t('jobTitlePlaceholder');

        if (inputs[1])
          inputs[1].placeholder =
            t('companyPlaceholder');

        if (inputs[2])
          inputs[2].placeholder =
            t('datesPlaceholder');

        if (inputs[3])
          inputs[3].placeholder =
            t('descriptionPlaceholder');


        const remove =
          root.querySelector('.entry__remove');

        if (remove) {
          remove.setAttribute(
            'aria-label',
            t('removeExperience')
          );
        }
      }


      if (educationTemplate) {

        const root =
          educationTemplate.content;

        const labels =
          root.querySelectorAll('.field__label');

        if (labels[0])
          labels[0].textContent =
            t('degree');

        if (labels[1])
          labels[1].textContent =
            t('school');

        if (labels[2])
          labels[2].textContent =
            t('year');


        const inputs =
          root.querySelectorAll('input');

        if (inputs[0])
          inputs[0].placeholder =
            t('degreePlaceholder');

        if (inputs[1])
          inputs[1].placeholder =
            t('schoolPlaceholder');

        if (inputs[2])
          inputs[2].placeholder =
            t('year');


        const remove =
          root.querySelector('.entry__remove');

        if (remove) {
          remove.setAttribute(
            'aria-label',
            t('removeEducation')
          );
        }
      }
    }

/* =====================================================
   TRANSLATE EXISTING DYNAMIC ENTRIES
===================================================== */

function translateExistingEntries() {

  /* ---------- Experience entries ---------- */

  if (experienceList) {

    experienceList
      .querySelectorAll('[data-entry]')
      .forEach(entry => {

        const labels =
          entry.querySelectorAll('.field__label');

        if (labels[0])
          labels[0].textContent =
            t('position');

        if (labels[1])
          labels[1].textContent =
            t('company');

        if (labels[2])
          labels[2].textContent =
            t('dates');

        if (labels[3])
          labels[3].textContent =
            t('description');


        const inputs =
          entry.querySelectorAll(
            'input, textarea'
          );

        if (inputs[0])
          inputs[0].placeholder =
            t('jobTitlePlaceholder');

        if (inputs[1])
          inputs[1].placeholder =
            t('companyPlaceholder');

        if (inputs[2])
          inputs[2].placeholder =
            t('datesPlaceholder');

        if (inputs[3])
          inputs[3].placeholder =
            t('descriptionPlaceholder');


        const remove =
          entry.querySelector('.entry__remove');

        if (remove) {
          remove.setAttribute(
            'aria-label',
            t('removeExperience')
          );
        }

      });
  }


  /* ---------- Education entries ---------- */

  if (educationList) {

    educationList
      .querySelectorAll('[data-entry]')
      .forEach(entry => {

        const labels =
          entry.querySelectorAll('.field__label');

        if (labels[0])
          labels[0].textContent =
            t('degree');

        if (labels[1])
          labels[1].textContent =
            t('school');

        if (labels[2])
          labels[2].textContent =
            t('year');


        const inputs =
          entry.querySelectorAll('input');

        if (inputs[0])
          inputs[0].placeholder =
            t('degreePlaceholder');

        if (inputs[1])
          inputs[1].placeholder =
            t('schoolPlaceholder');

        if (inputs[2])
          inputs[2].placeholder =
            t('year');


        const remove =
          entry.querySelector('.entry__remove');

        if (remove) {
          remove.setAttribute(
            'aria-label',
            t('removeEducation')
          );
        }

      });
  }


  /* ---------- Preview section headings ---------- */

  const previewHeadings = {
    '#section-experience .sheet__heading span':
      'experience',

    '#section-education .sheet__heading span':
      'education',

    '#section-skills .sheet__heading span':
      'skills',

    '#section-languages .sheet__heading span':
      'languages'
  };


  Object.entries(previewHeadings)
    .forEach(([selector, key]) => {

      document
        .querySelectorAll(selector)
        .forEach(element => {
          element.textContent =
            t(key);
        });

    });
}
    /* =========================================================
       EXPERIENCE
    ========================================================= */

    function addExperienceEntry(data = {}) {

      if (
        !experienceTemplate ||
        !experienceList
      ) {
        return;
      }

      const fragment =
        experienceTemplate.content.cloneNode(true);

      const entry =
        fragment.querySelector('[data-entry]');

      if (!entry) {
        return;
      }

      experienceList.appendChild(fragment);


      const role =
        entry.querySelector('.js-role');

      const company =
        entry.querySelector('.js-company');

      const dates =
        entry.querySelector('.js-dates');

      const description =
        entry.querySelector('.js-desc');


      if (role)
        role.value =
          data.role || '';

      if (company)
        company.value =
          data.company || '';

      if (dates)
        dates.value =
          data.dates || '';

      if (description)
        description.value =
          data.description || '';


      const removeButton =
        entry.querySelector('.entry__remove');

      if (removeButton) {

        removeButton.addEventListener(
          'click',
          () => {
            entry.remove();
            render();
          }
        );
      }


      entry
        .querySelectorAll('input, textarea')
        .forEach(element => {
          element.addEventListener(
            'input',
            render
          );
        });

      translateTemplates();
    }


    /* =========================================================
       EDUCATION
    ========================================================= */

    function addEducationEntry(data = {}) {

      if (
        !educationTemplate ||
        !educationList
      ) {
        return;
      }

      const fragment =
        educationTemplate.content.cloneNode(true);

      const entry =
        fragment.querySelector('[data-entry]');

      if (!entry) {
        return;
      }

      educationList.appendChild(fragment);


      const degree =
        entry.querySelector('.js-degree');

      const school =
        entry.querySelector('.js-school');

      const year =
        entry.querySelector('.js-year');


      if (degree)
        degree.value =
          data.degree || '';

      if (school)
        school.value =
          data.school || '';

      if (year)
        year.value =
          data.year || '';


      const removeButton =
        entry.querySelector('.entry__remove');

      if (removeButton) {

        removeButton.addEventListener(
          'click',
          () => {
            entry.remove();
            render();
          }
        );
      }


      entry
        .querySelectorAll('input, textarea')
        .forEach(element => {
          element.addEventListener(
            'input',
            render
          );
        });

      translateTemplates();
    }


    /* =========================================================
       READ EXPERIENCE
    ========================================================= */

    function readExperience() {

      if (!experienceList) {
        return [];
      }

      return Array.from(
        experienceList.querySelectorAll('[data-entry]')
      )
        .map(entry => ({
          role:
            entry.querySelector('.js-role')
              ?.value.trim() || '',

          company:
            entry.querySelector('.js-company')
              ?.value.trim() || '',

          dates:
            entry.querySelector('.js-dates')
              ?.value.trim() || '',

          description:
            entry.querySelector('.js-desc')
              ?.value.trim() || ''
        }))
        .filter(item =>
          item.role ||
          item.company ||
          item.dates ||
          item.description
        );
    }


    /* =========================================================
       READ EDUCATION
    ========================================================= */

    function readEducation() {

      if (!educationList) {
        return [];
      }

      return Array.from(
        educationList.querySelectorAll('[data-entry]')
      )
        .map(entry => ({
          degree:
            entry.querySelector('.js-degree')
              ?.value.trim() || '',

          school:
            entry.querySelector('.js-school')
              ?.value.trim() || '',

          year:
            entry.querySelector('.js-year')
              ?.value.trim() || ''
        }))
        .filter(item =>
          item.degree ||
          item.school ||
          item.year
        );
    }


    /* =========================================================
       RENDER EXPERIENCE
    ========================================================= */

    function renderExperience(items) {

      if (
        !sections.experience ||
        !out.experience
      ) {
        return;
      }

      if (!items.length) {

        sections.experience.hidden =
          true;

        out.experience.innerHTML =
          '';

        return;
      }

      sections.experience.hidden =
        false;

      out.experience.innerHTML =
        items.map(item => `

          <div class="sheet-entry">

            <div class="sheet-entry__top">

              <span>
                ${escapeHTML(
                  item.role ||
                  t('position')
                )}
              </span>

              ${
                item.dates
                  ? `
                    <span class="sheet-entry__dates">
                      ${escapeHTML(item.dates)}
                    </span>
                  `
                  : ''
              }

            </div>

            ${
              item.company
                ? `
                  <p class="sheet-entry__sub">
                    ${escapeHTML(item.company)}
                  </p>
                `
                : ''
            }

            ${
              item.description
                ? `
                  <p class="sheet-entry__desc">
                    ${escapeHTML(item.description)}
                  </p>
                `
                : ''
            }

          </div>

        `).join('');
    }


    /* =========================================================
       RENDER EDUCATION
    ========================================================= */

    function renderEducation(items) {

      if (
        !sections.education ||
        !out.education
      ) {
        return;
      }

      if (!items.length) {

        sections.education.hidden =
          true;

        out.education.innerHTML =
          '';

        return;
      }

      sections.education.hidden =
        false;

      out.education.innerHTML =
        items.map(item => `

          <div class="sheet-entry">

            <div class="sheet-entry__top">

              <span>
                ${escapeHTML(
                  item.degree ||
                  t('qualification')
                )}
              </span>

              ${
                item.year
                  ? `
                    <span class="sheet-entry__dates">
                      ${escapeHTML(item.year)}
                    </span>
                  `
                  : ''
              }

            </div>

            ${
              item.school
                ? `
                  <p class="sheet-entry__sub">
                    ${escapeHTML(item.school)}
                  </p>
                `
                : ''
            }

          </div>

        `).join('');
    }


    /* =========================================================
       RENDER SKILLS
    ========================================================= */

    function renderSkills(skills) {

      if (
        !sections.skills ||
        !out.skills
      ) {
        return;
      }

      if (!skills.length) {

        sections.skills.hidden =
          true;

        out.skills.innerHTML =
          '';

        return;
      }

      sections.skills.hidden =
        false;

      out.skills.innerHTML =
        skills.map(skill => `
          <li>${escapeHTML(skill)}</li>
        `).join('');
    }


    /* =========================================================
       RENDER LANGUAGES
    ========================================================= */

    function renderLanguages(languages) {

      if (
        !sections.languages ||
        !out.languages
      ) {
        return;
      }

      if (!languages.length) {

        sections.languages.hidden =
          true;

        out.languages.innerHTML =
          '';

        return;
      }

      sections.languages.hidden =
        false;

      out.languages.innerHTML =
        languages.map(language => `
          <li>${escapeHTML(language)}</li>
        `).join('');
    }


    /* =========================================================
       MAIN RENDER
    ========================================================= */

    function render() {

      const fullName =
        getValue('fullName');

      const jobTitle =
        getValue('jobTitle');

      const targetJob =
        getValue('targetJob');

      const email =
        getValue('email');

      const phone =
        getValue('phone');

      const location =
        getValue('location');

      const summary =
        getValue('summary');

      const skills =
        splitList(getValue('skills'));

      const languages =
        splitList(getValue('languages'));

      const experience =
        readExperience();

      const education =
        readEducation();


      if (out.name) {
        out.name.textContent =
          fullName ||
          t('namePlaceholder');
      }


      if (out.title) {
        out.title.textContent =
          jobTitle ||
          targetJob ||
          t('titlePlaceholder');
      }


      if (out.contact) {

        const contactParts = [
          email,
          phone,
          location
        ].filter(Boolean);

        out.contact.textContent =
          contactParts.length
            ? contactParts.join('  ·  ')
            : t('contactPlaceholder');
      }


      if (out.summary) {

        out.summary.textContent =
          summary;

        out.summary.hidden =
          !summary;
      }


      renderExperience(experience);
      renderEducation(education);
      renderSkills(skills);
      renderLanguages(languages);


      if (
        templateSelect &&
        sheet
      ) {
        sheet.dataset.template =
          templateSelect.value ||
          'classic';
      }
    }


    /* =========================================================
       TEMPLATE CHANGE
    ========================================================= */

    if (templateSelect) {

      templateSelect.addEventListener(
        'change',
        render
      );
    }


    /* =========================================================
       ADD BUTTONS
    ========================================================= */

    document
      .querySelectorAll('[data-add]')
      .forEach(button => {

        button.addEventListener(
          'click',
          () => {

            const type =
              button.getAttribute('data-add');

            if (type === 'experience') {
              addExperienceEntry();
            }

            if (type === 'education') {
              addEducationEntry();
            }

            render();
          }
        );
      });


    /* =========================================================
       FORM INPUT
    ========================================================= */

    form.addEventListener(
      'input',
      render
    );

    form.addEventListener(
      'change',
      render
    );



          /* =========================================================
       GEMINI AI
    ========================================================= */

    form.addEventListener(
      'submit',
      async event => {

        event.preventDefault();

        render();

        if (!generateBtn) {
          return;
        }

        const originalText =
          generateBtn.textContent;

        generateBtn.disabled = true;
        generateBtn.textContent = t('improving');

        try {

          const experience = readExperience();
          const education = readEducation();

          const cvText = `
${currentLanguage === 'ar'
  ? 'الوظيفة المستهدفة'
  : currentLanguage === 'fr'
    ? 'Poste recherché'
    : 'Target Job'}: ${getValue('targetJob')}

${currentLanguage === 'ar'
  ? 'المسمى الوظيفي'
  : currentLanguage === 'fr'
    ? 'Intitulé du poste'
    : 'Job Title'}: ${getValue('jobTitle')}

${currentLanguage === 'ar'
  ? 'الملخص'
  : currentLanguage === 'fr'
    ? 'Résumé'
    : 'Summary'}:
${getValue('summary')}

${currentLanguage === 'ar'
  ? 'الخبرة'
  : currentLanguage === 'fr'
    ? 'Expérience'
    : 'Experience'}:
${experience
  .map(item =>
    `${item.role} - ${item.company} - ${item.dates}\n${item.description}`
  )
  .join('\n\n')}

${currentLanguage === 'ar'
  ? 'التعليم'
  : currentLanguage === 'fr'
    ? 'Formation'
    : 'Education'}:
${education
  .map(item =>
    `${item.degree} - ${item.school} - ${item.year}`
  )
  .join('\n')}

${currentLanguage === 'ar'
  ? 'المهارات'
  : currentLanguage === 'fr'
    ? 'Compétences'
    : 'Skills'}:
${getValue('skills')}

${currentLanguage === 'ar'
  ? 'اللغات'
  : currentLanguage === 'fr'
    ? 'Langues'
    : 'Languages'}:
${getValue('languages')}
`.trim();


          const response =
            await fetch(
              'https://cv-genius-ai-backend.vercel.app/improve-cv',
              {
                method: 'POST',

                headers: {
                  'Content-Type': 'application/json'
                },

                body: JSON.stringify({
                  text: cvText,
                  language: currentLanguage
                })
              }
            );


          let data = null;

          try {
            data = await response.json();
          } catch {
            data = null;
          }


          if (!response.ok) {

            throw new Error(
              data?.error || t('aiError')
            );
          }


          if (!data?.result) {

            throw new Error(
              t('aiEmpty')
            );
          }


          /* =====================================================
             AI RESULT
          ===================================================== */

          const aiResult =
            String(data.result).trim();


          sessionStorage.setItem(
            'cvGeniusAI_lastAIResult',
            aiResult
          );


          /*
             نحاول قراءة JSON الذي أعاده Gemini.
          */

          let improvedCV = null;

          try {

            improvedCV =
              JSON.parse(aiResult);

          } catch (jsonError) {

            console.warn(
              'Gemini result is not valid JSON:',
              jsonError
            );

          }


          /*
             إذا كانت النتيجة JSON صحيحة،
             نضع البيانات المحسنة داخل حقول CV.
          */

          if (
            improvedCV &&
            typeof improvedCV === 'object'
          ) {

            /*
               SUMMARY
            */

            if (
              typeof improvedCV.summary === 'string'
            ) {

              const summaryInput =
                document.getElementById('summary');

              if (summaryInput) {

                summaryInput.value =
                  improvedCV.summary.trim();
              }
            }


            /*
               EXPERIENCE
            */

            if (
              Array.isArray(improvedCV.experience)
            ) {

              if (experienceList) {

                experienceList.innerHTML = '';

              }

              improvedCV.experience.forEach(
                item => {

                  addExperienceEntry({
                    role:
                      item?.role || '',

                    company:
                      item?.company || '',

                    dates:
                      item?.dates || '',

                    description:
                      item?.description || ''
                  });

                }
              );
            }


            /*
               EDUCATION
            */

            if (
              Array.isArray(improvedCV.education)
            ) {

              if (educationList) {

                educationList.innerHTML = '';

              }

              improvedCV.education.forEach(
                item => {

                  addEducationEntry({
                    degree:
                      item?.degree || '',

                    school:
                      item?.school || '',

                    year:
                      item?.year || ''
                  });

                }
              );
            }


            /*
               SKILLS
            */

            if (
              Array.isArray(improvedCV.skills)
            ) {

              const skillsInput =
                document.getElementById('skills');

              if (skillsInput) {

                skillsInput.value =
                  improvedCV.skills
                    .map(skill =>
                      String(skill).trim()
                    )
                    .filter(Boolean)
                    .join(', ');
              }
            }


            /*
               LANGUAGES
            */

            if (
              Array.isArray(improvedCV.languages)
            ) {

              const languagesInput =
                document.getElementById('languages');

              if (languagesInput) {

                languagesInput.value =
                  improvedCV.languages
                    .map(language =>
                      String(language).trim()
                    )
                    .filter(Boolean)
                    .join(', ');
              }
            }


            /*
               تحديث المعاينة بعد إدخال
               النتيجة المحسنة.
            */

            render();


            /*
               حفظ نسخة JSON منظمة.
            */

            sessionStorage.setItem(
              'cvGeniusAI_lastAIResult',
              JSON.stringify(
                improvedCV
              )
            );

          }


          /*
             عرض النتيجة الخام فقط إذا كان
             عنصر ai-result موجودًا.
          */

          const aiOutput =
            document.getElementById('ai-result');

          if (aiOutput) {

            aiOutput.textContent =
              improvedCV
                ? ''
                : aiResult;

            aiOutput.hidden =
              !aiOutput.textContent;
          }


          generateBtn.textContent =
            t('generated');


          if (sheet) {

            sheet.scrollIntoView({
              behavior: 'smooth',
              block: 'start'
            });
          }


        } catch (error) {

          console.error(
            'Gemini error:',
            error
          );

          alert(
            error?.message ||
            t('aiError')
          );

          generateBtn.textContent =
            originalText;

        } finally {

          setTimeout(() => {

            generateBtn.disabled =
              false;

            generateBtn.textContent =
              t('generate');

          }, 2000);
        }
      }
    );    


  /* =========================================================
   PRINT
========================================================= */

if (printBtn) {

  printBtn.addEventListener(
    'click',
    () => {

      render();

      // منع المتصفح من اعتبار مساحة المعاينة
      // صفحة إضافية أثناء الطباعة
      const originalTitle =
        document.title;

      document.title =
        getValue('fullName') ||
        'CV';

      requestAnimationFrame(() => {

        requestAnimationFrame(() => {

          window.print();

          // إعادة العنوان بعد انتهاء نافذة الطباعة
          setTimeout(() => {
            document.title =
              originalTitle;
          }, 1000);

        });

      });

    }
  );
}


    /* =========================================================
       PDF DOWNLOAD
    ========================================================= */

    if (downloadPdfBtn) {

      downloadPdfBtn.addEventListener(
        'click',
        async () => {

          render();


          if (
            typeof window.html2pdf !==
            'function'
          ) {

            alert(
              t('pdfLibraryError')
            );

            return;
          }


          const fullName =
            getValue('fullName') ||
            'CV';


          const safeName =
            fullName
              .replace(
                /[\\/:*?"<>|]/g,
                ''
              )
              .replace(
                /\s+/g,
                '-'
              )
              .substring(
                0,
                50
              );


          const uniqueId =
            new Date()
              .toISOString()
              .replace(
                /[-:T.Z]/g,
                ''
              )
              .substring(
                0,
                14
              );


          const fileName =
            `CV-Genius-AI-${safeName || 'CV'}-${uniqueId}.pdf`;

const options = {

  margin: 0,

  filename: fileName,

  image: {
    type: 'jpeg',
    quality: 0.98
  },

  html2canvas: {
    scale: 2,
    useCORS: true,
    allowTaint: false,
    backgroundColor: '#ffffff',
    logging: false,

    scrollX: 0,
    scrollY: 0,

    windowWidth: sheet.scrollWidth,
    windowHeight: sheet.scrollHeight
  },

  jsPDF: {
    unit: 'mm',
    format: 'a4',
    orientation: 'portrait',
    compress: true
  },

  pagebreak: {
  mode: ['css', 'legacy'],
  avoid: [
    '.sheet-entry'
  ]
}

};


          try {

            downloadPdfBtn.disabled =
              true;

            downloadPdfBtn.textContent =
              t('creatingPdf');


            await window
              .html2pdf()
              .set(options)
              .from(sheet)
              .save();


            downloadPdfBtn.textContent =
              t('downloaded');


            setTimeout(() => {

              downloadPdfBtn.textContent =
                t('download');

              downloadPdfBtn.disabled =
                false;

            }, 1500);


          } catch (error) {

            console.error(
              'CV Genius AI PDF error:',
              error
            );


            downloadPdfBtn.disabled =
              false;

            downloadPdfBtn.textContent =
              t('download');


            alert(
              t('pdfError')
            );
          }
        }
      );
    }


    /* =========================================================
       SAVED CVS
    ========================================================= */

    function collectCVData() {

      return {

        id:
          Date.now(),

        targetJob:
          getValue('targetJob'),

        fullName:
          getValue('fullName'),

        jobTitle:
          getValue('jobTitle'),

        email:
          getValue('email'),

        phone:
          getValue('phone'),

        location:
          getValue('location'),

        summary:
          getValue('summary'),

        skills:
          getValue('skills'),

        languages:
          getValue('languages'),

        template:
          templateSelect
            ? templateSelect.value
            : 'classic',

        experience:
          readExperience(),

        education:
          readEducation(),

        createdAt:
          new Date().toISOString()
      };
    }


    function getSavedCVs() {

      try {

        const data =
          localStorage.getItem(
            'cvGeniusAI_CVs'
          );

        if (!data) {
          return [];
        }

        const parsed =
          JSON.parse(data);

        return Array.isArray(parsed)
          ? parsed
          : [];

      } catch (error) {

        console.error(
          'Saved CVs error:',
          error
        );

        return [];
      }
    }


    function saveCVs(cvs) {

      try {

        localStorage.setItem(
          'cvGeniusAI_CVs',
          JSON.stringify(cvs)
        );

        return true;

      } catch (error) {

        console.error(
          'Save CVs error:',
          error
        );

        return false;
      }
    }


    /* =========================================================
       SAVE CV
    ========================================================= */

    if (saveCvBtn) {

      saveCvBtn.addEventListener(
        'click',
        () => {

          const cv =
            collectCVData();


          if (!cv.fullName) {

            alert(
              t('enterName')
            );

            document
              .getElementById('fullName')
              ?.focus();

            return;
          }


          const cvs =
            getSavedCVs();


          cvs.unshift(cv);


          if (
            saveCVs(
              cvs.slice(0, 20)
            )
          ) {

            saveCvBtn.textContent =
              t('saved');


            setTimeout(() => {

              saveCvBtn.textContent =
                t('saveCv');

            }, 1500);


            renderSavedCVs();
          }
        }
      );
    }


    /* =========================================================
       CLEAR FORM
    ========================================================= */

    function clearForm() {

      form.reset();


      if (experienceList) {
        experienceList.innerHTML =
          '';
      }


      if (educationList) {
        educationList.innerHTML =
          '';
      }


      addExperienceEntry();
      addEducationEntry();


      if (templateSelect) {
        templateSelect.value =
          'classic';
      }


      sessionStorage.removeItem(
        'cvGeniusAI_lastAIResult'
      );


      const aiOutput =
        document.getElementById(
          'ai-result'
        );

      if (aiOutput) {
        aiOutput.textContent =
          '';

        aiOutput.hidden =
          true;
      }


      applyLanguage();
      render();
    }


    /* =========================================================
       NEW CV
    ========================================================= */

    if (newCvBtn) {

      newCvBtn.addEventListener(
        'click',
        () => {

          if (
            !window.confirm(
              t('newConfirm')
            )
          ) {
            return;
          }

          clearForm();
        }
      );
    }


    /* =========================================================
       RENDER SAVED CVS
    ========================================================= */

    function renderSavedCVs() {

      if (!savedCvsList) {
        return;
      }


      const cvs =
        getSavedCVs();


      if (!cvs.length) {

        savedCvsList.innerHTML = `
          <p class="saved-cv-empty">
            ${escapeHTML(
              t('noSavedCvs')
            )}
          </p>
        `;

        return;
      }


      savedCvsList.innerHTML =
        cvs.map((cv, index) => {

          const name =
            escapeHTML(
              cv.fullName ||
              'CV'
            );


          const job =
            escapeHTML(
              cv.jobTitle ||
              cv.targetJob ||
              t('titlePlaceholder')
            );


          return `
            <div
              class="saved-cv-item"
              data-saved-index="${index}"
            >

              <div class="saved-cv-info">

                <strong>
                  ${name}
                </strong>

                <span>
                  ${job}
                </span>

              </div>


              <div class="saved-cv-actions">

                <button
                  type="button"
                  class="btn btn--text js-load-cv"
                  data-index="${index}"
                >
                  ${escapeHTML(
                    t('load')
                  )}
                </button>


                <button
                  type="button"
                  class="btn btn--text js-delete-cv"
                  data-index="${index}"
                >
                  ${escapeHTML(
                    t('delete')
                  )}
                </button>

              </div>

            </div>
          `;

        }).join('');


      savedCvsList
        .querySelectorAll('.js-load-cv')
        .forEach(button => {

          button.addEventListener(
            'click',
            () => {

              loadCV(
                Number(
                  button.dataset.index
                )
              );
            }
          );
        });


      savedCvsList
        .querySelectorAll('.js-delete-cv')
        .forEach(button => {

          button.addEventListener(
            'click',
            () => {

              deleteCV(
                Number(
                  button.dataset.index
                )
              );
            }
          );
        });
    }


    /* =========================================================
       LOAD CV
    ========================================================= */

    function loadCV(index) {

      const cvs =
        getSavedCVs();

      const cv =
        cvs[index];

      if (!cv) {
        return;
      }


      const fields = [
        'targetJob',
        'fullName',
        'jobTitle',
        'email',
        'phone',
        'location',
        'summary',
        'skills',
        'languages'
      ];


      fields.forEach(id => {

        const element =
          document.getElementById(id);

        if (element) {
          element.value =
            cv[id] || '';
        }
      });


      if (experienceList) {
        experienceList.innerHTML =
          '';
      }


      if (educationList) {
        educationList.innerHTML =
          '';
      }


      if (
        Array.isArray(cv.experience) &&
        cv.experience.length
      ) {

        cv.experience.forEach(
          addExperienceEntry
        );

      } else {

        addExperienceEntry();
      }


      if (
        Array.isArray(cv.education) &&
        cv.education.length
      ) {

        cv.education.forEach(
          addEducationEntry
        );

      } else {

        addEducationEntry();
      }


      if (templateSelect) {

        templateSelect.value =
          cv.template ||
          'classic';
      }


      applyLanguage();
      render();


      if (savedCvsList) {
        savedCvsList.style.display =
          'none';
      }


      sheet.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }


    /* =========================================================
       DELETE CV
    ========================================================= */

    function deleteCV(index) {

      const cvs =
        getSavedCVs();


      if (!cvs[index]) {
        return;
      }


      if (
        !window.confirm(
          t('deleteConfirm')
        )
      ) {
        return;
      }


      cvs.splice(index, 1);

      saveCVs(cvs);

      renderSavedCVs();
    }


    /* =========================================================
       MY CVS
    ========================================================= */

    if (myCvsBtn) {

      myCvsBtn.addEventListener(
        'click',
        () => {

          if (!savedCvsList) {
            return;
          }


          const visible =
            savedCvsList.style.display ===
            'block';


          savedCvsList.style.display =
            visible
              ? 'none'
              : 'block';


          if (!visible) {
            renderSavedCVs();
          }
        }
      );
    }


    /* =========================================================
       INITIALIZATION
    ========================================================= */

    createLanguageSelector();

    setupExistingLanguageSelectors();

    applyLanguage();


    if (
      experienceList &&
      experienceList.children.length === 0
    ) {
      addExperienceEntry();
    }


    if (
      educationList &&
      educationList.children.length === 0
    ) {
      addEducationEntry();
    }


    if (savedCvsList) {
      savedCvsList.style.display =
        'none';
    }


    render();

  });

})();
