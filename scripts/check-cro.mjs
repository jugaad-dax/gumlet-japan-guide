import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const text=file=>readFileSync(path.join(root,file),'utf8');
const baseline=JSON.parse(text('scripts/affiliate-baseline.json'));
const fragment=text('components/calculator.html');
const pricingData=text('pricing-data.js');
let preserved=0, total=0;
for (const {file,anchors} of baseline) {
  const html=text(file);
  const actual=[...html.matchAll(/<a\b[^>]*href="https:\/\/www\.gumlet\.com\/[^"]*"[^>]*>/g)].map(m=>m[0]);
  let offset=0;
  for(const anchor of anchors){
    const found=actual.indexOf(anchor,offset);
    assert(found>=0,`${file}: original affiliate tag changed or removed`);
    offset=found+1;preserved++;
  }
  for(const anchor of actual){
    assert(anchor.includes('fpr=daisuke-okamoto-0d1593'));
    assert(anchor.includes('data-gumlet-affiliate="true"'));
    assert(anchor.includes('target="_blank"'));
    assert(anchor.includes('rel="noopener noreferrer sponsored"'));
    total++;
  }
  assert(html.includes('data-quick-verdict="true"'),`${file}: quick verdict`);
  assert(html.includes('PR / 公式紹介リンク'),`${file}: disclosure maintained`);
  assert(!html.includes('Creator/Growth $0.10/GB'),`${file}: old Creator overage`);
  assert(!html.includes('$0.06〜$0.10/GB'),`${file}: overage range omits Creator`);
  assert(!html.includes('全有料プラン20%OFFが自動適用されます'),`${file}: unsupported unconditional offer`);
  const calculators=(html.match(/data-gumlet-calculator/g)||[]).length;
  if(file==='index.html' || file==='pricing/index.html') {
    assert.equal(calculators,1);
    assert(html.includes(fragment.trim()),`${file}: calculator fragment drift`);
  }else{
    assert.equal(calculators,0);
    assert(!html.match(/src="\/(?:calculator|pricing-data)\.js/),`${file}: calculator scripts must not load`);
  }
}
assert.equal(baseline.length,13);
for(const rate of ['0.15','0.10','0.06'])assert(pricingData.includes(`bandwidthOverageUSDPerGB: ${rate}`));
for(const price of [6,19,99])assert(pricingData.includes(`annualMonthlyUSD: ${price}`));
const top=text('index.html'), pricing=text('pricing/index.html'), vimeo=text('vimeo-alternative/index.html');
for(const feature of ['growth-features','use-case-models'])assert(top.includes(`id="${feature}"`));
for(const name of ['index.html','pricing/index.html','guide/paid-plan/index.html']){
  const page=text(name);assert(page.includes('cro-ui-steps'));assert(page.includes('実際の管理画面キャプチャではありません'));
}
assert(!text('guide/paid-plan/index.html').includes('└─►'));
for(const file of ['articles/vimeo-domain-restriction-security.html','articles/online-course-video-drm-protection.html']){
  const page=text(file);assert(page.includes('data-lms-guide="true"'));
  for(const word of ['UTAGE','Teachable','Kajabi','Thinkific','LearnDash','MemberPress','Simple Membership'])assert(page.includes(word));
}
for(const word of ['2026年11月20日','通常のVimeo','Wistia','Bunny Stream','Stripe'])assert(vimeo.includes(word));
assert(pricing.includes('"@type": "SoftwareApplication"'));
assert(text('script.js').includes('cta_placement: placement'));
assert(text('script.js').includes('content_type:'));
assert(text('llms.txt').includes('plan_calculator_used'));
console.log(`PASS CRO: ${preserved} original affiliate tags byte-preserved; ${total} current links protected across ${baseline.length} pages.`);
