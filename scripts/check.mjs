import { readFileSync, existsSync } from 'node:fs';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const text = name => readFileSync(path.join(root, name), 'utf8');
const html = text('index.html');
const css = text('styles.css');
const script = text('script.js');
const headers = text('_headers');
const llms = text('llms.txt');
const sitemap = text('sitemap.xml');
const robots = text('robots.txt');
const redirects = text('_redirects');
const basicAffiliateUrl = 'https://www.gumlet.com/?fpr=daisuke-okamoto-0d1593';
const pricingAffiliateUrl = 'https://www.gumlet.com/pricing?fpr=daisuke-okamoto-0d1593';
const affiliateUrls = new Set([basicAffiliateUrl, pricingAffiliateUrl]);
const gaSnippet = `<!-- Google tag (gtag.js) -->
<link rel="preconnect" href="https://www.googletagmanager.com">
<script async src="https://www.googletagmanager.com/gtag/js?id=G-9KJF5ZSXY5"></script>`;
const cspMeta = `<meta http-equiv="Content-Security-Policy" content="default-src 'self' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://googleads.g.doubleclick.net https://*.doubleclick.net https://static.cloudflareinsights.com; connect-src 'self' https://*.google-analytics.com https://www.google-analytics.com https://*.analytics.google.com https://analytics.google.com https://*.googletagmanager.com https://www.googletagmanager.com https://*.google.com https://www.google.com https://*.doubleclick.net https://stats.g.doubleclick.net https://googleads.g.doubleclick.net https://*.googleadservices.com https://www.googleadservices.com https://cloudflareinsights.com https://*.cloudflareinsights.com; img-src 'self' https: data:; style-src 'self' 'unsafe-inline' https:">`;
const routes = [
  { file: 'index.html', url: 'https://site-speedup.com/' },
  { file: 'vimeo-alternative/index.html', url: 'https://site-speedup.com/vimeo-alternative/' },
  { file: 'pricing/index.html', url: 'https://site-speedup.com/pricing/' },
  { file: 'guide/index.html', url: 'https://site-speedup.com/guide/' },
  { file: 'guide/embed/index.html', url: 'https://site-speedup.com/guide/embed/' },
  { file: 'guide/paid-plan/index.html', url: 'https://site-speedup.com/guide/paid-plan/' },
  { file: 'guide/vimeo-migration/index.html', url: 'https://site-speedup.com/guide/vimeo-migration/' },
];

assert.equal(redirects, 'https://gumlet-japan-guide.pages.dev/* https://site-speedup.com/:splat 301!\n');
assert.equal((html.match(/<link rel="canonical" href="https:\/\/site-speedup\.com\/">/g) || []).length, 1);
assert(html.includes('<title>Vimeoの料金値上げ・帯域制限対策に「Gumlet」｜プラン比較と実質48%OFF導入ガイド【site-speedup.com】</title>'));
assert(html.includes('<meta name="description" content="Vimeoの料金・プラン・帯域幅の条件を比較し、次世代動画配信基盤Gumletの導入を解説。'));
assert(html.includes('<meta name="robots" content="index, follow">'));
assert(html.includes('<meta property="og:type" content="website">'));
assert(html.includes('<meta property="og:url" content="https://site-speedup.com/">'));
assert(html.includes('<meta name="twitter:card" content="summary_large_image">'));
assert.equal((html.match(/<h1>/g) || []).length, 1);
assert(html.includes('<h1>Vimeoの帯域制限・プラン値上げ対策に｜<span>次世代動画配信基盤「Gumlet」</span></h1>'));
for (const term of [
  'Vimeoの料金プラン値上げ・帯域制限の課題とGumletの徹底比較',
  'Vimeoの帯域幅（転送量）超過コストを1/3〜1/5に削減できる理由',
  '実質最大48%OFF！年間契約割引＋当サイト限定20%OFF特典の仕組み',
  'VimeoからGumletへの乗り換え・導入3ステップ',
  'よくある質問（FAQ）',
]) assert(html.includes(term), term);
assert(html.includes('id="pricing-comparison"'));
assert(html.includes('id="bandwidth-cost"'));
assert(html.includes('id="discount-details"'));
assert(html.includes('Creator/Growth $0.10/GB、Business $0.06/GB'));
assert(html.includes('1 − (1 − 0.35) × (1 − 0.20) = 48%'));
assert(html.includes('限定20%OFF特典付きでGumletを無料体験する'));
assert(html.includes('Vimeoとの料金・帯域比較を見る'));
assert(html.includes('Gumlet公式の料金プラン詳細（限定割引対象）を見る'));
assert(html.includes('class="hero-player"'));
assert(html.includes('class="cost-estimate"'));
assert(html.includes('id="mobile-sticky-cta"'));
assert(html.includes('<section class="operator-info"'));
assert(html.includes('プライバシーポリシー'));
assert(html.includes('PR / 公式紹介リンク'));
assert(html.includes('https://jugaad.tokyo/'));
assert(!html.includes('Gumletの配信最適化アーキテクチャ概要'));
assert(!html.includes('src="/assets/gumlet-speed-architecture.webp"'));
assert(!html.includes('請求書払い'));
assert(!html.includes('銀行振込'));

for (const { file, url } of routes) {
  const page = text(file);
  assert(existsSync(path.join(root, file)), file);
  assert(page.includes(`<link rel="canonical" href="${url}">`), `${file}: canonical`);
  assert(page.includes('2026-10-17'), `${file}: modified date`);
  assert(page.startsWith('<!DOCTYPE html>'), `${file}: doctype`);
  assert(page.includes(`<head>\n${cspMeta}\n${gaSnippet}`), `${file}: CSP and unified GA tag placement`);
  assert.equal((page.match(/<meta http-equiv="Content-Security-Policy"/g) || []).length, 1, `${file}: CSP meta count`);
  assert.equal((page.match(/googletagmanager\.com\/gtag\/js\?id=G-9KJF5ZSXY5/g) || []).length, 1, `${file}: tag loader count`);
  assert.equal((page.match(/gtag\('config', 'G-9KJF5ZSXY5'\);/g) || []).length, 1, `${file}: GA4 config count`);
  assert.equal((page.match(/gtag\('config', 'G-8NDNNMSRBX'\);/g) || []).length, 1, `${file}: Ads config count`);
  assert(page.includes('PR / 公式紹介リンク</strong><span>当サイトはGumlet公式パートナーとして正規の紹介リンク（アフィリエイト広告）を含んでおり、本ページ経由で全有料プラン20%OFFが自動適用されます。</span>'), `${file}: disclosure`);
  assert(page.includes('神奈川県三浦市南下浦町上宮田3202番14の509'), `${file}: operator address`);
  assert(page.includes('https://site-speedup.com/#organization'), `${file}: organization schema`);
  assert(!page.includes('請求書払い'), `${file}: invoice wording`);
  assert(!page.includes('銀行振込'), `${file}: bank transfer wording`);
  for (const jsonLd of page.matchAll(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/g)) JSON.parse(jsonLd[1]);
  const affiliateAnchors = [...page.matchAll(/<a\b[^>]*href="https:\/\/www\.gumlet\.com\/[^\"]*"[^>]*>/g)];
  assert(affiliateAnchors.length > 0, `${file}: affiliate anchors`);
  affiliateAnchors.forEach(([anchor]) => {
    const href = anchor.match(/href="([^"]+)"/)[1];
    assert(affiliateUrls.has(href), `${file}: affiliate URL ${href}`);
    assert(anchor.includes('data-gumlet-affiliate="true"'), `${file}: tracking marker`);
    assert(anchor.includes('target="_blank"'), `${file}: target blank`);
    assert(anchor.includes('rel="noopener noreferrer sponsored"'), `${file}: sponsored rel`);
  });
  assert(sitemap.includes(`<loc>${url}</loc>`), `${file}: sitemap URL`);
}
assert((html.match(new RegExp(`href="${basicAffiliateUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`, 'g')) || []).length >= 1, 'root basic CTA');
assert((html.match(new RegExp(`href="${pricingAffiliateUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`, 'g')) || []).length >= 3, 'root pricing CTAs');
assert(!html.includes('utm_source=lp'));

assert(script.includes("const link = event.target.closest('a[href*=\"gumlet.com\"]');"));
assert(script.includes("window.gtag('event', 'affiliate_click', {"));
for (const term of ["event_category: 'outbound'", 'event_label: link.href', 'link_url: link.href', "link_text: (link.innerText || '').trim().slice(0, 50)", "transport_type: 'beacon'"]) assert(script.includes(term), term);
assert(script.includes('IntersectionObserver'));
assert(!script.match(/https?:\/\//));

for (const directive of [
  'Cache-Control: public, max-age=0, must-revalidate',
  'Strict-Transport-Security: max-age=31536000; includeSubDomains',
  'X-Content-Type-Options: nosniff',
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://googleads.g.doubleclick.net https://*.doubleclick.net https://static.cloudflareinsights.com",
  'https://analytics.google.com',
  'https://stats.g.doubleclick.net',
  'https://www.googleadservices.com',
  'https://cloudflareinsights.com',
  'Last-Modified: Fri, 17 Oct 2026 00:00:00 GMT',
]) assert(headers.includes(directive), directive);
for (const selector of ['--cta: #059669', '.mobile-sticky-cta', '.hero-savings-badge', '.hero-value-list', '.bandwidth-grid', '.discount-table', 'overflow-x: auto', 'overflow-x: clip', '-webkit-overflow-scrolling: touch']) assert(css.includes(selector), selector);
for (const term of ['https://site-speedup.com/guide/paid-plan/', 'https://site-speedup.com/guide/vimeo-migration/', '最終更新日: 2026-10-17', '実質最大48%OFF']) assert(llms.includes(term), term);
assert.equal((sitemap.match(/<lastmod>2026-10-17<\/lastmod>/g) || []).length, 7);
assert(robots.includes('User-agent: *') && robots.includes('Allow: /') && robots.includes('Sitemap: https://site-speedup.com/sitemap.xml'));
for (const asset of [
  'index.html', 'styles.css', 'script.js', '_headers', '_redirects', 'favicon.svg', 'og-image.svg', 'og-image.png', 'assets/og-image.png', 'assets/gumlet-image-delivery.webp', 'assets/gumlet-video-api.webp', 'llms.txt', 'robots.txt', 'sitemap.xml', 'vimeo-alternative/index.html', 'pricing/index.html', 'guide/index.html', 'guide/embed/index.html', 'guide/paid-plan/index.html', 'guide/vimeo-migration/index.html',
]) assert(existsSync(path.join(root, asset)), asset);
assert(!existsSync(path.join(root, 'assets/gumlet-speed-architecture.webp')));

console.log('PASS: CSP Google allowlist, Google tag/Ads integration, affiliate event tracking, two-link routing, SEO/FAQ JSON-LD, legal disclosures, and Core Web Vitals safeguards.');
