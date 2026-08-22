import { connect } from 'cloudflare:sockets';

const PERMISSIONS = ['panel.view', 'forms.manage', 'submissions.view', 'submissions.manage', 'rules.manage', 'departments.manage', 'permissions.manage'];
const COLLECTION_PERMISSION = {
  forms: 'forms.manage',
  submissions: 'submissions.manage',
  departments: 'departments.manage',
  teams: 'permissions.manage',
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
      else if (url.pathname === '/api/fivem/status' && request.method === 'GET') response = await fivemStatus(env);
      else if (url.pathname === '/api/fivem/join' && request.method === 'POST') response = await fivemJoin(request, env);
      else if (url.pathname === '/api/forms' && request.method === 'GET') response = await listForms(request, env);
      else if (url.pathname === '/api/departments' && request.method === 'GET') response = json({ departments: (await listContent(env, 'departments')).filter(item => item.publishState !== 'draft') });
      else if (url.pathname === '/api/team' && request.method === 'GET') response = json({ team: sortByOrder(await listContent(env, 'teams')) });
      else if (url.pathname === '/api/rules' && request.method === 'GET') response = json({ rules: await getContent(env, 'rules', 'site-rules') });
      else if (url.pathname === '/api/submissions' && request.method === 'POST') response = await createSubmission(request, env);
      else if (/^\/api\/tickets\/[^/]+\/messages$/.test(url.pathname) && request.method === 'POST') response = await addTicketMessage(request, env);
      else if (url.pathname === '/api/admin' && request.method === 'GET') response = await adminSnapshot(request, env);
      else if (/^\/api\/admin\/tickets\/[^/]+\/claim$/.test(url.pathname) && request.method === 'POST') response = await claimTicket(request, env);
      else if (/^\/api\/admin\/tickets\/[^/]+\/status$/.test(url.pathname) && request.method === 'PUT') response = await updateTicketStatus(request, env);
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

async function fivemStatus(env) {
  const statusUrl = String(env.FIVEM_STATUS_URL || '').trim();
  if (!statusUrl) return json({ online: false, players: 0, maxPlayers: 0, full: false });
  try {
    const url = new URL(statusUrl);
    const data = url.protocol === 'http:' && url.port && !['80', '443'].includes(url.port)
      ? await fetchJsonOverTcp(url)
      : await fetchJson(statusUrl);
    const players = Math.max(0, Number(data.clients) || 0);
    const maxPlayers = Math.max(0, Number(data.sv_maxclients) || 0);
    return json({ online: true, players, maxPlayers, full: maxPlayers > 0 && players >= maxPlayers, hostname: String(data.hostname || 'Venture Roleplay').slice(0, 120), gametype: String(data.gametype || 'Roleplay').slice(0, 60) });
  } catch (error) {
    console.error(JSON.stringify({ message: 'FiveM status lookup failed', error: error instanceof Error ? error.message : String(error) }));
    return json({ online: false, players: 0, maxPlayers: 0, full: false });
  }
}

async function fetchJson(url) {
  const response = await fetch(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(5000) });
  if (!response.ok) throw new Error(`FiveM status returned ${response.status}`);
  return response.json();
}

async function fetchJsonOverTcp(url) {
  const port = Number(url.port);
  if (!/^\d{1,3}(?:\.\d{1,3}){3}$/.test(url.hostname) || !Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('Invalid FiveM TCP endpoint');
  }

  const socket = connect({ hostname: url.hostname, port });
  const timeout = new Promise((_, reject) => {
    const timer = setTimeout(() => {
      socket.close();
      reject(new Error('FiveM status timed out'));
    }, 5000);
    socket.closed.finally(() => clearTimeout(timer)).catch(() => {});
  });

  const exchange = (async () => {
    await socket.opened;
    const writer = socket.writable.getWriter();
    await writer.write(new TextEncoder().encode(`GET ${url.pathname}${url.search} HTTP/1.1\r\nHost: ${url.host}\r\nAccept: application/json\r\nConnection: close\r\n\r\n`));
    writer.releaseLock();

    const reader = socket.readable.getReader();
    const decoder = new TextDecoder();
    let raw = '';
    while (raw.length < 65536) {
      const { value, done } = await reader.read();
      if (done) break;
      raw += decoder.decode(value, { stream: true });
    }
    raw += decoder.decode();
    reader.releaseLock();
    socket.close();

    const headerEnd = raw.indexOf('\r\n\r\n');
    if (headerEnd < 0) throw new Error('Invalid FiveM HTTP response');
    const headers = raw.slice(0, headerEnd);
    const status = Number(headers.slice(0, headers.indexOf('\r\n')).split(' ')[1]);
    if (status < 200 || status >= 300) throw new Error(`FiveM status returned ${status || 'an invalid response'}`);
    const body = /\r\ntransfer-encoding:\s*chunked\r\n/i.test(`\r\n${headers}\r\n`)
      ? decodeChunkedBody(raw.slice(headerEnd + 4))
      : raw.slice(headerEnd + 4);
    return JSON.parse(body);
  })();

  return Promise.race([exchange, timeout]);
}

function decodeChunkedBody(body) {
  let cursor = 0;
  let decoded = '';
  while (cursor < body.length) {
    const lineEnd = body.indexOf('\r\n', cursor);
    if (lineEnd < 0) throw new Error('Invalid chunked FiveM response');
    const size = Number.parseInt(body.slice(cursor, lineEnd).split(';')[0], 16);
    if (!Number.isFinite(size)) throw new Error('Invalid FiveM chunk size');
    if (size === 0) return decoded;
    const start = lineEnd + 2;
    const end = start + size;
    if (end > body.length) throw new Error('Incomplete FiveM response');
    decoded += body.slice(start, end);
    cursor = end + 2;
  }
  throw new Error('Incomplete chunked FiveM response');
}

async function fivemJoin(request, env) {
  await authenticate(request, env);
  const joinUrl = String(env.FIVEM_JOIN_URL || '').trim();
  if (!/^fivem:\/\/connect\/[A-Za-z0-9.:-]+$/.test(joinUrl)) throw publicError('The FiveM join address is not configured.', 503);
  return json({ joinUrl });
}

async function listForms(request, env) {
  const forms = (await listContent(env, 'forms')).filter(form => form.status === 'open');
  const auth = await authenticate(request, env, false);
  const allSubmissions = await listContent(env, 'submissions');
  const submissions = auth ? allSubmissions.filter(item => item.userId === auth.user.id) : [];
  const suggestions = allSubmissions.filter(item => item.formId === 'suggestion' && !item.ticket).map(item => ({ id: item.id, formId: item.formId, formTitle: item.formTitle, values: item.values, status: item.status, user: item.user, createdAt: item.createdAt, staffResponse: item.staffResponse || '', votes: Number(item.votes || 0) }));
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
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const submission = {
    id,
    formId: form.id,
    formTitle: form.title,
    values,
    status: form.ticketEnabled ? 'open' : 'received',
    userId: auth.user.id,
    user: publicUser(auth.user),
    createdAt,
    ...(form.ticketEnabled ? { ticket: true, ticketNumber: `VR-${id.slice(0, 8).toUpperCase()}`, claimedBy: null, messages: [], updatedAt: createdAt } : {}),
  };
  await putContent(env, 'submissions', submission.id, submission);
  return json({ submission }, 201);
}

async function addTicketMessage(request, env) {
  const auth = await authenticate(request, env);
  const ticket = await ticketFromRequest(request, env);
  const body = await bodyJson(request);
  const isMember = ticket.userId === auth.user.id;
  const isStaffReply = body.asStaff === true && hasResourcePermission(auth, 'submissions.manage', ticket.formId);
  if (!isMember && !isStaffReply) throw publicError('You do not have access to that ticket.', 403);
  if (ticket.status === 'closed' && isStaffReply) throw publicError('Reopen this ticket before sending a staff reply.', 409);
  if (isStaffReply && ticket.claimedBy?.id !== auth.user.id) throw publicError(ticket.claimedBy ? 'This ticket is claimed by another staff member.' : 'Claim this ticket before replying.', 409);
  const message = String(body.message || '').trim();
  if (!message) throw publicError('Write a message before sending.', 400);
  if (message.length > 5000) throw publicError('Ticket messages can be up to 5,000 characters.', 400);
  const messages = Array.isArray(ticket.messages) ? ticket.messages.slice(-499) : [];
  messages.push({ id: crypto.randomUUID(), body: message, senderType: isStaffReply ? 'staff' : 'member', sender: publicUser(auth.user), createdAt: new Date().toISOString() });
  ticket.messages = messages;
  ticket.updatedAt = new Date().toISOString();
  if (!isStaffReply && isMember && ['resolved', 'closed'].includes(ticket.status)) ticket.status = 'open';
  await putContent(env, 'submissions', ticket.id, ticket);
  return json({ ticket });
}

async function claimTicket(request, env) {
  const auth = await authenticate(request, env);
  const ticket = await ticketFromRequest(request, env);
  requireResourcePermission(auth, 'submissions.manage', ticket.formId);
  if (ticket.claimedBy?.id && ticket.claimedBy.id !== auth.user.id && !auth.permissions.includes('permissions.manage')) throw publicError(`This ticket is already claimed by ${ticket.claimedBy.name || 'another staff member'}.`, 409);
  ticket.claimedBy = { ...publicUser(auth.user), name: auth.user.global_name || auth.user.username };
  if (ticket.status === 'open') ticket.status = 'claimed';
  ticket.updatedAt = new Date().toISOString();
  await putContent(env, 'submissions', ticket.id, ticket);
  return json({ ticket });
}

async function updateTicketStatus(request, env) {
  const auth = await authenticate(request, env);
  const ticket = await ticketFromRequest(request, env);
  requireResourcePermission(auth, 'submissions.manage', ticket.formId);
  if (!ticket.claimedBy) throw publicError('Claim this ticket before changing its status.', 409);
  if (ticket.claimedBy.id !== auth.user.id) throw publicError('Only the staff member handling this ticket can change its status.', 409);
  const body = await bodyJson(request);
  const status = String(body.status || '').toLowerCase();
  if (!['open', 'claimed', 'pending', 'resolved', 'closed'].includes(status)) throw publicError('Choose a valid ticket status.', 400);
  ticket.status = status;
  ticket.updatedAt = new Date().toISOString();
  await putContent(env, 'submissions', ticket.id, ticket);
  return json({ ticket });
}

async function ticketFromRequest(request, env) {
  const segments = new URL(request.url).pathname.split('/').filter(Boolean);
  const ticketId = decodeURIComponent(segments[segments.indexOf('tickets') + 1] || '');
  const ticket = ticketId ? await getContent(env, 'submissions', ticketId) : null;
  if (!ticket?.ticket) throw publicError('Ticket not found.', 404);
  return ticket;
}

function publicUser(user) {
  return { id: user.id, username: user.username, global_name: user.global_name || '' };
}

async function adminSnapshot(request, env) {
  const auth = await authenticate(request, env);
  requirePermission(auth, 'panel.view');
  const [allForms, allDepartments, allTeams, allRoleRules, rules, allSubmissions] = await Promise.all([listContent(env, 'forms'), listContent(env, 'departments'), listContent(env, 'teams'), listContent(env, 'roleRules'), getContent(env, 'rules', 'site-rules'), listContent(env, 'submissions')]);
  const canConfigure = auth.permissions.includes('permissions.manage');
  const forms = allForms.filter(form => canConfigure || hasResourcePermission(auth, 'forms.manage', form.id) || hasResourcePermission(auth, 'submissions.view', form.id) || hasResourcePermission(auth, 'submissions.manage', form.id));
  const departments = allDepartments.filter(department => canConfigure || hasResourcePermission(auth, 'departments.manage', department.id));
  const teams = canConfigure ? sortByOrder(allTeams) : [];
  const submissions = allSubmissions.filter(item => hasResourcePermission(auth, 'submissions.view', item.formId) || hasResourcePermission(auth, 'submissions.manage', item.formId));
  const roleRules = canConfigure ? allRoleRules : [];
  return json({ forms, departments, teams, submissions, roleRules, rules });
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
    if (existing.ticket) throw publicError('Use the ticket controls to update this ticket.', 409);
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
  if (collection === 'forms') {
    if (!value.title || !Array.isArray(value.fields)) throw publicError('Form title and fields are required.', 400);
    value.status = ['draft', 'open', 'closed'].includes(value.status) ? value.status : 'draft';
    value.ticketEnabled = Boolean(value.ticketEnabled);
  }
  if (collection === 'departments') {
    if (!value.name || !value.slug) throw publicError('Department name and slug are required.', 400);
    value.publishState = value.publishState === 'draft' ? 'draft' : 'published';
  }
  if (collection === 'teams') {
    value.name = String(value.name || '').trim().slice(0, 80);
    value.role = String(value.role || '').trim().slice(0, 80);
    value.bio = String(value.bio || '').trim().slice(0, 600);
    value.initials = String(value.initials || '').trim().slice(0, 4).toUpperCase();
    value.imageUrl = safeHttpUrl(value.imageUrl);
    value.order = Math.max(0, Math.min(999, Number(value.order) || 0));
    if (!value.name || !value.role) throw publicError('Team member name and role are required.', 400);
  }
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
function sortByOrder(items) { return [...items].sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0) || String(a.name || '').localeCompare(String(b.name || ''))); }
function safeHttpUrl(value) { const text = String(value || '').trim(); if (!text) return ''; try { const url = new URL(text); return ['http:', 'https:'].includes(url.protocol) ? url.href : ''; } catch { return ''; } }
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
