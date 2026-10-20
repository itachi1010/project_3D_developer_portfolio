# Cloudflare for bennyuchiha.tech

The domain remains registered with Hostinger. Cloudflare becomes the DNS provider
and optional reverse proxy; the website and its separate PostgreSQL database run
in the existing VPS K3s `demos` namespace. Traefik routes by hostname, so future
Cresol domains can use the same server without sharing application services.

1. In Cloudflare, add `bennyuchiha.tech` and choose the Free plan.
2. Review the DNS import against Hostinger. Preserve email MX/TXT, verification,
   and other required records. If DNSSEC is enabled at the registrar, follow
   Cloudflare's DNSSEC migration instructions before switching nameservers.
3. Set A `@` to `45.9.191.177`, initially DNS only. Remove conflicting website
   records targeting the old host. Do not invent an AAAA record for this IPv4-only
   deployment. Add `www` only when routing and certificate coverage include it.
4. Replace Hostinger nameservers with the exact pair assigned by Cloudflare.
   Wait for Cloudflare to report the zone Active; cached DNS can take time.
5. Once the portfolio origin has a valid certificate and HTTPS works, enable
   the orange-cloud proxy for the website record. Set SSL/TLS to Full (strict).
   Keep email-only records DNS only. Do not enable Flexible SSL.
6. Check the site and `/api/ready`, the phone model and resume download from
   Nigeria and another network. Do not cache `/api/*` or enable a blanket HTML
   cache rule over authenticated/admin traffic.

Cloudflare may improve delivery and DNS reliability, but cannot guarantee access
through every ISP, outage, or filtering rule. Other domains require their own
Cloudflare zones and matching Kubernetes hostname/certificate configuration.
No nameserver/DNS changes are made by the deployment scripts.

References:
- https://developers.cloudflare.com/dns/zone-setups/full-setup/setup/
- https://developers.cloudflare.com/ssl/origin-configuration/ssl-modes/full-strict/
- https://www.hostinger.com/support/1696789-how-to-change-nameservers-at-hostinger/
