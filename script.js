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
    const fragment = template.content.cloneNode(true);
    const entry = fragment.querySelector('[data-entry]');

    listEl.appendChild(fragment);

    entry.querySelector('.entry__remove').addEventListener('click', () => {
      entry.remove();
      render();
    });

    entry.querySelectorAll('input, textarea').forEach((el) => {
      el.addEventListener('input', render);
    });

    return entry;
  }

  function readEntries(listEl, fields) {
    return Array.from(listEl.querySelectorAll('[data-entry]'))
      .map((entry) => {
        const result = {};

        Object.entries(fields).forEach(([key, selector]) => {
          result[key] =
            entry.querySelector(selector)?.value.trim() || '';
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
      .map((s) => s.trim())
      .filter(Boolean);
  }

  function render() {
    const data = new FormData(form);

    const name = data.get('fullName')?.trim();
    const jobTitle = data.get('jobTitle')?.trim();
    const email = data.get('email')?.trim();
    const phone = data.get('phone')?.trim();
    const location = data.get('location')?.trim();
    const summary = data.get('summary')?.trim();

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
        .map((s) => `<li>${escapeHTML(s)}</li>`)
        .join('');

      sections.skills.hidden = false;
    } else {
      sections.skills.hidden = true;
    }

    if (languages.length) {
      out.languages.innerHTML = languages
        .map((l) => `<li>${escapeHTML(l)}</li>`)
        .join('');

      sections.languages.hidden = false;
    } else {
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

  form.addEventListener('input', render);

  /* Template selector */

  const templateSelector =
    document.getElementById('cv-template');

  if (templateSelector) {
    templateSelector.addEventListener('change', (e) => {
      sheet.dataset.template = e.target.value;
    });
  }

  /* Generate CV */

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = new FormData(form);

    const cvText = `
الاسم: ${data.get('fullName')}
الوظيفة: ${data.get('jobTitle')}
الوظيفة المستهدفة: ${data.get('targetJob')}
الموقع: ${data.get('location')}
الملخص: ${data.get('summary')}
المهارات: ${data.get('skills')}
اللغات: ${data.get('languages')}
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

      const result = await response.json();

if (result.result) {
  sheet.innerHTML = `
    <div style="padding:30px; line-height:1.8;">
      ${escapeHTML(result.result).replace(/\n/g, '<br>')}
    </div>
  `;
} else {
  render();
}

    } catch (error) {
      console.error(error);
      alert('Unable to generate CV. Please try again.');
    }

    pulseSheet();
  });

  /* Print */

  const printButton =
    document.getElementById('print-btn');

  if (printButton) {
    printButton.addEventListener('click', () => {
      window.print();
    });
  }

  /* Download PDF */

  const downloadButton =
    document.getElementById('download-pdf-btn');

  if (downloadButton) {
    downloadButton.addEventListener('click', () => {
      const element =
        document.getElementById('cv-sheet');

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

      if (typeof html2pdf === 'function') {
        html2pdf()
          .set(options)
          .from(element)
          .save();
      } else {
        window.print();
      }
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

      const listContainer =
        document.getElementById('saved-cvs-list');

      if (!listContainer) {
        alert('Saved CV list is missing.');
        return;
      }

      listContainer.innerHTML = '';

      if (savedCVs.length === 0) {
        listContainer.innerHTML =
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
            ${escapeHTML(
              cv.fullName || 'Unnamed CV'
            )}
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
              cv.experience.forEach((entryData) => {
                const entry =
                  addEntry(
                    experienceList,
                    experienceTemplate
                  );

                entry.querySelector('.js-role').value =
                  entryData.role || '';

                entry.querySelector('.js-company').value =
                  entryData.company || '';

                entry.querySelector('.js-dates').value =
                  entryData.dates || '';

                entry.querySelector('.js-desc').value =
                  entryData.desc || '';
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
              cv.education.forEach((entryData) => {
                const entry =
                  addEntry(
                    educationList,
                    educationTemplate
                  );

                entry.querySelector('.js-degree').value =
                  entryData.degree || '';

                entry.querySelector('.js-school').value =
                  entryData.school || '';

                entry.querySelector('.js-year').value =
                  entryData.year || '';
              });
            } else {
              addEntry(
                educationList,
                educationTemplate
              );
            }

            render();

            alert(
              'CV loaded successfully!'
            );
          });

        /* Delete */

        item
          .querySelector('.delete-cv-btn')
          .addEventListener('click', () => {

            if (
              !confirm(
                'Delete this CV?'
              )
            ) {
              return;
            }

            const updatedCVs =
              savedCVs.filter(
                (_, i) => i !== index
              );

            localStorage.setItem(
              'savedCVs',
              JSON.stringify(updatedCVs)
            );

            item.remove();

            alert(
              'CV deleted successfully!'
            );
          });

        listContainer.appendChild(item);
      });
    });
  }

  /* Start */

  addEntry(
    experienceList,
    experienceTemplate
  );

  addEntry(
    educationList,
    educationTemplate
  );

  render();

})();
