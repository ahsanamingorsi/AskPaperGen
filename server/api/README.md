# Account and points service

The static site can stay on GitHub Pages. Google login, payments, balances and paid exports run in this separate Cloudflare Worker with D1, private R2 storage and Browser Rendering. Editing and local OCR remain free and offline. Official PDF and JSON exports cost 1 point; retrying the same export request does not charge twice. Browser screenshots and native printing of a preview cannot be prevented.

Packages: 10 points for Rs200, 50 for Rs900, 100 for Rs1600. Payments are manually reviewed; entering a transaction reference never credits points.

## Configure and deploy

1. Run `npm ci` in `server/api`, then `npx wrangler login` using your Cloudflare account.
2. Copy `wrangler.example.toml` to `wrangler.toml` (ignored by Git).
3. Run `npx wrangler d1 create askpapergen-accounts`; copy the returned database ID into the configuration. Run `npx wrangler r2 bucket create askpapergen-exports`. Enable Browser Rendering for the account and retain the BROWSER binding. Keep the R2 bucket private.
4. Create a Google OAuth **Web application** client. Add `https://ahsanamingorsi.github.io` as an authorized JavaScript origin (origins have no path). Add your local origin if testing. Set the client ID in `GOOGLE_CLIENT_ID`. Configure the Google consent screen and publish it or add test users as appropriate. Use the site's privacy page URL on the consent screen.
5. Set the actual receiving account name and number for JazzCash and/or Easypaisa. A method remains unavailable until both fields are filled. Set `ALLOWED_ORIGINS` to your actual frontend origins.
6. Run `npx wrangler d1 migrations apply askpapergen-accounts --remote`, then `npm run deploy`.
7. Set `apiUrl` in `js/account-config.js` to the deployed HTTPS Worker URL, with no trailing slash. Run `node scripts/release.mjs` from the repository root and publish the frontend using your existing hosting workflow.
8. Sign in with your own Google account. Query `npx wrangler d1 execute askpapergen-accounts --remote --command "SELECT google_sub,email FROM users"`. Set your own `google_sub` in `ADMIN_GOOGLE_SUBS`, then redeploy the Worker. Admin rights come exclusively from this server configuration.

The Google client ID and API URL are public configuration, not passwords. Never put service secrets in frontend JavaScript. Sessions expire after seven days; users sign in again after closing their browser session.

## Verify before accepting payments

Sign in, submit a transaction reference, and confirm that the balance remains unchanged. Open `admin.html` as the configured administrator. Check the reference and amount in the **receiving payment account** before checking the verification box and approving. Approval credits the package exactly once. Rejection credits nothing. Then export a paper and check that exactly one point was deducted. Retry the same download and check that the balance does not change. Test insufficient balance and failed exports.

## Tests and operations

`npm test` checks nonce replay, authentication, origin restrictions, manual payment approval, duplicate credits, export idempotency, insufficient funds, concurrent debits and failure refunds against SQLite.

Generated files stay in private R2 and are served only through an authenticated export request. The Worker stores Google identity, hashed session tokens, payment references, ledger entries and export records in D1. Drafts stay in browser storage until exported. Back up D1 and maintain payment records. The five-minute scheduled job refunds abandoned exports after ten minutes and deletes expired sessions and login challenges. An interrupted PDF may therefore require waiting for the refund before starting a new request.

Google sign-in and live Cloudflare PDF rendering require configured external services; unit tests use injected identity and PDF adapters and do not verify a live Google account or a live deployment.

Official references: [Google token verification](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token), [Cloudflare D1](https://developers.cloudflare.com/d1/worker-api/d1-database/), [Cloudflare Playwright](https://developers.cloudflare.com/browser-run/playwright/).
