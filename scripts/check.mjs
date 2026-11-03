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
  { file: 'articles/vimeo-bandwidth-overage-guide.html', url: 'https://site-speedup.com/articles/vimeo-bandwidth-overage-guide', type: 'Article' },
  { file: 'articles/vimeo-domain-restriction-security.html', url: 'https://site-speedup.com/articles/vimeo-domain-restriction-security', type: 'Article' },
  { file: 'articles/vimeo-to-gumlet-migration-guide.html', url: 'https://site-speedup.com/articles/vimeo-to-gumlet-migration-guide', type: 'Article' },
];

assert.equal(redirects, 'https://gumlet-japan-guide.pages.dev/* https://site-speedup.com/:splat 301!\n/articles/vimeo-bandwidth-overage-guide/ /articles/vimeo-bandwidth-overage-guide 301\n/articles/vimeo-domain-restriction-security/ /articles/vimeo-domain-restriction-security 301\n/articles/vimeo-to-gumlet-migration-guide/ /articles/vimeo-to-gumlet-migration-guide 301\n');
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
  const modifiedDate = ['index.html', 'guide/index.html'].includes(file) || file.startsWith('articles/') ? '2026-11-03' : releaseDate;
  assert(page.includes(modifiedDate), `${file}: modified date`);
  assert(page.startsWith('<!DOCTYPE html>'), `${file}: doctype`);
  assert(page.includes(`<head>\n${cspMeta}\n${gaSnippet}`), `${file}: CSP and GA placement`);
  assert.equal((page.match(/<meta http-equiv="Content-Security-Policy"/g) || []).length, 1, `${file}: CSP meta count`);
  assert.equal((page.match(/googletagmanager\.com\/gtag\/js\?id=G-9KJF5ZSXY5/g) || []).length, 1, `${file}: GA loader count`);
  assert(page.includes('PR / 公式紹介リンク</strong><span>'), `${file}: disclosure`);
  assert(page.includes('https://site-speedup.com/#organization'), `${file}: organization schema`);
  if (!file.startsWith('articles/')) assert(!page.includes('請求書払い'), `${file}: invoice wording`);
  for (const id of ['G-9KJF5ZSXY5', 'G-8NDNNMSRBX']) assert(page.includes(`gtag('config', '${id}')`), `${file}: GA config ${id}`);
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
assert.equal((sitemap.match(/<loc>https:\/\/site-speedup\.com\//g) || []).length, 10, 'ten sitemap URLs');
assert.equal((sitemap.match(/<lastmod>2026-11-03<\/lastmod>/g) || []).length, 5, 'five updated sitemap dates');
assert.equal((sitemap.match(new RegExp(`<lastmod>${releaseDate}<\\/lastmod>`, 'g')) || []).length, 5, 'five unchanged sitemap dates');
for (const bot of ['Googlebot', 'Google-Extended', 'OAI-SearchBot', 'ChatGPT-User', 'PerplexityBot', 'ClaudeBot']) assert(robots.includes(`User-agent: ${bot}\nAllow: /`), bot);
assert(robots.includes('Sitemap: https://site-speedup.com/sitemap.xml'));
for (const directive of ['Cache-Control: public, max-age=0, must-revalidate', 'https://analytics.google.com', 'https://static.cloudflareinsights.com', 'Last-Modified: Tue, 03 Nov 2026 00:00:00 GMT']) assert(headers.includes(directive), directive);
for (const asset of ['index.html', 'styles.css', 'script.js', '_headers', '_redirects', 'llms.txt', 'robots.txt', 'sitemap.xml', ...routes.slice(1).map(route => route.file)]) assert(existsSync(path.join(root, asset)), asset);
const overage = text('articles/vimeo-bandwidth-overage-guide.html');
assert.equal((overage.match(/<h1>/g) || []).length, 1);
assert.equal((overage.match(/<h2>/g) || []).length, 4);
const overageSchema = [...overage.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => JSON.parse(m[1]));
const faq = overageSchema.find(node => node['@type'] === 'FAQPage');
assert.equal(faq.mainEntity.length, 3);
for (const question of faq.mainEntity) {
  assert(overage.includes(`<summary>${question.name}</summary>`));
  assert(overage.includes(`<p>${question.acceptedAnswer.text}</p>`));
}
assert.equal((overage.match(/>限定20%OFF特典付きでGumletを無料体験する<\/a>/g) || []).length, 2);
assert.equal((overage.match(/>Gumletの最新料金プラン詳細（限定割引対象）を見る<\/a>/g) || []).length, 1);
assert(overage.includes('日本円での請求書払い（銀行振込）の可否'));
assert(overage.includes('保証する案内ではありません'));
assert(html.includes('id="helpful-guides"'));
for (const name of ['index.html', 'guide/index.html']) assert(text(name).includes('href="/articles/vimeo-bandwidth-overage-guide"'));
const newArticles = [
  { slug: 'vimeo-domain-restriction-security', headings: ['会員サイトやオンライン講座で必須の「動画セキュリティ」とは？', 'VimeoとGumletのセキュリティ機能・料金比較', 'Gumletで特定のWebサイト（WordPress等）からのみ再生を許可する設定手順', 'よくある質問（FAQ）'] },
  { slug: 'vimeo-to-gumlet-migration-guide', headings: ['VimeoからGumletへの移行前に確認すべき3つのチェックポイント', '【3ステップ】動画データの移行と初期設定手順', 'Webサイト上の埋め込みコード（iframe）差し替えと表示速度の最適化', 'よくある質問（FAQ）'] },
];
const htmlEscape = value => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
for (const { slug, headings } of newArticles) {
  const page = text(`articles/${slug}.html`);
  assert.deepEqual([...page.matchAll(/<h2>(.*?)<\/h2>/g)].map(m => m[1]), headings, `${slug}: exact H2s`);
  assert.equal((page.match(/<h1>/g) || []).length, 1);
  assert.equal((page.match(/data-article-cta="/g) || []).length, 3);
  for (const placement of ['intro', 'comparison', 'summary']) assert(page.includes(`data-article-cta="${placement}"`));
  assert.equal((page.match(/年払い＋紹介20%OFFで実質最大48%OFF（適用条件あり）/g) || []).length, 3);
  assert.equal((page.match(/data-gumlet-affiliate="true"/g) || []).length, 5);
  const nodes = [...page.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => JSON.parse(m[1]));
  const article = nodes.find(n => n['@type'] === 'Article');
  const faqNode = nodes.find(n => n['@type'] === 'FAQPage');
  assert.equal(article.url, `https://site-speedup.com/articles/${slug}`);
  assert.equal(faqNode.mainEntity.length, 3);
  for (const q of faqNode.mainEntity) {
    assert(page.includes(`<summary>${htmlEscape(q.name)}</summary>`));
    assert(page.includes(`<p>${htmlEscape(q.acceptedAnswer.text)}</p>`));
  }
  assert(page.includes('日本円での請求書払い（銀行振込）の可否'));
  assert(page.includes('保証する案内ではありません'));
  assert(page.includes('href="https://jugaad.tokyo/privacy/"'));
  assert(!page.includes('<!-- CTA_'), `${slug}: unresolved CTA marker`);
  for (const source of ['index.html', 'guide/index.html', 'articles/vimeo-bandwidth-overage-guide.html']) assert(text(source).includes(`href="/articles/${slug}"`), `${source}: link to ${slug}`);
  for (const other of ['vimeo-bandwidth-overage-guide', ...newArticles.map(a => a.slug)].filter(a => a !== slug)) assert(page.includes(`href="/articles/${other}"`), `${slug}: link to ${other}`);
}
console.log('PASS: contextual internal links, reciprocal guide navigation, schema markup, crawler files, affiliate isolation, and static-site safeguards.');
