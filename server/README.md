# Venture RP API

The website remains a static GitHub Pages site. This Cloudflare Worker provides the parts a static host cannot safely provide: Discord code exchange, guild-role verification, shared storage, and server-enforced permissions.

## Deploy

1. In the Discord Developer Portal, add the Worker callback URL as an OAuth redirect:
   `https://YOUR-WORKER.workers.dev/auth/callback`
   Keep the existing GitHub Pages redirect as well if you want local demo sign-in.
2. Install Wrangler and authenticate: `npm install -g wrangler` then `wrangler login`.
3. From this directory, create the database: `wrangler d1 create venture-rp`.
4. Copy the returned database ID into `wrangler.toml`.
5. Apply the schema: `wrangler d1 execute venture-rp --remote --file=schema.sql`.
6. Store the Discord client secret: `wrangler secret put DISCORD_CLIENT_SECRET`.
7. In `wrangler.toml` or the Worker dashboard, set:
   - `DISCORD_GUILD_ID` to the Venture Discord server ID.
   - `OWNER_USER_IDS` to a comma-separated list of Discord user IDs that should always have full access. This bootstraps the permission editor.
8. Deploy with `wrangler deploy`.
9. Set `apiBaseUrl` in `../portal-config.js` to the deployed Worker URL and push the site to GitHub Pages.

Do not put the Discord client secret, bot token, or Worker session data in this repository. The API uses Discord's authorization-code flow, an HttpOnly OAuth state cookie, opaque hashed sessions, and checks permissions again on every protected request.
