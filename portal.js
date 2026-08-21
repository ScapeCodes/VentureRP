(() => {
  'use strict';

  const config = window.VENTURE_CONFIG || {};
  const page = document.body.dataset.portalPage;
  const sessionKey = 'venture_session';
  const demoStoreKey = 'venture_demo_content_v2';
  const allPermissions = ['panel.view', 'forms.manage', 'submissions.view', 'submissions.manage', 'departments.manage', 'permissions.manage'];

  const seed = {
    forms: [
      { id: 'suggestion', title: 'Community suggestion', description: 'Share an idea that could make Venture even better.', icon: '01', status: 'open', fields: [
        { id: 'summary', label: 'Suggestion title', type: 'text', required: true, placeholder: 'A short, clear title' },
        { id: 'details', label: 'Tell us about it', type: 'textarea', required: true, placeholder: 'What would you change and why?' },
        { id: 'impact', label: 'Who would this benefit?', type: 'select', required: true, options: ['Everyone', 'Civilians', 'Emergency services', 'Businesses', 'Staff'] },
      ]},
      { id: 'ban-appeal', title: 'Ban appeal', description: 'Ask the staff team to review a community ban.', icon: '02', status: 'open', fields: [
        { id: 'ban_date', label: 'When were you banned?', type: 'date', required: true },
        { id: 'reason', label: 'Ban reason', type: 'text', required: true },
        { id: 'appeal', label: 'Why should we reconsider?', type: 'textarea', required: true, placeholder: 'Be honest and include what you would do differently.' },
      ]},
      { id: 'staff-report', title: 'Staff report', description: 'Raise a confidential concern for senior management.', icon: '03', status: 'open', fields: [
        { id: 'staff_member', label: 'Staff member', type: 'text', required: true },
        { id: 'details', label: 'What happened?', type: 'textarea', required: true },
        { id: 'evidence', label: 'Evidence link', type: 'url', required: false, placeholder: 'https://' },
      ]},
    ],
    departments: [
      { id: 'lspd', slug: 'lspd', name: 'Los Santos Police Department', shortName: 'LSPD', summary: 'Protecting life, preserving peace and serving Los Santos with integrity.', accent: '#3f78d6', status: 'Recruitment open', updatedAt: '2026-08-21', content: '<h2>Mission statement</h2><p>Our mission is to protect life and property, preserve the peace and build trust through fair, professional policing.</p><h2>What we expect</h2><p>Officers demonstrate maturity, sound judgement and a commitment to character-led roleplay. Training gives every recruit the foundation to thrive.</p><h2>Specialist divisions</h2><p>Build a career across patrol, traffic enforcement, investigations and specialist operations.</p>', applyUrl: 'forms.html' },
      { id: 'safr', slug: 'safr', name: 'San Andreas Fire & Rescue', shortName: 'SAFR', summary: 'Emergency medicine, rescue and fire response for every corner of San Andreas.', accent: '#db1240', status: 'Recruitment open', updatedAt: '2026-08-21', content: '<h2>Answer the call</h2><p>SAFR delivers professional medical and rescue roleplay, supporting the city at its most critical moments.</p><h2>Your career</h2><p>Train as an EMT, develop clinical skills and progress into specialist rescue and leadership paths.</p>', applyUrl: 'forms.html' },
      { id: 'doj', slug: 'doj', name: 'Department of Justice', shortName: 'DOJ', summary: 'Creating courtroom stories and upholding a fair, living legal system.', accent: '#c5a35e', status: 'Coming soon', updatedAt: '2026-08-21', content: '<h2>Justice with consequence</h2><p>Attorneys and judges turn police investigations into long-form legal stories where every decision matters.</p>', applyUrl: '' },
    ],
    submissions: [],
    roleRules: [],
  };

  function getSession() {
    try {
      const session = JSON.parse(localStorage.getItem(sessionKey) || 'null');
      if (session?.expiresAt && session.expiresAt < Date.now()) { localStorage.removeItem(sessionKey); return null; }
      return session;
    } catch { localStorage.removeItem(sessionKey); return null; }
  }

  function saveSession(value) {
    if (value) localStorage.setItem(sessionKey, JSON.stringify(value));
    else localStorage.removeItem(sessionKey);
  }

  function demoData() {
    try {
      const saved = JSON.parse(localStorage.getItem(demoStoreKey) || 'null');
      return saved || structuredClone(seed);
    } catch { return JSON.parse(JSON.stringify(seed)); }
  }

  function saveDemo(data) { localStorage.setItem(demoStoreKey, JSON.stringify(data)); }

  async function request(path, options = {}) {
    if (!config.apiBaseUrl) return null;
    const session = getSession();
    const response = await fetch(config.apiBaseUrl.replace(/\/$/, '') + path, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}), ...(options.headers || {}) },
    });
    if (response.status === 204) return null;
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || 'Something went wrong.');
    return body;
  }

  function has(permission) { return Boolean(getSession()?.permissions?.includes(permission)); }
  function escapeHtml(value = '') { const el = document.createElement('div'); el.textContent = value; return el.innerHTML; }
  function slugify(value) { return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
  function uid() { return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`; }
  function toast(message) { const el = document.getElementById('toast'); if (!el) return; el.textContent = message; el.classList.add('toast--show'); clearTimeout(el._timer); el._timer = setTimeout(() => el.classList.remove('toast--show'), 3200); }

  async function beginLogin() {
    if (config.apiBaseUrl) {
      const returnTo = new URL('forms.html', location.href).href;
      location.href = `${config.apiBaseUrl.replace(/\/$/, '')}/auth/discord?return_to=${encodeURIComponent(returnTo)}`;
      return;
    }
    const state = crypto.getRandomValues(new Uint32Array(4)).join('-');
    sessionStorage.setItem('venture_oauth_state', state);
    const params = new URLSearchParams({ client_id: config.clientId, redirect_uri: config.redirectUri, response_type: 'token', scope: 'identify guilds guilds.members.read', state, prompt: 'consent' });
    location.href = `https://discord.com/oauth2/authorize?${params}`;
  }

  async function finishLogin() {
    const hash = new URLSearchParams(location.hash.slice(1));
    const apiToken = hash.get('session');
    if (apiToken) {
      saveSession({ token: apiToken, user: { username: 'Loading…' }, permissions: [] });
      history.replaceState(null, '', location.pathname + location.search);
      try { saveSession(await request('/api/me')); location.href = 'forms.html'; } catch (error) { saveSession(null); toast(error.message); }
      return true;
    }
    const accessToken = hash.get('access_token');
    if (!accessToken) return false;
    const expected = sessionStorage.getItem('venture_oauth_state');
    if (!expected || expected !== hash.get('state')) { history.replaceState(null, '', location.pathname); toast('Discord login could not be verified. Please try again.'); return true; }
    try {
      const headers = { Authorization: `Bearer ${accessToken}` };
      const [userResponse, guildsResponse] = await Promise.all([fetch('https://discord.com/api/v10/users/@me', { headers }), fetch('https://discord.com/api/v10/users/@me/guilds', { headers })]);
      if (!userResponse.ok) throw new Error('Discord did not return your profile.');
      const user = await userResponse.json();
      const guilds = guildsResponse.ok ? await guildsResponse.json() : [];
      const normalize = value => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const guild = guilds.find(item => config.guildId && item.id === config.guildId) || guilds.find(item => normalize(item.name).includes(normalize(config.guildName || 'Venture')));
      let roles = [];
      if (guild) {
        const memberResponse = await fetch(`https://discord.com/api/v10/users/@me/guilds/${guild.id}/member`, { headers });
        if (memberResponse.ok) roles = (await memberResponse.json()).roles || [];
      }
      const guildPermissions = guild ? BigInt(guild.permissions || '0') : 0n;
      const isGuildAdmin = Boolean(guild?.owner) || Boolean(guildPermissions & 8n) || Boolean(guildPermissions & 32n);
      const session = { user, roles, guild: guild ? { id: guild.id, name: guild.name } : null, isGuildAdmin, permissions: [], expiresAt: Date.now() + Number(hash.get('expires_in') || 0) * 1000, demo: true };
      session.permissions = staticPermissions(session);
      saveSession(session);
      sessionStorage.removeItem('venture_oauth_state');
      history.replaceState(null, '', location.pathname);
      location.href = 'forms.html';
    } catch (error) { toast(error.message); }
    return true;
  }

  function staticPermissions(session) {
    if (!session) return [];
    const configuredAdmin = (config.adminUserIds || []).includes(session.user?.id) || (session.roles || []).some(role => (config.adminRoleIds || []).includes(role));
    const mapped = demoData().roleRules.filter(rule => (session.roles || []).includes(rule.roleId)).flatMap(rule => rule.permissions || []);
    return [...new Set(session.isGuildAdmin || configuredAdmin ? allPermissions : mapped)];
  }

  async function refreshSession() {
    const session = getSession(); if (!session) return;
    try {
      const fresh = config.apiBaseUrl && session.token ? await request('/api/me') : { ...session, permissions: staticPermissions(session) };
      if (JSON.stringify(fresh.permissions) !== JSON.stringify(session.permissions) || fresh.user?.username !== session.user?.username) {
        saveSession(fresh); window.dispatchEvent(new Event('venture:session'));
      }
    } catch (error) {
      if (/expired|log in/i.test(error.message)) { saveSession(null); window.dispatchEvent(new Event('venture:session')); }
    }
  }

  function authCard() {
    const el = document.getElementById('auth-card');
    if (!el) return;
    const session = getSession();
    if (!session) {
      el.innerHTML = '<div><small>Discord account required</small><strong>Sign in to submit</strong></div><button class="discord-login" type="button">Login with Discord</button>';
      el.querySelector('button').addEventListener('click', beginLogin);
    } else {
      const avatar = session.user.avatar ? `https://cdn.discordapp.com/avatars/${session.user.id}/${session.user.avatar}.png?size=80` : 'logo.png';
      el.innerHTML = `<img src="${avatar}" alt="" /><div><small>Signed in as</small><strong>${escapeHtml(session.user.global_name || session.user.username)}</strong></div><button class="text-link auth-logout" type="button">Log out</button>`;
      el.querySelector('button').addEventListener('click', () => { saveSession(null); location.reload(); });
    }
  }

  function fieldMarkup(field, value = '') {
    const common = `name="${escapeHtml(field.id)}" id="field-${escapeHtml(field.id)}" ${field.required ? 'required' : ''}`;
    let control;
    if (field.type === 'textarea') control = `<textarea ${common} placeholder="${escapeHtml(field.placeholder || '')}">${escapeHtml(value)}</textarea>`;
    else if (field.type === 'select') control = `<select ${common}><option value="">Choose one…</option>${(field.options || []).map(option => `<option ${option === value ? 'selected' : ''}>${escapeHtml(option)}</option>`).join('')}</select>`;
    else control = `<input ${common} type="${escapeHtml(field.type || 'text')}" value="${escapeHtml(value)}" placeholder="${escapeHtml(field.placeholder || '')}" />`;
    return `<label class="portal-field"><span>${escapeHtml(field.label)}${field.required ? ' <b>*</b>' : ''}</span>${control}</label>`;
  }

  async function initForms() {
    const list = document.getElementById('suggestions-list');
    if (!list) return;
    let data = await request('/api/forms').catch(error => { toast(error.message); return null; });
    const store = demoData();
    const forms = data?.forms || store.forms.filter(form => form.status === 'open');
    const suggestionForm = forms.find(form => form.id === 'suggestion' || /suggestion/i.test(form.title));
    const suggestions = data?.suggestions || store.submissions.filter(item => item.formId === 'suggestion');
    const query = document.getElementById('suggestion-query');
    const renderSuggestions = () => {
      const term = query.value.trim().toLowerCase();
      const visible = suggestions.filter(item => !term || Object.values(item.values || {}).some(value => String(value).toLowerCase().includes(term)) || String(item.user?.global_name || item.user?.username || '').toLowerCase().includes(term));
      document.getElementById('suggestion-count').textContent = `${visible.length} ${visible.length === 1 ? 'suggestion' : 'suggestions'}`;
      list.innerHTML = visible.length ? visible.map(item => {
        const author = item.user?.global_name || item.user?.username || 'Venture member';
        const title = item.values?.summary || item.formTitle || 'Community suggestion';
        const body = item.values?.details || '';
        const category = item.values?.impact || 'Community';
        return `<article class="suggestion-post"><div class="suggestion-vote"><span>▲</span><strong>${Number(item.votes || 0)}</strong></div><div class="suggestion-post-body"><div class="suggestion-meta"><span>${escapeHtml(category)}</span><small>Posted by ${escapeHtml(author)} · ${new Date(item.createdAt).toLocaleDateString()}</small></div><h2>${escapeHtml(title)}</h2><p>${escapeHtml(body)}</p><div class="suggestion-footer"><span class="status-pill status-pill--${escapeHtml(item.status)}">${escapeHtml(item.status || 'received')}</span></div></div></article>`;
      }).join('') : '<div class="empty-state suggestions-empty"><h3>No suggestions found</h3><p>Be the first to start a conversation.</p></div>';
    };
    query.addEventListener('input', renderSuggestions);
    renderSuggestions();
    document.getElementById('create-suggestion').onclick = () => { if (!getSession()) beginLogin(); else if (suggestionForm) openSubmission(suggestionForm, store); else toast('The suggestion form is currently closed.'); };
    const privateForms = forms.filter(form => form !== suggestionForm);
    const privateSection = document.getElementById('private-forms-section');
    const privateGrid = document.getElementById('private-forms');
    if (getSession() && privateForms.length) {
      privateSection.hidden = false;
      privateGrid.innerHTML = privateForms.map(form => `<article class="form-card"><span class="form-card-number">${escapeHtml(form.icon || '—')}</span><div><small>Private submission</small><h3>${escapeHtml(form.title)}</h3><p>${escapeHtml(form.description)}</p></div><button class="button button--ghost" data-private-form="${escapeHtml(form.id)}">Start form</button></article>`).join('');
      privateGrid.onclick = event => { const button = event.target.closest('[data-private-form]'); const form = button && privateForms.find(item => item.id === button.dataset.privateForm); if (form) openSubmission(form, store); };
    }
    renderMySubmissions(data?.submissions || store.submissions);
    if (location.hash === '#login' && !getSession()) beginLogin();
    if (location.hash === '#my-submissions') document.getElementById('my-submissions-section')?.scrollIntoView();
    if (location.hash === '#private-forms') privateSection?.scrollIntoView();
  }

  function openSubmission(form, store) {
    const dialog = document.getElementById('form-dialog');
    const body = document.getElementById('form-dialog-body');
    body.innerHTML = `<p class="eyebrow"><span></span> Secure submission</p><h2>${escapeHtml(form.title)}</h2><p class="dialog-lede">${escapeHtml(form.description)}</p><form id="public-form">${form.fields.map(field => fieldMarkup(field)).join('')}<label class="consent-row"><input type="checkbox" required /> <span>I confirm these details are accurate.</span></label><button class="button" type="submit">Send submission</button></form>`;
    dialog.showModal();
    body.querySelector('form').addEventListener('submit', async event => {
      event.preventDefault();
      const values = Object.fromEntries(new FormData(event.currentTarget));
      const payload = { formId: form.id, values };
      try {
        if (config.apiBaseUrl) await request('/api/submissions', { method: 'POST', body: JSON.stringify(payload) });
        else { const session = getSession(); store.submissions.unshift({ id: uid(), formId: form.id, formTitle: form.title, values, status: 'received', createdAt: new Date().toISOString(), userId: session?.user.id, user: session ? { id: session.user.id, username: session.user.username, global_name: session.user.global_name } : null }); saveDemo(store); }
        dialog.close(); toast('Submission received.'); initForms();
      } catch (error) { toast(error.message); }
    });
  }

  function renderMySubmissions(submissions) {
    const session = getSession(); if (!session) return;
    const mine = submissions.filter(item => !item.userId || item.userId === session.user.id);
    const section = document.getElementById('my-submissions-section'); const list = document.getElementById('my-submissions');
    if (!section || !list) return; section.hidden = false;
    list.innerHTML = mine.length ? mine.map(item => `<article><div><small>${new Date(item.createdAt).toLocaleDateString()}</small><strong>${escapeHtml(item.formTitle || item.formId)}</strong></div><span class="status-pill status-pill--${escapeHtml(item.status)}">${escapeHtml(item.status)}</span></article>`).join('') : '<p class="muted-copy">You have not submitted a form yet.</p>';
  }

  async function initDepartments() {
    const root = document.getElementById('department-view'); if (!root) return;
    const response = await request('/api/departments').catch(error => { toast(error.message); return null; });
    const departments = response?.departments || demoData().departments;
    const slug = new URLSearchParams(location.search).get('department');
    if (slug) {
      const department = departments.find(item => item.slug === slug);
      if (!department) { root.innerHTML = '<section class="portal-section section-shell empty-state"><h2>Department not found</h2><a class="text-link" href="index.html">Back home</a></section>'; return; }
      document.title = `${department.shortName} — Venture Roleplay`;
      root.innerHTML = `<article class="department-page"><header class="department-banner" style="--department-accent:${escapeHtml(department.accent)}"><div class="section-shell"><a class="back-link" href="index.html">← Back home</a><span class="department-monogram">${escapeHtml(department.shortName)}</span><p class="eyebrow"><span></span>${escapeHtml(department.status)}</p><h1>${escapeHtml(department.name)}</h1><p>${escapeHtml(department.summary)}</p></div></header><div class="department-layout section-shell"><aside><small>Last updated</small><strong>${new Date(department.updatedAt).toLocaleDateString()}</strong>${department.applyUrl ? `<a class="button" href="${escapeHtml(department.applyUrl)}">Apply today</a>` : ''}</aside><div class="rich-content">${sanitizeHtml(department.content)}</div></div></article>`;
    } else {
      root.innerHTML = `<section class="portal-section section-shell"><div class="portal-section-head"><div><span class="section-index">04 / DEPARTMENTS</span><h2>CHOOSE YOUR PATH</h2></div></div><div class="department-grid">${departments.map(department => `<a class="department-card" style="--department-accent:${escapeHtml(department.accent)}" href="?department=${encodeURIComponent(department.slug)}"><div><span>${escapeHtml(department.shortName)}</span><small>${escapeHtml(department.status)}</small></div><h3>${escapeHtml(department.name)}</h3><p>${escapeHtml(department.summary)}</p><b>Explore department →</b></a>`).join('')}</div></section>`;
    }
  }

  function sanitizeHtml(html = '') {
    const template = document.createElement('template'); template.innerHTML = html;
    template.content.querySelectorAll('script,style,iframe,object,embed,form,input,button,link,meta').forEach(el => el.remove());
    template.content.querySelectorAll('*').forEach(el => [...el.attributes].forEach(attr => { if (attr.name.startsWith('on') || attr.name === 'style' || (['href', 'src'].includes(attr.name) && /^javascript:/i.test(attr.value))) el.removeAttribute(attr.name); }));
    return template.innerHTML;
  }

  function requirePanel() {
    const session = getSession();
    if (session && has('panel.view')) return true;
    const content = document.getElementById('admin-content');
    if (content) content.innerHTML = `<div class="locked-panel"><span>VR</span><h2>ACCESS REQUIRED</h2><p>${session ? 'Your Discord roles do not grant Control Room access.' : 'Log in with Discord to verify your staff roles.'}</p><button class="button" id="locked-login">${session ? 'Return to site' : 'Login with Discord'}</button></div>`;
    document.getElementById('admin-tabs')?.setAttribute('hidden', '');
    document.getElementById('locked-login')?.addEventListener('click', () => session ? location.href = 'index.html' : beginLogin());
    return false;
  }

  async function initMod() {
    if (!requirePanel()) return;
    const session = getSession();
    document.getElementById('mod-user-label').textContent = `Signed in as ${session.user.global_name || session.user.username}`;
    document.querySelectorAll('[data-permission]').forEach(button => { if (!has(button.dataset.permission)) button.hidden = true; });
    document.getElementById('admin-tabs').addEventListener('click', event => { const button = event.target.closest('button[data-tab]'); if (!button) return; document.querySelectorAll('.admin-tabs button').forEach(item => item.classList.remove('active')); button.classList.add('active'); renderAdminTab(button.dataset.tab); });
    renderAdminTab('overview');
  }

  async function adminData() {
    const response = await request('/api/admin').catch(error => { toast(error.message); return null; });
    const data = response || demoData();
    if (!data.rules) {
      try { data.rules = JSON.parse(localStorage.getItem('venture_rules') || 'null') || structuredClone(window.VENTURE_RULES); }
      catch { data.rules = JSON.parse(JSON.stringify(window.VENTURE_RULES)); }
    }
    return data;
  }

  async function renderAdminTab(tab) {
    const root = document.getElementById('admin-content'); root.innerHTML = '<div class="loading-state">Loading…</div>';
    const data = await adminData();
    if (tab === 'overview') {
      root.innerHTML = `<div class="admin-heading"><p class="eyebrow"><span></span> At a glance</p><h2>OVERVIEW</h2></div><div class="metric-grid"><article><small>Open forms</small><strong>${data.forms.filter(f => f.status === 'open').length}</strong></article><article><small>Submissions</small><strong>${data.submissions.length}</strong></article><article><small>Departments</small><strong>${data.departments.length}</strong></article></div><div class="admin-note"><strong>Role-backed access</strong><p>Permissions are checked by the API on every request. Hiding a button in the browser is never treated as security.</p></div>`;
    } else if (tab === 'forms') renderFormsAdmin(root, data);
    else if (tab === 'submissions') renderSubmissionsAdmin(root, data);
    else if (tab === 'rules') renderRulesAdmin(root, data);
    else if (tab === 'departments') renderDepartmentsAdmin(root, data);
    else if (tab === 'permissions') renderPermissionsAdmin(root, data);
  }

  function adminHeading(title, actionLabel, action) {
    return `<div class="admin-heading admin-heading--row"><div><p class="eyebrow"><span></span> Content manager</p><h2>${title}</h2></div>${actionLabel ? `<button class="button" data-action="${action}">${actionLabel}</button>` : ''}</div>`;
  }

  function renderFormsAdmin(root, data) {
    root.innerHTML = adminHeading('FORMS', 'Create form', 'new-form') + `<div class="admin-list">${data.forms.map(form => `<article><div><span class="status-pill">${escapeHtml(form.status)}</span><h3>${escapeHtml(form.title)}</h3><p>${form.fields.length} fields · ${escapeHtml(form.description)}</p></div><div><button class="text-link" data-edit-form="${form.id}">Edit</button><button class="icon-button danger" data-delete-form="${form.id}">Delete</button></div></article>`).join('')}</div>`;
    root.querySelector('[data-action]').addEventListener('click', () => openFormEditor(null, data));
    root.querySelectorAll('[data-edit-form]').forEach(button => button.addEventListener('click', () => openFormEditor(data.forms.find(item => item.id === button.dataset.editForm), data)));
    root.querySelectorAll('[data-delete-form]').forEach(button => button.addEventListener('click', () => deleteItem('forms', button.dataset.deleteForm, data)));
  }

  function openFormEditor(existing, data) {
    const dialog = document.getElementById('admin-dialog'); const body = document.getElementById('admin-dialog-body');
    const form = existing || { id: '', title: '', description: '', status: 'open', fields: [] };
    body.innerHTML = `<div class="admin-heading"><p class="eyebrow"><span></span> Form builder</p><h2>${existing ? 'EDIT' : 'CREATE'} FORM</h2></div><form id="form-builder"><div class="field-row"><label class="portal-field"><span>Title</span><input name="title" value="${escapeHtml(form.title)}" required /></label><label class="portal-field"><span>Status</span><select name="status"><option value="open" ${form.status === 'open' ? 'selected' : ''}>Open</option><option value="closed" ${form.status === 'closed' ? 'selected' : ''}>Closed</option></select></label></div><label class="portal-field"><span>Description</span><textarea name="description" required>${escapeHtml(form.description)}</textarea></label><div class="builder-fields"><div class="builder-fields-head"><strong>Questions</strong><button type="button" class="text-link" id="add-field">+ Add question</button></div><div id="builder-field-list"></div></div><button class="button" type="submit">Save form</button></form>`;
    const list = body.querySelector('#builder-field-list');
    const addRow = (field = {}) => { const row = document.createElement('div'); row.className = 'builder-field'; row.innerHTML = `<input class="builder-label" aria-label="Question label" placeholder="Question label" value="${escapeHtml(field.label || '')}" required /><select aria-label="Question type"><option value="text">Short answer</option><option value="textarea">Long answer</option><option value="select">Dropdown choices</option><option value="date">Date</option><option value="url">URL</option></select><input class="builder-options" aria-label="Dropdown options" placeholder="Choices, separated, by commas" value="${escapeHtml((field.options || []).join(', '))}" /><label><input type="checkbox" ${field.required ? 'checked' : ''} /> Required</label><button type="button" aria-label="Remove">×</button>`; const type = row.querySelector('select'); const options = row.querySelector('.builder-options'); type.value = field.type || 'text'; const toggleOptions = () => { options.hidden = type.value !== 'select'; }; type.onchange = toggleOptions; toggleOptions(); row.querySelector('button').onclick = () => row.remove(); list.append(row); };
    form.fields.forEach(addRow); body.querySelector('#add-field').onclick = () => addRow(); dialog.showModal();
    body.querySelector('form').onsubmit = async event => { event.preventDefault(); const fd = new FormData(event.currentTarget); const fields = [...list.children].map((row, index) => { const type = row.querySelector('select').value; const field = { id: slugify(row.querySelector('.builder-label').value) || `field-${index + 1}`, label: row.querySelector('.builder-label').value, type, required: row.querySelector('input[type="checkbox"]').checked }; if (type === 'select') field.options = row.querySelector('.builder-options').value.split(',').map(value => value.trim()).filter(Boolean); return field; }); const value = { ...form, id: form.id || slugify(fd.get('title')) || uid(), title: fd.get('title'), description: fd.get('description'), status: fd.get('status'), fields }; await saveItem('forms', value, data); dialog.close(); renderAdminTab('forms'); };
  }

  function renderSubmissionsAdmin(root, data) {
    root.innerHTML = adminHeading('SUBMISSIONS') + `<div class="admin-list">${data.submissions.map(item => `<article><div><span class="status-pill status-pill--${escapeHtml(item.status)}">${escapeHtml(item.status)}</span><h3>${escapeHtml(item.formTitle || item.formId)}</h3><p>${new Date(item.createdAt).toLocaleString()}</p></div><button class="text-link" data-view-submission="${item.id}">Review</button></article>`).join('') || '<div class="empty-state"><h3>No submissions yet</h3></div>'}</div>`;
    root.querySelectorAll('[data-view-submission]').forEach(button => button.onclick = () => openSubmissionReview(data.submissions.find(item => item.id === button.dataset.viewSubmission), data));
  }

  function renderRulesAdmin(root, data) {
    const ruleData = data.rules;
    root.innerHTML = adminHeading('RULES', 'Edit introduction', 'edit-rule-intro') + `<div class="rule-admin-categories">${ruleData.categories.map(category => `<section><div class="rule-admin-category-head"><div><small>${escapeHtml(category.number)}</small><h3>${escapeHtml(category.title)}</h3></div><button class="text-link" data-add-rule="${escapeHtml(category.id)}">+ Add section</button></div><div class="admin-list">${category.sections.map(section => `<article><div><span class="status-pill">${escapeHtml(section.id)}</span><h3>${escapeHtml(section.title)}</h3><p>${section.rules.length} rule points</p></div><div><button class="text-link" data-edit-rule="${escapeHtml(category.id)}:${escapeHtml(section.id)}">Edit</button><button class="icon-button danger" data-delete-rule="${escapeHtml(category.id)}:${escapeHtml(section.id)}">Delete</button></div></article>`).join('')}</div></section>`).join('')}</div>`;
    root.querySelector('[data-action]').onclick = () => openRuleIntroEditor(ruleData, data);
    root.querySelectorAll('[data-add-rule]').forEach(button => button.onclick = () => openRuleSectionEditor(ruleData.categories.find(category => category.id === button.dataset.addRule), null, ruleData, data));
    root.querySelectorAll('[data-edit-rule]').forEach(button => button.onclick = () => { const [categoryId, sectionId] = button.dataset.editRule.split(':'); const category = ruleData.categories.find(item => item.id === categoryId); openRuleSectionEditor(category, category.sections.find(item => item.id === sectionId), ruleData, data); });
    root.querySelectorAll('[data-delete-rule]').forEach(button => button.onclick = async () => { if (!confirm('Delete this rule section?')) return; const [categoryId, sectionId] = button.dataset.deleteRule.split(':'); const category = ruleData.categories.find(item => item.id === categoryId); category.sections = category.sections.filter(item => item.id !== sectionId); await persistRules(ruleData, data); renderAdminTab('rules'); });
  }

  function openRuleIntroEditor(ruleData, data) {
    const dialog = document.getElementById('admin-dialog'); const body = document.getElementById('admin-dialog-body');
    body.innerHTML = `${adminHeading('RULES INTRODUCTION')}<form id="rules-intro-editor"><label class="portal-field"><span>Notice</span><textarea name="notice" required>${escapeHtml(ruleData.notice || '')}</textarea></label><label class="portal-field"><span>Introduction paragraphs — separate with a blank line</span><textarea name="introduction" class="tall-textarea" required>${escapeHtml((ruleData.introduction || []).join('\n\n'))}</textarea></label><label class="portal-field"><span>Golden rule title</span><input name="goldenTitle" value="${escapeHtml(ruleData.goldenRule?.title || '')}" required /></label><label class="portal-field"><span>Golden rule paragraphs — separate with a blank line</span><textarea name="goldenCopy" class="tall-textarea" required>${escapeHtml((ruleData.goldenRule?.paragraphs || []).join('\n\n'))}</textarea></label><button class="button" type="submit">Save rules</button></form>`;
    dialog.showModal(); body.querySelector('form').onsubmit = async event => { event.preventDefault(); const fd = new FormData(event.currentTarget); ruleData.notice = fd.get('notice').trim(); ruleData.introduction = fd.get('introduction').split(/\n\s*\n/).map(value => value.trim()).filter(Boolean); ruleData.goldenRule = { title: fd.get('goldenTitle').trim(), paragraphs: fd.get('goldenCopy').split(/\n\s*\n/).map(value => value.trim()).filter(Boolean) }; await persistRules(ruleData, data); dialog.close(); renderAdminTab('rules'); };
  }

  function openRuleSectionEditor(category, existing, ruleData, data) {
    const dialog = document.getElementById('admin-dialog'); const body = document.getElementById('admin-dialog-body'); const section = existing || { id: '', title: '', rules: [] };
    body.innerHTML = `${adminHeading(existing ? 'EDIT RULE SECTION' : 'ADD RULE SECTION')}<form id="rule-section-editor"><div class="field-row"><label class="portal-field"><span>Rule number</span><input name="id" value="${escapeHtml(section.id)}" placeholder="1.1" required /></label><label class="portal-field"><span>Title</span><input name="title" value="${escapeHtml(section.title)}" required /></label></div><label class="portal-field"><span>Rule points — one paragraph per line</span><textarea name="points" class="tall-textarea" required>${escapeHtml((section.rules || []).join('\n'))}</textarea></label><button class="button" type="submit">Save section</button></form>`;
    dialog.showModal(); body.querySelector('form').onsubmit = async event => { event.preventDefault(); const fd = new FormData(event.currentTarget); const value = { id: fd.get('id').trim(), title: fd.get('title').trim(), rules: fd.get('points').split('\n').map(point => point.trim()).filter(Boolean) }; if (existing) Object.assign(existing, value); else category.sections.push(value); await persistRules(ruleData, data); dialog.close(); renderAdminTab('rules'); };
  }

  async function persistRules(ruleData, data) {
    if (config.apiBaseUrl) await request('/api/admin/rules/site-rules', { method: 'PUT', body: JSON.stringify({ ...ruleData, id: 'site-rules' }) });
    else localStorage.setItem('venture_rules', JSON.stringify(ruleData));
    data.rules = ruleData; toast('Rules updated.');
  }

  function openSubmissionReview(item, data) {
    const dialog = document.getElementById('admin-dialog'); const body = document.getElementById('admin-dialog-body');
    body.innerHTML = `${adminHeading('REVIEW')}<div class="answer-list">${Object.entries(item.values).map(([key, value]) => `<div><small>${escapeHtml(key.replaceAll('_', ' '))}</small><p>${escapeHtml(value)}</p></div>`).join('')}</div><label class="portal-field"><span>Status</span><select id="submission-status"><option>received</option><option>in review</option><option>approved</option><option>declined</option><option>closed</option></select></label><button class="button" id="save-submission">Save status</button>`;
    body.querySelector('select').value = item.status; dialog.showModal(); body.querySelector('#save-submission').onclick = async () => { item.status = body.querySelector('select').value; await saveItem('submissions', item, data); dialog.close(); renderAdminTab('submissions'); };
  }

  function renderDepartmentsAdmin(root, data) {
    root.innerHTML = adminHeading('DEPARTMENTS', 'Create page', 'new-department') + `<div class="admin-list">${data.departments.map(item => `<article><div><span class="department-dot" style="background:${escapeHtml(item.accent)}"></span><h3>${escapeHtml(item.name)}</h3><p>/${escapeHtml(item.slug)} · ${escapeHtml(item.status)}</p></div><div><a class="text-link" href="department.html?department=${encodeURIComponent(item.slug)}">View</a><button class="text-link" data-edit-department="${item.id}">Edit</button><button class="icon-button danger" data-delete-department="${item.id}">Delete</button></div></article>`).join('')}</div>`;
    root.querySelector('[data-action]').onclick = () => openDepartmentEditor(null, data);
    root.querySelectorAll('[data-edit-department]').forEach(button => button.onclick = () => openDepartmentEditor(data.departments.find(item => item.id === button.dataset.editDepartment), data));
    root.querySelectorAll('[data-delete-department]').forEach(button => button.onclick = () => deleteItem('departments', button.dataset.deleteDepartment, data));
  }

  function openDepartmentEditor(existing, data) {
    const dialog = document.getElementById('admin-dialog'); const body = document.getElementById('admin-dialog-body'); const item = existing || { id: '', name: '', shortName: '', slug: '', summary: '', accent: '#db1240', status: 'Recruitment open', content: '<h2>About the department</h2><p>Start writing here…</p>', applyUrl: 'forms.html' };
    body.innerHTML = `${adminHeading(existing ? 'EDIT PAGE' : 'CREATE PAGE')}<form id="department-editor"><div class="field-row"><label class="portal-field"><span>Department name</span><input name="name" value="${escapeHtml(item.name)}" required /></label><label class="portal-field"><span>Short name</span><input name="shortName" value="${escapeHtml(item.shortName)}" maxlength="8" required /></label></div><div class="field-row"><label class="portal-field"><span>URL slug</span><input name="slug" value="${escapeHtml(item.slug)}" required /></label><label class="portal-field"><span>Accent</span><input name="accent" type="color" value="${escapeHtml(item.accent)}" /></label></div><label class="portal-field"><span>Summary</span><textarea name="summary" required>${escapeHtml(item.summary)}</textarea></label><label class="portal-field"><span>Recruitment status</span><input name="status" value="${escapeHtml(item.status)}" /></label><div class="portal-field"><span>Page content</span><div class="editor-toolbar"><button type="button" data-command="bold"><b>B</b></button><button type="button" data-command="italic"><i>I</i></button><button type="button" data-block="h2">Heading</button><button type="button" data-block="p">Text</button><button type="button" data-command="insertUnorderedList">List</button><button type="button" data-command="createLink">Link</button></div><div class="wysiwyg" id="wysiwyg" contenteditable="true">${sanitizeHtml(item.content)}</div></div><button class="button" type="submit">Save department</button></form>`;
    const editor = body.querySelector('#wysiwyg');
    body.querySelectorAll('[data-command]').forEach(button => button.onclick = () => { const value = button.dataset.command === 'createLink' ? prompt('Link URL (include https://)') : null; if (button.dataset.command !== 'createLink' || value) document.execCommand(button.dataset.command, false, value); editor.focus(); });
    body.querySelectorAll('[data-block]').forEach(button => button.onclick = () => { document.execCommand('formatBlock', false, button.dataset.block); editor.focus(); });
    dialog.showModal(); body.querySelector('form').onsubmit = async event => { event.preventDefault(); const fd = new FormData(event.currentTarget); const value = { ...item, id: item.id || uid(), name: fd.get('name'), shortName: fd.get('shortName'), slug: slugify(fd.get('slug')), summary: fd.get('summary'), accent: fd.get('accent'), status: fd.get('status'), content: sanitizeHtml(editor.innerHTML), updatedAt: new Date().toISOString(), applyUrl: item.applyUrl }; await saveItem('departments', value, data); dialog.close(); renderAdminTab('departments'); };
  }

  function renderPermissionsAdmin(root, data) {
    root.innerHTML = adminHeading('PERMISSIONS', 'Add Discord role', 'new-role') + '<div class="permission-intro"><strong>Discord role mapping</strong><p>Paste role IDs from Discord Developer Mode. Members receive the combined permissions of every matching role.</p></div><div class="role-rule-list">' + data.roleRules.map(rule => `<article><div><small>Role ID</small><strong>${escapeHtml(rule.roleId)}</strong></div><div class="permission-chips">${rule.permissions.map(permission => `<span>${escapeHtml(permission)}</span>`).join('')}</div><button class="text-link" data-edit-role="${rule.id}">Edit</button><button class="icon-button danger" data-delete-role="${rule.id}">Delete</button></article>`).join('') + '</div>';
    root.querySelector('[data-action]').onclick = () => openRoleEditor(null, data); root.querySelectorAll('[data-edit-role]').forEach(button => button.onclick = () => openRoleEditor(data.roleRules.find(item => item.id === button.dataset.editRole), data)); root.querySelectorAll('[data-delete-role]').forEach(button => button.onclick = () => deleteItem('roleRules', button.dataset.deleteRole, data));
  }

  function openRoleEditor(existing, data) {
    const dialog = document.getElementById('admin-dialog'); const body = document.getElementById('admin-dialog-body'); const rule = existing || { id: uid(), roleId: '', permissions: [] };
    body.innerHTML = `${adminHeading(existing ? 'EDIT ROLE' : 'ADD ROLE')}<form id="role-editor"><label class="portal-field"><span>Discord role ID</span><input name="roleId" inputmode="numeric" pattern="[0-9]+" value="${escapeHtml(rule.roleId)}" required /></label><fieldset class="permission-picker"><legend>Granted permissions</legend>${allPermissions.map(permission => `<label><input type="checkbox" name="permissions" value="${permission}" ${rule.permissions.includes(permission) ? 'checked' : ''} /><span><strong>${permission}</strong><small>${permissionDescription(permission)}</small></span></label>`).join('')}</fieldset><button class="button" type="submit">Save role</button></form>`;
    dialog.showModal(); body.querySelector('form').onsubmit = async event => { event.preventDefault(); const fd = new FormData(event.currentTarget); const value = { ...rule, roleId: fd.get('roleId'), permissions: fd.getAll('permissions') }; await saveItem('roleRules', value, data); dialog.close(); renderAdminTab('permissions'); };
  }

  function permissionDescription(permission) { return ({ 'panel.view': 'Open the Control Room', 'forms.manage': 'Create, edit and delete forms', 'submissions.view': 'Read form submissions', 'submissions.manage': 'Change submission status', 'departments.manage': 'Publish department pages', 'permissions.manage': 'Configure role access' })[permission]; }

  async function saveItem(collection, value, data) {
    if (config.apiBaseUrl) { await request(`/api/admin/${collection}/${encodeURIComponent(value.id)}`, { method: 'PUT', body: JSON.stringify(value) }); }
    else { const index = data[collection].findIndex(item => item.id === value.id); if (index >= 0) data[collection][index] = value; else data[collection].push(value); saveDemo(data); }
    toast('Changes saved.');
  }

  async function deleteItem(collection, id, data) {
    if (!confirm('Delete this item? This cannot be undone.')) return;
    if (config.apiBaseUrl) await request(`/api/admin/${collection}/${encodeURIComponent(id)}`, { method: 'DELETE' });
    else { data[collection] = data[collection].filter(item => item.id !== id); saveDemo(data); }
    toast('Item deleted.'); renderAdminTab(collection === 'roleRules' ? 'permissions' : collection);
  }

  function initDialogs() { document.querySelectorAll('dialog').forEach(dialog => { dialog.querySelector('.dialog-close')?.addEventListener('click', () => dialog.close()); dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); }); }); }

  document.addEventListener('DOMContentLoaded', async () => {
    initDialogs();
    if (await finishLogin()) return;
    await refreshSession();
    if (page === 'forms') initForms();
    if (page === 'departments') initDepartments();
    if (page === 'mod') initMod();
  });
})();
