(() => {
  'use strict';

  const config = window.VENTURE_CONFIG || {};
  const page = document.body.dataset.portalPage;
  const sessionKey = 'venture_session';
  const demoStoreKey = 'venture_demo_content_v2';
  const allPermissions = ['panel.view', 'forms.manage', 'submissions.view', 'submissions.manage', 'rules.manage', 'departments.manage', 'permissions.manage'];

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
      { id: 'lspd', slug: 'lspd', name: 'Los Santos Police Department', shortName: 'LSPD', summary: 'Protecting life, preserving peace and serving Los Santos with integrity.', accent: '#3f78d6', status: 'Recruitment open', updatedAt: '2026-08-21', content: '<h2>Mission statement</h2><p>Our mission is to protect life and property, preserve the peace and build trust through fair, professional policing.</p><h2>What we expect</h2><p>Officers demonstrate maturity, sound judgement and a commitment to character-led roleplay. Training gives every recruit the foundation to thrive.</p><h2>Specialist divisions</h2><p>Build a career across patrol, traffic enforcement, investigations and specialist operations.</p>', applyUrl: 'forms/' },
      { id: 'safr', slug: 'safr', name: 'San Andreas Fire & Rescue', shortName: 'SAFR', summary: 'Emergency medicine, rescue and fire response for every corner of San Andreas.', accent: '#db1240', status: 'Recruitment open', updatedAt: '2026-08-21', content: '<h2>Answer the call</h2><p>SAFR delivers professional medical and rescue roleplay, supporting the city at its most critical moments.</p><h2>Your career</h2><p>Train as an EMT, develop clinical skills and progress into specialist rescue and leadership paths.</p>', applyUrl: 'forms/' },
      { id: 'doj', slug: 'doj', name: 'Department of Justice', shortName: 'DOJ', summary: 'Creating courtroom stories and upholding a fair, living legal system.', accent: '#c5a35e', status: 'Coming soon', updatedAt: '2026-08-21', content: '<h2>Justice with consequence</h2><p>Attorneys and judges turn police investigations into long-form legal stories where every decision matters.</p>', applyUrl: '' },
    ],
    teams: [
      { id: 'dormin', name: 'Dormin', role: 'Founder', initials: 'D', bio: 'Founder and owner of Venture Roleplay.', imageUrl: '', order: 0 },
      { id: 'jambo', name: 'Jambo', role: 'Founder', initials: 'J', bio: 'Founder and owner of Venture Roleplay.', imageUrl: '', order: 1 },
      { id: 'itzxsonar', name: 'ItzxSonar', role: 'Lead Developer', initials: 'IS', bio: 'Building the systems, careers and details that make the city feel alive.', imageUrl: '', order: 2 },
      { id: 'scape', name: 'Scape', role: 'Developer', initials: 'S', bio: 'Building the systems, careers and details that make the city feel alive.', imageUrl: '', order: 3 },
    ],
    submissions: [],
    roleRules: [],
    auditLog: [],
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

  function permissions() { return getSession()?.permissions || []; }
  function has(permission) { return permissions().includes(permission); }
  function hasScoped(permission, resourceId) { return has(permission) || Boolean(resourceId && has(`${permission}:${resourceId}`)); }
  function hasAnyScope(permission) { return has(permission) || permissions().some(value => value.startsWith(`${permission}:`)); }
  function escapeHtml(value = '') { const el = document.createElement('div'); el.textContent = value; return el.innerHTML; }
  function slugify(value) { return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
  function safeHttpUrl(value) { try { const url = new URL(String(value || '').trim()); return ['http:', 'https:'].includes(url.protocol) ? url.href : ''; } catch { return ''; } }
  function uid() { return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`; }
  function toast(message) { const el = document.getElementById('toast'); if (!el) return; el.textContent = message; el.classList.add('toast--show'); clearTimeout(el._timer); el._timer = setTimeout(() => el.classList.remove('toast--show'), 3200); }
  function statusLabel(status = 'received') { return ({ received: 'New', 'in review': 'Under review', approved: 'Accepted', declined: 'Declined', closed: 'Closed' })[status] || status; }
  function friendlyPath(path = './') {
    const routes = { 'index.html': './', 'join.html': 'join/', 'rules.html': 'rules/', 'forms.html': 'forms/', 'profile.html': 'profile/', 'mod.html': 'mod/', 'department.html': 'departments/' };
    const match = Object.keys(routes).find(route => path === route || path.startsWith(`${route}?`) || path.startsWith(`${route}#`));
    return match ? routes[match] + path.slice(match.length) : path;
  }
  function siteUrl(path = './') { return new URL(friendlyPath(path), document.baseURI).href; }
  function normalizeRenderedLinks(root = document) { root.querySelectorAll('a[href]').forEach(link => { const value = link.getAttribute('href'); if (value) link.setAttribute('href', friendlyPath(value)); }); }

  async function beginLogin(returnPath = 'profile/') {
    if (window.VentureAuth?.beginLogin) { window.VentureAuth.beginLogin(returnPath); return; }
    if (config.apiBaseUrl) {
      location.href = `${config.apiBaseUrl.replace(/\/$/, '')}/auth/discord?return_to=${encodeURIComponent(siteUrl(returnPath))}`;
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
      try { saveSession(await request('/api/me')); location.href = siteUrl(sessionStorage.getItem('venture_login_return') || 'profile/'); } catch (error) { saveSession(null); toast(error.message); }
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
      const returnTo = sessionStorage.getItem('venture_login_return') || 'profile/';
      sessionStorage.removeItem('venture_login_return');
      location.href = siteUrl(returnTo);
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
    const maxLength = Number(field.maxLength || (field.type === 'textarea' ? 5000 : 300));
    const common = `name="${escapeHtml(field.id)}" id="field-${escapeHtml(field.id)}" ${field.required ? 'required' : ''} ${['text', 'textarea', 'url'].includes(field.type) ? `maxlength="${maxLength}"` : ''}`;
    let control;
    if (field.type === 'textarea') control = `<textarea ${common} placeholder="${escapeHtml(field.placeholder || '')}">${escapeHtml(value)}</textarea>`;
    else if (field.type === 'select') control = `<select ${common}><option value="">Choose one…</option>${(field.options || []).map(option => `<option ${option === value ? 'selected' : ''}>${escapeHtml(option)}</option>`).join('')}</select>`;
    else control = `<input ${common} type="${escapeHtml(field.type || 'text')}" value="${escapeHtml(value)}" placeholder="${escapeHtml(field.placeholder || '')}" />`;
    const condition = field.condition ? `data-condition-field="${escapeHtml(field.condition.field)}" data-condition-value="${escapeHtml(field.condition.value)}"` : '';
    return `<label class="portal-field form-question" ${condition}><span>${escapeHtml(field.label)}${field.required ? ' <b>*</b>' : ''}</span>${field.help ? `<small class="field-help">${escapeHtml(field.help)}</small>` : ''}${control}${['text', 'textarea', 'url'].includes(field.type) ? `<small class="character-count">${String(value).length} / ${maxLength}</small>` : ''}</label>`;
  }

  function isFormOpen(form) {
    const now = Date.now();
    return form.status === 'open' && (!form.opensAt || new Date(form.opensAt).getTime() <= now) && (!form.closesAt || new Date(form.closesAt).getTime() > now);
  }

  async function initForms() {
    const list = document.getElementById('suggestions-list');
    if (!list) return;
    list.innerHTML = '<div class="loading-state">Loading community suggestions…</div>';
    let data = await request('/api/forms').catch(error => { toast(error.message); return null; });
    const store = demoData();
    const forms = (data?.forms || store.forms).filter(isFormOpen);
    const suggestionForm = forms.find(form => form.id === 'suggestion' || /suggestion/i.test(form.title));
    const suggestions = data?.suggestions || store.submissions.filter(item => item.formId === 'suggestion');
    const query = document.getElementById('suggestion-query');
    const sort = document.getElementById('suggestion-sort');
    const filters = document.getElementById('suggestion-filters');
    const loadMore = document.getElementById('load-more-suggestions');
    let activeStatus = 'all';
    let visibleCount = 8;
    const renderSuggestions = () => {
      const term = query.value.trim().toLowerCase();
      const filtered = suggestions.filter(item => (activeStatus === 'all' || (item.status || 'received') === activeStatus) && (!term || Object.values(item.values || {}).some(value => String(value).toLowerCase().includes(term)) || String(item.user?.global_name || item.user?.username || '').toLowerCase().includes(term)));
      filtered.sort((a, b) => sort.value === 'popular' ? Number(b.votes || 0) - Number(a.votes || 0) : sort.value === 'oldest' ? new Date(a.createdAt) - new Date(b.createdAt) : new Date(b.createdAt) - new Date(a.createdAt));
      const visible = filtered.slice(0, visibleCount);
      document.getElementById('suggestion-count').textContent = `${filtered.length} ${filtered.length === 1 ? 'suggestion' : 'suggestions'}`;
      loadMore.hidden = visible.length >= filtered.length;
      list.innerHTML = visible.length ? visible.map(item => {
        const author = item.user?.global_name || item.user?.username || 'Venture member';
        const title = item.values?.summary || item.formTitle || 'Community suggestion';
        const body = item.values?.details || '';
        const category = item.values?.impact || 'Community';
        return `<button class="suggestion-post" type="button" data-suggestion="${escapeHtml(item.id)}"><div class="suggestion-post-body"><div class="suggestion-meta"><span>${escapeHtml(category)}</span><small>Posted by ${escapeHtml(author)} · ${new Date(item.createdAt).toLocaleDateString(getPreferences().language || 'en-GB')}</small></div><h2>${escapeHtml(title)}</h2><p>${escapeHtml(body.length > 280 ? `${body.slice(0, 280)}…` : body)}</p><div class="suggestion-footer"><span class="status-pill status-pill--${escapeHtml(item.status)}">${escapeHtml(statusLabel(item.status))}</span>${item.staffResponse ? '<span class="staff-replied">Staff replied</span>' : ''}</div></div><span class="suggestion-open">Read suggestion →</span></button>`;
      }).join('') : '<div class="empty-state suggestions-empty"><h3>No suggestions found</h3><p>Be the first to start a conversation.</p></div>';
    };
    query.addEventListener('input', () => { visibleCount = 8; renderSuggestions(); });
    sort.addEventListener('change', renderSuggestions);
    filters.onclick = event => { const button = event.target.closest('[data-status]'); if (!button) return; activeStatus = button.dataset.status; visibleCount = 8; filters.querySelectorAll('button').forEach(item => item.classList.toggle('active', item === button)); renderSuggestions(); };
    loadMore.onclick = () => { visibleCount += 8; renderSuggestions(); };
    list.onclick = event => { const post = event.target.closest('[data-suggestion]'); const suggestion = post && suggestions.find(item => item.id === post.dataset.suggestion); if (suggestion) openSuggestion(suggestion); };
    renderSuggestions();
    document.getElementById('create-suggestion').onclick = () => { if (!getSession()) beginLogin('forms/'); else if (suggestionForm) openSubmission(suggestionForm, store); else toast('The suggestion form is currently closed.'); };
    if (location.hash === '#login' && !getSession()) beginLogin();
    const requestedSuggestion = new URLSearchParams(location.search).get('suggestion');
    if (requestedSuggestion) { const suggestion = suggestions.find(item => item.id === requestedSuggestion); if (suggestion) openSuggestion(suggestion, false); }
  }

  function openSuggestion(item, updateUrl = true) {
    const dialog = document.getElementById('form-dialog'); const body = document.getElementById('form-dialog-body');
    const author = item.user?.global_name || item.user?.username || 'Venture member'; const title = item.values?.summary || 'Community suggestion';
    body.innerHTML = `<article class="suggestion-detail"><div class="suggestion-detail-head"><span class="status-pill status-pill--${escapeHtml(item.status)}">${escapeHtml(statusLabel(item.status))}</span><small>${new Date(item.createdAt).toLocaleDateString(getPreferences().language || 'en-GB')}</small></div><h2>${escapeHtml(title)}</h2><div class="suggestion-author">Posted by <strong>${escapeHtml(author)}</strong> · ${escapeHtml(item.values?.impact || 'Community')}</div><div class="suggestion-copy">${escapeHtml(item.values?.details || '').replaceAll('\n', '<br />')}</div>${item.staffResponse ? `<aside class="staff-response"><small>Official staff response</small><p>${escapeHtml(item.staffResponse)}</p></aside>` : ''}<button class="text-link" id="copy-suggestion-link" type="button">Copy link</button></article>`;
    if (updateUrl) { const url = new URL(location.href); url.searchParams.set('suggestion', item.id); history.pushState(null, '', url); }
    body.querySelector('#copy-suggestion-link').onclick = async () => { await navigator.clipboard.writeText(location.href).catch(() => {}); toast('Suggestion link copied.'); };
    dialog.onclose = () => { const url = new URL(location.href); url.searchParams.delete('suggestion'); history.replaceState(null, '', url); dialog.onclose = null; };
    if (!dialog.open) dialog.showModal();
  }

  function openSubmission(form, store, suppliedValues = null) {
    const dialog = document.getElementById('form-dialog');
    const body = document.getElementById('form-dialog-body');
    const session = getSession(); const draftKey = `venture_draft_${session?.user.id || 'guest'}_${form.id}`;
    let draft = suppliedValues;
    if (!draft) { try { draft = JSON.parse(localStorage.getItem(draftKey) || 'null'); } catch { draft = null; } }
    const hasDraftValues = draft && Object.values(draft).some(value => String(value).length);
    body.innerHTML = `<p class="eyebrow"><span></span> Secure submission</p><h2>${escapeHtml(form.title)}</h2><p class="dialog-lede">${escapeHtml(form.description)}</p>${hasDraftValues ? '<div class="draft-notice"><strong>Draft restored</strong><button type="button" id="discard-draft">Discard</button></div>' : ''}<form id="public-form">${form.fields.map(field => fieldMarkup(field, draft?.[field.id] || '')).join('')}<div class="form-actions"><small>Saved automatically in this browser</small><button class="button" type="submit">Review submission</button></div></form>`;
    if (!dialog.open) dialog.showModal();
    const publicForm = body.querySelector('form');
    const valuesFromForm = () => Object.fromEntries((form.fields || []).map(field => [field.id, publicForm.elements[field.id]?.value || '']));
    const updateConditions = () => body.querySelectorAll('[data-condition-field]').forEach(wrapper => { const source = publicForm.elements[wrapper.dataset.conditionField]; const visible = source?.value === wrapper.dataset.conditionValue; wrapper.hidden = !visible; wrapper.querySelectorAll('input,textarea,select').forEach(control => { control.disabled = !visible; if (control.dataset.wasRequired === 'true') control.required = visible; }); });
    body.querySelectorAll('.form-question [required]').forEach(control => control.dataset.wasRequired = 'true');
    publicForm.addEventListener('input', event => { const counter = event.target.closest('.form-question')?.querySelector('.character-count'); if (counter) counter.textContent = `${event.target.value.length} / ${event.target.maxLength}`; localStorage.setItem(draftKey, JSON.stringify(valuesFromForm())); updateConditions(); });
    publicForm.addEventListener('change', updateConditions); updateConditions();
    body.querySelector('#discard-draft')?.addEventListener('click', () => { localStorage.removeItem(draftKey); openSubmission(form, store, {}); });
    publicForm.addEventListener('submit', async event => {
      event.preventDefault();
      const values = valuesFromForm();
      body.innerHTML = `<p class="eyebrow"><span></span> Check before sending</p><h2>REVIEW SUBMISSION</h2><div class="answer-list">${form.fields.filter(field => !field.condition || values[field.condition.field] === field.condition.value).map(field => `<div><small>${escapeHtml(field.label)}</small><p>${escapeHtml(values[field.id] || 'Not provided')}</p></div>`).join('')}</div><label class="consent-row"><input type="checkbox" id="review-consent" /> <span>I confirm these details are accurate and ready to send.</span></label><div class="review-actions"><button class="button button--ghost" id="edit-submission" type="button">Go back</button><button class="button" id="confirm-submission" type="button" disabled>Send submission</button></div>`;
      body.querySelector('#review-consent').onchange = event => { body.querySelector('#confirm-submission').disabled = !event.target.checked; };
      body.querySelector('#edit-submission').onclick = () => openSubmission(form, store, values);
      body.querySelector('#confirm-submission').onclick = async () => {
      const payload = { formId: form.id, values };
      try {
        if (config.apiBaseUrl) await request('/api/submissions', { method: 'POST', body: JSON.stringify(payload) });
        else { const session = getSession(); store.submissions.unshift({ id: uid(), formId: form.id, formTitle: form.title, values, status: 'received', createdAt: new Date().toISOString(), userId: session?.user.id, user: session ? { id: session.user.id, username: session.user.username, global_name: session.user.global_name } : null }); saveDemo(store); }
        localStorage.removeItem(draftKey);
        body.innerHTML = `<div class="submission-success"><span>${icons.check}</span><p class="eyebrow"><span></span> Submission received</p><h2>THANK YOU.</h2><p>${escapeHtml(form.confirmationMessage || 'Your response has been sent to the Venture team. You can track its status from your profile.')}</p><button class="button" id="finish-submission">Done</button></div>`;
        body.querySelector('#finish-submission').onclick = () => { dialog.close(); page === 'profile' ? initProfile() : initForms(); };
      } catch (error) { toast(error.message); }
      };
    });
  }

  function getPreferences() {
    try { return JSON.parse(localStorage.getItem('venture_preferences') || '{}'); } catch { return {}; }
  }

  function profileName(session, preferences = getPreferences()) {
    return preferences.nameStyle === 'username' ? session.user.username : (session.user.global_name || session.user.username);
  }

  function draftCount(userId) { return Object.keys(localStorage).filter(key => key.startsWith(`venture_draft_${userId}_`)).length; }

  async function initProfile() {
    const root = document.getElementById('profile-root'); if (!root) return;
    const session = getSession();
    if (!session) {
      root.innerHTML = '<div class="profile-login"><span>VR</span><h1>MEMBER ACCESS</h1><p>Connect Discord to open your private forms, submissions and profile settings.</p><button class="button" id="profile-login">Login with Discord</button></div>';
      root.querySelector('button').onclick = () => beginLogin('profile/'); return;
    }
    root.innerHTML = '<div class="loading-state">Loading your member area…</div>';
    const response = await request('/api/forms').catch(error => { toast(error.message); return null; });
    const store = demoData();
    const forms = (response?.forms || store.forms).filter(isFormOpen);
    const submissions = response?.submissions || store.submissions.filter(item => !item.userId || item.userId === session.user.id);
    const preferences = getPreferences();
    const allowedTabs = ['overview', 'forms', 'submissions', 'settings'];
    const requestedTab = new URLSearchParams(location.search).get('tab');
    let activeTab = allowedTabs.includes(requestedTab) ? requestedTab : (allowedTabs.includes(preferences.defaultTab) ? preferences.defaultTab : 'overview');
    const avatar = session.user.avatar ? `https://cdn.discordapp.com/avatars/${session.user.id}/${session.user.avatar}.png?size=160` : 'logo.png';
    root.innerHTML = `<nav class="breadcrumbs" aria-label="Breadcrumb"><a href="index.html">Home</a><span>›</span><span>My profile</span></nav><section class="profile-header"><div class="profile-identity"><img src="${avatar}" alt="" /><div><p class="eyebrow"><span></span> Private member area</p><h1>${escapeHtml(profileName(session, preferences))}</h1><p>@${escapeHtml(session.user.username)}${session.guild?.name ? ` · ${escapeHtml(session.guild.name)}` : ''}</p></div></div><span class="profile-access-badge">${has('panel.view') ? 'Staff access' : 'Member'}</span></section><div class="profile-layout"><aside class="profile-tabs" aria-label="Profile sections"><button data-profile-tab="overview">Overview</button><button data-profile-tab="forms">Member forms</button><button data-profile-tab="submissions">My submissions</button><button data-profile-tab="settings">Settings</button></aside><section class="profile-content" id="profile-content"></section></div>`;
    const showTab = tab => {
      activeTab = tab;
      root.querySelectorAll('[data-profile-tab]').forEach(button => button.classList.toggle('active', button.dataset.profileTab === tab));
      renderProfileContent(tab, { forms, submissions, store, session, preferences });
      normalizeRenderedLinks(root);
      const url = new URL(location.href); if (tab === 'overview') url.searchParams.delete('tab'); else url.searchParams.set('tab', tab); history.replaceState(null, '', url);
    };
    root.querySelector('.profile-tabs').onclick = event => { const button = event.target.closest('[data-profile-tab]'); if (button) showTab(button.dataset.profileTab); };
    showTab(activeTab);
  }

  function renderProfileContent(tab, context) {
    const root = document.getElementById('profile-content');
    const { forms, submissions, store, session } = context;
    const privateForms = forms.filter(form => form.id !== 'suggestion' && !/suggestion/i.test(form.title));
    if (tab === 'overview') {
      const recent = submissions.slice(0, 3);
      root.innerHTML = `<div class="profile-section-heading"><p class="eyebrow"><span></span> Welcome back</p><h2>YOUR DASHBOARD</h2><p>Everything connected to your Venture account, kept in one private place.</p></div><div class="profile-metrics"><article><small>Available forms</small><strong>${privateForms.length}</strong></article><article><small>Submissions</small><strong>${submissions.length}</strong></article><article><small>Saved drafts</small><strong>${draftCount(session.user.id)}</strong></article><article><small>Access level</small><strong>${has('panel.view') ? 'STAFF' : 'MEMBER'}</strong></article></div><div class="profile-quick-links"><button data-go-tab="forms"><span>Start a private form</span><small>Appeals, reports and member requests</small></button><a href="forms.html"><span>Browse suggestions</span><small>See what the community is discussing</small></a>${has('panel.view') ? '<a href="mod.html"><span>Open Control Room</span><small>Manage site content and submissions</small></a>' : ''}</div><div class="profile-permissions"><h3>Website access</h3><p>${session.permissions?.length ? session.permissions.map(permission => `<span>${escapeHtml(permission)}</span>`).join('') : '<span>Standard member access</span>'}</p></div><div class="profile-recent"><div class="profile-subhead"><h3>Recent activity</h3><button class="text-link" data-go-tab="submissions">View all</button></div>${submissionRows(recent)}</div>`;
      root.querySelectorAll('[data-go-tab]').forEach(button => button.onclick = () => document.querySelector(`[data-profile-tab="${button.dataset.goTab}"]`).click());
    } else if (tab === 'forms') {
      root.innerHTML = `<div class="profile-section-heading member-forms-heading"><div><p class="eyebrow"><span></span> Confidential submissions</p><h2>MEMBER FORMS</h2><p>Appeals, reports and member requests are sent privately to the appropriate staff team.</p></div><div class="member-forms-count"><strong>${String(privateForms.length).padStart(2, '0')}</strong><span>Forms available</span></div></div><div class="member-form-grid">${privateForms.map((form, index) => { const hasDraft = localStorage.getItem(`venture_draft_${session.user.id}_${form.id}`); const questionCount = form.fields?.length || 0; return `<article class="member-form-card${hasDraft ? ' member-form-card--draft' : ''}"><header><span class="member-form-privacy"><i></i>Private</span><span class="member-form-number">${String(index + 1).padStart(2, '0')}</span></header><div class="member-form-card__body"><small>${questionCount} ${questionCount === 1 ? 'question' : 'questions'}${hasDraft ? ' · Draft saved' : ''}</small><h3>${escapeHtml(form.title)}</h3><p>${escapeHtml(form.description)}</p></div><footer><span>${hasDraft ? 'Your progress is saved on this device' : 'Visible only to authorised staff'}</span><button class="button" data-member-form="${escapeHtml(form.id)}">${hasDraft ? 'Continue draft' : 'Start form'} <b>→</b></button></footer></article>`; }).join('') || '<div class="empty-state"><h3>No member forms are open</h3><p>Check back later.</p></div>'}</div>`;
      root.querySelectorAll('[data-member-form]').forEach(button => button.onclick = () => { const form = privateForms.find(item => item.id === button.dataset.memberForm); if (form) openSubmission(form, store); });
    } else if (tab === 'submissions') {
      root.innerHTML = `<div class="profile-section-heading"><p class="eyebrow"><span></span> Private activity</p><h2>MY SUBMISSIONS</h2><p>Track the current status of suggestions, appeals and reports you have sent.</p></div><div class="profile-submission-list">${submissionRows(submissions, true)}</div>`;
      root.querySelectorAll('[data-submission]').forEach(button => button.onclick = () => openMemberSubmission(submissions.find(item => item.id === button.dataset.submission)));
    } else if (tab === 'settings') {
      renderProfileSettings(root, session);
    }
  }

  function submissionRows(submissions, interactive = false) {
    if (!submissions.length) return '<div class="empty-state profile-empty"><h3>No activity yet</h3><p>Your submitted forms will appear here.</p></div>';
    const locale = getPreferences().language || 'en-GB';
    return submissions.map(item => `<${interactive ? 'button' : 'article'} class="profile-submission-row" ${interactive ? `data-submission="${escapeHtml(item.id)}"` : ''}><div><small>${new Date(item.createdAt).toLocaleDateString(locale)}</small><strong>${escapeHtml(item.formTitle || item.formId)}</strong></div><span class="status-pill status-pill--${escapeHtml(item.status)}">${escapeHtml(item.status)}</span></${interactive ? 'button' : 'article'}>`).join('');
  }

  function openMemberSubmission(item) {
    if (!item) return; const dialog = document.getElementById('form-dialog'); const body = document.getElementById('form-dialog-body');
    body.innerHTML = `<p class="eyebrow"><span></span> Submitted ${new Date(item.createdAt).toLocaleDateString(getPreferences().language || 'en-GB')}</p><h2>${escapeHtml(item.formTitle || item.formId)}</h2><div class="answer-list">${Object.entries(item.values || {}).map(([key, value]) => `<div><small>${escapeHtml(key.replaceAll('_', ' '))}</small><p>${escapeHtml(value)}</p></div>`).join('')}</div><span class="status-pill status-pill--${escapeHtml(item.status)}">${escapeHtml(item.status)}</span>`;
    dialog.showModal();
  }

  function renderProfileSettings(root, session) {
    const preferences = { language: 'en-GB', nameStyle: 'display', defaultTab: 'overview', reducedMotion: false, compactLayout: false, submissionUpdates: true, ruleChanges: false, ...getPreferences() };
    root.innerHTML = `<div class="profile-section-heading"><p class="eyebrow"><span></span> Personal preferences</p><h2>SETTINGS</h2><p>These choices are private and apply whenever you use this browser.</p></div><form class="profile-settings" id="profile-settings"><section><div><h3>Profile</h3><p>Choose how your account appears to you on the site.</p></div><div class="settings-fields"><label class="portal-field"><span>Name shown</span><select name="nameStyle"><option value="display">Discord display name</option><option value="username">Discord username</option></select></label><label class="portal-field"><span>Default profile tab</span><select name="defaultTab"><option value="overview">Overview</option><option value="forms">Member forms</option><option value="submissions">My submissions</option></select></label></div></section><section><div><h3>Language & region</h3><p>Controls date formatting and the browser language declaration.</p></div><div class="settings-fields"><label class="portal-field"><span>Language</span><select name="language"><option value="en-GB">English (United Kingdom)</option><option value="en-US">English (United States)</option></select></label></div></section><section><div><h3>Accessibility</h3><p>Adjust motion and information density.</p></div><div class="settings-toggles"><label><input type="checkbox" name="reducedMotion" /><span><strong>Reduce motion</strong><small>Minimise animations and transitions</small></span></label><label><input type="checkbox" name="compactLayout" /><span><strong>Compact layout</strong><small>Show more content with tighter spacing</small></span></label></div></section><section><div><h3>Notifications</h3><p>Save which updates you want once shared notifications are connected.</p></div><div class="settings-toggles"><label><input type="checkbox" name="submissionUpdates" /><span><strong>Submission updates</strong><small>Status changes to appeals, reports and suggestions</small></span></label><label><input type="checkbox" name="ruleChanges" /><span><strong>Rule changes</strong><small>Important community rule revisions</small></span></label></div></section><section><div><h3>Discord connection</h3><p>Your identity and access come from Discord.</p></div><div class="connection-card"><span><small>User ID</small><strong>${escapeHtml(session.user.id)}</strong></span><span><small>Server</small><strong>${escapeHtml(session.guild?.name || 'Not detected')}</strong></span><span><small>Roles detected</small><strong>${session.roles?.length || 0}</strong></span><span><small>Website permissions</small><strong>${escapeHtml((session.permissions || []).join(', ') || 'Standard member')}</strong></span><a class="text-link" href="#" id="settings-refresh">Refresh Discord access</a></div></section><section><div><h3>Privacy & local data</h3><p>GitHub Pages stores drafts and preferences in this browser.</p></div><div class="privacy-actions"><button type="button" class="button button--ghost" id="clear-drafts">Clear saved drafts</button><button type="button" class="icon-button danger" id="clear-site-data">Clear all site data</button></div></section><button class="button" type="submit">Save settings</button></form>`;
    const form = root.querySelector('form'); form.elements.nameStyle.value = preferences.nameStyle; form.elements.defaultTab.value = preferences.defaultTab; form.elements.language.value = preferences.language; form.elements.reducedMotion.checked = preferences.reducedMotion; form.elements.compactLayout.checked = preferences.compactLayout; form.elements.submissionUpdates.checked = preferences.submissionUpdates; form.elements.ruleChanges.checked = preferences.ruleChanges;
    form.onsubmit = event => { event.preventDefault(); const fd = new FormData(form); const value = { nameStyle: fd.get('nameStyle'), defaultTab: fd.get('defaultTab'), language: fd.get('language'), reducedMotion: form.elements.reducedMotion.checked, compactLayout: form.elements.compactLayout.checked, submissionUpdates: form.elements.submissionUpdates.checked, ruleChanges: form.elements.ruleChanges.checked }; localStorage.setItem('venture_preferences', JSON.stringify(value)); document.documentElement.lang = value.language; document.body.classList.toggle('pref-reduced-motion', value.reducedMotion); document.body.classList.toggle('pref-compact', value.compactLayout); toast('Settings saved.'); initProfile(); window.dispatchEvent(new Event('venture:session')); };
    root.querySelector('#settings-refresh').onclick = event => { event.preventDefault(); saveSession(null); beginLogin('profile.html?tab=settings'); };
    root.querySelector('#clear-drafts').onclick = () => { if (!confirm('Clear all locally saved form drafts?')) return; Object.keys(localStorage).filter(key => key.startsWith(`venture_draft_${session.user.id}_`)).forEach(key => localStorage.removeItem(key)); toast('Saved drafts cleared.'); };
    root.querySelector('#clear-site-data').onclick = () => { if (!confirm('Clear your login, preferences, drafts and locally stored Venture data from this browser?')) return; Object.keys(localStorage).filter(key => key.startsWith('venture_')).forEach(key => localStorage.removeItem(key)); location.href = siteUrl('./'); };
  }

  async function initDepartments() {
    const root = document.getElementById('department-view'); if (!root) return;
    const response = await request('/api/departments').catch(error => { toast(error.message); return null; });
    const departments = (response?.departments || demoData().departments).filter(item => item.publishState !== 'draft');
    const slug = new URLSearchParams(location.search).get('department');
    if (slug) {
      const department = departments.find(item => item.slug === slug);
      if (!department) { root.innerHTML = '<section class="portal-section section-shell empty-state"><h2>Department not found</h2><a class="text-link" href="./">Back home</a></section>'; return; }
      document.title = `${department.shortName} — Venture Roleplay`;
      root.innerHTML = `<article class="department-page"><header class="department-banner" style="--department-accent:${escapeHtml(department.accent)}"><div class="section-shell"><a class="back-link" href="index.html">← Back home</a><span class="department-monogram">${escapeHtml(department.shortName)}</span><p class="eyebrow"><span></span>${escapeHtml(department.status)}</p><h1>${escapeHtml(department.name)}</h1><p>${escapeHtml(department.summary)}</p></div></header><div class="department-layout section-shell"><aside><small>Last updated</small><strong>${new Date(department.updatedAt).toLocaleDateString()}</strong>${department.applyUrl ? `<a class="button" href="${escapeHtml(department.applyUrl)}">Apply today</a>` : ''}</aside><div class="rich-content">${sanitizeHtml(department.content)}</div></div></article>`;
    } else {
      root.innerHTML = `<section class="portal-section section-shell"><div class="portal-section-head"><div><span class="section-index">04 / DEPARTMENTS</span><h2>CHOOSE YOUR PATH</h2></div></div><div class="department-grid">${departments.map(department => `<a class="department-card" style="--department-accent:${escapeHtml(department.accent)}" href="?department=${encodeURIComponent(department.slug)}"><div><span>${escapeHtml(department.shortName)}</span><small>${escapeHtml(department.status)}</small></div><h3>${escapeHtml(department.name)}</h3><p>${escapeHtml(department.summary)}</p><b>Explore department →</b></a>`).join('')}</div></section>`;
    }
    normalizeRenderedLinks(root);
  }

  function replaceTag(element, tagName) {
    const replacement = document.createElement(tagName);
    [...element.attributes].forEach(attribute => replacement.setAttribute(attribute.name, attribute.value));
    while (element.firstChild) replacement.append(element.firstChild);
    element.replaceWith(replacement);
    return replacement;
  }

  function normalizeRichMarkup(root, { stripStyles = false } = {}) {
    root.querySelectorAll('font').forEach(element => {
      const span = replaceTag(element, 'span');
      const sizeMap = { 1: '11px', 2: '13px', 3: '15px', 4: '18px', 5: '22px', 6: '28px', 7: '36px' };
      if (!stripStyles && element.getAttribute('color')) span.style.color = element.getAttribute('color');
      if (!stripStyles && sizeMap[element.getAttribute('size')]) span.style.fontSize = sizeMap[element.getAttribute('size')];
      span.removeAttribute('color'); span.removeAttribute('size'); span.removeAttribute('face');
    });
    root.querySelectorAll('h1').forEach(element => replaceTag(element, 'h2'));
    root.querySelectorAll('h4,h5,h6').forEach(element => replaceTag(element, 'h3'));
    root.querySelectorAll('div').forEach(element => {
      if (element.closest('li,blockquote') || element.querySelector('p,h2,h3,ul,ol,blockquote,hr')) { element.replaceWith(...element.childNodes); return; }
      replaceTag(element, 'p');
    });
    root.querySelectorAll('h2,h3,p').forEach(block => {
      const children = [...block.childNodes];
      if (!children.some(child => child.nodeType === Node.ELEMENT_NODE && /^(P|H2|H3|UL|OL|BLOCKQUOTE|HR)$/.test(child.tagName))) return;
      const fragment = document.createDocumentFragment(); let current = block.cloneNode(false);
      const appendCurrent = () => { if (current.textContent.trim() || current.querySelector('br')) fragment.append(current); current = block.cloneNode(false); };
      children.forEach(child => {
        if (child.nodeType === Node.ELEMENT_NODE && /^(P|H2|H3|UL|OL|BLOCKQUOTE|HR)$/.test(child.tagName)) { appendCurrent(); fragment.append(child); }
        else current.append(child);
      });
      appendCurrent(); block.replaceWith(fragment);
    });
    root.querySelectorAll('h2,h3').forEach(heading => {
      if (heading.textContent.trim().length > 140 || heading.querySelectorAll('br').length > 1) replaceTag(heading, 'p');
    });
    [...root.childNodes].forEach(node => {
      if (node.nodeType !== Node.TEXT_NODE || !node.textContent.trim()) return;
      const paragraph = document.createElement('p'); paragraph.textContent = node.textContent; node.replaceWith(paragraph);
    });
    root.querySelectorAll('p,h2,h3,li,blockquote').forEach(element => { if (!element.textContent.trim() && !element.querySelector('br')) element.remove(); });
  }

  function sanitizeHtml(html = '', options = {}) {
    const template = document.createElement('template'); template.innerHTML = html;
    template.content.querySelectorAll('script,style,iframe,object,embed,form,input,button,link,meta,svg,canvas').forEach(element => element.remove());
    normalizeRichMarkup(template.content, options);
    const allowedTags = new Set(['P', 'H2', 'H3', 'UL', 'OL', 'LI', 'STRONG', 'B', 'EM', 'I', 'U', 'S', 'SPAN', 'BR', 'HR', 'BLOCKQUOTE', 'A']);
    template.content.querySelectorAll('*').forEach(element => {
      if (!allowedTags.has(element.tagName)) { element.replaceWith(...element.childNodes); return; }
      const originalHref = element.getAttribute('href') || '';
      const safeStyles = [];
      if (!options.stripStyles) {
        const safeColour = value => /^(#[0-9a-f]{3,8}|rgba?\([\d\s,.%]+\)|[a-z]{3,20})$/i.test(value || '');
        if (safeColour(element.style.color)) safeStyles.push(`color:${element.style.color}`);
        if (safeColour(element.style.backgroundColor)) safeStyles.push(`background-color:${element.style.backgroundColor}`);
        if (/^(11|13|15|18|22|28|36)px$/.test(element.style.fontSize)) safeStyles.push(`font-size:${element.style.fontSize}`);
        if (/^(left|center|right|justify)$/.test(element.style.textAlign)) safeStyles.push(`text-align:${element.style.textAlign}`);
      }
      [...element.attributes].forEach(attribute => element.removeAttribute(attribute.name));
      if (safeStyles.length) element.setAttribute('style', safeStyles.join(';'));
      if (element.tagName === 'A') {
        try { const url = new URL(originalHref, location.href); if (['http:', 'https:', 'mailto:'].includes(url.protocol)) { element.setAttribute('href', originalHref); element.setAttribute('rel', 'noreferrer'); } }
        catch { /* Invalid links are rendered as plain text. */ }
        if (!element.hasAttribute('href')) element.replaceWith(...element.childNodes);
      }
    });
    return template.innerHTML;
  }

  function requirePanel() {
    const session = getSession();
    if (session && has('panel.view')) return true;
    const content = document.getElementById('admin-content');
    if (content) content.innerHTML = `<div class="locked-panel"><span>VR</span><h2>ACCESS REQUIRED</h2><p>${session ? 'Your Discord roles do not grant Control Room access.' : 'Log in with Discord to verify your staff roles.'}</p><button class="button" id="locked-login">${session ? 'Return to site' : 'Login with Discord'}</button></div>`;
    document.getElementById('admin-tabs')?.setAttribute('hidden', '');
    document.getElementById('locked-login')?.addEventListener('click', () => session ? location.href = siteUrl('./') : beginLogin());
    return false;
  }

  async function initMod() {
    if (!requirePanel()) return;
    const session = getSession();
    document.getElementById('mod-user-label').textContent = `Signed in as ${session.user.global_name || session.user.username}`;
    document.querySelectorAll('[data-permission]').forEach(button => {
      const allowed = button.dataset.permission.split(',').some(permission => hasAnyScope(permission.trim()));
      if (!allowed) button.hidden = true;
    });
    document.getElementById('admin-tabs').addEventListener('click', event => { const button = event.target.closest('button[data-tab]'); if (!button) return; document.querySelectorAll('.admin-tabs button').forEach(item => item.classList.remove('active')); button.classList.add('active'); renderAdminTab(button.dataset.tab); });
    renderAdminTab('overview');
  }

  async function adminData() {
    const response = await request('/api/admin').catch(error => { toast(error.message); return null; });
    const data = response || demoData();
    data.teams ||= structuredClone(seed.teams);
    data.teams.sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0) || String(a.name || '').localeCompare(String(b.name || '')));
    data.auditLog ||= (() => { try { return JSON.parse(localStorage.getItem('venture_audit_log') || '[]'); } catch { return []; } })();
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
      const visibleForms = data.forms.filter(form => hasScoped('forms.manage', form.id) || hasScoped('submissions.view', form.id) || hasScoped('submissions.manage', form.id));
      const visibleSubmissions = data.submissions.filter(item => hasScoped('submissions.view', item.formId) || hasScoped('submissions.manage', item.formId));
      const visibleDepartments = data.departments.filter(item => hasScoped('departments.manage', item.id));
      root.innerHTML = `<div class="admin-heading"><p class="eyebrow"><span></span> At a glance</p><h2>OVERVIEW</h2></div><div class="metric-grid"><article><small>Accessible forms</small><strong>${visibleForms.length}</strong></article><article><small>Accessible submissions</small><strong>${visibleSubmissions.length}</strong></article><article><small>Accessible departments</small><strong>${visibleDepartments.length}</strong></article></div><div class="admin-note"><strong>Role-backed access</strong><p>Your Discord roles can grant site-wide access or access to individual forms and departments. The production API checks the permission again on every change.</p></div>`;
    } else if (tab === 'forms') renderFormsAdmin(root, data);
    else if (tab === 'submissions') renderSubmissionsAdmin(root, data);
    else if (tab === 'rules') renderRulesAdmin(root, data);
    else if (tab === 'departments') renderDepartmentsAdmin(root, data);
    else if (tab === 'teams') renderTeamsAdmin(root, data);
    else if (tab === 'permissions') renderPermissionsAdmin(root, data);
    else if (tab === 'audit') renderAuditAdmin(root, data);
    normalizeRenderedLinks(root);
  }

  function adminHeading(title, actionLabel, action) {
    return `<div class="admin-heading admin-heading--row"><div><p class="eyebrow"><span></span> Content manager</p><h2>${title}</h2></div>${actionLabel ? `<button class="button" data-action="${action}">${actionLabel}</button>` : ''}</div>`;
  }

  function renderFormsAdmin(root, data) {
    const canCreate = has('forms.manage');
    const visibleForms = data.forms.filter(form => hasScoped('forms.manage', form.id));
    root.innerHTML = adminHeading('FORMS', canCreate ? 'Create form' : '', 'new-form') + `<div class="admin-list">${visibleForms.map((form, index) => `<article><div><span class="status-pill">${escapeHtml(isFormOpen(form) ? 'open' : form.status)}</span><h3>${escapeHtml(form.title)}</h3><p>${form.fields.length} fields · ${escapeHtml(form.description)}${form.opensAt || form.closesAt ? ' · Scheduled' : ''}</p></div><div class="admin-row-actions">${canCreate ? `<button class="icon-button" data-move-form="${form.id}" data-direction="-1" ${index === 0 ? 'disabled' : ''}>↑</button><button class="icon-button" data-move-form="${form.id}" data-direction="1" ${index === visibleForms.length - 1 ? 'disabled' : ''}>↓</button><button class="text-link" data-duplicate-form="${form.id}">Duplicate</button>` : ''}<button class="text-link" data-edit-form="${form.id}">Edit</button><button class="icon-button danger" data-delete-form="${form.id}">Delete</button></div></article>`).join('') || '<div class="empty-state"><h3>No forms assigned</h3><p>Ask an administrator to grant this role access to a form.</p></div>'}</div>`;
    root.querySelector('[data-action]')?.addEventListener('click', () => openFormEditor(null, data));
    root.querySelectorAll('[data-edit-form]').forEach(button => button.addEventListener('click', () => openFormEditor(data.forms.find(item => item.id === button.dataset.editForm), data)));
    root.querySelectorAll('[data-duplicate-form]').forEach(button => button.onclick = async () => { const source = data.forms.find(item => item.id === button.dataset.duplicateForm); const copy = structuredClone(source); copy.id = `${source.id}-copy-${Date.now()}`; copy.title = `${source.title} copy`; copy.status = 'draft'; await saveItem('forms', copy, data, 'Duplicated form as draft'); renderAdminTab('forms'); });
    root.querySelectorAll('[data-move-form]').forEach(button => button.onclick = async () => { const index = data.forms.findIndex(item => item.id === button.dataset.moveForm); const target = index + Number(button.dataset.direction); [data.forms[index], data.forms[target]] = [data.forms[target], data.forms[index]]; saveDemo(data); recordAudit('Reordered forms'); renderAdminTab('forms'); });
    root.querySelectorAll('[data-delete-form]').forEach(button => button.addEventListener('click', () => deleteItem('forms', button.dataset.deleteForm, data)));
  }

  function openFormEditor(existing, data) {
    const dialog = document.getElementById('admin-dialog'); const body = document.getElementById('admin-dialog-body');
    const form = existing || { id: '', title: '', description: '', status: 'draft', fields: [], confirmationMessage: '' };
    const localDateTime = value => value ? new Date(value).toISOString().slice(0, 16) : '';
    body.innerHTML = `<div class="admin-heading"><p class="eyebrow"><span></span> Form builder</p><h2>${existing ? 'EDIT' : 'CREATE'} FORM</h2></div><form id="form-builder"><div class="field-row"><label class="portal-field"><span>Title</span><input name="title" value="${escapeHtml(form.title)}" required /></label><label class="portal-field"><span>Status</span><select name="status"><option value="open" ${form.status === 'open' ? 'selected' : ''}>Open</option><option value="closed" ${form.status === 'closed' ? 'selected' : ''}>Closed</option></select></label></div><label class="portal-field"><span>Description</span><textarea name="description" required>${escapeHtml(form.description)}</textarea></label><label class="portal-field"><span>Confirmation message</span><textarea name="confirmationMessage" placeholder="Shown after a successful submission">${escapeHtml(form.confirmationMessage || '')}</textarea></label><div class="field-row"><label class="portal-field"><span>Open from (optional)</span><input name="opensAt" type="datetime-local" value="${localDateTime(form.opensAt)}" /></label><label class="portal-field"><span>Close at (optional)</span><input name="closesAt" type="datetime-local" value="${localDateTime(form.closesAt)}" /></label></div><div class="builder-fields"><div class="builder-fields-head"><strong>Questions</strong><button type="button" class="text-link" id="add-field">+ Add question</button></div><div id="builder-field-list"></div></div><button class="button" type="submit">Save form</button></form>`;
    const statusSelect = body.querySelector('[name="status"]');
    statusSelect.insertAdjacentHTML('afterbegin', '<option value="draft">Draft — staff only</option>');
    statusSelect.value = form.status || 'draft';
    statusSelect.closest('label').insertAdjacentHTML('beforeend', '<small class="field-help">Draft forms remain editable in the Control Room and cannot receive submissions.</small>');
    const list = body.querySelector('#builder-field-list');
    const addRow = (field = {}) => { const row = document.createElement('div'); row.className = 'builder-field builder-field--advanced'; row.innerHTML = `<div class="builder-field-main"><input class="builder-label" aria-label="Question label" placeholder="Question label" value="${escapeHtml(field.label || '')}" required /><select class="builder-type" aria-label="Question type"><option value="text">Short answer</option><option value="textarea">Long answer</option><option value="select">Dropdown choices</option><option value="date">Date</option><option value="url">URL</option></select><label><input class="builder-required" type="checkbox" ${field.required ? 'checked' : ''} /> Required</label><button type="button" class="builder-remove" aria-label="Remove">×</button></div><div class="builder-field-options"><input class="builder-options" placeholder="Dropdown choices, separated by commas" value="${escapeHtml((field.options || []).join(', '))}" /><input class="builder-placeholder" placeholder="Placeholder text" value="${escapeHtml(field.placeholder || '')}" /><input class="builder-help" placeholder="Help text" value="${escapeHtml(field.help || '')}" /><input class="builder-max" type="number" min="1" max="10000" placeholder="Character limit" value="${escapeHtml(field.maxLength || '')}" /><input class="builder-condition-field" placeholder="Show when field ID…" value="${escapeHtml(field.condition?.field || '')}" /><input class="builder-condition-value" placeholder="…equals this value" value="${escapeHtml(field.condition?.value || '')}" /></div>`; const type = row.querySelector('.builder-type'); const options = row.querySelector('.builder-options'); type.value = field.type || 'text'; const toggleOptions = () => { options.hidden = type.value !== 'select'; }; type.onchange = toggleOptions; toggleOptions(); row.querySelector('.builder-remove').onclick = () => row.remove(); list.append(row); };
    form.fields.forEach(addRow); body.querySelector('#add-field').onclick = () => addRow(); dialog.showModal();
    body.querySelector('form').onsubmit = async event => { event.preventDefault(); const fd = new FormData(event.currentTarget); const fields = [...list.children].map((row, index) => { const type = row.querySelector('.builder-type').value; const conditionField = row.querySelector('.builder-condition-field').value.trim(); const conditionValue = row.querySelector('.builder-condition-value').value.trim(); const field = { id: slugify(row.querySelector('.builder-label').value) || `field-${index + 1}`, label: row.querySelector('.builder-label').value, type, required: row.querySelector('.builder-required').checked, placeholder: row.querySelector('.builder-placeholder').value.trim(), help: row.querySelector('.builder-help').value.trim(), maxLength: Number(row.querySelector('.builder-max').value) || undefined }; if (type === 'select') field.options = row.querySelector('.builder-options').value.split(',').map(value => value.trim()).filter(Boolean); if (conditionField && conditionValue) field.condition = { field: conditionField, value: conditionValue }; return field; }); const value = { ...form, id: form.id || slugify(fd.get('title')) || uid(), title: fd.get('title'), description: fd.get('description'), confirmationMessage: fd.get('confirmationMessage'), status: fd.get('status'), opensAt: fd.get('opensAt') ? new Date(fd.get('opensAt')).toISOString() : '', closesAt: fd.get('closesAt') ? new Date(fd.get('closesAt')).toISOString() : '', fields }; await saveItem('forms', value, data); dialog.close(); renderAdminTab('forms'); };
  }

  function renderSubmissionsAdmin(root, data) {
    root.innerHTML = adminHeading('SUBMISSIONS') + `<div class="admin-filterbar"><label class="suggestion-search"><span class="icon" data-icon="search"></span><input id="submission-search" placeholder="Search forms, members or responses…" /></label><select id="submission-filter"><option value="all">All statuses</option><option value="received">New</option><option value="in review">Under review</option><option value="approved">Accepted</option><option value="declined">Declined</option><option value="closed">Closed</option></select></div><div class="admin-list" id="submission-admin-list"></div>`;
    const list = root.querySelector('#submission-admin-list'); const search = root.querySelector('#submission-search'); const filter = root.querySelector('#submission-filter');
    const renderList = () => { const term = search.value.trim().toLowerCase(); const visible = data.submissions.filter(item => (hasScoped('submissions.view', item.formId) || hasScoped('submissions.manage', item.formId)) && (filter.value === 'all' || item.status === filter.value) && (!term || JSON.stringify(item).toLowerCase().includes(term))); list.innerHTML = visible.map(item => `<article><div><span class="status-pill status-pill--${escapeHtml(item.status)}">${escapeHtml(statusLabel(item.status))}</span><h3>${escapeHtml(item.formTitle || item.formId)}</h3><p>${escapeHtml(item.user?.global_name || item.user?.username || 'Unknown member')} · ${new Date(item.createdAt).toLocaleString()}${item.assignedTo ? ` · Assigned to ${escapeHtml(item.assignedTo)}` : ''}</p></div><button class="text-link" data-view-submission="${item.id}">${hasScoped('submissions.manage', item.formId) ? 'Review' : 'View'}</button></article>`).join('') || '<div class="empty-state"><h3>No matching submissions</h3></div>'; list.querySelectorAll('[data-view-submission]').forEach(button => button.onclick = () => openSubmissionReview(data.submissions.find(item => item.id === button.dataset.viewSubmission), data)); };
    search.oninput = renderList; filter.onchange = renderList; renderList(); initIcons();
  }

  function renderRulesAdmin(root, data) {
    const ruleData = data.rules;
    root.innerHTML = adminHeading('RULES', 'Edit introduction', 'edit-rule-intro') + `<div class="admin-preview-link"><a class="text-link" href="rules.html" target="_blank">Preview published rules →</a><span>Last changed ${ruleData.lastUpdated ? new Date(ruleData.lastUpdated).toLocaleString() : 'not recorded'}</span></div><div class="rule-admin-categories">${ruleData.categories.map(category => `<section><div class="rule-admin-category-head"><div><small>${escapeHtml(category.number)}</small><h3>${escapeHtml(category.title)}</h3></div><button class="text-link" data-add-rule="${escapeHtml(category.id)}">+ Add section</button></div><div class="admin-list">${category.sections.map(section => `<article><div><span class="status-pill">${escapeHtml(section.id)}</span><h3>${escapeHtml(section.title)}</h3><p>${section.rules.length} rule points${section.updatedAt ? ` · Updated ${new Date(section.updatedAt).toLocaleDateString()}` : ''}</p></div><div><button class="text-link" data-edit-rule="${escapeHtml(category.id)}:${escapeHtml(section.id)}">Edit</button><button class="icon-button danger" data-delete-rule="${escapeHtml(category.id)}:${escapeHtml(section.id)}">Delete</button></div></article>`).join('')}</div></section>`).join('')}</div>`;
    root.querySelector('[data-action]').onclick = () => openRuleIntroEditor(ruleData, data);
    root.querySelectorAll('[data-add-rule]').forEach(button => button.onclick = () => openRuleSectionEditor(ruleData.categories.find(category => category.id === button.dataset.addRule), null, ruleData, data));
    root.querySelectorAll('[data-edit-rule]').forEach(button => button.onclick = () => { const [categoryId, sectionId] = button.dataset.editRule.split(':'); const category = ruleData.categories.find(item => item.id === categoryId); openRuleSectionEditor(category, category.sections.find(item => item.id === sectionId), ruleData, data); });
    root.querySelectorAll('[data-delete-rule]').forEach(button => button.onclick = async () => { if (!confirm('Delete this rule section?')) return; const [categoryId, sectionId] = button.dataset.deleteRule.split(':'); const category = ruleData.categories.find(item => item.id === categoryId); category.sections = category.sections.filter(item => item.id !== sectionId); await persistRules(ruleData, data); renderAdminTab('rules'); });
  }

  function openRuleIntroEditor(ruleData, data) {
    const dialog = document.getElementById('admin-dialog'); const body = document.getElementById('admin-dialog-body');
    body.innerHTML = `${adminHeading('RULES INTRODUCTION')}<form id="rules-intro-editor"><label class="portal-field"><span>Revision note</span><input name="changeNote" value="${escapeHtml(ruleData.changeNote || '')}" placeholder="Briefly describe what changed" /></label><label class="portal-field"><span>Notice</span><textarea name="notice" required>${escapeHtml(ruleData.notice || '')}</textarea></label><label class="portal-field"><span>Introduction paragraphs — separate with a blank line</span><textarea name="introduction" class="tall-textarea" required>${escapeHtml((ruleData.introduction || []).join('\n\n'))}</textarea></label><label class="portal-field"><span>Golden rule title</span><input name="goldenTitle" value="${escapeHtml(ruleData.goldenRule?.title || '')}" required /></label><label class="portal-field"><span>Golden rule paragraphs — separate with a blank line</span><textarea name="goldenCopy" class="tall-textarea" required>${escapeHtml((ruleData.goldenRule?.paragraphs || []).join('\n\n'))}</textarea></label><button class="button" type="submit">Save rules</button></form>`;
    dialog.showModal(); body.querySelector('form').onsubmit = async event => { event.preventDefault(); const fd = new FormData(event.currentTarget); ruleData.changeNote = fd.get('changeNote').trim(); ruleData.notice = fd.get('notice').trim(); ruleData.introduction = fd.get('introduction').split(/\n\s*\n/).map(value => value.trim()).filter(Boolean); ruleData.goldenRule = { title: fd.get('goldenTitle').trim(), paragraphs: fd.get('goldenCopy').split(/\n\s*\n/).map(value => value.trim()).filter(Boolean) }; await persistRules(ruleData, data); dialog.close(); renderAdminTab('rules'); };
  }

  function openRuleSectionEditor(category, existing, ruleData, data) {
    const dialog = document.getElementById('admin-dialog'); const body = document.getElementById('admin-dialog-body'); const section = existing || { id: '', title: '', rules: [] };
    body.innerHTML = `${adminHeading(existing ? 'EDIT RULE SECTION' : 'ADD RULE SECTION')}<form id="rule-section-editor"><div class="field-row"><label class="portal-field"><span>Rule number</span><input name="id" value="${escapeHtml(section.id)}" placeholder="1.1" required /></label><label class="portal-field"><span>Title</span><input name="title" value="${escapeHtml(section.title)}" required /></label></div><label class="portal-field"><span>Rule points — one paragraph per line</span><textarea name="points" class="tall-textarea" required>${escapeHtml((section.rules || []).join('\n'))}</textarea></label><button class="button" type="submit">Save section</button></form>`;
    dialog.showModal(); body.querySelector('form').onsubmit = async event => { event.preventDefault(); const fd = new FormData(event.currentTarget); const value = { id: fd.get('id').trim(), title: fd.get('title').trim(), rules: fd.get('points').split('\n').map(point => point.trim()).filter(Boolean), updatedAt: new Date().toISOString() }; if (existing) Object.assign(existing, value); else category.sections.push(value); await persistRules(ruleData, data); dialog.close(); renderAdminTab('rules'); };
  }

  async function persistRules(ruleData, data) {
    ruleData.lastUpdated = new Date().toISOString();
    if (config.apiBaseUrl) await request('/api/admin/rules/site-rules', { method: 'PUT', body: JSON.stringify({ ...ruleData, id: 'site-rules' }) });
    else localStorage.setItem('venture_rules', JSON.stringify(ruleData));
    data.rules = ruleData; recordAudit('Updated community rules'); toast('Rules updated.');
  }

  function openSubmissionReview(item, data) {
    const dialog = document.getElementById('admin-dialog'); const body = document.getElementById('admin-dialog-body');
    const canManage = hasScoped('submissions.manage', item.formId);
    const disabled = canManage ? '' : ' disabled';
    body.innerHTML = `${adminHeading(canManage ? 'REVIEW' : 'VIEW SUBMISSION')}<div class="submission-review-meta"><span><small>Member</small><strong>${escapeHtml(item.user?.global_name || item.user?.username || item.userId || 'Unknown')}</strong></span><span><small>Submitted</small><strong>${new Date(item.createdAt).toLocaleString()}</strong></span></div><div class="answer-list">${Object.entries(item.values).map(([key, value]) => `<div><small>${escapeHtml(key.replaceAll('_', ' '))}</small><p>${escapeHtml(value)}</p></div>`).join('')}</div><div class="field-row"><label class="portal-field"><span>Status</span><select id="submission-status"${disabled}><option value="received">New</option><option value="in review">Under review</option><option value="approved">Accepted</option><option value="declined">Declined</option><option value="closed">Closed</option></select></label><label class="portal-field"><span>Assigned staff member</span><input id="submission-assignee" value="${escapeHtml(item.assignedTo || '')}" placeholder="Name or callsign"${disabled} /></label></div><label class="portal-field"><span>Private staff notes</span><textarea id="submission-notes" placeholder="Only staff can see these notes"${disabled}>${escapeHtml(item.staffNotes || '')}</textarea></label>${item.formId === 'suggestion' ? `<label class="portal-field"><span>Public staff response</span><textarea id="submission-response" placeholder="Shown publicly beneath this suggestion"${disabled}>${escapeHtml(item.staffResponse || '')}</textarea></label>` : ''}${canManage ? '<button class="button" id="save-submission">Save review</button>' : '<div class="admin-note"><strong>Read-only access</strong><p>Your role can view submissions for this form but cannot change them.</p></div>'}`;
    body.querySelector('#submission-status').value = item.status; dialog.showModal();
    body.querySelector('#save-submission')?.addEventListener('click', async () => { item.status = body.querySelector('#submission-status').value; item.assignedTo = body.querySelector('#submission-assignee').value.trim(); item.staffNotes = body.querySelector('#submission-notes').value.trim(); if (item.formId === 'suggestion') item.staffResponse = body.querySelector('#submission-response').value.trim(); await saveItem('submissions', item, data, 'Reviewed submission'); dialog.close(); renderAdminTab('submissions'); });
  }

  function renderDepartmentsAdmin(root, data) {
    const canCreate = has('departments.manage');
    const visibleDepartments = data.departments.filter(item => hasScoped('departments.manage', item.id));
    root.innerHTML = adminHeading('DEPARTMENTS', canCreate ? 'Create page' : '', 'new-department') + `<div class="admin-list">${visibleDepartments.map((item, index) => `<article><div><span class="status-pill">${item.publishState === 'draft' ? 'draft' : 'published'}</span><span class="department-dot" style="background:${escapeHtml(item.accent)}"></span><h3>${escapeHtml(item.name)}</h3><p>/${escapeHtml(item.slug)} · ${escapeHtml(item.status)}</p></div><div class="admin-row-actions">${canCreate ? `<button class="icon-button" data-move-department="${item.id}" data-direction="-1" ${index === 0 ? 'disabled' : ''}>↑</button><button class="icon-button" data-move-department="${item.id}" data-direction="1" ${index === visibleDepartments.length - 1 ? 'disabled' : ''}>↓</button>` : ''}${item.publishState === 'draft' ? '' : `<a class="text-link" href="department.html?department=${encodeURIComponent(item.slug)}">View</a>`}${canCreate ? `<button class="text-link" data-duplicate-department="${item.id}">Duplicate</button>` : ''}<button class="text-link" data-edit-department="${item.id}">Edit</button><button class="icon-button danger" data-delete-department="${item.id}">Delete</button></div></article>`).join('') || '<div class="empty-state"><h3>No departments assigned</h3><p>Ask an administrator to grant this role access to a department.</p></div>'}</div>`;
    root.querySelector('[data-action]')?.addEventListener('click', () => openDepartmentEditor(null, data));
    root.querySelectorAll('[data-edit-department]').forEach(button => button.onclick = () => openDepartmentEditor(data.departments.find(item => item.id === button.dataset.editDepartment), data));
    root.querySelectorAll('[data-duplicate-department]').forEach(button => button.onclick = async () => { const source = data.departments.find(item => item.id === button.dataset.duplicateDepartment); const copy = structuredClone(source); copy.id = uid(); copy.slug = `${source.slug}-copy`; copy.name = `${source.name} copy`; copy.publishState = 'draft'; await saveItem('departments', copy, data, 'Duplicated department as draft'); renderAdminTab('departments'); });
    root.querySelectorAll('[data-move-department]').forEach(button => button.onclick = () => { const index = data.departments.findIndex(item => item.id === button.dataset.moveDepartment); const target = index + Number(button.dataset.direction); [data.departments[index], data.departments[target]] = [data.departments[target], data.departments[index]]; saveDemo(data); recordAudit('Reordered departments'); renderAdminTab('departments'); });
    root.querySelectorAll('[data-delete-department]').forEach(button => button.onclick = () => deleteItem('departments', button.dataset.deleteDepartment, data));
  }

  function openDepartmentEditor(existing, data) {
    const dialog = document.getElementById('admin-dialog'); const body = document.getElementById('admin-dialog-body'); const item = existing || { id: '', name: '', shortName: '', slug: '', summary: '', accent: '#db1240', status: 'Recruitment open', publishState: 'draft', content: '<h2>About the department</h2><p>Start writing here…</p>', applyUrl: 'forms/' };
    body.innerHTML = `${adminHeading(existing ? 'EDIT PAGE' : 'CREATE PAGE')}<form id="department-editor"><div class="field-row"><label class="portal-field"><span>Department name</span><input name="name" value="${escapeHtml(item.name)}" required /></label><label class="portal-field"><span>Short name</span><input name="shortName" value="${escapeHtml(item.shortName)}" maxlength="8" required /></label></div><div class="field-row"><label class="portal-field"><span>URL slug</span><input name="slug" value="${escapeHtml(item.slug)}" required /></label><label class="portal-field"><span>Accent</span><input name="accent" type="color" value="${escapeHtml(item.accent)}" /></label></div><label class="portal-field"><span>Summary</span><textarea name="summary" required>${escapeHtml(item.summary)}</textarea></label><div class="field-row"><label class="portal-field"><span>Recruitment status</span><input name="status" value="${escapeHtml(item.status)}" /></label><label class="portal-field"><span>Application link</span><input name="applyUrl" value="${escapeHtml(item.applyUrl || '')}" placeholder="profile.html?tab=forms" /></label></div><div class="portal-field"><span>Page content</span><div class="editor-toolbar" role="toolbar" aria-label="Page content formatting"><div class="editor-toolbar-group"><select id="editor-format" aria-label="Block format" title="Block format"><option value="p">Paragraph</option><option value="h2">Large heading</option><option value="h3">Small heading</option><option value="blockquote">Quote</option></select><select id="editor-size" aria-label="Text size" title="Text size"><option value="">Text size</option><option value="2">Small</option><option value="3">Normal</option><option value="4">Large</option><option value="5">Extra large</option></select></div><div class="editor-toolbar-group"><button type="button" data-command="bold" title="Bold"><b>B</b></button><button type="button" data-command="italic" title="Italic"><i>I</i></button><button type="button" data-command="underline" title="Underline"><u>U</u></button><button type="button" data-command="strikeThrough" title="Strikethrough"><s>S</s></button></div><div class="editor-toolbar-group"><button type="button" data-command="insertUnorderedList" title="Bullet list">• List</button><button type="button" data-command="insertOrderedList" title="Numbered list">1. List</button><button type="button" data-command="outdent" title="Decrease indent">←</button><button type="button" data-command="indent" title="Increase indent">→</button></div><div class="editor-toolbar-group"><button type="button" data-command="justifyLeft" title="Align left">Left</button><button type="button" data-command="justifyCenter" title="Align centre">Centre</button><button type="button" data-command="justifyRight" title="Align right">Right</button></div><div class="editor-toolbar-group editor-colour-tools"><label title="Text colour"><span>A</span><input id="editor-colour" type="color" value="#ffffff" aria-label="Text colour" /></label><label title="Highlight colour"><span>Highlight</span><input id="editor-highlight" type="color" value="#db1240" aria-label="Highlight colour" /></label></div><div class="editor-toolbar-group"><button type="button" data-command="createLink" title="Add link">Link</button><button type="button" data-command="unlink" title="Remove link">Unlink</button><button type="button" data-command="insertHorizontalRule" title="Horizontal divider">Divider</button><button type="button" data-command="removeFormat" title="Clear selected formatting">Clear</button></div><div class="editor-toolbar-group"><button type="button" data-command="undo" title="Undo">Undo</button><button type="button" data-command="redo" title="Redo">Redo</button></div><details class="editor-template-menu"><summary>Insert section</summary><div><button type="button" data-template="mission">Mission</button><button type="button" data-template="leadership">Leadership</button><button type="button" data-template="faq">FAQ</button><button type="button" data-template="gallery">Gallery</button></div></details></div><div class="wysiwyg" id="wysiwyg" contenteditable="true" spellcheck="true" aria-label="Department page content">${sanitizeHtml(item.content)}</div><small class="field-help">Tip: paste from documents normally—the editor will clean unsupported formatting and keep headings, lists and links in a safe structure.</small></div><button class="text-link" type="button" id="preview-department">Toggle preview</button><div class="department-editor-preview rich-content" id="department-editor-preview" hidden></div><button class="button" type="submit">Save department</button></form>`;
    const visibilityField = document.createElement('label');
    visibilityField.className = 'portal-field';
    visibilityField.innerHTML = '<span>Page visibility</span><select name="publishState"><option value="draft">Draft — staff only</option><option value="published">Published — visible publicly</option></select><small class="field-help">Draft pages stay in the Control Room and are excluded from the public API and departments dropdown.</small>';
    body.querySelector('[name="status"]').closest('.field-row').insertAdjacentElement('beforebegin', visibilityField);
    visibilityField.querySelector('select').value = item.publishState || 'published';
    const editor = body.querySelector('#wysiwyg');
    const toolbar = body.querySelector('.editor-toolbar'); let savedRange = null;
    const rememberSelection = () => { const selection = getSelection(); if (selection?.rangeCount && editor.contains(selection.anchorNode)) savedRange = selection.getRangeAt(0).cloneRange(); };
    const restoreSelection = () => { editor.focus(); const selection = getSelection(); if (!savedRange) { savedRange = document.createRange(); savedRange.selectNodeContents(editor); savedRange.collapse(false); } selection.removeAllRanges(); selection.addRange(savedRange); };
    const runCommand = (command, value = null) => { restoreSelection(); document.execCommand(command, false, value); rememberSelection(); };
    editor.addEventListener('keyup', rememberSelection); editor.addEventListener('mouseup', rememberSelection); editor.addEventListener('input', rememberSelection); editor.addEventListener('focus', rememberSelection);
    toolbar.querySelectorAll('button').forEach(button => button.addEventListener('mousedown', event => event.preventDefault()));
    body.querySelectorAll('[data-command]').forEach(button => button.onclick = () => { if (button.dataset.command === 'createLink') { const value = prompt('Link URL (include https://)'); if (value) runCommand('createLink', value); return; } runCommand(button.dataset.command); });
    body.querySelector('#editor-format').onchange = event => { runCommand('formatBlock', event.target.value); };
    body.querySelector('#editor-size').onchange = event => { if (event.target.value) runCommand('fontSize', event.target.value); event.target.value = ''; };
    body.querySelector('#editor-colour').oninput = event => runCommand('foreColor', event.target.value);
    body.querySelector('#editor-highlight').oninput = event => runCommand('hiliteColor', event.target.value);
    editor.addEventListener('paste', event => {
      event.preventDefault(); const html = event.clipboardData.getData('text/html'); const text = event.clipboardData.getData('text/plain');
      const cleaned = html ? sanitizeHtml(html, { stripStyles: true }) : text.split(/\n{2,}/).map(paragraph => `<p>${escapeHtml(paragraph).replaceAll('\n', '<br />')}</p>`).join('');
      runCommand('insertHTML', cleaned || `<p>${escapeHtml(text)}</p>`);
    });
    const templates = { mission: '<h2>Mission statement</h2><p>Describe the department mission and values.</p>', leadership: '<h2>Leadership</h2><h3>Department Head</h3><p>Name and callsign</p>', faq: '<h2>Frequently asked questions</h2><h3>How do I apply?</h3><p>Explain the application process.</p>', gallery: '<h2>Department gallery</h2><p>Add links to approved department media here.</p>' };
    body.querySelectorAll('[data-template]').forEach(button => button.onclick = () => { runCommand('insertHTML', templates[button.dataset.template]); button.closest('details')?.removeAttribute('open'); });
    body.querySelector('#preview-department').onclick = () => { const preview = body.querySelector('#department-editor-preview'); const cleaned = sanitizeHtml(editor.innerHTML); editor.innerHTML = cleaned; savedRange = null; preview.hidden = !preview.hidden; preview.innerHTML = cleaned; };
    dialog.showModal(); body.querySelector('form').onsubmit = async event => { event.preventDefault(); const fd = new FormData(event.currentTarget); const value = { ...item, id: item.id || uid(), name: fd.get('name'), shortName: fd.get('shortName'), slug: slugify(fd.get('slug')), summary: fd.get('summary'), accent: fd.get('accent'), status: fd.get('status'), publishState: fd.get('publishState'), content: sanitizeHtml(editor.innerHTML), updatedAt: new Date().toISOString(), applyUrl: fd.get('applyUrl') }; await saveItem('departments', value, data); dialog.close(); renderAdminTab('departments'); };
  }

  function renderTeamsAdmin(root, data) {
    if (!has('permissions.manage')) { root.innerHTML = '<div class="empty-state"><h3>Administrator access required</h3><p>Only site administrators can manage the public team directory.</p></div>'; return; }
    root.innerHTML = adminHeading('TEAMS', 'Add team member', 'new-team-member') + `<div class="admin-note"><strong>Administrator managed</strong><p>This public directory is available at the Team link in the main navigation. Only administrators can add, edit, reorder or remove members.</p></div><div class="admin-list team-admin-list">${data.teams.map((member, index) => { const imageUrl = safeHttpUrl(member.imageUrl); return `<article><div class="team-admin-identity"><span class="team-admin-avatar">${imageUrl ? `<img src="${escapeHtml(imageUrl)}" alt="" />` : escapeHtml(member.initials || member.name.slice(0, 2))}</span><div><span class="status-pill">${escapeHtml(member.role)}</span><h3>${escapeHtml(member.name)}</h3><p>${escapeHtml(member.bio || 'No biography added.')}</p></div></div><div class="admin-row-actions"><button class="icon-button" data-move-team="${escapeHtml(member.id)}" data-direction="-1" ${index === 0 ? 'disabled' : ''}>↑</button><button class="icon-button" data-move-team="${escapeHtml(member.id)}" data-direction="1" ${index === data.teams.length - 1 ? 'disabled' : ''}>↓</button><button class="text-link" data-edit-team="${escapeHtml(member.id)}">Edit</button><button class="icon-button danger" data-delete-team="${escapeHtml(member.id)}">Delete</button></div></article>`; }).join('') || '<div class="empty-state"><h3>No team members yet</h3><p>Add the first person to publish the team directory.</p></div>'}</div>`;
    root.querySelector('[data-action]')?.addEventListener('click', () => openTeamEditor(null, data));
    root.querySelectorAll('[data-edit-team]').forEach(button => button.onclick = () => openTeamEditor(data.teams.find(member => member.id === button.dataset.editTeam), data));
    root.querySelectorAll('[data-delete-team]').forEach(button => button.onclick = () => deleteItem('teams', button.dataset.deleteTeam, data));
    root.querySelectorAll('[data-move-team]').forEach(button => button.onclick = async () => {
      const index = data.teams.findIndex(member => member.id === button.dataset.moveTeam);
      const target = index + Number(button.dataset.direction);
      if (index < 0 || target < 0 || target >= data.teams.length) return;
      [data.teams[index], data.teams[target]] = [data.teams[target], data.teams[index]];
      data.teams.forEach((member, order) => { member.order = order; });
      if (config.apiBaseUrl) await Promise.all(data.teams.map(member => request(`/api/admin/teams/${encodeURIComponent(member.id)}`, { method: 'PUT', body: JSON.stringify(member) })));
      else saveDemo(data);
      recordAudit('Reordered team members'); toast('Team order saved.'); window.dispatchEvent(new Event('venture:content')); renderAdminTab('teams');
    });
  }

  function openTeamEditor(existing, data) {
    const dialog = document.getElementById('admin-dialog'); const body = document.getElementById('admin-dialog-body');
    const member = existing || { id: '', name: '', role: '', initials: '', bio: '', imageUrl: '', order: data.teams.length };
    const imageUrl = safeHttpUrl(member.imageUrl);
    body.innerHTML = `${adminHeading(existing ? 'EDIT TEAM MEMBER' : 'ADD TEAM MEMBER')}<form id="team-editor"><div class="team-editor-preview"><span id="team-editor-avatar">${imageUrl ? `<img src="${escapeHtml(imageUrl)}" alt="" />` : escapeHtml(member.initials || 'VR')}</span><div><small>Public card preview</small><strong id="team-editor-name">${escapeHtml(member.name || 'Team member')}</strong><p id="team-editor-role">${escapeHtml(member.role || 'Role')}</p></div></div><div class="field-row"><label class="portal-field"><span>Name</span><input name="name" value="${escapeHtml(member.name)}" maxlength="80" required /></label><label class="portal-field"><span>Role</span><input name="role" value="${escapeHtml(member.role)}" maxlength="80" placeholder="Founder, Moderator, Developer…" required /></label></div><div class="field-row"><label class="portal-field"><span>Initials</span><input name="initials" value="${escapeHtml(member.initials || '')}" maxlength="4" placeholder="VR" /></label><label class="portal-field"><span>Profile image URL (optional)</span><input name="imageUrl" type="url" value="${escapeHtml(member.imageUrl || '')}" placeholder="https://…" /></label></div><label class="portal-field"><span>Biography</span><textarea name="bio" maxlength="600" placeholder="A short description of their responsibilities and contribution.">${escapeHtml(member.bio || '')}</textarea></label><button class="button" type="submit">${existing ? 'Save member' : 'Add member'}</button></form>`;
    const form = body.querySelector('form'); const nameInput = form.elements.name; const roleInput = form.elements.role; const initialsInput = form.elements.initials; const imageInput = form.elements.imageUrl; const avatar = body.querySelector('#team-editor-avatar');
    const updatePreview = () => { const initials = (initialsInput.value.trim() || nameInput.value.trim().split(/\s+/).map(part => part[0]).join('').slice(0, 2) || 'VR').toUpperCase(); const url = safeHttpUrl(imageInput.value); avatar.innerHTML = url ? `<img src="${escapeHtml(url)}" alt="" />` : escapeHtml(initials); body.querySelector('#team-editor-name').textContent = nameInput.value.trim() || 'Team member'; body.querySelector('#team-editor-role').textContent = roleInput.value.trim() || 'Role'; };
    [nameInput, roleInput, initialsInput, imageInput].forEach(input => input.addEventListener('input', updatePreview));
    dialog.showModal(); form.onsubmit = async event => { event.preventDefault(); const fd = new FormData(form); const name = fd.get('name').trim(); const value = { ...member, id: member.id || `${slugify(name) || 'member'}-${Date.now()}`, name, role: fd.get('role').trim(), initials: (fd.get('initials').trim() || name.split(/\s+/).map(part => part[0]).join('').slice(0, 2)).toUpperCase(), imageUrl: safeHttpUrl(fd.get('imageUrl')), bio: fd.get('bio').trim(), order: Number(member.order) || 0 }; await saveItem('teams', value, data, `${existing ? 'Updated' : 'Added'} team member: ${name}`); dialog.close(); window.dispatchEvent(new Event('venture:content')); renderAdminTab('teams'); };
  }

  function renderPermissionsAdmin(root, data) {
    root.innerHTML = adminHeading('PERMISSIONS', 'Add Discord role', 'new-role') + '<div class="permission-intro"><strong>Discord role mapping</strong><p>Paste role IDs from Discord Developer Mode. Members receive the combined permissions of every matching role.</p></div><div class="role-rule-list">' + data.roleRules.map(rule => `<article><div><small>Role ID</small><strong>${escapeHtml(rule.roleId)}</strong></div><div class="permission-chips">${rule.permissions.map(permission => `<span>${escapeHtml(permission)}</span>`).join('')}</div><button class="text-link" data-edit-role="${rule.id}">Edit</button><button class="icon-button danger" data-delete-role="${rule.id}">Delete</button></article>`).join('') + '</div>';
    root.querySelector('[data-action]').onclick = () => openRoleEditor(null, data); root.querySelectorAll('[data-edit-role]').forEach(button => button.onclick = () => openRoleEditor(data.roleRules.find(item => item.id === button.dataset.editRole), data)); root.querySelectorAll('[data-delete-role]').forEach(button => button.onclick = () => deleteItem('roleRules', button.dataset.deleteRole, data));
  }

  function openRoleEditor(existing, data) {
    const dialog = document.getElementById('admin-dialog'); const body = document.getElementById('admin-dialog-body'); const rule = existing || { id: uid(), roleId: '', permissions: [] };
    const permissionOption = (permission, title, description) => `<label><input type="checkbox" name="permissions" value="${escapeHtml(permission)}" ${rule.permissions.includes(permission) ? 'checked' : ''} /><span><strong>${escapeHtml(title)}</strong><small>${escapeHtml(description)}</small></span></label>`;
    const formScopes = data.forms.map(form => `<section class="resource-permission-group"><h3>${escapeHtml(form.title)}</h3>${permissionOption(`forms.manage:${form.id}`, 'Edit this form', 'Edit or delete this form only')}${permissionOption(`submissions.view:${form.id}`, 'View submissions', 'Read submissions sent through this form')}${permissionOption(`submissions.manage:${form.id}`, 'Manage submissions', 'Change status, assignment, notes and responses')}</section>`).join('');
    const departmentScopes = data.departments.map(department => `<section class="resource-permission-group"><h3>${escapeHtml(department.name)}</h3>${permissionOption(`departments.manage:${department.id}`, 'Manage this department', 'Edit or delete this department page only')}</section>`).join('');
    body.innerHTML = `${adminHeading(existing ? 'EDIT ROLE' : 'ADD ROLE')}<form id="role-editor"><label class="portal-field"><span>Discord role ID</span><input name="roleId" inputmode="numeric" pattern="[0-9]+" value="${escapeHtml(rule.roleId)}" required /></label><div class="permission-presets"><span>Permission preset</span><button type="button" data-preset="administrator">Administrator</button><button type="button" data-preset="moderator">Moderator</button><button type="button" data-preset="reviewer">Reviewer</button><button type="button" data-preset="department">Department lead</button></div><fieldset class="permission-picker"><legend>Site-wide permissions</legend>${allPermissions.map(permission => permissionOption(permission, permission, permissionDescription(permission))).join('')}</fieldset><fieldset class="permission-picker resource-permission-picker"><legend>Form-specific permissions</legend><p class="permission-help">Use these instead of a site-wide form permission when a role should only access selected forms.</p>${formScopes || '<p>No forms have been created yet.</p>'}</fieldset><fieldset class="permission-picker resource-permission-picker"><legend>Department-specific permissions</legend><p class="permission-help">Select exactly which department pages this Discord role can manage.</p>${departmentScopes || '<p>No departments have been created yet.</p>'}</fieldset><button class="button" type="submit">Save role</button></form>`;
    const presets = { administrator: allPermissions, moderator: ['panel.view', 'forms.manage', 'submissions.view', 'submissions.manage'], reviewer: ['panel.view', 'submissions.view', 'submissions.manage'], department: ['panel.view', 'departments.manage'] };
    body.querySelectorAll('[data-preset]').forEach(button => button.onclick = () => body.querySelectorAll('[name="permissions"]').forEach(input => { input.checked = presets[button.dataset.preset].includes(input.value); }));
    dialog.showModal(); body.querySelector('form').onsubmit = async event => { event.preventDefault(); const fd = new FormData(event.currentTarget); const granted = fd.getAll('permissions'); if (granted.length && !granted.includes('panel.view')) granted.unshift('panel.view'); const value = { ...rule, roleId: fd.get('roleId'), permissions: [...new Set(granted)] }; await saveItem('roleRules', value, data); dialog.close(); renderAdminTab('permissions'); };
  }

  function permissionDescription(permission) { return ({ 'panel.view': 'Open the Control Room', 'forms.manage': 'Create, edit and delete forms', 'submissions.view': 'Read form submissions', 'submissions.manage': 'Change submission status', 'rules.manage': 'Edit the community rules', 'departments.manage': 'Publish department pages', 'permissions.manage': 'Configure role access' })[permission]; }

  function recordAudit(action) {
    const session = getSession(); let entries = [];
    try { entries = JSON.parse(localStorage.getItem('venture_audit_log') || '[]'); } catch { entries = []; }
    entries.unshift({ id: uid(), action, user: session?.user?.global_name || session?.user?.username || 'Unknown', createdAt: new Date().toISOString() });
    localStorage.setItem('venture_audit_log', JSON.stringify(entries.slice(0, 250)));
  }

  function renderAuditAdmin(root, data) {
    root.innerHTML = adminHeading('ACTIVITY LOG') + `<div class="admin-note"><strong>Browser-local history</strong><p>This records changes made from this browser. A shared tamper-resistant audit log requires the production API.</p></div><div class="audit-list">${data.auditLog.map(entry => `<article><span>${new Date(entry.createdAt).toLocaleString()}</span><div><strong>${escapeHtml(entry.action)}</strong><small>by ${escapeHtml(entry.user)}</small></div></article>`).join('') || '<div class="empty-state"><h3>No recorded changes</h3></div>'}</div>`;
  }

  async function saveItem(collection, value, data, auditAction = null) {
    if (config.apiBaseUrl) { await request(`/api/admin/${collection}/${encodeURIComponent(value.id)}`, { method: 'PUT', body: JSON.stringify(value) }); }
    else { const index = data[collection].findIndex(item => item.id === value.id); if (index >= 0) data[collection][index] = value; else data[collection].push(value); saveDemo(data); }
    recordAudit(auditAction || `Updated ${collection}: ${value.title || value.name || value.id}`);
    toast('Changes saved.');
    if (collection === 'departments' || collection === 'teams') window.dispatchEvent(new Event('venture:content'));
  }

  async function deleteItem(collection, id, data) {
    if (!confirm('Delete this item? This cannot be undone.')) return;
    if (config.apiBaseUrl) await request(`/api/admin/${collection}/${encodeURIComponent(id)}`, { method: 'DELETE' });
    else { data[collection] = data[collection].filter(item => item.id !== id); saveDemo(data); }
    recordAudit(`Deleted ${collection}: ${id}`);
    if (collection === 'departments' || collection === 'teams') window.dispatchEvent(new Event('venture:content'));
    toast('Item deleted.'); renderAdminTab(collection === 'roleRules' ? 'permissions' : collection);
  }

  function initDialogs() { document.querySelectorAll('dialog').forEach(dialog => { dialog.querySelector('.dialog-close')?.addEventListener('click', () => dialog.close()); dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); }); }); }

  document.addEventListener('DOMContentLoaded', async () => {
    initDialogs();
    if (await finishLogin()) return;
    await refreshSession();
    if (page === 'forms') initForms();
    if (page === 'profile') initProfile();
    if (page === 'departments') initDepartments();
    if (page === 'mod') initMod();
  });
})();
