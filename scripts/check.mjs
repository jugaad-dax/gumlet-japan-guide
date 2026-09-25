import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const text = name => readFileSync(path.join(root, name), 'utf8');
const html = text('index.html');
const css = text('styles.css');
const headers = text('_headers');
const llms = text('llms.txt');
const sitemap = text('sitemap.xml');
const redirects = text('_redirects');
const affiliate = [
  'https://www.gumlet.com/?fpr=daisuke-okamoto-0d1593',
  'https://www.gumlet.com/pricing?fpr=daisuke-okamoto-0d1593',
  'https://www.gumlet.com/analyzer?fpr=daisuke-okamoto-0d1593',
];
const routes = [
  { file: 'index.html', url: 'https://site-speedup.com/' },
  { file: 'vimeo-alternative/index.html', url: 'https://site-speedup.com/vimeo-alternative/' },
  { file: 'pricing/index.html', url: 'https://site-speedup.com/pricing/' },
  { file: 'guide/embed/index.html', url: 'https://site-speedup.com/guide/embed/' },
];

assert.equal(redirects, 'https://gumlet-japan-guide.pages.dev/* https://site-speedup.com/:splat 301!\n');
assert.equal((html.match(/<link rel="canonical" href="https:\/\/site-speedup\.com\/">/g) || []).length, 1);
assert(!html.includes('ジュガード株式会社の公式サイトでは、メイン動画の配信基盤としてGumletを採用しています。'));
assert(html.includes('美容室YQUIMのサイトでは、メイン動画の配信基盤としてGumletを採用しています。'));
assert(html.includes('Core Web Vitals（LCP/CLS）'));
assert(html.includes('https://www.gumlet.com/analyzer?fpr=daisuke-okamoto-0d1593'));
assert(html.includes('https://www.gumlet.com/pricing?fpr=daisuke-okamoto-0d1593'));
for (const url of ['https://www.gumlet.com/pricing/', 'https://vimeo.com/pricing', 'https://aws.amazon.com/cloudfront/pricing/', 'https://aws.amazon.com/s3/pricing/', 'https://docs.gumlet.com/', 'https://jugaad.tokyo/']) assert(html.includes(url), url);
for (const navUrl of ['/vimeo-alternative/', '/pricing/', '/guide/embed/']) assert(html.split(navUrl).length - 1 >= 2, navUrl);
for (const term of ['神奈川県三浦市南下浦町上宮田3202番14の509', 'okamoto@jugaad.tokyo', 'MVM戦略策定・SaaS選定／導入支援・AI駆動Web実装・広告初期検証']) assert(html.includes(term), term);
for (const date of ['2026-09-25', '2026-09-25T00:00:00+09:00']) assert(html.includes(date), date);
for (const url of affiliate) {
  const anchors = [...html.matchAll(new RegExp(`<a\\b[^>]*href="${url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>`, 'g'))];
  assert(anchors.length > 0, url);
  anchors.forEach(([anchor]) => { assert(anchor.includes('target="_blank"')); assert(anchor.includes('rel="sponsored noopener"')); });
}
const inline = html.match(/<script>([\s\S]*?)<\/script>/)[1];
assert(headers.includes(`sha256-${createHash('sha256').update(inline).digest('base64')}`));
for (const directive of ['/_astro/*', '/_next/static/*', '/assets/*', 'Cache-Control: public, max-age=0, must-revalidate']) assert(headers.includes(directive), directive);
for (const route of routes) {
  assert(existsSync(path.join(root, route.file)), route.file);
  const page = text(route.file);
  assert(page.includes(`<link rel="canonical" href="${route.url}">`), route.url);
  assert(page.includes('2026-09-25'), route.file);
  assert(page.includes('PR</strong><span>本ページはプロモーション・アフィリエイト広告を含みます。'), route.file);
  assert(page.includes('神奈川県三浦市南下浦町上宮田3202番14の509'), route.file);
  assert(page.includes('https://site-speedup.com/#organization'), route.file);
  const pageAffiliate = [...page.matchAll(/<a\b[^>]*href="https:\/\/www\.gumlet\.com\/(?:\?fpr|pricing\?fpr|analyzer\?fpr)[^"]*"[^>]*>/g)];
  pageAffiliate.forEach(([anchor]) => { assert(anchor.includes('target="_blank"')); assert(anchor.includes('rel="sponsored noopener"')); });
  assert(sitemap.includes(`<loc>${route.url}</loc>`), route.url);
}
for (const term of ['https://site-speedup.com/vimeo-alternative/', 'https://site-speedup.com/pricing/', 'https://site-speedup.com/guide/embed/', '最終更新日: 2026-09-25']) assert(llms.includes(term), term);
assert.equal((sitemap.match(/<lastmod>2026-09-25<\/lastmod>/g) || []).length, 4);
for (const name of ['index.html', 'styles.css', 'script.js', '_headers', '_redirects', 'favicon.svg', 'og-image.svg', 'og-image.png', 'llms.txt', 'robots.txt', 'sitemap.xml', 'vimeo-alternative/index.html', 'pricing/index.html', 'guide/embed/index.html']) assert(existsSync(path.join(root, name)), name);
assert(!css.includes('radial-gradient'));
console.log('PASS: redirect asset, canonical URLs, E-E-A-T, cluster pages, affiliate attributes, crawler files and static build inputs.');
