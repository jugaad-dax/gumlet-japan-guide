# 2026-11-05 CRO implementation

This is the existing vanilla HTML/CSS/JS site deployed from GitHub `main` to Cloudflare Pages. No framework, external UI library, persistent database, payment integration, tracking pixel, or new Pages project was added.

## Local build and tests

Run `npm run build`. The existing `scripts/check.mjs` includes `check-calculator.mjs` (82 pure/DOM-harness tests) and `check-cro.mjs` (13 pages, original affiliate anchors, new components, required content). `npm run build` writes only public assets into `dist`; test fixtures and this document are not deployed.

The calculator scripts are classic deferred scripts loaded only on `/` and `/pricing/`. `pricing-data.js` is a frozen reference dataset with validation and pure estimate functions. `calculator.js` enhances the local form. No browser storage, form submission, or remote pricing API is used. `components/calculator.html` is the exact shared HTML copied into both pages; changing only that file does not rebuild the copies automatically. Update all three copies together and run the drift test.

The initial estimate is rendered in HTML to avoid inserting a large hidden region after page load. Inputs are disabled until enhancement succeeds. No-JavaScript users see initial pricing and a fallback explanation. Integer number fields permit exact 1,001/3,001/15,001-minute boundaries; range sliders stay in 100-unit increments. An invalid/blank field invalidates the whole estimate instead of silently coercing it.

## Fee assumptions

Reference date: 2026-11-05. Annual monthly equivalents: Creator $6, Growth $19, Business $99. Stored input-minute caps: 1,000, 3,000, 15,000. All paid plans include 3,000GB/month. Bandwidth overages are $0.15/$0.10/$0.06 per GB. Business-only excess storage uses a proportional reference at $3/1,000 minutes; actual invoice blocks/rounding/proration are not confirmed.

The requested heuristic is retained: dynamic watermark or storage >3,000 selects Business; custom player/CRM or storage >1,000 selects Growth; otherwise Creator. DRM alone does not force Business; $99/month is added to the selected paid plan and 100,000 monthly DRM views are included. Further DRM views are outside this calculator. High bandwidth can make a higher plan cheaper; the displayed candidate is not an exhaustive total-cost optimizer.

Referral mode assumes 20% off the annual base only. DRM, storage and bandwidth overages are undiscounted. The annual base is paid upfront; monthly additions and a fixed-usage annual reference total are distinguished. Public official materials did not confirm purchaser discount eligibility, period or annual stacking. The displayed offer is conditional and must be checked before purchase.

Cloudflare Stream storage is purchased in 1,000-minute blocks, rounded up at $5/block. Delivery is $1/1,000 minutes, estimated from decimal GB at 2Mbps. This bitrate is an explicit assumption, not measured video quality. Vimeo Core/Professional references use $24.50/$71 annual monthly equivalents, not a guarantee that the selected Vimeo plan meets the same storage, bandwidth or security needs. USD/JPY 150 is hypothetical, not a current exchange-rate quote.

## Affiliate safety and analytics

The 70 original affiliate anchor start tags are stored in `scripts/affiliate-baseline.json` and tested byte-for-byte in their original relative order. New anchors use only the original home or pricing referral href, `data-gumlet-affiliate="true"`, `_blank`, and `noopener noreferrer sponsored`. No calculator handler changes href or intercepts affiliate clicks. The shared click listener sends the original `affiliate_click` plus `cta_placement` and `content_type`; exceptions are caught without blocking native navigation.

`plan_calculator_used` sends once per page after a valid user interaction (200ms debounce) with plan, billingCycle and security only. It does not send storageMinutes, bandwidth, names or emails. It is not sent on initial rendering. GA4 remains configured for G-9KJF5ZSXY5 and G-8NDNNMSRBX. Existing CSP origins were not changed; only the Last-Modified date changed in `_headers`.

If reporting these added fields as GA4 custom dimensions is desired, configure the GA4 property separately. Receiving an event in browser dataLayer does not prove its appearance in the GA4 reporting interface. QA browser sessions intercept Google requests to avoid generating test traffic.

## Editorial and verification boundaries

UI navigation/checkout cards are explicitly conceptual, not live Gumlet screenshots. Billing is confirmed in official documentation; a literal Billing > Plans hierarchy was not verified. The 60-day referral cookie is an official attribution period, not a guaranteed discount or cookie retention in every browser.

The current pricing feature data lists Creator HLS/DASH, whereas official Video FAQs states that Creator cannot use HLS/MP4 URLs. The site acknowledges this difference and recommends checking direct-URL support before purchase. Growth is retained as the requested conservative custom-player/CRM candidate, not an assertion that Creator categorically lacks HLS.

LMS tables are official-document-based configuration guidance, not tested native integrations. UTAGE, Teachable, Kajabi, Thinkific, LearnDash and MemberPress have different HTML/embed/access constraints. Simple Membership is a general WordPress membership candidate and was not individually verified. Allowed Referrers should use actual embed-page hosts, not blindly the media CDN or identity-provider domains. Membership entitlement and video access protection are separate.

The three use-case cards are hypothetical models, not client results. Image Growth is a separate contract at $32 annual monthly equivalent ($39 monthly); no Image referral discount is assumed. No invented performance gain, conversion rate, customer or complete-copy-prevention guarantee is included. The existing showcase and all four real embedded demo players are preserved.

Vimeo On Demand ends November 20, 2026 according to official Help. This is distinct from ending all Vimeo hosting. Selling, entitlement management and video delivery require separate components; no built-in Gumlet Stripe/PPV integration is asserted. Bunny Stream is a player-based video platform, not merely general CDN. Basic protection and $99/month-per-library Enterprise DRM plus licenses are distinguished. Wistia Business and Signals are separate annual-price marketing tiers.

## Sources

- Gumlet pricing: https://www.gumlet.com/pricing/
- Gumlet FAQ: https://docs.gumlet.com/video/getting-started/faqs
- Gumlet affiliate: https://www.gumlet.com/affiliate/
- Gumlet engagement: https://docs.gumlet.com/video/manage-videos/video-engagement-section
- Gumlet Webhooks: https://docs.gumlet.com/developers/webhooks
- Gumlet WordPress Video: https://docs.gumlet.com/video/embed-stream/gumlet-wordpress-video-plugin
- Cloudflare Stream pricing: https://developers.cloudflare.com/stream/pricing/
- Vimeo current pricing: https://vimeo.com/upgrade-plan
- Vimeo VOD seller notice: https://help.vimeo.com/hc/en-us/articles/12427367616913-How-to-start-selling-with-Vimeo-On-Demand
- Vimeo VOD purchaser notice: https://help.vimeo.com/hc/en-us/articles/12426042296465-About-purchasing-Vimeo-On-Demand-titles
- Wistia pricing: https://wistia.com/pricing
- Bunny Stream pricing: https://bunny.net/docs/stream/pricing

Tool-specific official source links are printed alongside each LMS table in the articles.
