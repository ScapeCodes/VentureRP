# Venture Roleplay website

A static GitHub Pages frontend with Discord login, configurable community forms, department pages, and a role-gated staff Control Room.

## Pages

- `index.html` — main site and OAuth return page
- `forms/index.html` — public suggestions browser at `/forms/`
- `profile/index.html` — private member area at `/profile/`
- `departments/index.html` — dynamic department pages at `/departments/?department=slug`
- `mod/index.html` — staff Control Room at `/mod/`
- `join/index.html` and `rules/index.html` — public pages with friendly folder URLs

The root-level `forms.html`, `profile.html`, `department.html`, `mod.html`, `join.html`, and `rules.html` files are compatibility redirects for old bookmarks.
- `server/` — optional but required-for-production Cloudflare Worker API

## Local preview

Serve the repository over HTTP rather than opening the HTML files directly:

```powershell
python -m http.server 8080
```

The frontend includes sample forms and departments in browser storage when `apiBaseUrl` is blank. Discord login uses the registered GitHub Pages redirect in this preview configuration. Shared data and staff access deliberately stay disabled without the API because browser-only role checks are not secure.

## Production setup

1. Publish this repository with GitHub Pages.
2. Deploy the API by following [`server/README.md`](server/README.md).
3. Put the Worker URL in `portal-config.js`.
4. Confirm these two exact redirects in the Discord application:
   - `https://scapecodes.github.io/VentureRP/`
   - `https://YOUR-WORKER.workers.dev/auth/callback`

The first Discord user IDs listed in the Worker's `OWNER_USER_IDS` setting can open the permission editor and grant capabilities to Discord roles. After a role change in Discord, the affected member should log out and back in so the site receives the current role list.

## Permissions

- `panel.view`
- `forms.manage`
- `submissions.view`
- `submissions.manage`
- `rules.manage`
- `departments.manage`
- `permissions.manage`

Form and department access can also be limited to one resource. The Control Room creates these scoped values automatically:

- `forms.manage:FORM_ID`
- `submissions.view:FORM_ID`
- `submissions.manage:FORM_ID`
- `departments.manage:DEPARTMENT_ID`

The unscoped version grants access to every resource of that type. A scoped version grants access only to the selected form or department.

Never add a Discord client secret or bot token to GitHub Pages or `portal-config.js`.
