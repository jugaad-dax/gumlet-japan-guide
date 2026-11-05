/* Load as a classic deferred script AFTER /pricing-data.js, only on / and /pricing. */
(() => {
  'use strict';
  if (typeof document === 'undefined' || !globalThis.GumletPricing) return;
  const pricing = globalThis.GumletPricing;
  let usedEventSent = false;
  let analyticsTimer;
  const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const preciseUSD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 3 });
  const integer = new Intl.NumberFormat('ja-JP', { maximumFractionDigits: 0 });

  const cancelAnalytics = () => {
    if (analyticsTimer !== undefined) clearTimeout(analyticsTimer);
    analyticsTimer = undefined;
  };

  const queueAnalytics = (estimate) => {
    cancelAnalytics();
    if (usedEventSent) return;
    analyticsTimer = setTimeout(() => {
      analyticsTimer = undefined;
      if (usedEventSent || typeof globalThis.gtag !== 'function') return;
      usedEventSent = true;
      try {
        globalThis.gtag('event', 'plan_calculator_used', {
          plan: estimate.plan,
          billingCycle: estimate.input.billingCycle,
          security: estimate.input.security,
        });
      } catch (_) {
        // Analytics must never break the calculator or affect outbound navigation.
      }
    }, 200);
  };

  const init = (root) => {
    if (root.dataset.calculatorReady === 'true') return;
    const form = root.querySelector('[data-calculator-form]');
    const ui = root.querySelector('[data-calculator-ui]');
    const results = root.querySelector('[data-calculator-results]');
    const security = root.querySelector('[data-calc-field="security"]');
    if (!form || !ui || !results || !security) return;
    const pairs = {};
    Object.keys(pricing.data.inputs).forEach((key) => {
      pairs[key] = {
        number: form.querySelector(`[data-calc-field="${key}"]`),
        range: form.querySelector(`[data-calc-range="${key}"]`),
      };
    });
    if (Object.values(pairs).some((pair) => !pair.number || !pair.range)) return;
    const outputs = {};
    results.querySelectorAll('[data-calc-output]').forEach((node) => { outputs[node.dataset.calcOutput] = node; });
    const ctaText = root.querySelector('[data-calculator-cta-text]');
    const setText = (key, text) => { if (outputs[key]) outputs[key].textContent = text; };
    const readInput = () => ({
      storageMinutes: pairs.storageMinutes.number.value,
      bandwidthGB: pairs.bandwidthGB.number.value,
      security: security.value,
      billingCycle: form.querySelector('input[name="calculator-billing-cycle"]:checked')?.value,
    });

    const showErrors = (errors) => {
      ['storageMinutes', 'bandwidthGB', 'security', 'billingCycle'].forEach((key) => {
        const error = root.querySelector(`[data-calc-error="${key}"]`);
        if (error) {
          error.textContent = errors[key] || '';
          error.hidden = !errors[key];
        }
        const control = key === 'billingCycle'
          ? form.querySelector('[data-calculator-billing]')
          : key === 'security' ? security : pairs[key].number;
        control?.setAttribute('aria-invalid', errors[key] ? 'true' : 'false');
        if (control && typeof control.setCustomValidity === 'function') control.setCustomValidity(errors[key] || '');
      });
    };

    const syncRange = (key) => {
      const pair = pairs[key];
      const limits = pricing.data.inputs[key];
      const value = pricing.parseInteger(pair.number.value);
      if (value === null || value < limits.min || value > limits.max) return;
      // Range remains step=100; the numeric input retains exact integers such as 1001.
      // Native range sanitization gives its nearest step without changing the number field.
      pair.range.value = String(value);
      const unit = key === 'storageMinutes' ? '分' : 'GB';
      const exact = Number(pair.range.value) === value;
      pair.range.setAttribute('aria-valuetext', `${integer.format(value)}${unit}${exact ? '' : '（数値欄の指定値。スライダー位置は100刻みの概算）'}`);
    };

    const render = (estimate) => {
      showErrors(estimate.errors);
      if (!estimate.valid) {
        Object.keys(outputs).forEach((key) => setText(key, '—'));
        setText('status', '入力内容を確認してください。すべての項目が有効になるまで料金は試算しません。');
        if (ctaText) ctaText.textContent = 'Gumletの料金・条件を確認';
        root.dataset.calculatorValid = 'false';
        return;
      }
      root.dataset.calculatorValid = 'true';
      const referral = estimate.input.billingCycle === 'annual_referral';
      setText('status', '入力条件に基づく参考試算です。実際の請求額・最安を保証するものではありません。');
      setText('plan', estimate.plan);
      setText('reason', estimate.reason);
      setText('caps', `保存 ${integer.format(estimate.includedStorageMinutes)}分 / 配信 ${integer.format(estimate.includedBandwidthGB)}GB・月`);
      setText('baseList', `${usd.format(estimate.baseListMonthlyUSD)} / 月相当`);
      setText('discount', referral ? `基本料のみ20%割引：−${usd.format(estimate.discountMonthlyUSD)} / 月相当` : '紹介割引なし（年払い通常料金）');
      setText('base', `${usd.format(estimate.baseMonthlyUSD)} / 月相当`);
      setText('upfront', `${usd.format(estimate.annualBaseUpfrontUSD)} / 年（基本料のみ・一括前払い）`);
      setText('bandwidth', `${preciseUSD.format(estimate.bandwidthOverageMonthlyUSD)} / 月（超過 ${integer.format(estimate.bandwidthOverageGB)}GB）`);
      setText('storage', `${preciseUSD.format(estimate.storageOverageMonthlyUSD)} / 月（超過 ${integer.format(estimate.storageOverageMinutes)}分・比例計算の参考値）`);
      setText('drm', estimate.drmMonthlyUSD ? `${usd.format(estimate.drmMonthlyUSD)} / 月（DRM視聴10万回 / 月を含む・割引対象外）` : '$0.00 / 月（DRM追加なし）');
      setText('totalMonthlyUSD', `${usd.format(estimate.totalMonthlyUSD)} / 月相当`);
      setText('totalAnnualUSD', `${usd.format(estimate.totalAnnualUSD)} / 年の参考総額`);
      setText('jpy', `月相当 約${integer.format(estimate.totalMonthlyJPY)}円 / 年 約${integer.format(estimate.totalAnnualJPY)}円`);
      setText('cloudflareTotal', `${usd.format(estimate.cloudflare.totalMonthlyUSD)} / 月`);
      setText('cloudflareBreakdown', `保存 ${usd.format(estimate.cloudflare.storageMonthlyUSD)}（1,000分ブロック × ${estimate.cloudflare.storageBlocks}）＋ 配信 ${usd.format(estimate.cloudflare.deliveryMonthlyUSD)}（約${integer.format(estimate.cloudflare.deliveryMinutes)}分 / ${integer.format(estimate.cloudflare.deliveryHours)}時間）`);
      setText('vimeoBenchmark', `${estimate.vimeo.indicativePlan} ${usd.format(estimate.vimeo.benchmarkMonthlyUSD)} / 月相当（年払い目安）`);
      if (ctaText) ctaText.textContent = `${estimate.plan}${estimate.drmMonthlyUSD ? '＋DRM' : ''}で無料体験する（${referral ? '20%OFFは適用確認' : '契約条件を確認'}）`;
    };

    const update = (userInput) => {
      const estimate = pricing.calculate(readInput());
      render(estimate);
      if (!estimate.valid) cancelAnalytics();
      else if (userInput) queueAnalytics(estimate);
    };

    const onInput = (event) => {
      const target = event.target;
      if (!target || !target.dataset) return;
      const rangeKey = target.dataset.calcRange;
      const fieldKey = target.dataset.calcField;
      if (rangeKey && pairs[rangeKey]) {
        pairs[rangeKey].number.value = target.value;
        syncRange(rangeKey);
      } else if (fieldKey && pairs[fieldKey]) {
        syncRange(fieldKey);
      } else if (fieldKey !== 'security' && target.name !== 'calculator-billing-cycle') {
        return;
      }
      update(true);
    };

    // Scoped handlers only: no affiliate listeners, href mutation, or navigation interception.
    form.addEventListener('input', onInput);
    form.addEventListener('change', (event) => {
      if (event.target === security || event.target.name === 'calculator-billing-cycle') onInput(event);
    });
    form.addEventListener('submit', (event) => {
      event.preventDefault(); // Prevent only this local, non-submitting estimate form.
      update(true);
    });
    Object.keys(pairs).forEach(syncRange);
    update(false); // Initial render never sends plan_calculator_used.
    ui.hidden = false;
    form.querySelectorAll('input, select').forEach(control => { control.disabled = false; });
    root.dataset.calculatorReady = 'true';
  };

  const start = () => document.querySelectorAll('[data-gumlet-calculator]').forEach(init);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
