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
    languages: document.getElementById('out-languages'),
  };

  const sections = {
    experience: document.getElementById('section-experience'),
    education: document.getElementById('section-education'),
    skills: document.getElementById('section-skills'),
    languages: document.getElementById('section-languages'),
  };

  const sheet = document.getElementById('cv-sheet');

  /* ---------- helpers ---------- */

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
    return Array.from(listEl.querySelectorAll('[data-entry]')).map((entry) => {
      const result = {};
      Object.entries(fields).forEach(([key, selector]) => {
        result[key] = entry.querySelector(selector)?.value.trim() || '';
      });
      return result;
    }).filter((e) => Object.values(e).some((v) => v !== ''));
  }

  function splitList(value) {
    return (value || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }

  /* ---------- render ---------- */

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

    // Experience
    const experience = readEntries(experienceList, {
      role: '.js-role',
      company: '.js-company',
      dates: '.js-dates',
      desc: '.js-desc',
    });
    renderExperience(experience);

    // Education
    const education = readEntries(educationList, {
      degree: '.js-degree',
      school: '.js-school',
      year: '.js-year',
    });
    renderEducation(education);

    // Skills
    if (skills.length) {
      out.skills.innerHTML = skills.map((s) => `<li>${escapeHTML(s)}</li>`).join('');
      sections.skills.hidden = false;
    } else {
      sections.skills.hidden = true;
    }

    // Languages
    if (languages.length) {
      out.languages.innerHTML = languages.map((l) => `<li>${escapeHTML(l)}</li>`).join('');
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
    out.experience.innerHTML = items.map((item) => `
      <div class="sheet-entry">
        <div class="sheet-entry__top">
          <span>${escapeHTML(item.role) || 'Role'}</span>
          ${item.dates ? `<span class="sheet-entry__dates">${escapeHTML(item.dates)}</span>` : ''}
        </div>
        ${item.company ? `<p class="sheet-entry__sub">${escapeHTML(item.company)}</p>` : ''}
        ${item.desc ? `<p class="sheet-entry__desc">${escapeHTML(item.desc)}</p>` : ''}
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
          ${item.year ? `<span class="sheet-entry__dates">${escapeHTML(item.year)}</span>` : ''}
        </div>
        ${item.school ? `<p class="sheet-entry__sub">${escapeHTML(item.school)}</p>` : ''}
      </div>
    `).join('');
  }

  /* ---------- generate button feedback ---------- */

  function pulseSheet() {
    sheet.style.transition = 'box-shadow 200ms ease, transform 200ms ease';
    sheet.style.boxShadow = '0 1px 1px rgba(20,23,31,0.06), 0 18px 40px -14px rgba(47,93,80,0.45), 0 50px 70px -35px rgba(20,23,31,0.3)';
    sheet.style.transform = 'rotate(0deg) scale(1.01)';
    window.setTimeout(() => {
      sheet.style.boxShadow = '';
      sheet.style.transform = '';
    }, 260);
    sheet.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* ---------- wiring ---------- */

  document.querySelectorAll('[data-add]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const kind = btn.getAttribute('data-add');
      if (kind === 'experience') addEntry(experienceList, experienceTemplate);
      if (kind === 'education') addEntry(educationList, educationTemplate);
      render();
    });
  });

  form.addEventListener('input', render);

  form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const data = new FormData(form);

  const cvText = `
الاسم: ${data.get('fullName')}
الوظيفة: ${data.get('jobTitle')}
الموقع: ${data.get('location')}
الملخص: ${data.get('summary')}
المهارات: ${data.get('skills')}
اللغات: ${data.get('languages')}
`;

  try {
    const response = await fetch(
      "https://cv-genius-ai-eight.vercel.app/improve-cv",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
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
      ${result.result.replace(/\n/g, "<br>")}
    </div>
  `;
}

  } catch (error) {
    console.error(error);
  }


  pulseSheet();
});

  document.getElementById('print-btn').addEventListener('click', () => {
    window.print();
  });

  // Seed with one empty entry of each kind so the form feels alive.
  addEntry(experienceList, experienceTemplate);
  addEntry(educationList, educationTemplate);

  render();
})();
