
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

  function escapeHTML(value) {
    const div = document.createElement('div');
    div.textContent = value || '';
    return div.innerHTML;
  }

  function addEntry(list, template) {
    const fragment = template.content.cloneNode(true);
    const entry = fragment.querySelector('[data-entry]');

    list.appendChild(fragment);

    const removeButton = entry.querySelector('.entry__remove');

    if (removeButton) {
      removeButton.addEventListener('click', () => {
        entry.remove();
        render();
      });
    }

    entry.querySelectorAll('input, textarea').forEach((field) => {
      field.addEventListener('input', render);
    });

    return entry;
  }

  function readEntries(list, fields) {
    return Array.from(list.querySelectorAll('[data-entry]'))
      .map((entry) => {
        const result = {};

        Object.entries(fields).forEach(([key, selector]) => {
          const field = entry.querySelector(selector);
          result[key] = field ? field.value.trim() : '';
        });

        return result;
      })
      .filter((item) =>
        Object.values(item).some((value) => value !== '')
      );
  }

  function splitList(value) {
    return (value || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function render() {
    if (!form || !sheet) return;

    const data = new FormData(form);

    const name = (data.get('fullName') || '').trim();
    const jobTitle = (data.get('jobTitle') || '').trim();
    const email = (data.get('email') || '').trim();
    const phone = (data.get('phone') || '').trim();
    const location = (data.get('location') || '').trim();
    const summary = (data.get('summary') || '').trim();

    const skills = splitList(data.get('skills'));
    const languages = splitList(data.get('languages'));

    out.name.textContent = name || 'Your Name';
    out.title.textContent = jobTitle || 'Job Title';

    const contact = [email, phone, location].filter(Boolean);

    out.contact.textContent = contact.length
      ? contact.join('  ·  ')
      : 'email · phone · location';

    if (summary) {
      out.summary.textContent = summary;
      out.summary.hidden = false;
    } else {
      out.summary.textContent = '';
      out.summary.hidden = true;
    }

    const experience = readEntries(experienceList, {
      role: '.js-role',
      company: '.js-company',
      dates: '.js-dates',
      desc: '.js-desc'
    });

    const education = readEntries(educationList, {
      degree: '.js-degree',
      school: '.js-school',
      year: '.js-year'
    });

    renderExperience(experience);
    renderEducation(education);

    if (skills.length) {
      out.skills.innerHTML = skills
        .map((item) => `<li>${escapeHTML(item)}</li>`)
        .join('');

      sections.skills.hidden = false;
    } else {
      out.skills.innerHTML = '';
      sections.skills.hidden = true;
    }

    if (languages.length) {
      out.languages.innerHTML = languages
        .map((item) => `<li>${escapeHTML(item)}</li>`)
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

    out.experience.innerHTML = items.map((item) => `
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
    `).join('');
  }

  function renderEducation(items) {
    if (!items.length) {
      sections.education.hidden = true;
      out.education.innerHTML = '';
      return;
    }

    sections.education.hidden = false;

    out.education.innerHTML = items.map((item) => `
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
    `).join('');
  }

  function pulseSheet() {
    sheet.style.transition =
      'box-shadow 200ms ease, transform 200ms ease';

    sheet.style.boxShadow =
      '0 18px 40px -14px rgba(47,93,80,0.45)';

    sheet.style.transform =
      'rotate(0deg) scale(1.01)';

    setTimeout(() => {
      sheet.style.boxShadow = '';
      sheet.style.transform = '';
    }, 260);

    sheet.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }

  /* Add Experience / Education */

  document.querySelectorAll('[data-add]').forEach((button) => {
    button.addEventListener('click', () => {
      const type = button.getAttribute('data-add');

      if (type === 'experience') {
        addEntry(experienceList, experienceTemplate);
      }

      if (type === 'education') {
        addEntry(educationList, educationTemplate);
      }

      render();
    });
  });

  /* Live preview */

  form.addEventListener('input', render);

  /* Template */

  const templateSelector =
    document.getElementById('cv-template');

  if (templateSelector) {
    templateSelector.addEventListener('change', (event) => {
      sheet.dataset.template = event.target.value;
    });
  }

  /* Generate CV */

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    // First make absolutely sure the normal CV is visible.
    render();

    pulseSheet();

    const data = new FormData(form);

    const cvText = `
الاسم: ${data.get('fullName') || ''}
الوظيفة: ${data.get('jobTitle') || ''}
الوظيفة المستهدفة: ${data.get('targetJob') || ''}
البريد الإلكتروني: ${data.get('email') || ''}
الهاتف: ${data.get('phone') || ''}
الموقع: ${data.get('location') || ''}
الملخص: ${data.get('summary') || ''}
المهارات: ${data.get('skills') || ''}
اللغات: ${data.get('languages') || ''}
`;

    try {
      const response = await fetch(
        'https://cv-genius-ai-api.vercel.app/improve-cv',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            text: cvText
          })
        }
      );

      if (!response.ok) {
        throw new Error('AI request failed');
      }

      const result = await response.json();

      /*
       * IMPORTANT:
       * Never replace sheet.innerHTML here.
       * The original CV preview must remain intact.
       */
      if (result.result && out.summary) {
        out.summary.textContent = result.result;
        out.summary.hidden = false;
      }

      render();

    } catch (error) {
      console.error('Generate CV error:', error);

      // Even if the AI API fails,
      // the normal CV must remain visible.
      render();
    }
  });

  /* Print */

  const printButton =
    document.getElementById('print-btn');

  if (printButton) {
    printButton.addEventListener('click', () => {
      render();
      window.print();
    });
  }

  /* Download PDF */

  const downloadButton =
    document.getElementById('download-pdf-btn');

  if (downloadButton) {
    downloadButton.addEventListener('click', () => {
      render();

      const element =
        document.getElementById('cv-sheet');

      if (typeof html2pdf !== 'function') {
        window.print();
        return;
      }

      html2pdf()
        .set({
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
        })
        .from(element)
        .save();
    });
  }

  /* New CV */

  const newCVButton =
    document.getElementById('new-cv-btn');

  if (newCVButton) {
    newCVButton.addEventListener('click', () => {
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

  const saveCVButton =
    document.getElementById('save-cv-btn');

  if (saveCVButton) {
    saveCVButton.addEventListener('click', () => {
      const formData = new FormData(form);
      const cvData = {};

      formData.forEach((value, key) => {
        cvData[key] = value;
      });

      cvData.experience = readEntries(
        experienceList,
        {
          role: '.js-role',
          company: '.js-company',
          dates: '.js-dates',
          desc: '.js-desc'
        }
      );

      cvData.education = readEntries(
        educationList,
        {
          degree: '.js-degree',
          school: '.js-school',
          year: '.js-year'
        }
      );

      cvData.id = Date.now();
      cvData.savedAt =
        new Date().toLocaleString();

      const savedCVs =
        JSON.parse(
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

  const myCVsButton =
    document.getElementById('my-cvs-btn');

  if (myCVsButton) {
    myCVsButton.addEventListener('click', () => {
      const savedCVs =
        JSON.parse(
          localStorage.getItem('savedCVs') || '[]'
        );

      const list =
        document.getElementById('saved-cvs-list');

      if (!list) return;

      list.innerHTML = '';

      if (!savedCVs.length) {
        list.innerHTML =
          '<p>No saved CVs found.</p>';
        return;
      }

      savedCVs.forEach((cv, index) => {
        const item =
          document.createElement('div');

        item.className =
          'saved-cv-item';

        item.innerHTML = `
          <strong>
            ${escapeHTML(cv.fullName || 'Unnamed CV')}
          </strong>

          <span>
            ${escapeHTML(
              cv.targetJob ||
              cv.jobTitle ||
              'No job title'
            )}
          </span>

          <button
            type="button"
            class="btn btn--text open-cv-btn">
            Open
          </button>

          <button
            type="button"
            class="btn btn--text delete-cv-btn">
            Delete
          </button>
        `;

        /* Open */

        item
          .querySelector('.open-cv-btn')
          .addEventListener('click', () => {

            Object.keys(cv).forEach((key) => {
              if (
                key === 'id' ||
                key === 'savedAt' ||
                key === 'experience' ||
                key === 'education'
              ) {
                return;
              }

              const field =
                document.getElementById(key);

              if (field) {
                field.value = cv[key];
              }
            });

            experienceList.innerHTML = '';
            educationList.innerHTML = '';

            if (
              Array.isArray(cv.experience) &&
              cv.experience.length
            ) {
              cv.experience.forEach((data) => {
                const entry =
                  addEntry(
                    experienceList,
                    experienceTemplate
                  );

                entry.querySelector('.js-role').value =
                  data.role || '';

                entry.querySelector('.js-company').value =
                  data.company || '';

                entry.querySelector('.js-dates').value =
                  data.dates || '';

                entry.querySelector('.js-desc').value =
                  data.desc || '';
              });
            } else {
              addEntry(
                experienceList,
                experienceTemplate
              );
            }

            if (
              Array.isArray(cv.education) &&
              cv.education.length
            ) {
              cv.education.forEach((data) => {
                const entry =
                  addEntry(
                    educationList,
                    educationTemplate
                  );

                entry.querySelector('.js-degree').value =
                  data.degree || '';

                entry.querySelector('.js-school').value =
                  data.school || '';

                entry.querySelector('.js-year').value =
                  data.year || '';
              });
            } else {
              addEntry(
                educationList,
                educationTemplate
              );
            }

            render();

            alert('CV loaded successfully!');
          });

        /* Delete */

        item
          .querySelector('.delete-cv-btn')
          .addEventListener('click', () => {

            if (!confirm('Delete this CV?')) {
              return;
            }

            const updated =
              savedCVs.filter(
                (_, i) => i !== index
              );

            localStorage.setItem(
              'savedCVs',
              JSON.stringify(updated)
            );

            item.remove();

            alert('CV deleted successfully!');
          });

        list.appendChild(item);
      });
    });
  }

  /* Initial CV entries */

  addEntry(
    experienceList,
    experienceTemplate
  );

  addEntry(
    educationList,
    educationTemplate
  );

  /* Initial render */

  render();
console.log("CV GENIUS SCRIPT LOADED");

if (!form) console.error("ERROR: cv-form not found");
if (!sheet) console.error("ERROR: cv-sheet not found");
if (!out.name) console.error("ERROR: out-name not found");
})();

  

        
    

    
      
