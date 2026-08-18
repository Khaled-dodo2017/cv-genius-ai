const SUPABASE_URL = 'https://nojgxttfaaayaosryruk.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_BToWA0CkSgL0OjpTtsnevQ_K7bwrYay';
const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

const PADDLE_CLIENT_TOKEN =
  'test_8685ddf75dfc7dacad6b890149a';

const PADDLE_PRICE_ID_MONTHLY =
  'pri_01m03eq09t74z1mjexndbh9d9v';

const PADDLE_PRICE_ID_ONE_TIME =
  'pri_01m08mansb6g0ey1g064ep8g37';
Paddle.Environment.set("sandbox");

Paddle.Initialize({
  token: PADDLE_CLIENT_TOKEN,

  eventCallback: function (data) {
    if (data.name === 'checkout.error') {
      alert(
        'Paddle Error:\n' +
        'Code: ' + data.code + '\n' +
        'Detail: ' + data.detail
      );
    }
  }
});
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

    const authEmail =
      document.getElementById('auth-email');

    const authPassword =
      document.getElementById('auth-password');

    const signupBtn =
      document.getElementById('signup-btn');

    const loginBtn =
      document.getElementById('login-btn');

    const logoutBtn =
      document.getElementById('logout-btn');

    const authStatus =
      document.getElementById('auth-status');

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
      experience:
        document.getElementById('section-experience'),

      education:
        document.getElementById('section-education'),

      skills:
        document.getElementById('section-skills'),

      languages:
        document.getElementById('section-languages')
    };


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

        pageTitle:
          'CV Genius AI — منشئ السيرة الذاتية',

        chooseLanguage:
          'اختر اللغة',

        editorLabel:
          'محرر السيرة الذاتية',

        subtitle:
          'أنشئ سيرتك الذاتية الاحترافية باستخدام الذكاء الاصطناعي. عدّل بياناتك وشاهد المعاينة مباشرة.',

        personal:
          'البيانات الشخصية',

        targetJob:
          'الوظيفة المستهدفة',

        chooseJob:
          'اختر وظيفة',

        softwareEngineer:
          'مهندس برمجيات',

        receptionist:
          'موظف استقبال',

        accountant:
          'محاسب',

        teacher:
          'مدرس',

        marketing:
          'أخصائي تسويق',

        other:
          'وظيفة أخرى',

        fullName:
          'الاسم الكامل',

        fullNamePlaceholder:
          'مثال: أحمد محمد',

        jobTitle:
          'المسمى الوظيفي',

        jobTitlePlaceholder:
          'مثال: مهندس برمجيات',

        email:
          'البريد الإلكتروني',

        phone:
          'رقم الهاتف',

        location:
          'الموقع',

        locationPlaceholder:
          'الجزائر، الجزائر',

        summary:
          'نبذة مختصرة',

        summaryPlaceholder:
          'اكتب نبذة قصيرة عن خبرتك وأهدافك المهنية...',

        experience:
          'الخبرة المهنية',

        addExperience:
          '+ إضافة خبرة',

        education:
          'التعليم',

        addEducation:
          '+ إضافة مؤهل تعليمي',

        skills:
          'المهارات',

        skillsLabel:
          'المهارات مفصولة بفواصل',

        skillsPlaceholder:
          'إدارة المشاريع، البرمجة، التصميم، التواصل',

        languages:
          'اللغات',

        languagesLabel:
          'اللغات مع مستوى الإتقان',

        languagesPlaceholder:
          'العربية — ممتاز، الإنجليزية — متقدم، الفرنسية — متوسط',

        cvTemplate:
          'قالب السيرة الذاتية',

        templateLabel:
          'اختر نمط السيرة',

        classic:
          'كلاسيكي',

        modern:
          'حديث',

        minimal:
          'بسيط',

        generate:
          'إنشاء السيرة الذاتية',

        improving:
          'جارٍ تحسين السيرة بالذكاء الاصطناعي...',

        generated:
          'تم إنشاء السيرة الذاتية ✓',

        print:
          'طباعة / حفظ PDF',

        download:
          'تنزيل PDF',

        creatingPdf:
          'جارٍ إنشاء PDF...',

        downloaded:
          'تم تنزيل PDF ✓',

        newCv:
          'سيرة ذاتية جديدة',

        saveCv:
          'حفظ السيرة الذاتية',

        saved:
          'تم الحفظ ✓',

        myCvs:
          'سيرتي الذاتية',

        preview:
          '02 — المعاينة المباشرة',

        previewAria:
          'معاينة السيرة الذاتية',

        namePlaceholder:
          'اسمك',

        titlePlaceholder:
          'المسمى الوظيفي',

        contactPlaceholder:
          'البريد الإلكتروني · الهاتف · الموقع',

        position:
          'المسمى الوظيفي',

        company:
          'الشركة',

        companyPlaceholder:
          'مثال: شركة تقنية',

        dates:
          'الفترة الزمنية',

        datesPlaceholder:
          '2022 — حتى الآن',

        description:
          'الوصف والإنجازات',

        descriptionPlaceholder:
          'اكتب أهم المهام والإنجازات التي حققتها...',

        removeExperience:
          'حذف هذه الخبرة',

        degree:
          'المؤهل أو التخصص',

        degreePlaceholder:
          'مثال: ليسانس في علوم الحاسوب',

        school:
          'المؤسسة التعليمية',

        schoolPlaceholder:
          'مثال: جامعة الجزائر',

        year:
          'السنة',

        removeEducation:
          'حذف هذا المؤهل',

        qualification:
          'المؤهل',

        noSavedCvs:
          'لا توجد سير ذاتية محفوظة حتى الآن.',

        load:
          'تحميل',

        delete:
          'حذف',

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

        direction:
          'ltr',

        pageTitle:
          'CV Genius AI — Créateur de CV',

        chooseLanguage:
          'Choisir la langue',

        editorLabel:
          'Éditeur de CV',

        subtitle:
          'Créez votre CV professionnel avec l’intelligence artificielle. Modifiez vos informations et visualisez le résultat en direct.',

        personal:
          'Informations personnelles',

        targetJob:
          'Poste recherché',

        chooseJob:
          'Choisir un poste',

        softwareEngineer:
          'Ingénieur logiciel',

        receptionist:
          'Réceptionniste',

        accountant:
          'Comptable',

        teacher:
          'Enseignant',

        marketing:
          'Spécialiste marketing',

        other:
          'Autre poste',

        fullName:
          'Nom complet',

        fullNamePlaceholder:
          'Exemple : Ahmed Mohamed',

        jobTitle:
          'Intitulé du poste',

        jobTitlePlaceholder:
          'Exemple : Ingénieur logiciel',

        email:
          'E-mail',

        phone:
          'Téléphone',

        location:
          'Localisation',

        locationPlaceholder:
          'Alger, Algérie',

        summary:
          'Résumé professionnel',

        summaryPlaceholder:
          'Écrivez un court résumé de votre expérience et de vos objectifs professionnels...',

        experience:
          'Expérience professionnelle',

        addExperience:
          '+ Ajouter une expérience',

        education:
          'Formation',

        addEducation:
          '+ Ajouter une formation',

        skills:
          'Compétences',

        skillsLabel:
          'Compétences séparées par des virgules',

        skillsPlaceholder:
          'Gestion de projet, programmation, design, communication',

        languages:
          'Langues',

        languagesLabel:
          'Langues avec niveau de maîtrise',

        languagesPlaceholder:
          'Arabe — Excellent, Anglais — Avancé, Français — Intermédiaire',

        cvTemplate:
          'Modèle de CV',

        templateLabel:
          'Choisir le style du CV',

        classic:
          'Classique',

        modern:
          'Moderne',

        minimal:
          'Minimaliste',

        generate:
          'Créer le CV',

        improving:
          'Amélioration du CV par IA...',

        generated:
          'CV créé ✓',

        print:
          'Imprimer / Enregistrer en PDF',

        download:
          'Télécharger PDF',

        creatingPdf:
          'Création du PDF...',

        downloaded:
          'PDF téléchargé ✓',

        newCv:
          'Nouveau CV',

        saveCv:
          'Enregistrer le CV',

        saved:
          'Enregistré ✓',

        myCvs:
          'Mes CV',

        preview:
          '02 — Aperçu en direct',

        previewAria:
          'Aperçu du CV',

        namePlaceholder:
          'Votre nom',

        titlePlaceholder:
          'Intitulé du poste',

        contactPlaceholder:
          'E-mail · téléphone · localisation',

        position:
          'Intitulé du poste',

        company:
          'Entreprise',

        companyPlaceholder:
          'Exemple : Entreprise technologique',

        dates:
          'Période',

        datesPlaceholder:
          '2022 — Aujourd’hui',

        description:
          'Description et réalisations',

        descriptionPlaceholder:
          'Décrivez vos principales tâches et réalisations...',

        removeExperience:
          'Supprimer cette expérience',

        degree:
          'Diplôme ou spécialité',

        degreePlaceholder:
          'Exemple : Licence en informatique',

        school:
          'Établissement',

        schoolPlaceholder:
          'Exemple : Université d’Alger',

        year:
          'Année',

        removeEducation:
          'Supprimer cette formation',

        qualification:
          'Diplôme',

        noSavedCvs:
          'Aucun CV enregistré pour le moment.',

        load:
          'Charger',

        delete:
          'Supprimer',

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

        direction:
          'ltr',

        pageTitle:
          'CV Genius AI — Resume Builder',

        chooseLanguage:
          'Choose language',

        editorLabel:
          'Resume Editor',

        subtitle:
          'Create your professional resume with AI. Edit your information and see the preview instantly.',

        personal:
          'Personal Information',

        targetJob:
          'Target Job',

        chooseJob:
          'Choose a job',

        softwareEngineer:
          'Software Engineer',

        receptionist:
          'Receptionist',

        accountant:
          'Accountant',

        teacher:
          'Teacher',

        marketing:
          'Marketing Specialist',

        other:
          'Other',

        fullName:
          'Full Name',

        fullNamePlaceholder:
          'Example: Ahmed Mohamed',

        jobTitle:
          'Job Title',

        jobTitlePlaceholder:
          'Example: Software Engineer',

        email:
          'Email',

        phone:
          'Phone',

        location:
          'Location',

        locationPlaceholder:
          'Algiers, Algeria',

        summary:
          'Professional Summary',

        summaryPlaceholder:
          'Write a short summary of your experience and career goals...',

        experience:
          'Work Experience',

        addExperience:
          '+ Add Experience',

        education:
          'Education',

        addEducation:
          '+ Add Education',

        skills:
          'Skills',

        skillsLabel:
          'Skills separated by commas',

        skillsPlaceholder:
          'Project management, programming, design, communication',

        languages:
          'Languages',

        languagesLabel:
          'Languages with proficiency level',

        languagesPlaceholder:
          'Arabic — Excellent, English — Advanced, French — Intermediate',

        cvTemplate:
          'Resume Template',

        templateLabel:
          'Choose resume style',

        classic:
          'Classic',

        modern:
          'Modern',

        minimal:
          'Minimal',

        generate:
          'Create Resume',

        improving:
          'Improving resume with AI...',

        generated:
          'Resume Created ✓',

        print:
          'Print / Save PDF',

        download:
          'Download PDF',

        creatingPdf:
          'Creating PDF...',

        downloaded:
          'PDF Downloaded ✓',

        newCv:
          'New Resume',

        saveCv:
          'Save Resume',

        saved:
          'Saved ✓',

        myCvs:
          'My Resumes',

        preview:
          '02 — Live Preview',

        previewAria:
          'Resume Preview',

        namePlaceholder:
          'Your Name',

        titlePlaceholder:
          'Job Title',

        contactPlaceholder:
          'email · phone · location',

        position:
          'Job Title',

        company:
          'Company',

        companyPlaceholder:
          'Example: Technology Company',

        dates:
          'Dates',

        datesPlaceholder:
          '2022 — Present',

        description:
          'Description & Achievements',

        descriptionPlaceholder:
          'Write your main responsibilities and achievements...',

        removeExperience:
          'Remove this experience',

        degree:
          'Degree or Specialization',

        degreePlaceholder:
          'Example: Bachelor’s in Computer Science',

        school:
          'Educational Institution',

        schoolPlaceholder:
          'Example: University of Algiers',

        year:
          'Year',

        removeEducation:
          'Remove this education',

        qualification:
          'Qualification',

        noSavedCvs:
          'No saved resumes yet.',

        load:
          'Load',

        delete:
          'Delete',

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
       LANGUAGE
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
       AUTH
    ========================================================= */

    function showAuthStatus(message) {

      if (authStatus) {
        authStatus.textContent = message;
      }

    }


    async function getCurrentUser() {

      try {

        const {
          data,
          error
        } =
          await supabaseClient.auth.getUser();

        if (error) {

          console.error(
            'Get user error:',
            error
          );

          return null;
        }

        return data?.user || null;

      } catch (error) {

        console.error(
          'Get user error:',
          error
        );

        return null;
      }

    }


    async function signUp() {

      const email =
        authEmail?.value.trim();

      const password =
        authPassword?.value || '';

      if (!email || !password) {

        showAuthStatus(
          'أدخل البريد الإلكتروني وكلمة المرور.'
        );

        return;
      }

      try {

        const {
          data,
          error
        } =
          await supabaseClient.auth.signUp({
            email,
            password
          });

        if (error) {
          throw error;
        }

        if (data?.user) {

          showAuthStatus(
            'تم إنشاء الحساب بنجاح.'
          );

        }

      } catch (error) {

        console.error(
          'Sign up error:',
          error
        );

        showAuthStatus(
          error.message ||
          'حدث خطأ أثناء إنشاء الحساب.'
        );

      }

    }


    async function login() {

      const email =
        authEmail?.value.trim();

      const password =
        authPassword?.value || '';

      if (!email || !password) {

        showAuthStatus(
          'أدخل البريد الإلكتروني وكلمة المرور.'
        );

        return;
      }

      try {

        const {
          error
        } =
          await supabaseClient.auth.signInWithPassword({
            email,
            password
          });

        if (error) {
          throw error;
        }

        showAuthStatus(
          'تم تسجيل الدخول بنجاح.'
        );

        await renderSavedCVs();

      } catch (error) {

        console.error(
          'Login error:',
          error
        );

        showAuthStatus(
          error.message ||
          'حدث خطأ أثناء تسجيل الدخول.'
        );

      }

    }


    async function logout() {

      try {

        const {
          error
        } =
          await supabaseClient.auth.signOut();

        if (error) {
          throw error;
        }

        showAuthStatus(
          'تم تسجيل الخروج.'
        );

        if (savedCvsList) {
          savedCvsList.innerHTML = '';
          savedCvsList.style.display = 'none';
        }

      } catch (error) {

        console.error(
          'Logout error:',
          error
        );

        showAuthStatus(
          error.message ||
          'حدث خطأ أثناء تسجيل الخروج.'
        );

      }

    }


    async function updateAuthUI() {

      const user =
        await getCurrentUser();

      if (user) {

        if (signupBtn)
          signupBtn.hidden = true;

        if (loginBtn)
          loginBtn.hidden = true;

        if (logoutBtn)
          logoutBtn.hidden = false;

        showAuthStatus(
          `تم تسجيل الدخول: ${user.email}`
        );

      } else {

        if (signupBtn)
          signupBtn.hidden = false;

        if (loginBtn)
          loginBtn.hidden = false;

        if (logoutBtn)
          logoutBtn.hidden = true;

        showAuthStatus(
          'لم يتم تسجيل الدخول.'
        );

      }

    }


    if (signupBtn) {

      signupBtn.addEventListener(
        'click',
        signUp
      );

    }


    if (loginBtn) {

      loginBtn.addEventListener(
        'click',
        login
      );

    }


    if (logoutBtn) {

      logoutBtn.addEventListener(
        'click',
        logout
      );

    }


    supabaseClient.auth.onAuthStateChange(
      () => {
        updateAuthUI();
      }
    );


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

      document
        .querySelectorAll(
          '#language-select, [data-language-select], .language-select'
        )
        .forEach(select => {

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


      document
        .querySelectorAll(
          '[data-language], [data-lang]'
        )
        .forEach(button => {

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

    function setGroupLegend(
      elementId,
      translationKey
    ) {

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


      setText(
        '#language-label, [data-language-label]',
        t('chooseLanguage')
      );


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


      const personalFields = {

        targetJob:
          'targetJob',

        fullName:
          'fullName',

        jobTitle:
          'jobTitle',

        email:
          'email',

        phone:
          'phone',

        location:
          'location',

        summary:
          'summary'

      };


      Object.entries(personalFields)
        .forEach(([id, key]) => {

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
              t(key);
          }

        });


      const jobSelect =
        document.getElementById('targetJob');


      if (jobSelect) {

        const jobKeys = {

          '':
            'chooseJob',

          'Software Engineer':
            'softwareEngineer',

          'Receptionist':
            'receptionist',

          'Accountant':
            'accountant',

          'Teacher':
            'teacher',

          'Marketing Specialist':
            'marketing',

          'Other':
            'other'

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

          classic:
            'classic',

          modern:
            'modern',

          minimal:
            'minimal'

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
        .querySelectorAll(
          '[data-add="experience"]'
        )
        .forEach(button => {

          button.textContent =
            t('addExperience');

        });


      document
        .querySelectorAll(
          '[data-add="education"]'
        )
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
          root.querySelectorAll(
            '.field__label'
          );


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
          root.querySelector(
            '.entry__remove'
          );


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
          root.querySelectorAll(
            '.field__label'
          );


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
          root.querySelectorAll(
            'input'
          );


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
          root.querySelector(
            '.entry__remove'
          );


        if (remove) {

          remove.setAttribute(
            'aria-label',
            t('removeEducation')
          );

        }

      }

    }


    /* =========================================================
       TRANSLATE EXISTING ENTRIES
    ========================================================= */

    function translateExistingEntries() {

      if (experienceList) {

        experienceList
          .querySelectorAll('[data-entry]')
          .forEach(entry => {

            const labels =
              entry.querySelectorAll(
                '.field__label'
              );


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
              entry.querySelector(
                '.entry__remove'
              );


            if (remove) {

              remove.setAttribute(
                'aria-label',
                t('removeExperience')
              );

            }

          });

      }


      if (educationList) {

        educationList
          .querySelectorAll('[data-entry]')
          .forEach(entry => {

            const labels =
              entry.querySelectorAll(
                '.field__label'
              );


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
              entry.querySelectorAll(
                'input'
              );


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
              entry.querySelector(
                '.entry__remove'
              );


            if (remove) {

              remove.setAttribute(
                'aria-label',
                t('removeEducation')
              );

            }

          });

      }


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
        experienceTemplate.content
          .cloneNode(true);


      const entry =
        fragment.querySelector(
          '[data-entry]'
        );


      if (!entry) {
        return;
      }


      experienceList.appendChild(
        fragment
      );


      const role =
        entry.querySelector(
          '.js-role'
        );

      const company =
        entry.querySelector(
          '.js-company'
        );

      const dates =
        entry.querySelector(
          '.js-dates'
        );

      const description =
        entry.querySelector(
          '.js-desc'
        );


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
        entry.querySelector(
          '.entry__remove'
        );


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
        .querySelectorAll(
          'input, textarea'
        )
        .forEach(element => {

          element.addEventListener(
            'input',
            render
          );

        });


      translateExistingEntries();

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
        educationTemplate.content
          .cloneNode(true);


      const entry =
        fragment.querySelector(
          '[data-entry]'
        );


      if (!entry) {
        return;
      }


      educationList.appendChild(
        fragment
      );


      const degree =
        entry.querySelector(
          '.js-degree'
        );

      const school =
        entry.querySelector(
          '.js-school'
        );

      const year =
        entry.querySelector(
          '.js-year'
        );


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
        entry.querySelector(
          '.entry__remove'
        );


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
        .querySelectorAll(
          'input, textarea'
        )
        .forEach(element => {

          element.addEventListener(
            'input',
            render
          );

        });


      translateExistingEntries();

    }


    /* =========================================================
       READ EXPERIENCE
    ========================================================= */

    function readExperience() {

      if (!experienceList) {
        return [];
      }


      return Array.from(
        experienceList.querySelectorAll(
          '[data-entry]'
        )
      )
        .map(entry => ({

          role:
            entry.querySelector(
              '.js-role'
            )?.value.trim() || '',

          company:
            entry.querySelector(
              '.js-company'
            )?.value.trim() || '',

          dates:
            entry.querySelector(
              '.js-dates'
            )?.value.trim() || '',

          description:
            entry.querySelector(
              '.js-desc'
            )?.value.trim() || ''

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
        educationList.querySelectorAll(
          '[data-entry]'
        )
      )
        .map(entry => ({

          degree:
            entry.querySelector(
              '.js-degree'
            )?.value.trim() || '',

          school:
            entry.querySelector(
              '.js-school'
            )?.value.trim() || '',

          year:
            entry.querySelector(
              '.js-year'
            )?.value.trim() || ''

        }))
        .filter(item =>
          item.degree ||
          item.school ||
          item.year
        );

    }


    /* =========================================================
       RENDER
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
          <li>
            ${escapeHTML(skill)}
          </li>
        `).join('');

    }


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
          <li>
            ${escapeHTML(language)}
          </li>
        `).join('');

    }


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
        splitList(
          getValue('skills')
        );

      const languages =
        splitList(
          getValue('languages')
        );

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


      renderExperience(
        experience
      );

      renderEducation(
        education
      );

      renderSkills(
        skills
      );

      renderLanguages(
        languages
      );


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
       ADD BUTTONS
    ========================================================= */

    document
      .querySelectorAll('[data-add]')
      .forEach(button => {

        button.addEventListener(
          'click',
          () => {

            const type =
              button.getAttribute(
                'data-add'
              );


            if (
              type === 'experience'
            ) {

              addExperienceEntry();

            }


            if (
              type === 'education'
            ) {

              addEducationEntry();

            }


            render();

          }
        );

      });


    if (templateSelect) {

      templateSelect.addEventListener(
        'change',
        render
      );

    }


    form.addEventListener(
      'input',
      render
    );


    form.addEventListener(
      'change',
      render
    );


    /* =========================================================
       AI USAGE LIMIT
    ========================================================= */

    /*
      الحد المجاني لكل حساب.
      لا يعتمد على اسم المستخدم أو محتوى السيرة الذاتية.
    */

    const FREE_AI_USES = 2;


    /*
      قراءة عدد استعمالات AI من جدول ai_usage
      حسب user_id الخاص بحساب Supabase.
    */

    async function getAIUsage() {

      const user =
        await getCurrentUser();


      if (!user) {

        return {
          user: null,
          count: 0
        };

      }


      const {
        data,
        error
      } =
        await supabaseClient
          .from('ai_usage')
          .select('uses')
          .eq(
            'user_id',
            user.id
          )
          .maybeSingle();


      if (error) {

        console.error(
          'Get AI usage error:',
          error
        );

        throw error;

      }


      return {

        user,

        count:
          Number(
            data?.uses || 0
          )

      };

    }


    /*
      زيادة الاستخدام تتم عن طريق PostgreSQL RPC.

      الدالة الموجودة في Supabase يجب أن تكون:
      increment_ai_usage

      وهي التي تستخدم auth.uid()
      وبالتالي لا يمكن للمستخدم اختيار user_id آخر.
    */

    async function incrementAIUsage() {

      const {
        data,
        error
      } =
        await supabaseClient
          .rpc(
            'increment_ai_usage'
          );


      if (error) {

        console.error(
          'Increment AI usage RPC error:',
          error
        );

        throw error;

      }


      return Number(
        data || 0
      );

    }


    function showAIUsageMessage(count) {

  if (count === 1) {

    alert(
      `تم استخدامك الأول للذكاء الاصطناعي.\n\nتبقى لك استعمال مجاني واحد.`
    );

    return;
  }

  if (count === 2) {
    showPaymentOptions();
  }

}


    function showPaymentOptions() {

  // منع فتح النافذة أكثر من مرة
  if (document.getElementById('aiPlansModal')) {
    return;
  }

  const modal = document.createElement('div');
  modal.id = 'aiPlansModal';

  modal.innerHTML = `
    <div style="
      position:fixed;
      inset:0;
      background:rgba(0,0,0,.65);
      display:flex;
      align-items:center;
      justify-content:center;
      z-index:99999;
      padding:20px;
      direction:rtl;
    ">

      <div style="
        width:100%;
        max-width:520px;
        background:#fff;
        border-radius:20px;
        padding:24px;
        box-sizing:border-box;
        box-shadow:0 20px 60px rgba(0,0,0,.3);
        color:#1f2937;
      ">

        <h2 style="
          margin:0 0 10px;
          text-align:center;
          font-size:24px;
        ">
          اختر خطة للمتابعة
        </h2>

        <p style="
          text-align:center;
          margin:0 0 22px;
          color:#6b7280;
          line-height:1.7;
        ">
          انتهت الاستعمالات المجانية للذكاء الاصطناعي.
        </p>


        <!-- الخطة الشهرية -->
        <div style="
          border:2px solid #0f766e;
          border-radius:16px;
          padding:18px;
          margin-bottom:14px;
        ">

          <div style="
            display:flex;
            justify-content:space-between;
            align-items:center;
            gap:10px;
          ">

            <div>
              <strong style="font-size:19px;">
                الخطة الشهرية
              </strong>

              <div style="
                margin-top:6px;
                color:#6b7280;
              ">
                30 استعمال للذكاء الاصطناعي
              </div>
            </div>

            <strong style="
              font-size:22px;
              white-space:nowrap;
            ">
              $4.99
            </strong>

          </div>

          <button
            type="button"
            onclick="Paddle.Checkout.open({
  items: [{
    priceId: PADDLE_PRICE_ID_MONTHLY,
    quantity: 1
  }]
})"
            style="
              width:100%;
              margin-top:15px;
              padding:13px;
              border:0;
              border-radius:10px;
              background:#0f766e;
              color:white;
              font-size:16px;
              font-weight:600;
              cursor:pointer;
            "
          >
            اختيار الخطة الشهرية
          </button>

        </div>


        <!-- الخطة مرة واحدة -->
        <div style="
          border:1px solid #d1d5db;
          border-radius:16px;
          padding:18px;
          margin-bottom:18px;
        ">

          <div style="
            display:flex;
            justify-content:space-between;
            align-items:center;
            gap:10px;
          ">

            <div>
              <strong style="font-size:19px;">
                خطة الاستخدام الواحد
              </strong>

              <div style="
                margin-top:6px;
                color:#6b7280;
              ">
                60 استعمال للذكاء الاصطناعي
              </div>
            </div>

            <strong style="
              font-size:22px;
              white-space:nowrap;
            ">
              $9.99
            </strong>

          </div>

          <button
            type="button"
            onclick="Paddle.Checkout.open({
  items: [{
    priceId: PADDLE_PRICE_ID_ONE_TIME,
    quantity: 1
  }]
})"
            style="
              width:100%;
              margin-top:15px;
              padding:13px;
              border:0;
              border-radius:10px;
              background:#374151;
              color:white;
              font-size:16px;
              font-weight:600;
              cursor:pointer;
            "
          >
            اختيار الخطة
          </button>

        </div>


        <button
          type="button"
          onclick="document.getElementById('aiPlansModal').remove()"
          style="
            width:100%;
            padding:11px;
            border:1px solid #d1d5db;
            border-radius:10px;
            background:white;
            color:#374151;
            font-size:15px;
            cursor:pointer;
          "
        >
          إغلاق
        </button>

      </div>

    </div>
  `;

  document.body.appendChild(modal);
}

    /* =========================================================
       AI
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


        generateBtn.disabled =
          true;

        generateBtn.textContent =
          t('improving');


        try {

          /* =====================================================
             REQUIRE LOGIN FOR AI
          ===================================================== */

          const user =
            await getCurrentUser();


          if (!user) {

            alert(
              'يجب تسجيل الدخول أولاً لاستخدام الذكاء الاصطناعي.'
            );

            return;

          }


          /* =====================================================
             CHECK AI USAGE BEFORE SENDING REQUEST
          ===================================================== */

          const usage =
            await getAIUsage();


          if (
            usage.count >= FREE_AI_USES
          ) {

            showPaymentOptions();

            return;

          }


          const experience =
            readExperience();

          const education =
            readEducation();


          /* =====================================================
             BUILD CV TEXT
          ===================================================== */

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


          /* =====================================================
             SEND REQUEST TO BACKEND
          ===================================================== */

          const {
  data: sessionData,
  error: sessionError
} = await supabaseClient.auth.getSession();

if (sessionError) {
  throw sessionError;
}

const accessToken =
  sessionData?.session?.access_token;

if (!accessToken) {
  throw new Error(
    'جلسة تسجيل الدخول غير متوفرة. يرجى تسجيل الدخول مرة أخرى.'
  );
}

const response =
  await fetch(
    'https://cv-genius-ai-backend.vercel.app/improve-cv',
    {
      method: 'POST',

      headers: {
        'Content-Type':
          'application/json',

        'Authorization':
          `Bearer ${accessToken}`
      },

      body:
        JSON.stringify({

          text:
            cvText,

          language:
            currentLanguage

        })
    }
  );


          let data = null;


          try {

            data =
              await response.json();

          } catch {

            data =
              null;

          }


          if (!response.ok) {

            throw new Error(
              data?.error ||
              t('aiError')
            );

          }


          if (!data?.result) {

            throw new Error(
              t('aiEmpty')
            );

          }


          /* =====================================================
             COUNT SUCCESSFUL AI USE
          ===================================================== */

          const newUsageCount =
            await incrementAIUsage();


          const aiResult =
            String(
              data.result
            ).trim();


          sessionStorage.setItem(
            'cvGeniusAI_lastAIResult',
            aiResult
          );


          let improvedCV =
            null;


          try {

            improvedCV =
              JSON.parse(
                aiResult
              );

          } catch (jsonError) {

            console.warn(
              'Gemini result is not valid JSON:',
              jsonError
            );

          }


          /* =====================================================
             APPLY IMPROVED SUMMARY
          ===================================================== */

          if (
            improvedCV &&
            typeof improvedCV === 'object'
          ) {


            if (
              typeof improvedCV.summary ===
              'string'
            ) {

              const summaryInput =
                document.getElementById(
                  'summary'
                );


              if (summaryInput) {

                summaryInput.value =
                  improvedCV.summary.trim();

              }

            }


            /* ===================================================
               APPLY IMPROVED EXPERIENCE
            =================================================== */

            if (
              Array.isArray(
                improvedCV.experience
              )
            ) {

              if (experienceList) {

                experienceList.innerHTML =
                  '';

              }


              improvedCV.experience
                .forEach(item => {

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

                });

            }


            /* ===================================================
               APPLY IMPROVED EDUCATION
            =================================================== */

            if (
              Array.isArray(
                improvedCV.education
              )
            ) {

              if (educationList) {

                educationList.innerHTML =
                  '';

              }


              improvedCV.education
                .forEach(item => {

                  addEducationEntry({

                    degree:
                      item?.degree || '',

                    school:
                      item?.school || '',

                    year:
                      item?.year || ''

                  });

                });

            }


            /* ===================================================
               APPLY IMPROVED SKILLS
            =================================================== */

            if (
              Array.isArray(
                improvedCV.skills
              )
            ) {

              const skillsInput =
                document.getElementById(
                  'skills'
                );


              if (skillsInput) {

                skillsInput.value =
                  improvedCV.skills
                    .map(skill =>
                      String(
                        skill
                      ).trim()
                    )
                    .filter(Boolean)
                    .join(', ');

              }

            }


            /* ===================================================
               APPLY IMPROVED LANGUAGES
            =================================================== */

            if (
              Array.isArray(
                improvedCV.languages
              )
            ) {

              const languagesInput =
                document.getElementById(
                  'languages'
                );


              if (languagesInput) {

                languagesInput.value =
                  improvedCV.languages
                    .map(language =>
                      String(
                        language
                      ).trim()
                    )
                    .filter(Boolean)
                    .join(', ');

              }

            }


            render();


            sessionStorage.setItem(
              'cvGeniusAI_lastAIResult',
              JSON.stringify(
                improvedCV
              )
            );

          }


          /* =====================================================
             AI OUTPUT
          ===================================================== */

          const aiOutput =
            document.getElementById(
              'ai-result'
            );


          if (aiOutput) {

            aiOutput.textContent =
              improvedCV
                ? ''
                : aiResult;

            aiOutput.hidden =
              !aiOutput.textContent;

          }


          /* =====================================================
             SHOW USAGE MESSAGE
          ===================================================== */

          showAIUsageMessage(
            newUsageCount
          );


          generateBtn.textContent =
            t('generated');


          if (sheet) {

            sheet.scrollIntoView({

              behavior:
                'smooth',

              block:
                'start'

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


          const originalTitle =
            document.title;


          document.title =
            getValue('fullName') ||
            'CV';


          requestAnimationFrame(() => {

            requestAnimationFrame(() => {

              window.print();


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
       PDF
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

            filename:
              fileName,

            image: {
              type: 'jpeg',
              quality: 0.98
            },

            html2canvas: {

              scale: 2,

              useCORS: true,

              allowTaint: false,

              backgroundColor:
                '#ffffff',

              logging: false,

              scrollX: 0,

              scrollY: 0,

              windowWidth:
                sheet.scrollWidth,

              windowHeight:
                sheet.scrollHeight

            },

            jsPDF: {

              unit: 'mm',

              format: 'a4',

              orientation:
                'portrait',

              compress: true

            },

            pagebreak: {

              mode: [
                'css',
                'legacy'
              ],

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
       COLLECT CV
    ========================================================= */

    function collectCVData() {

      return {

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
          readEducation()

      };

    }


    /* =========================================================
       SAVE CV — SUPABASE ONLY
    ========================================================= */

    if (saveCvBtn) {

      saveCvBtn.addEventListener(
        'click',
        async () => {

          const user =
            await getCurrentUser();


          if (!user) {

            alert(
              'يرجى تسجيل الدخول أولاً.'
            );

            return;
          }


          const cv =
            collectCVData();


          if (!cv.fullName) {

            alert(
              t('enterName')
            );


            document
              .getElementById(
                'fullName'
              )
              ?.focus();


            return;
          }


          try {

            saveCvBtn.disabled =
              true;


            saveCvBtn.textContent =
              'جارٍ الحفظ...';


            const {
              error
            } =
              await supabaseClient
                .from('resumes')
                .insert({

                  user_id:
                    user.id,

                  data:
                    cv

                });


            if (error) {
              throw error;
            }


            saveCvBtn.textContent =
              t('saved');


            await renderSavedCVs();


            setTimeout(() => {

              saveCvBtn.disabled =
                false;

              saveCvBtn.textContent =
                t('saveCv');

            }, 1500);


          } catch (error) {

            console.error(
              'Save CV error:',
              error
            );


            saveCvBtn.disabled =
              false;


            saveCvBtn.textContent =
              t('saveCv');


            alert(
              'حدث خطأ أثناء حفظ السيرة الذاتية.'
            );

          }

        }
      );

    }


    /* =========================================================
       RENDER SAVED CVS — SUPABASE ONLY
    ========================================================= */

    async function renderSavedCVs() {

      if (!savedCvsList) {
        return;
      }


      const user =
        await getCurrentUser();


      if (!user) {

        savedCvsList.innerHTML = `
          <p class="saved-cv-empty">
            يرجى تسجيل الدخول لعرض سيرك الذاتية.
          </p>
        `;

        return;
      }


      try {

        const {
          data: cvs,
          error
        } =
          await supabaseClient
            .from('resumes')
            .select(
              'id, data, created_at'
            )
            .eq(
              'user_id',
              user.id
            )
            .order(
              'created_at',
              {
                ascending:
                  false
              }
            );


        if (error) {
          throw error;
        }


        if (
          !cvs ||
          !cvs.length
        ) {

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
          cvs.map(cvRow => {

            const cv =
              cvRow.data || {};


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
                data-saved-id="${escapeHTML(
                  cvRow.id
                )}"
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
                    data-id="${escapeHTML(
                      cvRow.id
                    )}"
                  >
                    ${escapeHTML(
                      t('load')
                    )}
                  </button>


                  <button
                    type="button"
                    class="btn btn--text js-delete-cv"
                    data-id="${escapeHTML(
                      cvRow.id
                    )}"
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
          .querySelectorAll(
            '.js-load-cv'
          )
          .forEach(button => {

            button.addEventListener(
              'click',
              () => {

                loadCV(
                  button.dataset.id
                );

              }
            );

          });


        savedCvsList
          .querySelectorAll(
            '.js-delete-cv'
          )
          .forEach(button => {

            button.addEventListener(
              'click',
              () => {

                deleteCV(
                  button.dataset.id
                );

              }
            );

          });


      } catch (error) {

        console.error(
          'Render saved CVs error:',
          error
        );


        savedCvsList.innerHTML = `
          <p class="saved-cv-empty">
            حدث خطأ أثناء تحميل السير الذاتية.
          </p>
        `;

      }

    }


    /* =========================================================
       LOAD CV — SUPABASE ONLY
    ========================================================= */

    async function loadCV(id) {

      const user =
        await getCurrentUser();


      if (!user) {

        alert(
          'يرجى تسجيل الدخول أولاً.'
        );

        return;
      }


      try {

        const {
          data: row,
          error
        } =
          await supabaseClient
            .from('resumes')
            .select(
              'id, data'
            )
            .eq(
              'id',
              id
            )
            .eq(
              'user_id',
              user.id
            )
            .single();


        if (error) {
          throw error;
        }


        const cv =
          row?.data;


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
            document.getElementById(
              id
            );


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
          Array.isArray(
            cv.experience
          ) &&
          cv.experience.length
        ) {

          cv.experience.forEach(
            addExperienceEntry
          );

        } else {

          addExperienceEntry();

        }


        if (
          Array.isArray(
            cv.education
          ) &&
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
          behavior:
            'smooth',

          block:
            'start'

        });


      } catch (error) {

        console.error(
          'Load CV error:',
          error
        );


        alert(
          'حدث خطأ أثناء تحميل السيرة الذاتية.'
        );

      }

    }


    /* =========================================================
       DELETE CV — SUPABASE ONLY
    ========================================================= */

    async function deleteCV(id) {

      const user =
        await getCurrentUser();


      if (!user) {

        alert(
          'يرجى تسجيل الدخول أولاً.'
        );

        return;
      }


      if (
        !window.confirm(
          t('deleteConfirm')
        )
      ) {

        return;

      }


      try {

        const {
          error
        } =
          await supabaseClient
            .from('resumes')
            .delete()
            .eq(
              'id',
              id
            )
            .eq(
              'user_id',
              user.id
            );


        if (error) {
          throw error;
        }


        await renderSavedCVs();


      } catch (error) {

        console.error(
          'Delete CV error:',
          error
        );


        alert(
          'حدث خطأ أثناء حذف السيرة الذاتية.'
        );

      }

    }


    /* =========================================================
       MY CVS
    ========================================================= */

    if (myCvsBtn) {

      myCvsBtn.addEventListener(
        'click',
        async () => {

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

            await renderSavedCVs();

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

    updateAuthUI();

  });

})();
