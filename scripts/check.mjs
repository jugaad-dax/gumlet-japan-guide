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
const legacyAffiliateUrl = 'https://www.gumlet.com/?fpr=daisuke-okamoto-0d1593&utm_source=lp&utm_medium=referral&utm_campaign=gumlet_guide';
const articleAffiliateUrl = 'https://www.gumlet.com/?fpr=daisuke-okamoto-0d1593';
const affiliateUrls = new Set([legacyAffiliateUrl, articleAffiliateUrl]);
const ga4Snippet = '<!-- Google tag (gtag.js) -->';
const routes = [
  { file: 'index.html', url: 'https://site-speedup.com/', affiliateCount: 14, affiliateUrl: legacyAffiliateUrl },
  { file: 'vimeo-alternative/index.html', url: 'https://site-speedup.com/vimeo-alternative/', affiliateCount: 4, affiliateUrl: legacyAffiliateUrl },
  { file: 'pricing/index.html', url: 'https://site-speedup.com/pricing/', affiliateCount: 4, affiliateUrl: legacyAffiliateUrl },
  { file: 'guide/index.html', url: 'https://site-speedup.com/guide/', affiliateCount: 3, affiliateUrl: articleAffiliateUrl },
  { file: 'guide/embed/index.html', url: 'https://site-speedup.com/guide/embed/', affiliateCount: 4, affiliateUrl: legacyAffiliateUrl },
  { file: 'guide/paid-plan/index.html', url: 'https://site-speedup.com/guide/paid-plan/', affiliateCount: 5, affiliateUrl: articleAffiliateUrl },
  { file: 'guide/vimeo-migration/index.html', url: 'https://site-speedup.com/guide/vimeo-migration/', affiliateCount: 4, affiliateUrl: articleAffiliateUrl },
];

assert.equal(redirects, 'https://gumlet-japan-guide.pages.dev/* https://site-speedup.com/:splat 301!\n');
assert.equal((html.match(/<link rel="canonical" href="https:\/\/site-speedup\.com\/">/g) || []).length, 1);
assert(html.includes('<title>Gumlet日本語ガイド｜動画・画像最適化でWeb表示高速化</title>'));
assert(html.includes('meta http-equiv="last-modified" content="2026-10-13T00:00:00+09:00"'));
assert(html.includes('<meta property="og:type" content="website">'));
assert(html.includes('<meta property="og:image" content="https://site-speedup.com/assets/og-image.png">'));
assert(html.includes('<meta name="twitter:image" content="https://site-speedup.com/assets/og-image.png">'));
assert(html.includes('"@type": "VideoObject"'));
assert(html.includes('"@type": "Organization"'));
assert(html.includes('"@type": "Article"'));
assert(html.includes('"@type": "HowTo"'));
assert.equal((html.match(/<h1>/g) || []).length, 1);
assert(html.includes('<h1>高速・安全・低コストな動画・画像ホスティング<br><span>Gumlet 日本語ガイド</span></h1>'));
assert(html.includes('<address class="company-info" style="font-style: normal;">'));
assert(html.includes('〒238-0101 神奈川県三浦市南下浦町上宮田3202番14の509'));
assert(!html.includes('Gumletの配信最適化アーキテクチャ概要'));
assert(!html.includes('src="/assets/gumlet-speed-architecture.webp"'));
assert(!html.includes('ジュガード株式会社の公式サイトでは、メイン動画の配信基盤としてGumletを採用しています。'));
assert(html.includes('美容室YQUIMのサイトでは、メイン動画の配信基盤としてGumletを採用しています。'));
assert(html.includes('Core Web Vitals（LCP/CLS）'));
assert(html.includes(legacyAffiliateUrl));
for (const url of ['https://vimeo.com/pricing', 'https://aws.amazon.com/cloudfront/pricing/', 'https://aws.amazon.com/s3/pricing/', 'https://jugaad.tokyo/']) assert(html.includes(url), url);
for (const navUrl of ['/vimeo-alternative/', '/pricing/', '/guide/embed/', '/guide/']) assert(html.split(navUrl).length - 1 >= 2, navUrl);
for (const term of ['神奈川県三浦市南下浦町上宮田3202番14の509', 'okamoto@jugaad.tokyo', 'MVM戦略策定・SaaS選定／導入支援・AI駆動Web実装・広告初期検証']) assert(html.includes(term), term);
for (const date of ['2026-10-13', '2026-10-13T00:00:00+09:00']) assert(html.includes(date), date);
assert(html.includes('id="guide-library"'));
assert(html.includes('/guide/paid-plan/'));
assert(html.includes('/guide/vimeo-migration/'));

const allPages = routes.map(route => ({ ...route, page: text(route.file) }));
for (const { file, url, affiliateCount, affiliateUrl, page } of allPages) {
  assert(existsSync(path.join(root, file)), file);
  assert(page.includes(`<link rel="canonical" href="${url}">`), url);
  assert(page.includes('2026-10-13'), `${file}: modified date`);
  assert(page.includes('PR / 公式紹介リンク</strong><span>当サイトはGumlet公式パートナーとして正規の紹介リンク（アフィリエイト広告）を含んでおり、本ページ経由で全有料プラン20%OFFが自動適用されます。</span>'), `${file}: disclosure`);
  assert(page.includes('神奈川県三浦市南下浦町上宮田3202番14の509'), `${file}: operator address`);
  assert(page.includes('https://site-speedup.com/#organization'), `${file}: organization schema`);
  assert.equal((page.match(/googletagmanager\.com\/gtag\/js\?id=G-9KJF5ZSXY5/g) || []).length, 1, `${file}: GA4 tag count`);
  assert(page.includes(ga4Snippet), `${file}: GA4 comment`);
  assert(new RegExp(`<head>\\s*${ga4Snippet.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(page), `${file}: GA4 placement`);
  assert(page.includes("gtag('config', 'G-9KJF5ZSXY5');"), `${file}: GA4 config`);
  const anchors = [...page.matchAll(/<a\b[^>]*href="https:\/\/(?:www\.|docs\.)gumlet\.com\/[^\"]*"[^>]*>/g)];
  assert.equal(anchors.length, affiliateCount, `${file}: affiliate anchor count`);
  anchors.forEach(([anchor]) => {
    const href = anchor.match(/href="([^"]+)"/)[1];
    assert(affiliateUrls.has(href), `${file}: unexpected affiliate URL ${href}`);
    assert.equal(href, affiliateUrl, `${file}: affiliate URL must match page rule`);
    assert(anchor.includes('data-gumlet-affiliate="true"'), `${file}: affiliate event marker`);
    assert(anchor.includes('target="_blank"'), `${file}: target`);
    assert(anchor.includes('rel="noopener noreferrer sponsored"'), `${file}: rel`);
  });
  assert(sitemap.includes(`<loc>${url}</loc>`), `${file}: sitemap route`);
}
assert.equal(allPages.reduce((sum, { page }) => sum + (page.match(new RegExp(`href="${legacyAffiliateUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`, 'g')) || []).length, 0), 26, 'legacy affiliate URL count');
assert.equal(allPages.reduce((sum, { page }) => sum + (page.match(new RegExp(`href="${articleAffiliateUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`, 'g')) || []).length, 0), 12, 'new-article affiliate URL count');
assert.equal(allPages.reduce((sum, { page }) => sum + (page.match(/data-gumlet-affiliate="true"/g) || []).length, 0), 38, 'affiliate event marker count');

const paidPlan = text('guide/paid-plan/index.html');
for (const term of [
  'Gumlet 有料プラン導入・運用完全ガイド',
  'Image CDN プラン比較',
  'Video Hosting &amp; Streaming プラン比較',
  'Cloudinary / AWS CloudFront直接構築との比較',
  'パターンA: Web Folder（既存のWebサーバー / WordPress等のHTTP公開元）',
  'パターンB: Amazon S3（非公開S3バケット連携）',
  'カスタムドメイン（CNAME）設定と自動SSL',
  '主要なURLパラメータ操作と画像変換仕様',
  'HTMLでのレスポンシブ実装例 (srcset)',
]) assert(paidPlan.includes(term), `paid-plan: ${term}`);
assert.equal((paidPlan.match(/<table/g) || []).length, 4, 'paid-plan tables');
assert(paidPlan.includes('class="article-toc"'));
assert(paidPlan.includes('class="implementation-card"'));

const migration = text('guide/vimeo-migration/index.html');
for (const term of [
  'VimeoからGumletへ動画をインポートする完全移行ガイド｜ダウンロード不要・最短5ステップ',
  '移行前に確認すべき前提条件',
  'VimeoからGumletへのインポート手順（5ステップ）',
  'ステップ1：GumletダッシュボードでVimeo連携を選択',
  'ステップ5：処理設定（Processing Settings）の確認と実行',
  '移行されるデータ・引き継がれないデータ一覧',
  '既存Webサイトの埋め込みコード差し替え',
  'https://play.gumlet.io/embed/123456789',
]) assert(migration.includes(term), `vimeo-migration: ${term}`);
assert.equal((migration.match(/<table/g) || []).length, 1, 'vimeo-migration tables');
assert(migration.includes('class="article-toc"'));
assert(migration.includes('class="implementation-card"'));

assert(html.includes('id="mobile-sticky-cta"'));
assert(html.includes('全プラン20%OFF適用中'));
assert(html.includes('月間1,000時間再生・帯域500GB時の'));
assert(html.includes('class="recommendation-ribbon">おすすめ</span>'));
assert(html.includes('まずは無料で試す（20%OFF特典付き）'));
assert(html.includes('プラン一覧・料金を比較する（公式）'));
assert(html.includes('1分で完了・クレジットカード不要で試す'));
for (const selector of ['--cta: #059669', '.mobile-sticky-cta', 'backdrop-filter: blur(12px)', '.article-layout', '.article-toc', '.guide-card-grid', 'overflow-x: auto']) assert(css.includes(selector), selector);
assert(text('script.js').includes('IntersectionObserver'));
assert(text('script.js').includes('gumlet_affiliate_click'));
assert(text('script.js').includes('data-gumlet-affiliate'));
assert(text('script.js').includes("transport_type: 'beacon'"));
assert(!text('script.js').match(/https?:\/\//));
const inline = html.match(/<script>([\s\S]*?)<\/script>/)[1];
assert(headers.includes(`sha256-${createHash('sha256').update(inline).digest('base64')}`));
for (const directive of ['/_astro/*', '/_next/static/*', '/assets/*', 'Cache-Control: public, max-age=0, must-revalidate', 'Strict-Transport-Security: max-age=31536000; includeSubDomains', 'X-Content-Type-Options: nosniff', 'Last-Modified: Tue, 13 Oct 2026 00:00:00 GMT']) assert(headers.includes(directive), directive);
for (const term of ['https://site-speedup.com/vimeo-alternative/', 'https://site-speedup.com/pricing/', 'https://site-speedup.com/guide/embed/', 'https://site-speedup.com/guide/', 'https://site-speedup.com/guide/paid-plan/', 'https://site-speedup.com/guide/vimeo-migration/', '最終更新日: 2026-10-13', 'WebP形式', 'スマートフォンで横スクロール']) assert(llms.includes(term), term);
assert.equal((sitemap.match(/<lastmod>2026-10-13<\/lastmod>/g) || []).length, 7);
for (const name of ['index.html', 'styles.css', 'script.js', '_headers', '_redirects', 'favicon.svg', 'og-image.svg', 'og-image.png', 'assets/og-image.png', 'assets/gumlet-image-delivery.webp', 'assets/gumlet-video-api.webp', 'llms.txt', 'robots.txt', 'sitemap.xml', 'vimeo-alternative/index.html', 'pricing/index.html', 'guide/index.html', 'guide/embed/index.html', 'guide/paid-plan/index.html', 'guide/vimeo-migration/index.html']) assert(existsSync(path.join(root, name)), name);
assert(!existsSync(path.join(root, 'assets/gumlet-speed-architecture.webp')));
assert(html.includes('id="media-delivery"'));
for (const img of [['gumlet-image-delivery.webp', 'width="1184" height="848"', 'JPEG画像をWebPやAVIFなどの形式に最適化して配信するイメージ'], ['gumlet-video-api.webp', 'width="1280" height="756"', '埋め込みプレイヤーと動画APIによるWebサイトへの動画配信実装イメージ']]) { assert(html.includes(`/assets/${img[0]}`), img[0]); assert(html.includes(img[1]), img[1]); assert(html.includes(img[2]), img[2]); }
assert.equal((html.match(/loading="lazy"/g) || []).length >= 5, true);
assert(css.includes('overflow-x: clip'));
assert(css.includes('-webkit-overflow-scrolling: touch'));
assert(!css.includes('radial-gradient'));
console.log('PASS: article library, two long-form guides, affiliate attributes, GA4, crawler files, responsive layout, and static build inputs.');
