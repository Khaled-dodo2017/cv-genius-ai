(() => {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {

    /* =========================
       ELEMENTS
    ========================= */

    const form = document.getElementById('cv-form');

    const experienceList = document.getElementById('experience-list');
    const educationList = document.getElementById('education-list');

    const experienceTemplate = document.getElementById('experience-entry-template');
    const educationTemplate = document.getElementById('education-entry-template');

    const sheet = document.getElementById('cv-sheet');

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

    const generateBtn = document.getElementById('generate-btn');
    const printBtn = document.getElementById('print-btn');
    const downloadPdfBtn = document.getElementById('download-pdf-btn');
    const newCvBtn = document.getElementById('new-cv-btn');
    const saveCvBtn = document.getElementById('save-cv-btn');
    const myCvsBtn = document.getElementById('my-cvs-btn');
    const savedCvsList = document.getElementById('saved-cvs-list');
    const templateSelect = document.getElementById('cv-template');


    /* =========================
       SAFETY CHECK
    ========================= */

    if (!form || !sheet) {
      console.error('CV Genius AI: Required elements are missing.');
      return;
    }


    /* =========================
       HELPERS
    ========================= */

    function escapeHTML(value) {
      const div = document.createElement('div');
      div.textContent = value ?? '';
      return div.innerHTML;
    }


    function getValue(id) {
      const element = document.getElementById(id);
      return element ? element.value.trim() : '';
    }


    function splitList(value) {
      return (value || '')
        .split(',')
        .map(item => item.trim())
        .filter(Boolean);
    }


    /* =========================
       DYNAMIC EXPERIENCE
    ========================= */

    function addExperienceEntry(data = {}) {

      if (!experienceTemplate || !experienceList) {
        return;
      }

      const fragment = experienceTemplate.content.cloneNode(true);
      const entry = fragment.querySelector('[data-entry]');

      if (!entry) {
        return;
      }

      experienceList.appendChild(fragment);

      const role = entry.querySelector('.js-role');
      const company = entry.querySelector('.js-company');
      const dates = entry.querySelector('.js-dates');
      const description = entry.querySelector('.js-desc');

      if (role) role.value = data.role || '';
      if (company) company.value = data.company || '';
      if (dates) dates.value = data.dates || '';
      if (description) description.value = data.description || '';

      const removeButton = entry.querySelector('.entry__remove');

      if (removeButton) {
        removeButton.addEventListener('click', () => {
          entry.remove();
          render();
        });
      }

      entry.querySelectorAll('input, textarea').forEach(element => {
        element.addEventListener('input', render);
      });
    }


    /* =========================
       DYNAMIC EDUCATION
    ========================= */

    function addEducationEntry(data = {}) {

      if (!educationTemplate || !educationList) {
        return;
      }

      const fragment = educationTemplate.content.cloneNode(true);
      const entry = fragment.querySelector('[data-entry]');

      if (!entry) {
        return;
      }

      educationList.appendChild(fragment);

      const degree = entry.querySelector('.js-degree');
      const school = entry.querySelector('.js-school');
      const year = entry.querySelector('.js-year');

      if (degree) degree.value = data.degree || '';
      if (school) school.value = data.school || '';
      if (year) year.value = data.year || '';

      const removeButton = entry.querySelector('.entry__remove');

      if (removeButton) {
        removeButton.addEventListener('click', () => {
          entry.remove();
          render();
        });
      }

      entry.querySelectorAll('input, textarea').forEach(element => {
        element.addEventListener('input', render);
      });
    }


    /* =========================
       READ EXPERIENCE
    ========================= */

    function readExperience() {

      if (!experienceList) {
        return [];
      }

      return Array.from(
        experienceList.querySelectorAll('[data-entry]')
      )
        .map(entry => ({
          role: entry.querySelector('.js-role')?.value.trim() || '',
          company: entry.querySelector('.js-company')?.value.trim() || '',
          dates: entry.querySelector('.js-dates')?.value.trim() || '',
          description: entry.querySelector('.js-desc')?.value.trim() || ''
        }))
        .filter(item =>
          item.role ||
          item.company ||
          item.dates ||
          item.description
        );
    }


    /* =========================
       READ EDUCATION
    ========================= */

    function readEducation() {

      if (!educationList) {
        return [];
      }

      return Array.from(
        educationList.querySelectorAll('[data-entry]')
      )
        .map(entry => ({
          degree: entry.querySelector('.js-degree')?.value.trim() || '',
          school: entry.querySelector('.js-school')?.value.trim() || '',
          year: entry.querySelector('.js-year')?.value.trim() || ''
        }))
        .filter(item =>
          item.degree ||
          item.school ||
          item.year
        );
    }


    /* =========================
       RENDER EXPERIENCE
    ========================= */

    function renderExperience(items) {

      if (!sections.experience || !out.experience) {
        return;
      }

      if (!items.length) {
        sections.experience.hidden = true;
        out.experience.innerHTML = '';
        return;
      }

      sections.experience.hidden = false;

      out.experience.innerHTML = items.map(item => `
        <div class="sheet-entry">

          <div class="sheet-entry__top">

            <span>
              ${escapeHTML(item.role || 'Position')}
            </span>

            ${
              item.dates
                ? `<span class="sheet-entry__dates">
                    ${escapeHTML(item.dates)}
                   </span>`
                : ''
            }

          </div>

          ${
            item.company
              ? `<p class="sheet-entry__sub">
                   ${escapeHTML(item.company)}
                 </p>`
              : ''
          }

          ${
            item.description
              ? `<p class="sheet-entry__desc">
                   ${escapeHTML(item.description)}
                 </p>`
              : ''
          }

        </div>
      `).join('');
    }


    /* =========================
       RENDER EDUCATION
    ========================= */

    function renderEducation(items) {

      if (!sections.education || !out.education) {
        return;
      }

      if (!items.length) {
        sections.education.hidden = true;
        out.education.innerHTML = '';
        return;
      }

      sections.education.hidden = false;

      out.education.innerHTML = items.map(item => `
        <div class="sheet-entry">

          <div class="sheet-entry__top">

            <span>
              ${escapeHTML(item.degree || 'Qualification')}
            </span>

            ${
              item.year
                ? `<span class="sheet-entry__dates">
                    ${escapeHTML(item.year)}
                   </span>`
                : ''
            }

          </div>

          ${
            item.school
              ? `<p class="sheet-entry__sub">
                   ${escapeHTML(item.school)}
                 </p>`
              : ''
          }

        </div>
      `).join('');
    }


    /* =========================
       RENDER SKILLS
    ========================= */

    function renderSkills(skills) {

      if (!sections.skills || !out.skills) {
        return;
      }

      if (!skills.length) {
        sections.skills.hidden = true;
        out.skills.innerHTML = '';
        return;
      }

      sections.skills.hidden = false;

      out.skills.innerHTML = skills
        .map(skill => `
          <li>${escapeHTML(skill)}</li>
        `)
        .join('');
    }


    /* =========================
       RENDER LANGUAGES
    ========================= */

    function renderLanguages(languages) {

      if (!sections.languages || !out.languages) {
        return;
      }

      if (!languages.length) {
        sections.languages.hidden = true;
        out.languages.innerHTML = '';
        return;
      }

      sections.languages.hidden = false;

      out.languages.innerHTML = languages
        .map(language => `
          <li>${escapeHTML(language)}</li>
        `)
        .join('');
    }


    /* =========================
       MAIN RENDER
    ========================= */

    function render() {

      const fullName = getValue('fullName');
      const jobTitle = getValue('jobTitle');
      const targetJob = getValue('targetJob');
      const email = getValue('email');
      const phone = getValue('phone');
      const location = getValue('location');
      const summary = getValue('summary');

      const skills = splitList(getValue('skills'));
      const languages = splitList(getValue('languages'));

      const experience = readExperience();
      const education = readEducation();


      /* Name */

      if (out.name) {
        out.name.textContent =
          fullName || 'Your Name';
      }


      /* Job title */

      if (out.title) {
        out.title.textContent =
          jobTitle ||
          targetJob ||
          'Job Title';
      }


      /* Contact */

      if (out.contact) {

        const contactParts = [
          email,
          phone,
          location
        ].filter(Boolean);

        out.contact.textContent =
          contactParts.length
            ? contactParts.join('  ·  ')
            : 'email · phone · location';
      }


      /* Summary */

      if (out.summary) {

        if (summary) {
          out.summary.textContent = summary;
          out.summary.hidden = false;
        } else {
          out.summary.textContent = '';
          out.summary.hidden = true;
        }
      }


      /* Sections */

      renderExperience(experience);
      renderEducation(education);
      renderSkills(skills);
      renderLanguages(languages);


      /* Template */

      if (templateSelect && sheet) {
        const selectedTemplate =
          templateSelect.value || 'classic';

        sheet.dataset.template = selectedTemplate;
      }
    }


    /* =========================
       TEMPLATE CHANGE
    ========================= */

    if (templateSelect) {

      templateSelect.addEventListener('change', () => {

        if (sheet) {
          sheet.dataset.template =
            templateSelect.value || 'classic';
        }

        render();
      });
    }


    /* =========================
       ADD BUTTONS
    ========================= */

    document.querySelectorAll('[data-add]').forEach(button => {

      button.addEventListener('click', () => {

        const type =
          button.getAttribute('data-add');

        if (type === 'experience') {
          addExperienceEntry();
        }

        if (type === 'education') {
          addEducationEntry();
        }

        render();
      });

    });


    /* =========================
       FORM INPUT
    ========================= */

    form.addEventListener('input', () => {
      render();
    });


    form.addEventListener('change', () => {
      render();
    });


    /* =========================
       GENERATE CV
    ========================= */

    form.addEventListener('submit', event => {

      event.preventDefault();

      render();

      if (generateBtn) {

        const originalText =
          generateBtn.textContent;

        generateBtn.textContent =
          'CV Generated ✓';

        window.setTimeout(() => {
          generateBtn.textContent =
            originalText;
        }, 1400);
      }

      if (sheet) {

        sheet.style.transition =
          'transform 180ms ease, box-shadow 180ms ease';

        sheet.style.transform =
          'scale(1.01)';

        window.setTimeout(() => {
          sheet.style.transform = '';
        }, 220);

        window.setTimeout(() => {
          sheet.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }, 80);
      }
    });


    /* =========================
       PRINT
    ========================= */

    if (printBtn) {

      printBtn.addEventListener('click', () => {

        render();

        window.setTimeout(() => {
          window.print();
        }, 100);
      });
    }


    /* =========================
       DOWNLOAD PDF
    ========================= */

    if (downloadPdfBtn) {

      downloadPdfBtn.addEventListener('click', async () => {

        render();

        if (typeof window.html2pdf !== 'function') {

          alert(
            'PDF library is not available. Please check your internet connection and try again.'
          );

          return;
        }

        const fullName =
          getValue('fullName') || 'CV';

        const safeName =
          fullName
            .replace(/[\\/:*?"<>|]/g, '')
            .replace(/\s+/g, '-')
            .substring(0, 60);

        const fileName =
          `CV-Genius-AI-${safeName || 'CV'}.pdf`;

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
            backgroundColor: '#ffffff'
          },
          jsPDF: {
            unit: 'mm',
            format: 'a4',
            orientation: 'portrait'
          },
          pagebreak: {
            mode: ['css', 'legacy']
          }
        };

        try {

          downloadPdfBtn.disabled = true;

          const originalText =
            downloadPdfBtn.textContent;

          downloadPdfBtn.textContent =
            'Creating PDF...';

          await window.html2pdf()
            .set(options)
            .from(sheet)
            .save();

          downloadPdfBtn.textContent =
            'PDF Downloaded ✓';

          window.setTimeout(() => {
            downloadPdfBtn.textContent =
              originalText;
            downloadPdfBtn.disabled = false;
          }, 1500);

        } catch (error) {

          console.error(
            'CV Genius AI PDF error:',
            error
          );

          downloadPdfBtn.textContent =
            'Download PDF';

          downloadPdfBtn.disabled = false;

          alert(
            'Unable to create the PDF. Please try again.'
          );
        }
      });
    }


    /* =========================
       COLLECT CV DATA
    ========================= */

    function collectCVData() {

      return {
        id: Date.now(),

        targetJob: getValue('targetJob'),
        fullName: getValue('fullName'),
        jobTitle: getValue('jobTitle'),
        email: getValue('email'),
        phone: getValue('phone'),
        location: getValue('location'),
        summary: getValue('summary'),

        skills: getValue('skills'),
        languages: getValue('languages'),

        template:
          templateSelect
            ? templateSelect.value
            : 'classic',

        experience: readExperience(),
        education: readEducation(),

        createdAt:
          new Date().toISOString()
      };
    }


    /* =========================
       SAVE CV
    ========================= */

    function getSavedCVs() {

      try {

        const saved =
          localStorage.getItem(
            'cvGeniusAI_CVs'
          );

        if (!saved) {
          return [];
        }

        const parsed =
          JSON.parse(saved);

        return Array.isArray(parsed)
          ? parsed
          : [];

      } catch (error) {

        console.error(
          'Unable to read saved CVs:',
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
          'Unable to save CVs:',
          error
        );

        return false;
      }
    }


    if (saveCvBtn) {

      saveCvBtn.addEventListener('click', () => {

        render();

        const cv =
          collectCVData();

        if (!cv.fullName) {

          alert(
            'Please enter your full name before saving the CV.'
          );

          document
            .getElementById('fullName')
            ?.focus();

          return;
        }

        const cvs =
          getSavedCVs();

        cvs.unshift(cv);

        const success =
          saveCVs(cvs.slice(0, 20));

        if (success) {

          saveCvBtn.textContent =
            'Saved ✓';

          window.setTimeout(() => {
            saveCvBtn.textContent =
              'Save CV';
          }, 1500);

          renderSavedCVs();
        }
      });
    }


    /* =========================
       NEW CV
    ========================= */

    function clearForm() {

      form.reset();

      if (experienceList) {
        experienceList.innerHTML = '';
      }

      if (educationList) {
        educationList.innerHTML = '';
      }

      addExperienceEntry();
      addEducationEntry();

      if (templateSelect) {
        templateSelect.value =
          'classic';
      }

      render();
    }


    if (newCvBtn) {

      newCvBtn.addEventListener('click', () => {

        const confirmed =
          window.confirm(
            'Start a new CV? Your current unsaved data will be cleared.'
          );

        if (!confirmed) {
          return;
        }

        clearForm();

        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      });
    }


    /* =========================
       MY CVS
    ========================= */

    function renderSavedCVs() {

      if (!savedCvsList) {
        return;
      }

      const cvs =
        getSavedCVs();

      if (!cvs.length) {

        savedCvsList.innerHTML =
          '<p class="saved-cv-empty">No saved CVs yet.</p>';

        return;
      }

      savedCvsList.innerHTML = cvs
        .map((cv, index) => {

          const name =
            escapeHTML(
              cv.fullName || 'Unnamed CV'
            );

          const job =
            escapeHTML(
              cv.jobTitle ||
              cv.targetJob ||
              'CV'
            );

          return `
            <div class="saved-cv-item"
                 data-saved-index="${index}">

              <div class="saved-cv-info">
                <strong>${name}</strong>
                <span>${job}</span>
              </div>

              <div class="saved-cv-actions">

                <button
                  type="button"
                  class="btn btn--text js-load-cv"
                  data-index="${index}">
                  Load
                </button>

                <button
                  type="button"
                  class="btn btn--text js-delete-cv"
                  data-index="${index}">
                  Delete
                </button>

              </div>

            </div>
          `;
        })
        .join('');


      /* Load */

      savedCvsList
        .querySelectorAll('.js-load-cv')
        .forEach(button => {

          button.addEventListener('click', () => {

            const index =
              Number(
                button.getAttribute('data-index')
              );

            loadCV(index);
          });
        });


      /* Delete */

      savedCvsList
        .querySelectorAll('.js-delete-cv')
        .forEach(button => {

          button.addEventListener('click', () => {

            const index =
              Number(
                button.getAttribute('data-index')
              );

            deleteCV(index);
          });
        });
    }


    /* =========================
       LOAD SAVED CV
    ========================= */

    function loadCV(index) {

      const cvs =
        getSavedCVs();

      const cv =
        cvs[index];

      if (!cv) {
        return;
      }


      const fields = {
        targetJob: cv.targetJob,
        fullName: cv.fullName,
        jobTitle: cv.jobTitle,
        email: cv.email,
        phone: cv.phone,
        location: cv.location,
        summary: cv.summary,
        skills: cv.skills,
        languages: cv.languages
      };


      Object.entries(fields).forEach(([id, value]) => {

        const element =
          document.getElementById(id);

        if (element) {
          element.value =
            value || '';
        }
      });


      if (experienceList) {
        experienceList.innerHTML = '';
      }

      if (educationList) {
        educationList.innerHTML = '';
      }


      if (
        Array.isArray(cv.experience) &&
        cv.experience.length
      ) {

        cv.experience.forEach(item => {
          addExperienceEntry(item);
        });

      } else {

        addExperienceEntry();
      }


      if (
        Array.isArray(cv.education) &&
        cv.education.length
      ) {

        cv.education.forEach(item => {
          addEducationEntry(item);
        });

      } else {

        addEducationEntry();
      }


      if (templateSelect) {

        templateSelect.value =
          cv.template || 'classic';
      }


      render();


      if (savedCvsList) {
        savedCvsList.innerHTML = '';
      }


      sheet.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }


    /* =========================
       DELETE SAVED CV
    ========================= */

    function deleteCV(index) {

      const cvs =
        getSavedCVs();

      if (!cvs[index]) {
        return;
      }

      const confirmed =
        window.confirm(
          'Delete this saved CV?'
        );

      if (!confirmed) {
        return;
      }

      cvs.splice(index, 1);

      saveCVs(cvs);

      renderSavedCVs();
    }


    /* =========================
       MY CVS BUTTON
    ========================= */

    if (myCvsBtn) {

      myCvsBtn.addEventListener('click', () => {

        if (!savedCvsList) {
          return;
        }

        const isVisible =
          savedCvsList.style.display === 'block';

        savedCvsList.style.display =
          isVisible
            ? 'none'
            : 'block';

        if (!isVisible) {
          renderSavedCVs();
        }
      });
    }


    /* =========================
       INITIAL SETUP
    ========================= */

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
      savedCvsList.style.display = 'none';
    }

    render();

  });

})();
     
        
  

  
    

  

        
    

    
      
