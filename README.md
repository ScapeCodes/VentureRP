# Venture Roleplay website

A static GitHub Pages frontend with Discord login, configurable community forms, department pages, and a role-gated staff Control Room.

## Pages

- `index.html` — main site and OAuth return page
- `forms/index.html` — public suggestions browser at `/forms/`
- `profile/index.html` — private member area at `/profile/`
- `departments/index.html` — dynamic department pages at `/departments/?department=slug`
- `mod/index.html` — staff Control Room at `/mod/`
- `join/index.html` — public team directory at `/join/`, managed by administrators in the Control Room
- `rules/index.html` — public community rules page

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

## Form tickets

- Enable **Open a private ticket for every submission** in a form's Control Room editor.
- The submitted answers become the first entry in a private ticket. Members read and reply through **Profile → My submissions**.
- Staff use the Control Room **Tickets** queue. `submissions.view` grants read-only access; `submissions.manage` allows a staff member to claim, reply, and change status.
- Scoped permissions such as `submissions.manage:ban-appeal` limit a Discord role to tickets opened by that one form.
- Ticket messages are refresh-based. No browser polling or live socket connection is required.
- Ticket conversations use the authenticated full-page route at `tickets/index.html`; members reach it from their profile and staff reach it from the Control Room queue.

## Dedicated forms

- Every open form uses `form/index.html` with a URL such as `/form/?form=ban-appeal` instead of opening inside a dialog.
- Browser drafts, conditional questions, review confirmation, ticket creation, and submission success are handled on the dedicated page.
- The Control Room form list includes a read-only **View form** preview, including forms that are still drafts.

## FiveM live status and joining

- The homepage reads live capacity through the Worker endpoint `/api/fivem/status`; the Worker fetches the configured FXServer `dynamic.json` endpoint without exposing player identities.
- `/api/fivem/join` requires a valid Discord-authenticated website session before returning the `fivem://connect/...` launch URL.
- The homepage queue is authoritative: inactive waiting entries expire after 90 seconds, and ready slots are reserved for three minutes.
- The `fivem/venture_webqueue` resource verifies the connecting player's Discord ID and rejects direct queue bypasses before handing an approved connection to `qbx_core`.
- Configure the non-secret `FIVEM_STATUS_URL` and `FIVEM_JOIN_URL` values in `server/wrangler.toml`.
- Install the resource and configure the private shared secret as described in `fivem/venture_webqueue/README.md`. Never commit that secret.

## Drafts

- New and duplicated forms start as `draft`. Draft forms remain available to staff in the Control Room but cannot receive submissions or appear in member form lists.
- New and duplicated department pages start as `draft`. Draft departments remain editable in the Control Room but are excluded from the public API, navigation dropdown, and public department pages.
- Change a form to `open` or a department page to `published` in its editor when it is ready for visitors.

Never add a Discord client secret or bot token to GitHub Pages or `portal-config.js`.
