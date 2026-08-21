const PERMISSIONS = ['panel.view', 'forms.manage', 'submissions.view', 'submissions.manage', 'rules.manage', 'departments.manage', 'permissions.manage'];
const COLLECTION_PERMISSION = {
  forms: 'forms.manage',
  submissions: 'submissions.manage',
  departments: 'departments.manage',
  roleRules: 'permissions.manage',
  rules: 'rules.manage',
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') return withCors(new Response(null, { status: 204 }), request, env);
    try {
      let response;
      if (url.pathname === '/auth/discord' && request.method === 'GET') response = await startDiscord(request, env);
      else if (url.pathname === '/auth/callback' && request.method === 'GET') response = await finishDiscord(request, env);
      else if (url.pathname === '/api/me' && request.method === 'GET') response = await me(request, env);
      else if (url.pathname === '/api/forms' && request.method === 'GET') response = await listForms(request, env);
      else if (url.pathname === '/api/departments' && request.method === 'GET') response = json({ departments: await listContent(env, 'departments') });
      else if (url.pathname === '/api/rules' && request.method === 'GET') response = json({ rules: await getContent(env, 'rules', 'site-rules') });
      else if (url.pathname === '/api/submissions' && request.method === 'POST') response = await createSubmission(request, env);
      else if (url.pathname === '/api/admin' && request.method === 'GET') response = await adminSnapshot(request, env);
      else if (url.pathname.startsWith('/api/admin/') && ['PUT', 'DELETE'].includes(request.method)) response = await mutateContent(request, env);
      else response = json({ error: 'Not found.' }, 404);
      return withCors(response, request, env);
    } catch (error) {
      console.error(error);
      return withCors(json({ error: error.publicMessage || 'The server could not complete that request.' }, error.status || 500), request, env);
    }
  },
};

async function startDiscord(request, env) {
  requiredEnv(env);
  const url = new URL(request.url);
  const requestedReturn = url.searchParams.get('return_to') || env.SITE_URL;
  const returnTo = requestedReturn.startsWith(env.SITE_URL) ? requestedReturn : env.SITE_URL;
  const state = randomToken(24);
  const expiresAt = Date.now() + 10 * 60 * 1000;
  await env.DB.prepare('INSERT INTO oauth_states (state, return_to, expires_at) VALUES (?, ?, ?)').bind(state, returnTo, expiresAt).run();
  const callback = `${url.origin}/auth/callback`;
  const params = new URLSearchParams({ client_id: env.DISCORD_CLIENT_ID, redirect_uri: callback, response_type: 'code', scope: 'identify guilds.members.read', state, prompt: 'consent' });
  return new Response(null, { status: 302, headers: { Location: `https://discord.com/oauth2/authorize?${params}`, 'Set-Cookie': `venture_oauth=${state}; HttpOnly; Secure; SameSite=Lax; Path=/auth; Max-Age=600` } });
}

async function finishDiscord(request, env) {
  requiredEnv(env);
  const url = new URL(request.url);
  const state = url.searchParams.get('state');
  const code = url.searchParams.get('code');
  const cookieState = readCookie(request, 'venture_oauth');
  const saved = state ? await env.DB.prepare('SELECT return_to, expires_at FROM oauth_states WHERE state = ?').bind(state).first() : null;
  if (!code || !state || state !== cookieState || !saved || saved.expires_at < Date.now()) throw publicError('Discord login expired or could not be verified.', 400);
  await env.DB.prepare('DELETE FROM oauth_states WHERE state = ?').bind(state).run();
  const callback = `${url.origin}/auth/callback`;
  const tokenResponse = await fetch('https://discord.com/api/v10/oauth2/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: env.DISCORD_CLIENT_ID, client_secret: env.DISCORD_CLIENT_SECRET, grant_type: 'authorization_code', code, redirect_uri: callback }),
  });
  if (!tokenResponse.ok) throw publicError('Discord rejected the login code.', 401);
  const oauth = await tokenResponse.json();
  const discordHeaders = { Authorization: `Bearer ${oauth.access_token}` };
  const [userResponse, memberResponse] = await Promise.all([
    fetch('https://discord.com/api/v10/users/@me', { headers: discordHeaders }),
    fetch(`https://discord.com/api/v10/users/@me/guilds/${env.DISCORD_GUILD_ID}/member`, { headers: discordHeaders }),
  ]);
  if (!userResponse.ok) throw publicError('Discord profile lookup failed.', 401);
  if (!memberResponse.ok) throw publicError('You must be a member of the Venture Discord server.', 403);
  const user = await userResponse.json();
  const member = await memberResponse.json();
  const token = randomToken(40);
  const tokenHash = await sha256(token);
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
  await env.DB.prepare('INSERT INTO sessions (token_hash, user_id, user_json, roles_json, expires_at) VALUES (?, ?, ?, ?, ?)').bind(tokenHash, user.id, JSON.stringify(user), JSON.stringify(member.roles || []), expiresAt).run();
  const joiner = saved.return_to.includes('#') ? '&' : '#';
  return new Response(null, { status: 302, headers: { Location: `${saved.return_to}${joiner}session=${encodeURIComponent(token)}`, 'Set-Cookie': 'venture_oauth=; HttpOnly; Secure; SameSite=Lax; Path=/auth; Max-Age=0' } });
}

async function me(request, env) {
  const auth = await authenticate(request, env);
  return json({ token: auth.token, user: auth.user, permissions: auth.permissions, expiresAt: auth.expiresAt });
}

async function listForms(request, env) {
  const forms = (await listContent(env, 'forms')).filter(form => form.status === 'open');
  const auth = await authenticate(request, env, false);
  const allSubmissions = await listContent(env, 'submissions');
  const submissions = auth ? allSubmissions.filter(item => item.userId === auth.user.id) : [];
  const suggestions = allSubmissions.filter(item => item.formId === 'suggestion').map(item => ({ id: item.id, formId: item.formId, formTitle: item.formTitle, values: item.values, status: item.status, user: item.user, createdAt: item.createdAt, staffResponse: item.staffResponse || '', votes: Number(item.votes || 0) }));
  return json({ forms, submissions, suggestions });
}

async function createSubmission(request, env) {
  const auth = await authenticate(request, env);
  const body = await bodyJson(request);
  const form = await getContent(env, 'forms', body.formId);
  if (!form || form.status !== 'open') throw publicError('That form is not currently open.', 400);
  const values = {};
  for (const field of form.fields || []) {
    const value = String(body.values?.[field.id] || '').trim();
    if (field.required && !value) throw publicError(`${field.label} is required.`, 400);
    values[field.id] = value.slice(0, field.type === 'textarea' ? 10000 : 1000);
  }
  const submission = { id: crypto.randomUUID(), formId: form.id, formTitle: form.title, values, status: 'received', userId: auth.user.id, user: { id: auth.user.id, username: auth.user.username, global_name: auth.user.global_name }, createdAt: new Date().toISOString() };
  await putContent(env, 'submissions', submission.id, submission);
  return json({ submission }, 201);
}

async function adminSnapshot(request, env) {
  const auth = await authenticate(request, env);
  requirePermission(auth, 'panel.view');
  const [allForms, allDepartments, allRoleRules, rules, allSubmissions] = await Promise.all([listContent(env, 'forms'), listContent(env, 'departments'), listContent(env, 'roleRules'), getContent(env, 'rules', 'site-rules'), listContent(env, 'submissions')]);
  const canConfigure = auth.permissions.includes('permissions.manage');
  const forms = allForms.filter(form => canConfigure || hasResourcePermission(auth, 'forms.manage', form.id) || hasResourcePermission(auth, 'submissions.view', form.id) || hasResourcePermission(auth, 'submissions.manage', form.id));
  const departments = allDepartments.filter(department => canConfigure || hasResourcePermission(auth, 'departments.manage', department.id));
  const submissions = allSubmissions.filter(item => hasResourcePermission(auth, 'submissions.view', item.formId) || hasResourcePermission(auth, 'submissions.manage', item.formId));
  const roleRules = canConfigure ? allRoleRules : [];
  return json({ forms, departments, submissions, roleRules, rules });
}

async function mutateContent(request, env) {
  const auth = await authenticate(request, env);
  const segments = new URL(request.url).pathname.split('/').filter(Boolean);
  const collection = segments[2];
  const id = decodeURIComponent(segments.slice(3).join('/'));
  if (!COLLECTION_PERMISSION[collection] || !id) throw publicError('Unknown content collection.', 404);
  const existing = await getContent(env, collection, id);
  if (collection === 'forms' || collection === 'departments') {
    if (existing) requireResourcePermission(auth, COLLECTION_PERMISSION[collection], id);
    else requirePermission(auth, COLLECTION_PERMISSION[collection]);
  } else if (collection === 'submissions') {
    if (!existing) throw publicError('Submission not found.', 404);
    requireResourcePermission(auth, 'submissions.manage', existing.formId);
  } else if (collection === 'rules') {
    if (!auth.permissions.includes('rules.manage') && !auth.permissions.includes('permissions.manage')) throw publicError('Your Discord roles do not allow that action.', 403);
  } else requirePermission(auth, COLLECTION_PERMISSION[collection]);
  if (request.method === 'DELETE') { await env.DB.prepare('DELETE FROM content WHERE collection = ? AND id = ?').bind(collection, id).run(); return new Response(null, { status: 204 }); }
  const value = await bodyJson(request);
  value.id = id;
  if (collection === 'roleRules') {
    value.roleId = String(value.roleId || '');
    value.permissions = [...new Set((value.permissions || []).filter(isValidPermission))];
    if (!/^\d{15,22}$/.test(value.roleId)) throw publicError('Enter a valid Discord role ID.', 400);
  }
  if (collection === 'forms' && (!value.title || !Array.isArray(value.fields))) throw publicError('Form title and fields are required.', 400);
  if (collection === 'departments' && (!value.name || !value.slug)) throw publicError('Department name and slug are required.', 400);
  if (collection === 'submissions') {
    value.values = existing.values; value.user = existing.user; value.userId = existing.userId; value.createdAt = existing.createdAt;
    value.formId = existing.formId; value.formTitle = existing.formTitle;
  }
  await putContent(env, collection, id, value);
  return json({ item: value });
}

async function authenticate(request, env, required = true) {
  const match = request.headers.get('Authorization')?.match(/^Bearer (.+)$/);
  if (!match) { if (required) throw publicError('Log in to continue.', 401); return null; }
  const tokenHash = await sha256(match[1]);
  const row = await env.DB.prepare('SELECT user_json, roles_json, expires_at FROM sessions WHERE token_hash = ?').bind(tokenHash).first();
  if (!row || row.expires_at < Date.now()) { if (required) throw publicError('Your session expired. Please log in again.', 401); return null; }
  const user = JSON.parse(row.user_json); const roles = JSON.parse(row.roles_json); const permissions = await permissionsFor(env, user.id, roles);
  return { token: match[1], user, roles, permissions, expiresAt: row.expires_at };
}

async function permissionsFor(env, userId, roles) {
  const owners = String(env.OWNER_USER_IDS || '').split(',').map(value => value.trim()).filter(Boolean);
  if (owners.includes(userId)) return [...PERMISSIONS];
  const rules = await listContent(env, 'roleRules');
  return [...new Set(rules.filter(rule => roles.includes(rule.roleId)).flatMap(rule => rule.permissions).filter(isValidPermission))];
}

function requirePermission(auth, permission) { if (!auth.permissions.includes(permission)) throw publicError('Your Discord roles do not allow that action.', 403); }
function hasResourcePermission(auth, permission, resourceId) { return auth.permissions.includes(permission) || auth.permissions.includes(`${permission}:${resourceId}`); }
function requireResourcePermission(auth, permission, resourceId) { if (!hasResourcePermission(auth, permission, resourceId)) throw publicError('Your Discord roles do not allow access to that item.', 403); }
function isValidPermission(permission) { return PERMISSIONS.includes(permission) || /^(forms\.manage|submissions\.view|submissions\.manage|departments\.manage):[A-Za-z0-9_-]+$/.test(permission); }
async function listContent(env, collection) { const result = await env.DB.prepare('SELECT data FROM content WHERE collection = ? ORDER BY updated_at DESC').bind(collection).all(); return result.results.map(row => JSON.parse(row.data)); }
async function getContent(env, collection, id) { const row = await env.DB.prepare('SELECT data FROM content WHERE collection = ? AND id = ?').bind(collection, id).first(); return row ? JSON.parse(row.data) : null; }
async function putContent(env, collection, id, value) { await env.DB.prepare("INSERT INTO content (collection, id, data) VALUES (?, ?, ?) ON CONFLICT(collection, id) DO UPDATE SET data = excluded.data, updated_at = CURRENT_TIMESTAMP").bind(collection, id, JSON.stringify(value)).run(); }
async function bodyJson(request) { try { return await request.json(); } catch { throw publicError('Expected a JSON request body.', 400); } }
function json(value, status = 200) { return new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } }); }
function withCors(response, request, env) { const origin = request.headers.get('Origin'); const headers = new Headers(response.headers); if (origin === env.SITE_ORIGIN) { headers.set('Access-Control-Allow-Origin', origin); headers.set('Vary', 'Origin'); headers.set('Access-Control-Allow-Headers', 'Authorization, Content-Type'); headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS'); } return new Response(response.body, { status: response.status, statusText: response.statusText, headers }); }
function readCookie(request, name) { return request.headers.get('Cookie')?.split(';').map(value => value.trim().split('=')).find(([key]) => key === name)?.[1] || ''; }
function randomToken(bytes) { const value = new Uint8Array(bytes); crypto.getRandomValues(value); return btoa(String.fromCharCode(...value)).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', ''); }
async function sha256(value) { const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)); return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join(''); }
function publicError(message, status) { const error = new Error(message); error.publicMessage = message; error.status = status; return error; }
function requiredEnv(env) { for (const key of ['DISCORD_CLIENT_ID', 'DISCORD_CLIENT_SECRET', 'DISCORD_GUILD_ID', 'SITE_URL']) if (!env[key]) throw publicError(`Server is missing ${key}.`, 500); }
