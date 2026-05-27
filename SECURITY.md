# Security policy

This is a static brochure site for Ommi Forge Pvt. Ltd. It has no
backend, no authentication, and no database.

If you believe you've found a security issue (XSS in a third-party
embed, dependency CVE, exposed secret, etc.), please email
**marketing@ommiforge.com** with "Security" in the subject line, OR
open a private security advisory at
https://github.com/Piyushmishra29/ommi-forge-web/security/advisories/new

Please do not file public issues for security reports.

## Hosting / headers
The static build expects security headers to be supplied by the hosting
layer. See `public/_headers` (Netlify-style) and `public/.htaccess`
(Apache/Hostinger) for the baseline policy.
