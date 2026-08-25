const page = document.body.dataset.page || '';

const navItems = [
  ['about', 'Home', 'home.html'],
  ['research', 'Research', 'research.html'],
  ['publications', 'Publications', 'publications.html'],
  ['news', 'News', 'news.html'],
  ['join', 'Join Us', 'join.html']
];

const memberNav = `
  <div class="nav-item nav-item-members">
    <div class="nav-parent">
      <a class="nav-parent-link${page === 'member' ? ' active' : ''}" href="members.html" aria-haspopup="true"${page === 'member' ? ' aria-current="page"' : ''}>Members</a>
      <button class="submenu-toggle" type="button" aria-expanded="false" aria-controls="members-submenu" aria-label="Show Members submenu"></button>
    </div>
    <div id="members-submenu" class="nav-dropdown" aria-label="Members pages">
      <a href="principal-investigator.html">Principal Investigator</a>
      <a href="researcher.html">Researcher</a>
      <a href="students.html">Students</a>
    </div>
  </div>`;

const header = document.querySelector('[data-site-header]');
if (header) {
  header.className = 'site-header';
  header.innerHTML = `
    <div class="site-container nav-shell">
      <a class="brand" href="index.html" aria-label="MSF landing page">
        <span class="brand-mark"><i>M</i>SF</span>
        <span class="brand-name">Materials &amp; Systems<br>Foundry Group</span>
      </a>
      <button class="menu-toggle" aria-expanded="false" aria-controls="primary-nav">Menu</button>
      <nav id="primary-nav" class="primary-nav" aria-label="Primary navigation">
        ${navItems.slice(0, 2).map(([id, label, href]) => `<a href="${href}"${page === id ? ' class="active" aria-current="page"' : ''}>${label}</a>`).join('')}
        ${memberNav}
        ${navItems.slice(2).map(([id, label, href]) => `<a href="${href}"${page === id ? ' class="active" aria-current="page"' : ''}>${label}</a>`).join('')}
        <button class="search-toggle" aria-label="Open search"><span aria-hidden="true"></span></button>
      </nav>
    </div>
    <form class="global-search" role="search" hidden>
      <div class="site-container"><label for="site-search">Search the MSF site</label><input id="site-search" type="search" placeholder="Type a keyword"><button type="button" data-close-search>Close</button></div>
    </form>`;

  const menu = header.querySelector('.menu-toggle');
  const nav = header.querySelector('.primary-nav');
  menu.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') === 'true';
    menu.setAttribute('aria-expanded', String(!open));
    nav.classList.toggle('open', !open);
  });
  const memberItem = header.querySelector('.nav-item-members');
  const submenuToggle = header.querySelector('.submenu-toggle');
  const setSubmenu = open => {
    memberItem.classList.toggle('submenu-open', open);
    submenuToggle.setAttribute('aria-expanded', String(open));
    submenuToggle.setAttribute('aria-label', `${open ? 'Hide' : 'Show'} Members submenu`);
  };
  submenuToggle.addEventListener('click', event => {
    event.stopPropagation();
    setSubmenu(submenuToggle.getAttribute('aria-expanded') !== 'true');
  });
  memberItem.addEventListener('mouseenter', () => setSubmenu(true));
  memberItem.addEventListener('mouseleave', () => setSubmenu(false));
  memberItem.addEventListener('focusin', () => setSubmenu(true));
  memberItem.addEventListener('focusout', event => {
    if (!memberItem.contains(event.relatedTarget)) setSubmenu(false);
  });
  const search = header.querySelector('.global-search');
  header.querySelector('.search-toggle').addEventListener('click', () => {
    search.hidden = false;
    search.querySelector('input').focus();
  });
  header.querySelector('[data-close-search]').addEventListener('click', () => { search.hidden = true; });
}

const footer = document.querySelector('[data-site-footer]');
if (footer) {
  footer.className = 'site-footer';
  footer.innerHTML = `<div class="site-container"><div><b>MSF | Materials &amp; Systems Foundry Group</b><p>Materials, components, systems, and autonomous science.</p></div><nav aria-label="Footer"><a href="join.html">Contact</a><a href="home.html">Location</a><a href="home.html">Privacy</a></nav><p>&copy; 2026 MSF Group. All rights reserved.</p></div>`;
}

const memberFilters = document.querySelector('[data-member-filters]');
if (memberFilters) {
  const data = window.MSF_MEMBER_DATA;
  const empty = document.querySelector('.empty-state');
  const loading = document.querySelector('[data-member-loading]');
  const areaFilter = memberFilters.querySelector('[data-area-filter]');
  const memberScope = memberFilters.dataset.memberScope || 'all';
  const allowedAccents = new Set(['green', 'blue', 'violet', 'orange']);
  let categoryFilter = 'all';

  const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  })[character]);

  const safePath = value => {
    const path = String(value ?? '').trim();
    return /^(?:assets\/|https?:\/\/)/i.test(path) ? escapeHtml(path) : '';
  };

  const numberValue = value => Number.isFinite(Number(value)) ? Number(value) : 0;
  const memberAreas = member => Array.isArray(member.research_areas)
    ? member.research_areas.filter(Boolean)
    : String(member.research_areas || '').split('|').map(item => item.trim()).filter(Boolean);
  const memberEmailMarkup = member => {
    const email = String(member.email || '').trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return '';
    const safeEmail = escapeHtml(email);
    const separatorIndex = email.indexOf('@') + 1;
    const displayEmail = `${escapeHtml(email.slice(0, separatorIndex))}<wbr>${escapeHtml(email.slice(separatorIndex))}`;
    return `<div class="member-email-row"><span>Email</span><a class="member-email" href="mailto:${safeEmail}" title="${safeEmail}">${displayEmail}</a></div>`;
  };

  const publicationStatus = paper => {
    const status = String(paper.status || 'Published').trim().toLowerCase();
    return ['preparation', 'experiment'].includes(status) ? status : 'published';
  };

  const publicationStatusOrder = {
    preparation: 0,
    experiment: 1,
    published: 2
  };

  const publicationsFor = memberId => data.publications
    .filter(item => item.member_id === memberId)
    .sort((a, b) => {
      const statusDifference = publicationStatusOrder[publicationStatus(a)]
        - publicationStatusOrder[publicationStatus(b)];
      if (statusDifference !== 0) return statusDifference;
      return numberValue(b.year) - numberValue(a.year);
    });

  const publicationCounts = (member, papers) => {
    const published = papers.filter(paper => publicationStatus(paper) === 'published').length;
    const detailedPreparation = papers.filter(paper => publicationStatus(paper) === 'preparation').length;
    const detailedExperiment = papers.filter(paper => publicationStatus(paper) === 'experiment').length;
    const enteredInProgress = Math.max(0, numberValue(member.in_progress_count));
    const enteredExperiment = Math.max(0, Math.min(enteredInProgress, numberValue(member.experiment_count)));
    const enteredPreparation = Math.max(0, enteredInProgress - enteredExperiment);
    const hasEnteredProgress = enteredInProgress > 0 || numberValue(member.experiment_count) > 0;
    return {
      published,
      preparation: hasEnteredProgress ? enteredPreparation : detailedPreparation,
      experiment: hasEnteredProgress ? enteredExperiment : detailedExperiment
    };
  };

  const awardsFor = memberId => data.awards
    .filter(item => item.member_id === memberId)
    .sort((a, b) => numberValue(b.year) - numberValue(a.year));

  const paperMarkup = paper => {
    const title = escapeHtml(paper.title);
    const url = safePath(paper.url);
    const linkedTitle = url ? `<a href="${url}" target="_blank" rel="noopener">${title}</a>` : title;
    const journal = paper.journal ? `<small>${escapeHtml(paper.journal)}</small>` : '';
    const normalizedRole = String(paper.role || '').toLowerCase();
    const roleClass = normalizedRole.includes('co-first')
      ? 'co-first'
      : normalizedRole.includes('first')
        ? 'first'
        : 'co-author';
    const role = paper.role ? `<span class="author-role ${roleClass}">${escapeHtml(paper.role)}</span>` : '<span aria-hidden="true"></span>';
    const externalLink = url
      ? `<a class="paper-link" href="${url}" target="_blank" rel="noopener" aria-label="Open publication: ${title}">&#8599;</a>`
      : '<span class="paper-link is-disabled" aria-hidden="true">&#8599;</span>';
    return `<div class="paper-row"><span class="paper-year">${escapeHtml(paper.year)}</span><span class="paper-copy">${linkedTitle}${journal}</span>${role}${externalLink}</div>`;
  };

  const publicationGraph = (published, preparationCount, experimentCount) => {
    const inProgress = preparationCount + experimentCount;
    const largestValue = Math.max(published, inProgress, 1);
    const axisMax = Math.max(5, Math.ceil(largestValue / 5) * 5);
    const ticks = Array.from({ length: 6 }, (_, index) => Math.round((axisMax * index) / 5));
    const experiment = Math.max(0, experimentCount);
    const preparation = Math.max(0, preparationCount);
    const metric = (type, label, value, detail = '', segments = null) => {
      const width = Math.max(0, Math.min(100, (value / axisMax) * 100));
      const track = segments
        ? `<span class="metric-track segmented" role="img" aria-label="Preparation ${segments.preparation}, Experiment ${segments.experiment}">
            <i class="metric-segment preparation" style="width:${(segments.preparation / axisMax) * 100}%"></i>
            <i class="metric-segment experiment" style="width:${(segments.experiment / axisMax) * 100}%"></i>
          </span>`
        : `<span class="metric-track" aria-hidden="true"><i style="width:${width}%"></i></span>`;
      return `<div class="pub-metric ${type}">
        <span class="metric-dot" aria-hidden="true"></span>
        <span class="metric-label">${label}${detail}</span>
        <strong>${value}</strong>
        ${track}
      </div>`;
    };
    const progressLegend = `<small class="metric-legend">
      <span class="preparation"><i aria-hidden="true"></i>Preparation</span>
      <span class="experiment"><i aria-hidden="true"></i>Experiment</span>
    </small>`;
    return `<div class="pub-stats">
      <b class="pub-stats-title">Publications</b>
      ${metric('published', 'Published', published)}
      ${metric('in-progress', 'In Progress', inProgress, progressLegend, { preparation, experiment })}
      <div class="pub-axis" aria-hidden="true"><div class="pub-scale">${ticks.map((tick, index) => `<span style="left:${index * 20}%">${tick}</span>`).join('')}</div></div>
    </div>`;
  };

  const graduateCard = member => {
    const papers = publicationsFor(member.member_id);
    const counts = publicationCounts(member, papers);
    const areas = memberAreas(member);
    const accent = allowedAccents.has(member.accent) ? member.accent : 'blue';
    return `<article class="member-card ${accent}" data-kind="${escapeHtml(member.category)}" data-areas="${escapeHtml(areas.join('|').toLowerCase())}">
      <div class="profile">
        <div class="portrait"><img src="${safePath(member.portrait)}" alt="${escapeHtml(member.name)}"></div>
        <div>
          <h3>${escapeHtml(member.name)}</h3>
          <p>${escapeHtml(member.position)} <span>|</span> Joined ${escapeHtml(member.joined_year)}</p>
          <b>${escapeHtml(member.research_title)}</b>
          <p>${escapeHtml(member.description)}</p>
          <div class="tags">${areas.map(area => `<span>${escapeHtml(area)}</span>`).join('')}</div>
          ${memberEmailMarkup(member)}
        </div>
        ${publicationGraph(counts.published, counts.preparation, counts.experiment)}
      </div>
      ${papers.length ? `<div class="paper-list"><b>Publications</b>${papers.map(paperMarkup).join('')}</div>` : ''}
    </article>`;
  };

  const compactCard = member => {
    const awards = awardsFor(member.member_id);
    const areas = memberAreas(member);
    const accent = allowedAccents.has(member.accent) ? member.accent : 'blue';
    const awardMarkup = awards.length
      ? `<div class="member-awards"><b>Awards</b>${awards.map(item => `<p><span>${escapeHtml(item.year)}</span>${escapeHtml(item.award)}${item.result ? ` - ${escapeHtml(item.result)}` : ''}</p>`).join('')}</div>`
      : '';
    return `<article class="mini-member ${accent}" data-kind="${escapeHtml(member.category)}" data-areas="${escapeHtml(areas.join('|').toLowerCase())}">
      <div class="portrait"><img src="${safePath(member.portrait)}" alt="${escapeHtml(member.name)}"></div>
      <div>
        <h3>${escapeHtml(member.name)}</h3>
        <p>${escapeHtml(member.position)} <span>|</span> Joined ${escapeHtml(member.joined_year)}</p>
        <b>${escapeHtml(member.research_title)}</b>
        <p>${escapeHtml(member.description)}</p>
        ${memberEmailMarkup(member)}
        ${awardMarkup}
      </div>
    </article>`;
  };

  const updateStats = members => {
    const currentIds = new Set(members.filter(member => member.category !== 'alumni').map(member => member.member_id));
    const currentPublications = data.publications.filter(item => currentIds.has(item.member_id));
    const progress = members
      .filter(member => currentIds.has(member.member_id))
      .map(member => publicationCounts(member, publicationsFor(member.member_id)))
      .reduce((total, counts) => ({
        preparation: total.preparation + counts.preparation,
        experiment: total.experiment + counts.experiment
      }), { preparation: 0, experiment: 0 });
    const stats = {
      researchers: currentIds.size,
      published: currentPublications.length,
      'in-progress': progress.preparation + progress.experiment,
      experiment: progress.experiment
    };
    Object.entries(stats).forEach(([key, value]) => {
      const target = document.querySelector(`[data-member-stat="${key}"]`);
      if (target) target.textContent = String(value).padStart(2, '0');
    });
  };

  const updateFilters = () => {
    const selectedArea = areaFilter ? areaFilter.value.toLowerCase() : 'all';
    const cards = [...document.querySelectorAll('[data-member-grid] [data-kind]')];
    let visible = 0;
    cards.forEach(card => {
      const categoryMatch = categoryFilter === 'all'
        || (categoryFilter === 'graduate' && ['phd', 'masters'].includes(card.dataset.kind))
        || card.dataset.kind === categoryFilter;
      const areaMatch = selectedArea === 'all' || card.dataset.areas.split('|').includes(selectedArea);
      const show = categoryMatch && areaMatch;
      card.hidden = !show;
      if (show) visible += 1;
    });
    empty.hidden = visible !== 0;

    document.querySelectorAll('[data-member-section]').forEach(section => {
      section.hidden = !section.querySelector('[data-kind]:not([hidden])');
    });
  };

  if (!data || !Array.isArray(data.members) || !Array.isArray(data.publications) || !Array.isArray(data.awards)) {
    loading.textContent = 'Member data could not be loaded. Check data/members.js.';
  } else {
    const activeMembers = data.members
      .filter(member => member.active !== false)
      .filter(member => memberScope !== 'students' || ['phd', 'masters', 'undergrad'].includes(member.category))
      .sort((a, b) => numberValue(a.display_order) - numberValue(b.display_order));

    const groups = {
      graduate: activeMembers.filter(member => ['phd', 'masters'].includes(member.category)),
      undergraduate: activeMembers.filter(member => member.category === 'undergrad'),
      alumni: activeMembers.filter(member => member.category === 'alumni')
    };

    const graduateGrid = document.querySelector('[data-member-grid="graduate"]');
    const undergraduateGrid = document.querySelector('[data-member-grid="undergraduate"]');
    const alumniGrid = document.querySelector('[data-member-grid="alumni"]');
    if (graduateGrid) graduateGrid.innerHTML = groups.graduate.map(graduateCard).join('');
    if (undergraduateGrid) undergraduateGrid.innerHTML = groups.undergraduate.map(compactCard).join('');
    if (alumniGrid) alumniGrid.innerHTML = groups.alumni.map(compactCard).join('');

    const allAreas = [...new Set(activeMembers.flatMap(memberAreas))].sort((a, b) => a.localeCompare(b));
    if (areaFilter) areaFilter.insertAdjacentHTML('beforeend', allAreas.map(area => `<option value="${escapeHtml(area.toLowerCase())}">${escapeHtml(area)}</option>`).join(''));
    updateStats(activeMembers);
    loading.hidden = true;
    updateFilters();

    memberFilters.addEventListener('click', event => {
      const button = event.target.closest('button[data-filter]');
      if (!button) return;
      memberFilters.querySelectorAll('button').forEach(item => item.classList.remove('active'));
      button.classList.add('active');
      categoryFilter = button.dataset.filter;
      updateFilters();
    });
    if (areaFilter) areaFilter.addEventListener('change', updateFilters);
  }
}

const piProfile = document.querySelector('[data-pi-profile]');
if (piProfile) {
  const data = window.MSF_MEMBER_DATA;
  const escapePi = value => String(value ?? '').replace(/[&<>'"]/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  })[character]);
  const safePiPath = value => {
    const path = String(value ?? '').trim();
    return /^(?:assets\/|https?:\/\/)/i.test(path) ? escapePi(path) : '';
  };
  const safePiUrl = value => {
    const url = String(value ?? '').trim();
    return /^https:\/\//i.test(url) ? escapePi(url) : '';
  };
  const asList = value => Array.isArray(value)
    ? value.filter(Boolean)
    : String(value || '').split('|').map(item => item.trim()).filter(Boolean);
  const historyMarkup = items => asList(items).map(item => {
    const text = String(item);
    const separator = text.indexOf(':');
    const period = separator >= 0 ? text.slice(0, separator) : '';
    const detail = separator >= 0 ? text.slice(separator + 1).trim() : text;
    return `<li>${period ? `<time>${escapePi(period)}</time>` : ''}<span>${escapePi(detail)}</span></li>`;
  }).join('');
  const highlightedPiAuthors = publication => {
    const authors = escapePi(publication.authors);
    const labAuthors = asList(publication.lab_authors);
    if (!labAuthors.length) return authors;
    const pattern = labAuthors
      .sort((a, b) => b.length - a.length)
      .map(name => escapePi(name).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('|');
    return authors.replace(new RegExp(`(${pattern})`, 'gi'), '<strong class="lab-author">$1</strong>');
  };
  const selectedPublicationMarkup = investigator => {
    const publicationData = Array.isArray(window.MSF_PUBLICATION_DATA?.publications)
      ? window.MSF_PUBLICATION_DATA.publications.filter(item => item.active !== false)
      : [];
    const byNumber = new Map(publicationData.map(item => [String(item.number), item]));
    const requestedNumbers = asList(investigator.selected_publication_numbers).map(String);
    const selected = requestedNumbers.map(number => byNumber.get(number)).filter(Boolean);
    if (!requestedNumbers.length) return '';
    const items = selected.map(publication => {
      const figure = safePiPath(publication.figure);
      const url = safePiUrl(publication.url);
      const title = escapePi(publication.title);
      const titleMarkup = url ? `<a href="${url}" target="_blank" rel="noopener">${title}</a>` : title;
      const metrics = [
        publication.impact_factor !== null && publication.impact_factor !== '' ? `IF: ${escapePi(publication.impact_factor)}` : '',
        publication.jcr_top ? escapePi(publication.jcr_top) : ''
      ].filter(Boolean).join(', ');
      return `<article class="pi-publication${figure ? '' : ' no-figure'}">
        <b class="pi-publication-number">${escapePi(publication.number)}</b>
        <div class="pi-publication-copy">
          <p class="pi-publication-type">${escapePi(publication.type || 'Journal Article')}</p>
          <h3>${titleMarkup}</h3>
          <p class="pi-publication-authors"><i>${highlightedPiAuthors(publication)}</i></p>
          <p class="pi-publication-source"><strong>${escapePi(publication.journal)}</strong>${publication.citation ? `, ${escapePi(publication.citation)}` : ''}${metrics ? ` (${metrics})` : ''}</p>
        </div>
        ${figure ? `<figure class="pi-publication-figure"><img src="${figure}" alt="${escapePi(publication.alt_text || publication.title)}"></figure>` : ''}
      </article>`;
    }).join('');
    const content = items || '<p class="pi-publication-empty">No matching publication numbers were found. Check the Publications number column in Excel.</p>';
    return `<section class="pi-selected-publications" aria-labelledby="pi-selected-publications-title">
      <div class="pi-selected-heading">
        <h2 id="pi-selected-publications-title">Selected Publications</h2>
        <a href="publications.html">View all publications</a>
      </div>
      <div class="pi-selected-list">${content}</div>
    </section>`;
  };

  const investigators = Array.isArray(data?.principal_investigators)
    ? data.principal_investigators.filter(item => item.active !== false)
    : [];
  const investigator = investigators[0];

  if (!investigator) {
    piProfile.innerHTML = `<div class="pi-error"><h1>Principal Investigator</h1><p>Profile data could not be loaded. Check the Principal Investigator sheet in the member workbook, then run the member sync tool.</p></div>`;
  } else {
    const portrait = safePiPath(investigator.portrait);
    const scholarUrl = safePiUrl(investigator.scholar_url);
    const sourceUrl = safePiUrl(investigator.source_url);
    const email = escapePi(investigator.email);
    const telephone = escapePi(investigator.telephone);
    const telephoneHref = String(investigator.telephone || '').replace(/[^+\d]/g, '');
    const experienceItems = historyMarkup(investigator.professional_experiences);
    const educationItems = historyMarkup(investigator.education);
    const selectedPublications = selectedPublicationMarkup(investigator);

    piProfile.innerHTML = `
      <section class="pi-profile-grid" aria-labelledby="pi-name">
        <figure class="pi-portrait">
          ${portrait ? `<img src="${portrait}" alt="Portrait of ${escapePi(investigator.name)}">` : '<span>No portrait available</span>'}
        </figure>
        <div class="pi-summary">
          <p class="pi-label">Principal Investigator</p>
          <h1 id="pi-name">${escapePi(investigator.name)}</h1>
          <p class="pi-position">${escapePi(investigator.position)}</p>
          <p class="pi-affiliation">${escapePi(investigator.department)}<br><strong>${escapePi(investigator.institution)}</strong></p>
          <dl class="pi-contact">
            <div><dt>Email</dt><dd><a href="mailto:${email}">${email}</a></dd></div>
            <div><dt>Telephone</dt><dd><a href="tel:${escapePi(telephoneHref)}">${telephone}</a></dd></div>
          </dl>
          <div class="pi-actions">
            ${scholarUrl ? `<a class="primary-button" href="${scholarUrl}" target="_blank" rel="noopener">Google Scholar</a>` : ''}
            ${sourceUrl ? `<a class="secondary-button" href="${sourceUrl}" target="_blank" rel="noopener">Original Profile</a>` : ''}
          </div>
        </div>
      </section>
      <section class="pi-history-grid" aria-label="Academic profile">
        <div class="pi-history-section">
          <h2>Professional Experiences</h2>
          <ol>${experienceItems}</ol>
        </div>
        <div class="pi-history-section">
          <h2>Education</h2>
          <ol>${educationItems}</ol>
        </div>
      </section>
      ${selectedPublications}`;
  }
}

const publicationFilters = document.querySelector('[data-publication-filters]');
if (publicationFilters) {
  const list = document.querySelector('[data-publication-list]');
  const searchInput = document.querySelector('.search-row input');
  const yearFilter = document.querySelector('[data-publication-year]');
  const authorFilter = document.querySelector('[data-publication-author]');
  let category = 'all';
  let renderedVersion = '';

  const publicationEscape = value => String(value ?? '').replace(/[&<>'"]/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  })[character]);
  const publicationPath = value => {
    const path = String(value ?? '').trim();
    return /^(?:assets\/|https?:\/\/)/i.test(path) ? publicationEscape(path) : '';
  };
  const colorClass = { robotics: 'blue-text', systems: 'violet-text', autonomy: 'orange-text' };

  const authorNames = publications => [...new Set(publications.flatMap(publication =>
    String(publication.authors || '').split(/,\s*|\s+(?:and|&)\s+/i).map(author => author.trim()).filter(Boolean)
  ))].sort((a, b) => a.localeCompare(b));

  const highlightedAuthors = publication => {
    const authors = publicationEscape(publication.authors);
    const labAuthors = String(publication.lab_authors || '').split(/\s*\|\s*/).map(name => name.trim()).filter(Boolean);
    if (!labAuthors.length) return authors;
    const pattern = labAuthors
      .sort((a, b) => b.length - a.length)
      .map(name => publicationEscape(name).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('|');
    return authors.replace(new RegExp(`(${pattern})`, 'gi'), '<strong class="lab-author">$1</strong>');
  };

  const update = () => {
    const items = [...list.querySelectorAll('.pub-item')];
    const years = [...list.querySelectorAll('.pub-year')];
    const empty = list.querySelector('.empty-state');
    const query = searchInput.value.trim().toLowerCase();
    const selectedYear = yearFilter.value;
    const selectedAuthor = authorFilter.value.toLowerCase();
    let count = 0;
    items.forEach(item => {
      const matchesCategory = category === 'all' || item.classList.contains(category);
      const matchesYear = selectedYear === 'all' || item.dataset.year === selectedYear;
      const matchesAuthor = selectedAuthor === 'all' || item.dataset.authors.includes(selectedAuthor);
      const matchesQuery = item.textContent.toLowerCase().includes(query);
      const show = matchesCategory && matchesYear && matchesAuthor && matchesQuery;
      item.hidden = !show;
      if (show) count += 1;
    });
    years.forEach(year => { year.hidden = !year.querySelector('.pub-item:not([hidden])'); });
    empty.hidden = count !== 0;
  };

  const publicationMarkup = publication => {
    const categoryClass = colorClass[publication.category] || '';
    const figure = publicationPath(publication.figure);
    const url = publicationPath(publication.url);
    const title = publicationEscape(publication.title);
    const titleMarkup = url ? `<a href="${url}" target="_blank" rel="noopener">${title}</a>` : title;
    const metrics = [
      publication.impact_factor !== null && publication.impact_factor !== '' ? `IF: ${publicationEscape(publication.impact_factor)}` : '',
      publication.jcr_top ? publicationEscape(publication.jcr_top) : ''
    ].filter(Boolean).join(', ');
    const figureMarkup = figure
      ? `<div class="pub-figure"><img src="${figure}" alt="${publicationEscape(publication.alt_text || publication.title)}"></div>`
      : '<div class="pub-figure pub-figure-empty" aria-hidden="true"><span>Figure pending</span></div>';
    return `<article class="pub-item ${publicationEscape(publication.category)}" data-year="${publicationEscape(publication.year)}" data-authors="${publicationEscape(String(publication.authors || '').toLowerCase())}">
      <b class="pub-number ${categoryClass}">${publicationEscape(publication.number)}</b>
      <div><small>${publicationEscape(publication.type || 'Journal Article')}</small><h3>${titleMarkup}</h3>
      <p class="publication-authors"><i>${highlightedAuthors(publication)}</i></p>
      <p><b>${publicationEscape(publication.journal)}</b>${publication.citation ? `, ${publicationEscape(publication.citation)}` : ''}${metrics ? ` <strong>(${metrics})</strong>` : ''}</p></div>
      ${figureMarkup}
    </article>`;
  };

  const renderPublications = data => {
    const publications = Array.isArray(data?.publications)
      ? data.publications.filter(item => item.active !== false).sort((a, b) => Number(b.year) - Number(a.year) || Number(a.display_order) - Number(b.display_order))
      : [];
    const selectedYear = yearFilter.value;
    const selectedAuthor = authorFilter.value;
    const years = [...new Set(publications.map(item => Number(item.year)).filter(Boolean))].sort((a, b) => b - a);
    const groups = years.map(year => `<section class="pub-year"><h2>${year}</h2>${publications.filter(item => Number(item.year) === year).map(publicationMarkup).join('')}</section>`).join('');
    list.innerHTML = `${groups}<p class="empty-state"${publications.length ? ' hidden' : ''}>No publications found.</p>`;

    yearFilter.innerHTML = `<option value="all">All Years</option>${years.map(year => `<option value="${year}">${year}</option>`).join('')}`;
    authorFilter.innerHTML = `<option value="all">All Authors</option>${authorNames(publications).map(author => `<option value="${publicationEscape(author)}">${publicationEscape(author)}</option>`).join('')}`;
    if ([...yearFilter.options].some(option => option.value === selectedYear)) yearFilter.value = selectedYear;
    if ([...authorFilter.options].some(option => option.value === selectedAuthor)) authorFilter.value = selectedAuthor;

    const archiveCount = publications.reduce((largest, item) => Math.max(largest, Number(item.number) || 0), publications.length);
    const earliest = Number(data.archive_start_year) || (years.length ? Math.min(...years) : 0);
    const latest = years.length ? Math.max(...years) : 0;
    document.querySelector('[data-publication-stat="count"]').textContent = String(archiveCount).padStart(2, '0');
    document.querySelector('[data-publication-stat="timeline"]').textContent = earliest && latest ? `${earliest}-${latest}` : '-';
    update();
  };

  const applyLatestData = () => {
    const data = window.MSF_PUBLICATION_DATA;
    if (!data || data.updatedAt === renderedVersion) return;
    renderedVersion = data.updatedAt || String(Date.now());
    renderPublications(data);
  };

  const reloadPublicationData = () => {
    if (document.hidden) return;
    const script = document.createElement('script');
    script.src = `data/publications.js?v=${Date.now()}`;
    script.onload = () => { applyLatestData(); script.remove(); };
    script.onerror = () => script.remove();
    document.head.append(script);
  };

  publicationFilters.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-category]');
    if (!button) return;
    publicationFilters.querySelectorAll('button').forEach(item => item.classList.remove('active'));
    button.classList.add('active');
    category = button.dataset.category;
    update();
  });
  searchInput.addEventListener('input', update);
  yearFilter.addEventListener('change', update);
  authorFilter.addEventListener('change', update);
  applyLatestData();
  window.setInterval(reloadPublicationData, 2000);
}

const newsPage = document.querySelector('[data-news-page]');
if (newsPage) {
  const newsList = newsPage.querySelector('[data-news-list]');
  const yearFilters = newsPage.querySelector('[data-news-years]');
  const categoryFilter = newsPage.querySelector('[data-news-category]');
  const heroMedia = newsPage.querySelector('[data-news-hero-media]');
  const lightbox = document.querySelector('[data-news-lightbox]');
  const lightboxImage = lightbox.querySelector('[data-news-lightbox-image]');
  const lightboxCaption = lightbox.querySelector('[data-news-lightbox-caption]');
  const lightboxCount = lightbox.querySelector('[data-news-lightbox-count]');
  let activeYear = 'all';
  let activeCategory = 'all';
  let renderedNewsVersion = '';
  let renderedNews = [];
  let lightboxImages = [];
  let lightboxIndex = 0;

  const newsEscape = value => String(value ?? '').replace(/[&<>'"]/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  })[character]);
  const newsPath = value => {
    const path = String(value ?? '').trim();
    return /^(?:assets\/|https?:\/\/)/i.test(path) ? newsEscape(path) : '';
  };
  const newsSlug = value => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const newsDate = (start, end) => {
    if (!start) return '';
    const [year, month, day] = String(start).split('-');
    const first = `${year}. ${month}. ${day}.`;
    if (!end) return first;
    const [endYear, endMonth, endDay] = String(end).split('-');
    return endYear === year ? `${first} - ${endMonth}. ${endDay}.` : `${first} - ${endYear}. ${endMonth}. ${endDay}.`;
  };

  const updateLightbox = () => {
    const item = lightboxImages[lightboxIndex];
    if (!item) return;
    lightboxImage.src = item.src;
    lightboxImage.alt = item.title;
    lightboxCaption.textContent = item.title;
    lightboxCount.textContent = `${lightboxIndex + 1} / ${lightboxImages.length}`;
    lightbox.querySelector('[data-news-lightbox-prev]').hidden = lightboxImages.length < 2;
    lightbox.querySelector('[data-news-lightbox-next]').hidden = lightboxImages.length < 2;
  };
  const openLightbox = (eventId, initialIndex = 0) => {
    const item = renderedNews.find(news => news.news_id === eventId);
    if (!item || !item.images?.length) return;
    lightboxImages = item.images.map(src => ({ src: newsPath(src), title: item.title })).filter(image => image.src);
    if (!lightboxImages.length) return;
    lightboxIndex = Math.min(Math.max(Number(initialIndex) || 0, 0), lightboxImages.length - 1);
    updateLightbox();
    lightbox.hidden = false;
    document.body.style.overflow = 'hidden';
    lightbox.querySelector('[data-news-lightbox-close]').focus();
  };
  const closeLightbox = () => {
    lightbox.hidden = true;
    lightboxImage.removeAttribute('src');
    document.body.style.overflow = '';
  };
  const stepLightbox = direction => {
    if (!lightboxImages.length) return;
    lightboxIndex = (lightboxIndex + direction + lightboxImages.length) % lightboxImages.length;
    updateLightbox();
  };

  const newsCard = item => {
    const images = (Array.isArray(item.images) ? item.images : []).map(newsPath).filter(Boolean);
    const isFullWidth = String(item.card_width || '').toLowerCase() === 'full' || item.featured === true;
    const isSideBySide = String(item.image_layout || '').toLowerCase() === 'side by side' && images.length > 1;
    const visibleImages = isSideBySide ? images.slice(0, 2) : images.slice(0, 1);
    const media = images.length
      ? `<div class="news-card-media${isSideBySide ? ' side-by-side' : ''}">${visibleImages.map((src, index) => `<div class="news-card-photo"><img src="${src}" alt="${newsEscape(item.title)}${isSideBySide ? ` — photo ${index + 1}` : ''}" loading="lazy"><button class="news-media-button" type="button" data-news-open="${newsEscape(item.news_id)}" data-news-index="${index}" aria-label="View ${newsEscape(item.title)} photo ${index + 1}"></button>${isSideBySide && index === 1 && images.length > 2 ? `<span class="news-photo-count">+${images.length - 2} more</span>` : (!isSideBySide && images.length > 1 ? `<span class="news-photo-count">${images.length} photos</span>` : '')}</div>`).join('')}</div>`
      : `<div class="news-card-media"><div class="news-card-placeholder"><div><b>MSF</b><span>Event photo not provided</span></div></div></div>`;
    return `<article class="news-card${isFullWidth ? ' featured' : ''}" data-category="${newsSlug(item.category)}">
      ${media}
      <div class="news-card-body">
        <div class="news-meta"><span class="news-category">${newsEscape(item.category)}</span><time datetime="${newsEscape(item.date_start)}">${newsDate(item.date_start, item.date_end)}</time></div>
        <h3>${newsEscape(item.title)}</h3>
        ${item.description ? `<p>${newsEscape(item.description)}</p>` : ''}
      </div>
    </article>`;
  };

  const renderNewsList = () => {
    const filtered = renderedNews.filter(item => {
      const year = String(item.date_start || '').slice(0, 4);
      return (activeYear === 'all' || year === activeYear) && (activeCategory === 'all' || item.category === activeCategory);
    });
    newsList.innerHTML = filtered.length ? filtered.map(newsCard).join('') : '<p class="news-empty">No events match these filters.</p>';
  };

  const renderNews = data => {
    renderedNews = (Array.isArray(data?.news) ? data.news : [])
      .filter(item => item.active !== false)
      .sort((a, b) => Number(a.display_order) - Number(b.display_order) || String(b.date_start).localeCompare(String(a.date_start)));
    const years = [...new Set(renderedNews.map(item => String(item.date_start || '').slice(0, 4)).filter(Boolean))].sort((a, b) => b.localeCompare(a));
    const categories = [...new Set(renderedNews.map(item => item.category).filter(Boolean))].sort((a, b) => a.localeCompare(b));
    const allImages = renderedNews.flatMap(item => (item.images || []).map(src => ({ src: newsPath(src), title: item.title }))).filter(item => item.src);
    const configuredHeroImages = (Array.isArray(data?.hero_images) ? data.hero_images : [])
      .sort((a, b) => Number(a.slot) - Number(b.slot))
      .map(item => ({ src: newsPath(item.image_path), title: item.alt_text || 'MSF news highlight' }))
      .filter(item => item.src)
      .slice(0, 3);
    const heroImages = [...configuredHeroImages];
    for (const item of allImages) {
      if (heroImages.length >= 3) break;
      if (!heroImages.some(heroItem => heroItem.src === item.src)) heroImages.push(item);
    }
    heroMedia.innerHTML = heroImages.map(item => `<div class="news-hero-shot"><img src="${item.src}" alt="${newsEscape(item.title)}"></div>`).join('') || '<div class="news-hero-empty">Gallery images will appear here.</div>';
    while (heroMedia.children.length < 3 && heroImages.length) {
      const item = heroImages[heroMedia.children.length % heroImages.length];
      heroMedia.insertAdjacentHTML('beforeend', `<div class="news-hero-shot"><img src="${item.src}" alt="${newsEscape(item.title)}"></div>`);
    }
    yearFilters.innerHTML = `<button type="button" class="${activeYear === 'all' ? 'active' : ''}" data-news-year="all">All</button>${years.map(year => `<button type="button" class="${activeYear === year ? 'active' : ''}" data-news-year="${year}">${year}</button>`).join('')}`;
    const selectedCategory = activeCategory;
    categoryFilter.innerHTML = `<option value="all">All categories</option>${categories.map(category => `<option value="${newsEscape(category)}">${newsEscape(category)}</option>`).join('')}`;
    if ([...categoryFilter.options].some(option => option.value === selectedCategory)) categoryFilter.value = selectedCategory;
    renderNewsList();
  };

  const applyLatestNews = () => {
    const data = window.MSF_NEWS_DATA;
    if (!data || data.updatedAt === renderedNewsVersion) return;
    renderedNewsVersion = data.updatedAt || String(Date.now());
    renderNews(data);
  };
  const reloadNewsData = () => {
    if (document.hidden) return;
    const script = document.createElement('script');
    script.src = `data/news.js?v=${Date.now()}`;
    script.onload = () => { applyLatestNews(); script.remove(); };
    script.onerror = () => script.remove();
    document.head.append(script);
  };

  yearFilters.addEventListener('click', event => {
    const button = event.target.closest('[data-news-year]');
    if (!button) return;
    activeYear = button.dataset.newsYear;
    yearFilters.querySelectorAll('button').forEach(item => item.classList.toggle('active', item === button));
    renderNewsList();
  });
  categoryFilter.addEventListener('change', () => { activeCategory = categoryFilter.value; renderNewsList(); });
  newsList.addEventListener('click', event => {
    const button = event.target.closest('[data-news-open]');
    if (button) openLightbox(button.dataset.newsOpen, button.dataset.newsIndex);
  });
  lightbox.querySelector('[data-news-lightbox-close]').addEventListener('click', closeLightbox);
  lightbox.querySelector('[data-news-lightbox-prev]').addEventListener('click', () => stepLightbox(-1));
  lightbox.querySelector('[data-news-lightbox-next]').addEventListener('click', () => stepLightbox(1));
  lightbox.addEventListener('click', event => { if (event.target === lightbox) closeLightbox(); });
  document.addEventListener('keydown', event => {
    if (lightbox.hidden) return;
    if (event.key === 'Escape') closeLightbox();
    if (event.key === 'ArrowLeft') stepLightbox(-1);
    if (event.key === 'ArrowRight') stepLightbox(1);
  });
  applyLatestNews();
  window.setInterval(reloadNewsData, 2000);
}
