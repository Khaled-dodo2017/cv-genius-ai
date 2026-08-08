(() => {
  'use strict';

  const form = document.getElementById('cv-form');
  const experienceList = document.getElementById('experience-list');
  const educationList = document.getElementById('education-list');
  const experienceTemplate = document.getElementById('experience-entry-template');
  const educationTemplate = document.getElementById('education-entry-template');

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

  const sheet = document.getElementById('cv-sheet');

  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str ?? '';
    return div.innerHTML;
  }

  function addEntry(listEl, template) {
    if (!listEl || !template) return;

    const fragment = template.content.cloneNode(true);
    const entry = fragment.querySelector('[data-entry]');

    listEl.appendChild(fragment);

    if (!entry) return;

    const removeBtn = entry.querySelector('.entry__remove');

    if (removeBtn) {
      removeBtn.addEventListener('click', () => {
        entry.remove();
        render();
      });
    }

    entry.querySelectorAll('input, textarea').forEach((el) => {
      el.addEventListener('input', render);
    });
  }

  function readEntries(listEl, fields) {
    if (!listEl) return [];

    return Array.from(
      listEl.querySelectorAll('[data-entry]')
    )
      .map((entry) => {
        const result = {};

        Object.entries(fields).forEach(([key, selector]) => {
          const field = entry.querySelector(selector);
          result[key] = field?.value.trim() || '';
        });

        return result;
      })
      .filter((entry) =>
        Object.values(entry).some((value) => value !== '')
      );
  }

  function splitList(value) {
    return (value || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function render() {
    if (!form) return;

    const data = new FormData(form);

    const name = data.get('fullName')?.trim() || '';
    const jobTitle = data.get('jobTitle')?.trim() || '';
    const email = data.get('email')?.trim() || '';
    const phone = data.get('phone')?.trim() || '';
    const location = data.get('location')?.trim() || '';
    const summary = data.get('summary')?.trim() || '';

    const skills = splitList(data.get('skills'));
    const languages = splitList(data.get('languages'));

    out.name.textContent = name || 'Your Name';
    out.title.textContent = jobTitle || 'Job Title';

    const contactParts = [email, phone, location].filter(Boolean);

    out.contact.textContent = contactParts.length
      ? contactParts.join('  ·  ')
      : 'email · phone · location';

    if (summary) {
      out.summary.textContent = summary;
      out.summary.hidden = false;
    } else {
      out.summary.hidden = true;
    }

    const experience = readEntries(experienceList, {
      role: '.js-role',
      company: '.js-company',
      dates: '.js-dates',
      desc: '.js-desc'
    });

    renderExperience(experience);

    const education = readEntries(educationList, {
      degree: '.js-degree',
      school: '.js-school',
      year: '.js-year'
    });

    renderEducation(education);

    if (skills.length) {
      out.skills.innerHTML = skills
        .map((skill) => `<li>${escapeHTML(skill)}</li>`)
        .join('');

      sections.skills.hidden = false;
    } else {
      out.skills.innerHTML = '';
      sections.skills.hidden = true;
    }

    if (languages.length) {
      out.languages.innerHTML = languages
        .map((language) => `<li>${escapeHTML(language)}</li>`)
        .join('');

      sections.languages.hidden = false;
    } else {
      out.languages.innerHTML = '';
      sections.languages.hidden = true;
    }
  }

  function renderExperience(items) {
    if (!items.length) {
      sections.experience.hidden = true;
      out.experience.innerHTML = '';
      return;
    }

    sections.experience.hidden = false;

    out.experience.innerHTML = items
      .map((item) => `
        <div class="sheet-entry">
          <div class="sheet-entry__top">
            <span>${escapeHTML(item.role) || 'Role'}</span>

            ${
              item.dates
                ? `<span class="sheet-entry__dates">${escapeHTML(item.dates)}</span>`
                : ''
            }
          </div>

          ${
            item.company
              ? `<p class="sheet-entry__sub">${escapeHTML(item.company)}</p>`
              : ''
          }

          ${
            item.desc
              ? `<p class="sheet-entry__desc">${escapeHTML(item.desc)}</p>`
              : ''
          }
        </div>
      `)
      .join('');
  }

  function renderEducation(items) {
    if (!items.length) {
      sections.education.hidden = true;
      out.education.innerHTML = '';
      return;
    }

    sections.education.hidden = false;

    out.education.innerHTML = items
      .map((item) => `
        <div class="sheet-entry">
          <div class="sheet-entry__top">
            <span>${escapeHTML(item.degree) || 'Qualification'}</span>

            ${
              item.year
                ? `<span class="sheet-entry__dates">${escapeHTML(item.year)}</span>`
                : ''
            }
          </div>

          ${
            item.school
              ? `<p class="sheet-entry__sub">${escapeHTML(item.school)}</p>`
              : ''
          }
        </div>
      `)
      .join('');
  }

  function pulseSheet() {
    if (!sheet) return;

    sheet.style.transition =
      'box-shadow 200ms ease, transform 200ms ease';

    sheet.style.boxShadow =
      '0 1px 1px rgba(20,23,31,0.06), 0 18px 40px -14px rgba(47,93,80,0.45), 0 50px 70px -35px rgba(20,23,31,0.3)';

    sheet.style.transform = 'rotate(0deg) scale(1.01)';

    window.setTimeout(() => {
      sheet.style.boxShadow = '';
      sheet.style.transform = '';
    }, 260);

    sheet.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }

  /* Add experience / education */

  document.querySelectorAll('[data-add]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const kind = btn.getAttribute('data-add');

      if (kind === 'experience') {
        addEntry(experienceList, experienceTemplate);
      }

      if (kind === 'education') {
        addEntry(educationList, educationTemplate);
      }

      render();
    });
  });

  /* Live preview */

  if (form) {
    form.addEventListener('input', render);

    /* MAIN GENERATE BUTTON */

    form.addEventListener('submit', (event) => {
      event.preventDefault();

      const name =
        form.querySelector('[name="fullName"]')?.value.trim() || '';

      const jobTitle =
        form.querySelector('[name="jobTitle"]')?.value.trim() || '';

      if (!name || !jobTitle) {
        alert('Please enter your full name and job title.');
        return;
      }

      /*
       * IMPORTANT:
       * Do NOT call an external API here.
       * The CV is generated locally in the browser.
       */

      render();
      pulseSheet();
    });
  }

  /* CV template */

  const templateSelect = document.getElementById('cv-template');

  if (templateSelect && sheet) {
    templateSelect.addEventListener('change', (event) => {
      sheet.dataset.template = event.target.value;
    });
  }

  /* Print */

  const printBtn = document.getElementById('print-btn');

  if (printBtn) {
    printBtn.addEventListener('click', () => {
      render();
      window.print();
    });
  }

  /* PDF download */

  const downloadBtn =
    document.getElementById('download-pdf-btn');

  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
      render();

      if (typeof html2pdf === 'undefined') {
        alert(
          'PDF library is not loaded. Please use Print / Save PDF instead.'
        );
        window.print();
        return;
      }

      const options = {
        margin: 10,
        filename: 'CV-Genius-AI.pdf',
        image: {
          type: 'jpeg',
          quality: 0.98
        },
        html2canvas: {
          scale: 2
        },
        jsPDF: {
          unit: 'mm',
          format: 'a4',
          orientation: 'portrait'
        }
      };

      html2pdf()
        .set(options)
        .from(sheet)
        .save();
    });
  }

  /* New CV */

  const newCvBtn =
    document.getElementById('new-cv-btn');

  if (newCvBtn) {
    newCvBtn.addEventListener('click', () => {
      form.reset();

      experienceList.innerHTML = '';
      educationList.innerHTML = '';

      addEntry(
        experienceList,
        experienceTemplate
      );

      addEntry(
        educationList,
        educationTemplate
      );

      render();
    });
  }

  /* Save CV */

  const saveCvBtn =
    document.getElementById('save-cv-btn');

  if (saveCvBtn) {
    saveCvBtn.addEventListener('click', () => {
      const formData = new FormData(form);
      const cvData = {};

      formData.forEach((value, key) => {
        cvData[key] = value;
      });

      cvData.id = Date.now();
      cvData.savedAt = new Date().toLocaleString();

      const savedCVs = JSON.parse(
        localStorage.getItem('savedCVs') || '[]'
      );

      savedCVs.push(cvData);

      localStorage.setItem(
        'savedCVs',
        JSON.stringify(savedCVs)
      );

      alert('CV saved successfully!');
    });
  }

  /* My CVs */

  const myCvsBtn =
    document.getElementById('my-cvs-btn');

  if (myCvsBtn) {
    myCvsBtn.addEventListener('click', () => {
      const savedCVs = JSON.parse(
        localStorage.getItem('savedCVs') || '[]'
      );

      if (!savedCVs.length) {
        alert('No saved CVs found.');
        return;
      }

      const list = savedCVs
        .map(
          (cv, index) =>
            `${index + 1}. ${
              cv.fullName || 'Unnamed CV'
            } — ${cv.savedAt || ''}`
        )
        .join('\n');

      alert('My CVs:\n\n' + list);
    });
  }

  /* Initial entries */

  if (
    experienceList &&
    experienceTemplate &&
    !experienceList.querySelector('[data-entry]')
  ) {
    addEntry(
      experienceList,
      experienceTemplate
    );
  }

  if (
    educationList &&
    educationTemplate &&
    !educationList.querySelector('[data-entry]')
  ) {
    addEntry(
      educationList,
      educationTemplate
    );
  }

  /* Initial render */

  render();

})();
(() => {

})();

  

        
    

    
      
