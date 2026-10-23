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
const releaseDate = '2026-10-24';
const basicAffiliateUrl = 'https://www.gumlet.com/?fpr=daisuke-okamoto-0d1593';
const pricingAffiliateUrl = 'https://www.gumlet.com/pricing?fpr=daisuke-okamoto-0d1593';
const affiliateUrls = new Set([basicAffiliateUrl, pricingAffiliateUrl]);
const gaSnippet = `<!-- Google tag (gtag.js) -->\n<link rel="preconnect" href="https://www.googletagmanager.com">\n<script async src="https://www.googletagmanager.com/gtag/js?id=G-9KJF5ZSXY5"></script>`;
const cspMeta = `<meta http-equiv="Content-Security-Policy" content="default-src 'self' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://googleads.g.doubleclick.net https://*.doubleclick.net https://static.cloudflareinsights.com; connect-src 'self' https://*.google-analytics.com https://www.google-analytics.com https://*.analytics.google.com https://analytics.google.com https://*.googletagmanager.com https://www.googletagmanager.com https://*.google.com https://www.google.com https://*.doubleclick.net https://stats.g.doubleclick.net https://googleads.g.doubleclick.net https://*.googleadservices.com https://www.googleadservices.com https://cloudflareinsights.com https://*.cloudflareinsights.com; img-src 'self' https: data:; style-src 'self' 'unsafe-inline' https:">`;
const routes = [
  { file: 'index.html', url: 'https://site-speedup.com/', type: 'top' },
  { file: 'vimeo-alternative/index.html', url: 'https://site-speedup.com/vimeo-alternative/', type: 'Article' },
  { file: 'pricing/index.html', url: 'https://site-speedup.com/pricing/', type: 'Article' },
  { file: 'guide/index.html', url: 'https://site-speedup.com/guide/', type: 'CollectionPage' },
  { file: 'guide/embed/index.html', url: 'https://site-speedup.com/guide/embed/', type: 'TechArticle' },
  { file: 'guide/paid-plan/index.html', url: 'https://site-speedup.com/guide/paid-plan/', type: 'Article' },
  { file: 'guide/vimeo-migration/index.html', url: 'https://site-speedup.com/guide/vimeo-migration/', type: 'Article' },
];

assert.equal(redirects, 'https://gumlet-japan-guide.pages.dev/* https://site-speedup.com/:splat 301!\n');
assert.equal((html.match(/<link rel="canonical" href="https:\/\/site-speedup\.com\/">/g) || []).length, 1);
assert(html.includes('<meta name="robots" content="index, follow">'));
assert(html.includes('"@type": "ItemList"'));
assert(html.includes('"numberOfItems": 6'));
assert(html.includes('実質最大48%OFF'));
assert(!html.includes('請求書払い'));
assert(!html.includes('銀行振込'));
assert.equal((html.match(/data-internal-guide="/g) || []).length, 6, 'six contextual guide callouts');
const internalGuideTargets = ['/vimeo-alternative/', '/guide/embed/', '/guide/paid-plan/', '/pricing/', '/guide/vimeo-migration/', '/guide/'];
for (const target of internalGuideTargets) {
  const anchor = [...html.matchAll(/<a\b[^>]*data-internal-guide="[^"]+"[^>]*href="([^"]+)"[^>]*>|<a\b[^>]*href="([^"]+)"[^>]*data-internal-guide="[^"]+"[^>]*>/g)].find(match => (match[1] || match[2]) === target);
  assert(anchor, `internal guide target: ${target}`);
  assert(!anchor[0].includes('data-gumlet-affiliate'), `internal link must not be an affiliate: ${target}`);
  assert(!anchor[0].includes('target="_blank"'), `internal link must remain same-tab: ${target}`);
  assert(!anchor[0].includes('nofollow'), `internal link must not be nofollow: ${target}`);
}
for (const phrase of [
  'Gumlet 料金プラン比較と帯域幅（Bandwidth）・従量課金シミュレーション、Vimeoとのコスト比較ガイドを見る',
  'VimeoからGumletへの乗り換え・移行手順｜動画の一括インポートから埋め込みコード差し替えまでを確認する',
  '動画のダウンロード防止、DRM（Widevine / FairPlay）、署名付きURL（Signed URL）・ドメイン制限の設定ガイドを読む',
  'WordPress・オンライン講座（LMS）への動画埋め込み方法とAPI・Webhook連携を確認する',
  'HLSアダプティブストリーミング、動画プレイヤーのカスタマイズ、自動トランスコード・CDN配信',
]) assert(html.includes(phrase), phrase);

for (const { file, url, type } of routes) {
  const page = text(file);
  assert(existsSync(path.join(root, file)), file);
  assert(page.includes(`<link rel="canonical" href="${url}">`), `${file}: canonical`);
  assert(page.includes(releaseDate), `${file}: modified date`);
  assert(page.startsWith('<!DOCTYPE html>'), `${file}: doctype`);
  assert(page.includes(`<head>\n${cspMeta}\n${gaSnippet}`), `${file}: CSP and GA placement`);
  assert.equal((page.match(/<meta http-equiv="Content-Security-Policy"/g) || []).length, 1, `${file}: CSP meta count`);
  assert.equal((page.match(/googletagmanager\.com\/gtag\/js\?id=G-9KJF5ZSXY5/g) || []).length, 1, `${file}: GA loader count`);
  assert(page.includes('PR / 公式紹介リンク</strong><span>'), `${file}: disclosure`);
  assert(page.includes('https://site-speedup.com/#organization'), `${file}: organization schema`);
  assert(!page.includes('請求書払い'), `${file}: invoice wording`);
  for (const jsonLd of page.matchAll(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/g)) JSON.parse(jsonLd[1]);
  if (type !== 'top') {
    assert(page.includes(`"@type":"${type}"`) || page.includes(`"@type": "${type}"`), `${file}: page schema type`);
    assert(page.includes('"@type":"BreadcrumbList"') || page.includes('"@type": "BreadcrumbList"'), `${file}: breadcrumb schema`);
    assert(page.includes('<nav class="breadcrumb-nav'), `${file}: visible breadcrumb`);
  }
  const affiliateAnchors = [...page.matchAll(/<a\b[^>]*href="https:\/\/www\.gumlet\.com\/[^\"]*"[^>]*>/g)];
  assert(affiliateAnchors.length > 0, `${file}: affiliate anchors`);
  affiliateAnchors.forEach(([anchor]) => {
    const href = anchor.match(/href="([^"]+)"/)[1];
    assert(affiliateUrls.has(href), `${file}: affiliate URL ${href}`);
    assert(anchor.includes('data-gumlet-affiliate="true"'), `${file}: affiliate tracking marker`);
    assert(anchor.includes('target="_blank"'), `${file}: affiliate new-tab`);
    assert(anchor.includes('rel="noopener noreferrer sponsored"'), `${file}: affiliate sponsored rel`);
  });
  assert(sitemap.includes(`<loc>${url}</loc>`), `${file}: sitemap URL`);
}
for (const file of ['vimeo-alternative/index.html', 'pricing/index.html', 'guide/index.html', 'guide/embed/index.html', 'guide/paid-plan/index.html', 'guide/vimeo-migration/index.html']) {
  const page = text(file);
  assert(page.includes('関連ガイド') || page.includes('RELATED GUIDES') || page.includes('START WITH A COMPARISON'), `${file}: reciprocal related links`);
  assert(page.includes('href="/"'), `${file}: homepage return link`);
}
assert(script.includes("const link = event.target.closest('a[data-gumlet-affiliate=\"true\"][href*=\"gumlet.com\"]');"));
assert(script.includes("window.gtag('event', 'affiliate_click', {"));
assert(!script.match(/https?:\/\//));
for (const selector of ['.topic-callout {', '.topic-callout-link', '.related-guides.section', 'overflow-x: auto', '-webkit-overflow-scrolling: touch']) assert(css.includes(selector), selector);
for (const url of routes.map(route => route.url)) assert(llms.includes(url), `llms URL: ${url}`);
assert(llms.includes('Vimeoとのコスト比較'));
assert(llms.includes('署名付きURL'));
assert(llms.includes('WordPress'));
assert.equal((sitemap.match(/<loc>https:\/\/site-speedup\.com\//g) || []).length, 7, 'seven sitemap URLs');
assert.equal((sitemap.match(new RegExp(`<lastmod>${releaseDate}<\\/lastmod>`, 'g')) || []).length, 7, 'seven current sitemap dates');
for (const bot of ['Googlebot', 'Google-Extended', 'OAI-SearchBot', 'ChatGPT-User', 'PerplexityBot', 'ClaudeBot']) assert(robots.includes(`User-agent: ${bot}\nAllow: /`), bot);
assert(robots.includes('Sitemap: https://site-speedup.com/sitemap.xml'));
for (const directive of ['Cache-Control: public, max-age=0, must-revalidate', 'https://analytics.google.com', 'https://static.cloudflareinsights.com', 'Last-Modified: Sat, 24 Oct 2026 00:00:00 GMT']) assert(headers.includes(directive), directive);
for (const asset of ['index.html', 'styles.css', 'script.js', '_headers', '_redirects', 'llms.txt', 'robots.txt', 'sitemap.xml', ...routes.slice(1).map(route => route.file)]) assert(existsSync(path.join(root, asset)), asset);
console.log('PASS: contextual internal links, reciprocal guide navigation, schema markup, crawler files, affiliate isolation, and static-site safeguards.');
