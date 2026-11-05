import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

// Classic script intentionally has no ES exports: side-effect import works in Node.
await import('../pricing-data.js');
await import('../calculator.js'); // Must safely no-op without document.
const pricing = globalThis.GumletPricing;
let count = 0;
const test = async (name, run) => {
  try {
    await run();
    count += 1;
    console.log(`ok ${count} - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
};
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} != ${expected}`);
const input = (overrides = {}) => ({ storageMinutes: 600, bandwidthGB: 900, security: 'standard', billingCycle: 'annual_referral', ...overrides });
const calculate = (overrides) => {
  const result = pricing.calculate(input(overrides));
  assert.equal(result.valid, true);
  return result;
};

await test('global pure helper exports and nested reference data are frozen', () => {
  assert.ok(pricing);
  [pricing, pricing.data, pricing.data.inputs, pricing.data.inputs.storageMinutes, pricing.data.plans.Creator, pricing.data.security, pricing.data.cloudflare, pricing.data.vimeo].forEach((object) => assert.equal(Object.isFrozen(object), true));
  assert.throws(() => { pricing.data.plans.Creator.annualMonthlyUSD = 0; }, TypeError);
});
await test('default Creator reference and hypothetical JPY', () => {
  const result = calculate();
  assert.equal(result.plan, 'Creator');
  close(result.baseMonthlyUSD, 6 * (1 - 0.20));
  close(result.totalMonthlyUSD, result.baseMonthlyUSD);
  close(result.totalAnnualUSD, result.totalMonthlyUSD * 12);
  close(result.totalMonthlyJPY, result.totalMonthlyUSD * 150);
  close(result.totalAnnualJPY, result.totalAnnualUSD * 150);
});
await test('minimum 100 minutes and 100 GB accepted', () => {
  const result = calculate({ storageMinutes: 100, bandwidthGB: 100 });
  assert.equal(result.plan, 'Creator');
  assert.equal(result.bandwidthOverageMonthlyUSD, 0);
  assert.equal(result.storageOverageMonthlyUSD, 0);
});
await test('1000 minutes stays Creator', () => assert.equal(calculate({ storageMinutes: 1000 }).plan, 'Creator'));
await test('1001 minutes promotes to Growth', () => assert.equal(calculate({ storageMinutes: 1001 }).plan, 'Growth'));
await test('3000 minutes stays Growth', () => assert.equal(calculate({ storageMinutes: 3000 }).plan, 'Growth'));
await test('3001 minutes promotes to Business', () => assert.equal(calculate({ storageMinutes: 3001 }).plan, 'Business'));
await test('15000 minutes has zero Business storage overage', () => {
  const result = calculate({ storageMinutes: 15000 });
  assert.equal(result.plan, 'Business');
  assert.equal(result.storageOverageMinutes, 0);
  assert.equal(result.storageOverageMonthlyUSD, 0);
});
await test('15001 minutes charges proportional one-minute reference, not full block', () => {
  const result = calculate({ storageMinutes: 15001 });
  assert.equal(result.storageOverageMinutes, 1);
  close(result.storageOverageMonthlyUSD, 3 / 1000);
  assert.match(result.reason, /参考/);
});
await test('16000 minutes adds $3 Business storage reference', () => close(calculate({ storageMinutes: 16000 }).storageOverageMonthlyUSD, 3));
await test('all plans include exactly 3000 GB', () => {
  [600, 2000, 4000].forEach((storageMinutes) => {
    const result = calculate({ storageMinutes, bandwidthGB: 3000 });
    assert.equal(result.includedBandwidthGB, 3000);
    assert.equal(result.bandwidthOverageGB, 0);
    assert.equal(result.bandwidthOverageMonthlyUSD, 0);
  });
});
for (const [storageMinutes, plan, rate] of [[1000, 'Creator', 0.15], [3000, 'Growth', 0.10], [15000, 'Business', 0.06]]) {
  await test(`3001 GB: ${plan} one-GB overage at specified rate`, () => {
    const result = calculate({ storageMinutes, bandwidthGB: 3001 });
    assert.equal(result.plan, plan);
    assert.equal(result.bandwidthOverageGB, 1);
    close(result.bandwidthOverageMonthlyUSD, rate);
    close(result.totalMonthlyUSD, result.baseMonthlyUSD + rate);
  });
}
await test('maximum 20000 minutes / 10000 GB accepted with both overages', () => {
  const result = calculate({ storageMinutes: 20000, bandwidthGB: 10000 });
  assert.equal(result.plan, 'Business');
  close(result.storageOverageMonthlyUSD, (20000 - 15000) / 1000 * 3);
  close(result.bandwidthOverageMonthlyUSD, (10000 - 3000) * 0.06);
  close(result.totalMonthlyUSD, 99 * (1 - 0.20) + (20000 - 15000) / 1000 * 3 + (10000 - 3000) * 0.06);
});
for (const billingCycle of ['annual_referral', 'annual_list']) {
  for (const [security, expectedPlan] of [['standard', 'Creator'], ['custom_player', 'Growth'], ['watermark', 'Business'], ['drm', 'Creator']]) {
    await test(`${security} / ${billingCycle} selected plan and base-only discount`, () => {
      const result = calculate({ security, billingCycle });
      assert.equal(result.plan, expectedPlan);
      const base = { Creator: 6, Growth: 19, Business: 99 }[expectedPlan];
      const discount = billingCycle === 'annual_referral' ? 0.20 : 0;
      close(result.baseListMonthlyUSD, base);
      close(result.baseMonthlyUSD, base * (1 - discount));
      close(result.discountMonthlyUSD, base * discount);
      close(result.annualBaseUpfrontUSD, base * (1 - discount) * 12);
      assert.equal(result.drmMonthlyUSD, security === 'drm' ? 99 : 0);
      assert.equal(result.drmIncludedMonthlyViews, security === 'drm' ? 100000 : 0);
      close(result.totalMonthlyUSD, base * (1 - discount) + (security === 'drm' ? 99 : 0));
    });
  }
}
await test('DRM at exactly 1000 minutes remains Creator', () => assert.equal(calculate({ storageMinutes: 1000, security: 'drm' }).plan, 'Creator'));
await test('DRM at 1001 minutes selects Growth only for storage', () => assert.equal(calculate({ storageMinutes: 1001, security: 'drm' }).plan, 'Growth'));
await test('DRM at exactly 3000 minutes stays Growth', () => assert.equal(calculate({ storageMinutes: 3000, security: 'drm' }).plan, 'Growth'));
await test('DRM at 3001 minutes selects Business only for storage', () => assert.equal(calculate({ storageMinutes: 3001, security: 'drm' }).plan, 'Business'));
await test('custom player does not bypass storage >3000 Business threshold', () => assert.equal(calculate({ storageMinutes: 3001, security: 'custom_player' }).plan, 'Business'));
await test('watermark at minimum volume selects Business without storage overage', () => {
  const result = calculate({ storageMinutes: 100, security: 'watermark' });
  assert.equal(result.plan, 'Business');
  assert.equal(result.storageOverageMonthlyUSD, 0);
  assert.match(result.reason, /ウォーターマーク/);
});
await test('Creator and Growth do not accrue storage overage', () => {
  [1000, 1001, 3000].forEach((storageMinutes) => assert.equal(calculate({ storageMinutes }).storageOverageMonthlyUSD, 0));
});
await test('referral never discounts DRM or either overage', () => {
  const shared = { storageMinutes: 20000, bandwidthGB: 10000, security: 'drm' };
  const referral = calculate({ ...shared, billingCycle: 'annual_referral' });
  const list = calculate({ ...shared, billingCycle: 'annual_list' });
  ['storageOverageMonthlyUSD', 'bandwidthOverageMonthlyUSD', 'drmMonthlyUSD'].forEach((key) => close(referral[key], list[key]));
  close(list.totalMonthlyUSD - referral.totalMonthlyUSD, 99 * 0.20);
  close(referral.annualBaseUpfrontUSD, 99 * (1 - 0.20) * 12);
  close(referral.totalAnnualUSD, referral.totalMonthlyUSD * 12);
  assert.ok(referral.totalAnnualUSD > referral.annualBaseUpfrontUSD);
});
await test('pure helper leaves caller input unchanged and is deterministic', () => {
  const source = Object.freeze(input({ storageMinutes: '1001', bandwidthGB: '3001' }));
  const first = pricing.calculate(source);
  assert.deepEqual(first, pricing.calculate(source));
  assert.equal(source.storageMinutes, '1001');
  assert.equal(first.input.storageMinutes, 1001);
});
await test('decimal GB / 2Mbps: 900GB maps to 60000 minutes / 1000 hours', () => {
  const cf = calculate().cloudflare;
  close(cf.deliveryMinutes, 60000);
  close(cf.deliveryHours, 1000);
  close(cf.deliveryMonthlyUSD, 60000 / 1000 * 1);
  close(cf.storageMonthlyUSD, 5);
  close(cf.totalMonthlyUSD, 5 + 60000 / 1000 * 1);
});
for (const [storageMinutes, blocks] of [[1000, 1], [1001, 2], [3000, 3], [3001, 4], [15000, 15], [15001, 16], [20000, 20]]) {
  await test(`Cloudflare purchase block ceiling at ${storageMinutes} minutes`, () => {
    const cf = calculate({ storageMinutes }).cloudflare;
    assert.equal(cf.storageBlocks, blocks);
    close(cf.storageMonthlyUSD, blocks * 5);
    close(cf.totalAnnualUSD, cf.totalMonthlyUSD * 12);
  });
}
await test('Cloudflare estimate is unaffected by Gumlet referral and DRM selection', () => {
  assert.deepEqual(calculate({ security: 'drm', billingCycle: 'annual_list' }).cloudflare, calculate().cloudflare);
});
await test('Vimeo 1000-minute Core indicative benchmark', () => {
  const result = calculate({ storageMinutes: 1000 });
  assert.equal(result.vimeo.indicativePlan, 'Core');
  close(result.vimeo.benchmarkMonthlyUSD, 24.50);
  close(result.vimeo.benchmarkAnnualUSD, 24.50 * 12);
  assert.equal(pricing.data.vimeo.Creator, 9);
});
await test('Vimeo 1001-minute Professional indicative benchmark', () => {
  const result = calculate({ storageMinutes: 1001 });
  assert.equal(result.vimeo.indicativePlan, 'Professional');
  close(result.vimeo.benchmarkMonthlyUSD, 71);
  close(result.vimeo.benchmarkAnnualUSD, 71 * 12);
});

for (const [name, overrides, key] of [
  ['empty storage', { storageMinutes: '' }, 'storageMinutes'],
  ['blank whitespace storage', { storageMinutes: '   ' }, 'storageMinutes'],
  ['empty bandwidth', { bandwidthGB: '' }, 'bandwidthGB'],
  ['storage below minimum', { storageMinutes: 99 }, 'storageMinutes'],
  ['storage above maximum', { storageMinutes: 20001 }, 'storageMinutes'],
  ['bandwidth below minimum', { bandwidthGB: 99 }, 'bandwidthGB'],
  ['bandwidth above maximum', { bandwidthGB: 10001 }, 'bandwidthGB'],
  ['fractional storage', { storageMinutes: 1000.5 }, 'storageMinutes'],
  ['fractional bandwidth', { bandwidthGB: '3000.5' }, 'bandwidthGB'],
  ['NaN storage', { storageMinutes: NaN }, 'storageMinutes'],
  ['Infinity bandwidth', { bandwidthGB: Infinity }, 'bandwidthGB'],
  ['negative infinity storage', { storageMinutes: -Infinity }, 'storageMinutes'],
  ['non-numeric string', { storageMinutes: 'hello' }, 'storageMinutes'],
  ['numeric suffix', { bandwidthGB: '900GB' }, 'bandwidthGB'],
  ['hex string rejected', { storageMinutes: '0x400' }, 'storageMinutes'],
  ['exponent string rejected', { bandwidthGB: '9e2' }, 'bandwidthGB'],
  ['null rejected', { storageMinutes: null }, 'storageMinutes'],
  ['boolean rejected', { bandwidthGB: true }, 'bandwidthGB'],
  ['missing storage rejected', { storageMinutes: undefined }, 'storageMinutes'],
  ['unknown security rejected', { security: 'enterprise' }, 'security'],
  ['unknown billing rejected', { billingCycle: 'monthly' }, 'billingCycle'],
]) {
  await test(`invalid: ${name}; no total and no selected plan`, () => {
    const source = input(overrides);
    const result = pricing.calculate(source);
    assert.equal(result.valid, false);
    assert.ok(result.errors[key]);
    assert.equal(Object.hasOwn(result, 'totalMonthlyUSD'), false);
    assert.equal(pricing.selectPlan(source), null);
    assert.equal(pricing.validateInput(source).value, null);
  });
}
await test('missing input object returns errors instead of throwing/coercing', () => {
  for (const value of [undefined, null, false, '']) {
    const result = pricing.calculate(value);
    assert.equal(result.valid, false);
    assert.equal(Object.keys(result.errors).length, 4);
  }
});
await test('trimmed integer strings support exact 1001 and 3001 boundaries', () => {
  assert.equal(calculate({ storageMinutes: ' 1001 ', bandwidthGB: ' 3001 ' }).plan, 'Growth');
  assert.equal(calculate({ storageMinutes: '3001' }).plan, 'Business');
});

const fragmentPath = process.argv[2] || fileURLToPath(new URL('../components/calculator.html', import.meta.url));
const fragment = await readFile(fragmentPath, 'utf8');
const calculatorSource = await readFile(new URL('../calculator.js', import.meta.url), 'utf8');
await test('fragment loads exactly two ordered classic deferred scripts', () => {
  const scripts = [...fragment.matchAll(/<script\b([^>]*)><\/script>/g)].map((match) => match[1]);
  assert.equal(scripts.length, 2);
  assert.match(scripts[0], /src="\/pricing-data\.js(?:\?v=[^"]+)?"/);
  assert.match(scripts[1], /src="\/calculator\.js(?:\?v=[^"]+)?"/);
  scripts.forEach((attrs) => {
    assert.match(attrs, /\bdefer\b/);
    assert.doesNotMatch(attrs, /type="module"/);
  });
});
await test('affiliate CTA exact URL and required attributes', () => {
  const affiliate = fragment.match(/<a\b[^>]*data-gumlet-affiliate="true"[^>]*>/g);
  assert.equal(affiliate.length, 1);
  assert.match(affiliate[0], /href="https:\/\/www\.gumlet\.com\/\?fpr=daisuke-okamoto-0d1593"/);
  assert.match(affiliate[0], /data-cta-placement="calculator"/);
  assert.match(affiliate[0], /target="_blank"/);
  assert.match(affiliate[0], /rel="noopener noreferrer sponsored"/);
  assert.doesNotMatch(calculatorSource, /\.href\s*=|setAttribute\(['"]href|addEventListener\(['"]click/);
});
await test('every ID is unique and label/ARIA references resolve', () => {
  const ids = [...fragment.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(new Set(ids).size, ids.length);
  const idSet = new Set(ids);
  for (const match of fragment.matchAll(/\bfor="([^"]+)"/g)) assert.ok(idSet.has(match[1]), `label reference missing: ${match[1]}`);
  for (const match of fragment.matchAll(/\baria-(?:labelledby|describedby)="([^"]+)"/g)) {
    match[1].split(/\s+/).forEach((id) => assert.ok(idSet.has(id), `ARIA reference missing: ${id}`));
  }
  for (const match of fragment.matchAll(/<(?:input|select)\b[^>]*\bid="([^"]+)"[^>]*>/g)) {
    assert.ok(fragment.includes(`for="${match[1]}"`), `unlabelled control: ${match[1]}`);
  }
  assert.match(fragment, /<fieldset[\s\S]*?<legend>/);
  assert.match(fragment, /data-calculator-results aria-live="polite"/);
});
await test('ranges step=100 while numeric fields accept integer boundary values', () => {
  for (const [field, max, initial] of [['storage', 20000, 600], ['bandwidth', 10000, 900]]) {
    const range = fragment.match(new RegExp(`<input[^>]* id="calculator-${field}-range"[^>]+>`))[0];
    const number = fragment.match(new RegExp(`<input[^>]* id="calculator-${field}-number"[^>]+>`))[0];
    assert.match(range, /step="100"/);
    assert.match(number, /step="1"/);
    assert.ok(range.includes(`max="${max}"`));
    assert.ok(number.includes(`max="${max}"`));
    assert.ok(number.includes(`value="${initial}"`));
  }
});
await test('meaningful noscript pricing/caps and /pricing fallback', () => {
  const fallback = fragment.match(/<noscript>([\s\S]*?)<\/noscript>/)[1];
  ['Creator $6', 'Growth $19', 'Business $99', '1,000分', '3,000分', '15,000分', '3,000GB', 'href="/pricing"'].forEach((text) => assert.ok(fallback.includes(text)));
});
await test('visible payment terms outside details and mandatory assumptions summary', () => {
  const outsideDetails = fragment.replace(/<details[\s\S]*?<\/details>/g, '');
  assert.ok(outsideDetails.includes('年払い基本料は一括請求・DRM/超過/税別・割引適用は決済前に確認'));
  assert.ok(fragment.includes('<summary>試算の前提条件・注意事項を確認</summary>'));
  ['通常のエンコードは無料', 'DRMは同等ではなく', '自動的な最安保証ではありません', '仮の固定レート'].forEach((text) => assert.ok(fragment.includes(text)));
});

// A minimal DOM harness runs the actual vanilla UI script without a library/service.
const createHarness = ({ gtagAvailable = true, roots = 1 } = {}) => {
  const timers = new Map();
  const events = [];
  let timerID = 0;
  const node = (value = '') => ({
    value, textContent: '', hidden: false, dataset: {}, attrs: {}, listeners: {},
    setAttribute(name, val) { this.attrs[name] = val; },
    setCustomValidity(message) { this.validityMessage = message; },
    addEventListener(type, handler) { this.listeners[type] = handler; },
  });
  const setupRoot = () => {
    const root = node();
    const ui = node();
    ui.hidden = true;
    const form = node();
    const results = node();
    const security = node('standard');
    security.dataset.calcField = 'security';
    const radio = node('annual_referral');
    radio.name = 'calculator-billing-cycle';
    const billing = node();
    const ctaText = node();
    const errors = Object.fromEntries(['storageMinutes', 'bandwidthGB', 'security', 'billingCycle'].map((key) => [key, node()]));
    const pairs = {};
    Object.entries(pricing.data.inputs).forEach(([key, limits]) => {
      const number = node(String(limits.initial));
      const range = node(String(limits.initial));
      number.dataset.calcField = key;
      range.dataset.calcRange = key;
      pairs[key] = { number, range };
    });
    const outputNames = [...fragment.matchAll(/data-calc-output="([^"]+)"/g)].map((match) => match[1]);
    const outputs = Object.fromEntries(outputNames.map((key) => {
      const output = node();
      output.dataset.calcOutput = key;
      return [key, output];
    }));
    results.querySelectorAll = () => Object.values(outputs);
    form.querySelectorAll = () => [...Object.values(pairs).flatMap(pair => [pair.number, pair.range]), security, radio];
    form.querySelector = (selector) => {
      if (selector.includes(':checked')) return radio;
      if (selector === '[data-calculator-billing]') return billing;
      const match = selector.match(/\[data-calc-(field|range)="([^"]+)"\]/);
      return match ? pairs[match[2]][match[1] === 'field' ? 'number' : 'range'] : null;
    };
    root.querySelector = (selector) => {
      const nodes = {
        '[data-calculator-form]': form,
        '[data-calculator-ui]': ui,
        '[data-calculator-results]': results,
        '[data-calc-field="security"]': security,
        '[data-calculator-cta-text]': ctaText,
      };
      const errorKey = selector.match(/\[data-calc-error="([^"]+)"\]/)?.[1];
      return errorKey ? errors[errorKey] : nodes[selector] || null;
    };
    return { root, ui, form, results, pairs, outputs, errors, security, radio, ctaText };
  };
  const instances = Array.from({ length: roots }, setupRoot);
  const context = {
    GumletPricing: pricing,
    Intl,
    document: { readyState: 'complete', querySelectorAll: () => instances.map((instance) => instance.root) },
    setTimeout: (handler, delay) => { timerID += 1; timers.set(timerID, { handler, delay }); return timerID; },
    clearTimeout: (id) => timers.delete(id),
  };
  if (gtagAvailable) context.gtag = (...args) => events.push(args);
  vm.runInNewContext(calculatorSource, context, { filename: fileURLToPath(new URL('../calculator.js', import.meta.url)) });
  const flush = () => {
    const pending = [...timers.values()];
    timers.clear();
    pending.forEach(({ handler }) => handler());
  };
  const dispatch = (target, type = 'input', instance = instances[0]) => instance.form.listeners[type]({ target });
  return { ...instances[0], instances, context, timers, events, flush, dispatch };
};
await test('UI initial render calculates Creator without any analytics event', () => {
  const ui = createHarness();
  assert.equal(ui.outputs.plan.textContent, 'Creator');
  assert.equal(ui.ui.hidden, false);
  assert.equal(ui.timers.size, 0);
  ui.flush();
  assert.equal(ui.events.length, 0);
});
await test('UI numeric exact 1001 is preserved and selects Growth without replacing DOM', () => {
  const ui = createHarness();
  const originalForm = ui.form;
  const number = ui.pairs.storageMinutes.number;
  number.value = '1001';
  ui.dispatch(number);
  assert.equal(number.value, '1001');
  assert.equal(ui.outputs.plan.textContent, 'Growth');
  assert.equal(ui.form, originalForm);
  assert.equal([...ui.timers.values()][0].delay, 200);
});
await test('UI range keyboard input synchronizes paired numeric field', () => {
  const ui = createHarness();
  const range = ui.pairs.storageMinutes.range;
  range.value = '1100';
  ui.dispatch(range);
  assert.equal(ui.pairs.storageMinutes.number.value, '1100');
  assert.equal(ui.outputs.plan.textContent, 'Growth');
});
await test('UI empty input shows error, does not clamp, clears estimate and pending analytics', () => {
  const ui = createHarness();
  const number = ui.pairs.storageMinutes.number;
  number.value = '1001';
  ui.dispatch(number);
  number.value = '';
  ui.dispatch(number);
  assert.equal(number.value, '');
  assert.equal(ui.errors.storageMinutes.hidden, false);
  assert.equal(number.attrs['aria-invalid'], 'true');
  assert.equal(ui.outputs.totalMonthlyUSD.textContent, '—');
  assert.equal(ui.outputs.plan.textContent, '—');
  assert.equal(ui.timers.size, 0);
  ui.flush();
  assert.equal(ui.events.length, 0);
});
await test('UI out-of-range bandwidth remains invalid until repaired', () => {
  const ui = createHarness();
  const number = ui.pairs.bandwidthGB.number;
  number.value = '10001';
  ui.dispatch(number);
  assert.equal(number.value, '10001');
  assert.equal(ui.errors.bandwidthGB.hidden, false);
  assert.equal(ui.outputs.totalMonthlyUSD.textContent, '—');
  number.value = '3001';
  ui.dispatch(number);
  assert.equal(ui.errors.bandwidthGB.hidden, true);
  assert.equal(number.attrs['aria-invalid'], 'false');
  assert.equal(number.validityMessage, '');
  assert.notEqual(ui.outputs.totalMonthlyUSD.textContent, '—');
});
await test('UI 200ms debounce emits only latest plan/billing/security and only once', () => {
  const ui = createHarness();
  ui.pairs.storageMinutes.number.value = '1001';
  ui.dispatch(ui.pairs.storageMinutes.number);
  ui.pairs.storageMinutes.number.value = '3001';
  ui.dispatch(ui.pairs.storageMinutes.number);
  ui.security.value = 'drm';
  ui.dispatch(ui.security, 'change');
  ui.radio.value = 'annual_list';
  ui.dispatch(ui.radio, 'change');
  assert.equal(ui.timers.size, 1);
  assert.equal([...ui.timers.values()][0].delay, 200);
  ui.flush();
  assert.equal(ui.events.length, 1);
  assert.equal(ui.events[0][0], 'event');
  assert.equal(ui.events[0][1], 'plan_calculator_used');
  assert.equal(JSON.stringify(ui.events[0][2]), JSON.stringify({ plan: 'Business', billingCycle: 'annual_list', security: 'drm' }));
  assert.deepEqual(Object.keys(ui.events[0][2]), ['plan', 'billingCycle', 'security']);
  ui.pairs.bandwidthGB.number.value = '9000';
  ui.dispatch(ui.pairs.bandwidthGB.number);
  ui.flush();
  assert.equal(ui.events.length, 1);
});
await test('UI calculator CTA label changes with context; no click handlers exist', () => {
  const ui = createHarness();
  ui.security.value = 'drm';
  ui.dispatch(ui.security);
  assert.match(ui.ctaText.textContent, /Creator＋DRM/);
  ui.radio.value = 'annual_list';
  ui.dispatch(ui.radio);
  assert.match(ui.ctaText.textContent, /契約条件/);
  assert.equal(ui.ctaText.listeners.click, undefined);
  assert.deepEqual(Object.keys(ui.form.listeners), ['input', 'change', 'submit']);
});
await test('UI analytics absence does not break calculation or create a queued fallback', () => {
  const ui = createHarness({ gtagAvailable: false });
  ui.security.value = 'watermark';
  ui.dispatch(ui.security);
  ui.flush();
  assert.equal(ui.outputs.plan.textContent, 'Business');
  assert.equal(ui.events.length, 0);
  assert.equal(ui.timers.size, 0);
});
await test('UI even multiple roots never emit more than one calculator_used event per page', () => {
  const ui = createHarness({ roots: 2 });
  ui.dispatch(ui.instances[0].security, 'input', ui.instances[0]);
  ui.flush();
  ui.dispatch(ui.instances[1].security, 'input', ui.instances[1]);
  ui.flush();
  assert.equal(ui.events.length, 1);
});
await test('UI submit handling is scoped only to local form and no global event blocking', () => {
  const ui = createHarness();
  let prevented = false;
  ui.form.listeners.submit({ preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
  assert.equal(ui.outputs.plan.textContent, 'Creator');
  assert.doesNotMatch(calculatorSource, /stopPropagation|stopImmediatePropagation|document\.addEventListener\(['"](?:click|input|change|submit)/);
});

console.log(`\nPASS: ${count} calculator tests. Fragment: ${fragmentPath}`);
