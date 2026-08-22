# Venture website queue resource

1. Copy `venture_webqueue` into the FXServer `resources` directory.
2. Generate a long random secret. Store the same value in Cloudflare with `wrangler secret put FIVEM_SERVER_SECRET`.
3. Add these lines to `server.cfg`, before `ensure qbx_core`:

```cfg
set venture_queue_api "https://venture-rp-api.noscapedev.workers.dev"
set venture_queue_secret "YOUR_RANDOM_SECRET"
ensure venture_webqueue
```

Never commit the real secret to GitHub. The resource rejects direct connections unless the Discord account has a ready website reservation.
