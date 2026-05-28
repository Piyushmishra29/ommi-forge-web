# Deploying Ommi Forge

The site is a static export (`output: 'export'`), so `pnpm build` emits
a fully self-contained `out/` directory with HTML, CSS, JS, fonts,
videos, STLs, and the security-header sidecars (`_headers`,
`_redirects`, `.htaccess`) all pre-copied from `public/`. Any static
host can serve it.

Two supported routes:

- [Vercel](#vercel) — recommended for previews, easy rollbacks, and
  honouring `vercel.json` headers.
- [Hostinger](#hostinger) — current production host; switches the
  existing WordPress site over to the static export.

---

## Vercel

Prerequisites:

- `pnpm install -g vercel` (or `npm i -g vercel`)
- `vercel login`

First deploy from the repo root:

```bash
vercel link              # one-time: pick the team + project
vercel --prod            # build + deploy production
```

Subsequent deploys are just `vercel --prod`. Vercel reads
`vercel.json` for:

- `buildCommand: pnpm build`
- `outputDirectory: out`
- `framework: null` (we ship a plain static export, no Vercel-Next
  hybrid runtime needed)
- `cleanUrls: true` + `trailingSlash: true` to match
  `next.config.ts`
- A `headers` block that mirrors `public/_headers` (CSP, HSTS,
  X-Frame-Options, Referrer-Policy, Permissions-Policy, plus
  `Cache-Control: immutable` for `/assets/*` and `/_next/static/*`).
  Vercel does **not** read `public/_headers` — only `vercel.json`
  headers are honoured on Vercel.

Env vars to set under **Project Settings → Environment Variables**
(all optional, all `NEXT_PUBLIC_*` because they bake into the static
bundle):

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_FORMSPREE_URL` | Contact form endpoint |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | Enable Plausible analytics |
| `NEXT_PUBLIC_PLAUSIBLE_SRC` | Self-hosted Plausible script URL (optional) |

---

## Hostinger

Hostinger serves Apache + PHP, but for this build we only need static
HTML — the bundled `public/.htaccess` (auto-copied to `out/.htaccess`
during `pnpm build`) sets the security headers and the redirects.

### 1. Build locally

```bash
pnpm install
pnpm build
```

The export lives in `out/`. Verify these are present:

```bash
ls out/.htaccess out/_headers out/_redirects
```

If any are missing, re-run `pnpm build` — Next's static export copies
everything in `public/` to `out/`, so the sidecars come along for free
(no extra script step required).

### 2. Upload

Use Hostinger's file manager or SFTP/FTP:

```
Host:    your-hostinger-host (see hPanel → Files → FTP Accounts)
Port:    21 (FTP) or 22 (SFTP)
User:    your hPanel FTP user
Pass:    your hPanel FTP password
Target:  /public_html/
```

Upload **the contents of `out/`** (not the folder itself) into
`public_html/`. Make sure hidden files (`.htaccess`) are included —
many GUI FTP clients hide dotfiles by default; enable "show hidden
files" before transferring.

### 3. DNS / cutover

The existing WordPress site lives at `ommiforge.com` on the same
Hostinger account. Two soft-cutover options:

1. **Sub-domain preview** (recommended): create `new.ommiforge.com`
   in hPanel → Domains → Subdomains, pointed at a new directory
   (e.g. `public_html_new/`). Upload there first, QA, then swap.
2. **In-place replace**: archive the current `public_html/` to
   `public_html.wp-backup/`, then upload the new build into the
   freshly emptied `public_html/`. WordPress is offline during the
   swap; budget a maintenance window.

Either way, keep the WordPress backup until the new site has run for
at least a week.

### Optional: Hostinger build script

There is **no** `deploy:hostinger` npm script because `pnpm build`
already produces an upload-ready `out/` — the `public/.htaccess` is
copied automatically by Next's static export. If a future need arises
(e.g. rewriting headers, generating an FTP manifest), add
`scripts/build-hostinger.mjs` and wire it as
`"deploy:hostinger": "pnpm build && node scripts/build-hostinger.mjs"`
in `package.json`.

---

## Smoke tests after deploy

- `curl -I https://your-domain/` — verify the security headers
  (`x-frame-options`, `content-security-policy`, HSTS) are present.
- Open `/contact/` and submit a test message; check the Formspree
  inbox.
- Open `/renders/a/` and confirm the STL viewer loads (large `.stl`
  file; verify network and decompression).
- Browser devtools → Network — `plausible.io` should only appear if
  `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` was set at build time.

---

## Temporary VPS client-preview link

For sending a preview to the client on a plain VPS (nginx/Apache serving
`out/`), the audit surfaced a few host-config items. The static files are
correct; these are server-side settings the host needs.

### 1. Block search indexing (important)
`public/robots.txt` is set to `Disallow: /` for the preview phase so a
large client's unfinished site isn't indexed. **Revert to `Allow: /`
before production launch.** Also recommended on the VPS: add an
`X-Robots-Tag: noindex` response header for the preview host.

nginx:
```nginx
add_header X-Robots-Tag "noindex, nofollow" always;
```

### 2. Serve the branded 404 + make legacy redirects work
`public/_redirects` is Netlify-only and `public/.htaccess` carries only
security headers — neither runs on plain nginx. Two things to configure:

```nginx
# Branded 404 (also lets the client-side legacy-redirect script fire)
error_page 404 /404.html;

# Real redirects for old WordPress bookmarks (otherwise they 404)
location = /home/about-ommi-forge/ { return 308 /about/; }
location = /home/solutuion/        { return 308 /solutions/; }
location = /home/forged-products/  { return 308 /products/; }
location = /3d-renders/            { return 308 /renders/; }
location ~ ^/render-a/?$ { return 308 /renders/a/; }
location ~ ^/render-b/?$ { return 308 /renders/b/; }
location ~ ^/render-c/?$ { return 308 /renders/c/; }
location ~ ^/render-d/?$ { return 308 /renders/d/; }
location ~ ^/render-e/?$ { return 308 /renders/e/; }
location ~ ^/render-f/?$ { return 308 /renders/f/; }
location ~ ^/render-g/?$ { return 308 /renders/g/; }
location ~ ^/render-h-2/?$ { return 308 /renders/h/; }
location ~ ^/render-h/?$  { return 308 /renders/i/; }
```
(On Apache, add equivalent `RewriteRule`s + `ErrorDocument 404 /404.html`.)

### 3. Security headers on nginx
`vercel.json` / `_headers` / `.htaccess` don't apply on nginx. Replicate
the CSP/HSTS/X-Frame-Options from `public/.htaccess` in the nginx server
block if headers matter on the preview.

### 4. Contact form
The form is wired to Formspree but **does nothing useful unless
`NEXT_PUBLIC_FORMSPREE_URL` is set at build time**. On the preview build,
either set it (so test submissions actually arrive at
marketing@ommiforge.com) or leave it unset — the form now shows an
honest "email us directly" note instead of faking success.

### 5. OG link-preview card
`metadataBase` is `https://www.ommiforge.com`, so OG/Twitter card images
and canonicals resolve to the production domain. If `ommiforge.com` isn't
serving this build yet, the link-preview thumbnail (when the client
pastes the temp link in WhatsApp/Slack) may be wrong or blank — the
title/description text still render. To make the preview card correct on
the temp link, temporarily set `metadataBase` to the VPS URL and rebuild.

### 6. Don't upload the master assets
`_masters/` (raw 4K video, full-res JPG originals, wp-mirror) lives
outside `public/` and is gitignored — it never enters `out/`. Just upload
`out/` as-is (~120 MB).
