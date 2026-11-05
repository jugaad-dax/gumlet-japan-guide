/* Annual-price reference estimates; no API requests, storage, or personal data. */
(() => {
  'use strict';

  const deepFreeze = (value) => {
    Object.values(value).forEach((child) => {
      if (child && typeof child === 'object') deepFreeze(child);
    });
    return Object.freeze(value);
  };

  const data = deepFreeze({
    inputs: {
      storageMinutes: { min: 100, max: 20000, rangeStep: 100, initial: 600 },
      bandwidthGB: { min: 100, max: 10000, rangeStep: 100, initial: 900 },
    },
    plans: {
      Creator: { annualMonthlyUSD: 6, storageMinutes: 1000, bandwidthGB: 3000, bandwidthOverageUSDPerGB: 0.15 },
      Growth: { annualMonthlyUSD: 19, storageMinutes: 3000, bandwidthGB: 3000, bandwidthOverageUSDPerGB: 0.10 },
      Business: { annualMonthlyUSD: 99, storageMinutes: 15000, bandwidthGB: 3000, bandwidthOverageUSDPerGB: 0.06 },
    },
    security: ['standard', 'custom_player', 'watermark', 'drm'],
    billingCycles: ['annual_referral', 'annual_list'],
    referralDiscountRate: 0.20,
    businessStorageUSDPer1000Minutes: 3,
    drmMonthlyUSD: 99,
    drmIncludedMonthlyViews: 100000,
    hypotheticalJPYPerUSD: 150,
    cloudflare: {
      storageBlockMinutes: 1000,
      storageUSDPerBlock: 5,
      deliveryUSDPer1000Minutes: 1,
      assumedBitsPerSecond: 2000000,
      bytesPerDecimalGB: 1000000000,
    },
    vimeo: { Creator: 9, Core: 24.50, Professional: 71 },
    affiliateURL: 'https://www.gumlet.com/?fpr=daisuke-okamoto-0d1593',
  });

  // A blank string is invalid, not zero; never silently clamp or accept booleans/null.
  const parseInteger = (raw) => {
    if (typeof raw === 'number') return Number.isFinite(raw) && Number.isInteger(raw) ? raw : null;
    if (typeof raw !== 'string' || !/^\d+$/.test(raw.trim())) return null;
    const number = Number(raw.trim());
    return Number.isFinite(number) && Number.isInteger(number) ? number : null;
  };

  const validateInput = (input) => {
    const source = input && typeof input === 'object' ? input : {};
    const errors = {};
    const value = {};
    Object.entries(data.inputs).forEach(([key, limits]) => {
      const parsed = parseInteger(source[key]);
      const unit = key === 'storageMinutes' ? '分' : 'GB';
      if (parsed === null) {
        errors[key] = `空欄にせず、${limits.min.toLocaleString('ja-JP')}〜${limits.max.toLocaleString('ja-JP')}${unit}の整数を入力してください。`;
      } else if (parsed < limits.min || parsed > limits.max) {
        errors[key] = `${limits.min.toLocaleString('ja-JP')}〜${limits.max.toLocaleString('ja-JP')}${unit}の範囲で入力してください。`;
      } else {
        value[key] = parsed;
      }
    });
    if (!data.security.includes(source.security)) errors.security = '保護・プレーヤーの条件を選択してください。';
    else value.security = source.security;
    if (!data.billingCycles.includes(source.billingCycle)) errors.billingCycle = '年払いの料金条件を選択してください。';
    else value.billingCycle = source.billingCycle;
    const valid = Object.keys(errors).length === 0;
    return { valid, errors, value: valid ? value : null };
  };

  const choosePlan = ({ storageMinutes, security }) => {
    if (security === 'watermark' || storageMinutes > 3000) return 'Business';
    if (security === 'custom_player' || storageMinutes > 1000) return 'Growth';
    return 'Creator';
  };

  const selectPlan = (input) => {
    const validation = validateInput(input);
    return validation.valid ? choosePlan(validation.value) : null;
  };

  const reasonForPlan = (input, plan) => {
    const reasons = [];
    if (input.security === 'watermark') reasons.push('動的ウォーターマークの条件によりBusinessを選択');
    else if (input.security === 'custom_player') reasons.push(`独自プレイヤー／CRMではGrowth以上を保守的な比較候補に（今回の保存量では${plan}）`);
    if (input.storageMinutes > 3000) reasons.push('保存動画が3,000分を超えるためBusinessを選択');
    else if (input.storageMinutes > 1000) reasons.push('保存動画が1,000分を超え、3,000分以内');
    else reasons.push('保存動画がCreatorの1,000分枠以内');
    if (input.security === 'standard' && plan === 'Creator') reasons.push('標準保護の条件ではCreatorを選択');
    if (input.security === 'drm') reasons.push(`DRMは${plan}に月額$99を追加（DRMだけでは上位プランへ変更しない）`);
    if (input.storageMinutes > 15000) reasons.push('Businessの15,000分を超える保存量は比例計算の参考超過費用を加算');
    return `${reasons.join('。')}。`;
  };

  const estimateCloudflare = (storageMinutes, bandwidthGB) => {
    const config = data.cloudflare;
    const storageBlocks = Math.ceil(storageMinutes / config.storageBlockMinutes);
    const storageMonthlyUSD = storageBlocks * config.storageUSDPerBlock;
    const deliveryMinutes = bandwidthGB * config.bytesPerDecimalGB * 8 / (config.assumedBitsPerSecond * 60);
    const deliveryMonthlyUSD = deliveryMinutes / 1000 * config.deliveryUSDPer1000Minutes;
    const totalMonthlyUSD = storageMonthlyUSD + deliveryMonthlyUSD;
    return {
      storageBlocks,
      storageMonthlyUSD,
      deliveryMinutes,
      deliveryHours: deliveryMinutes / 60,
      deliveryMonthlyUSD,
      totalMonthlyUSD,
      totalAnnualUSD: totalMonthlyUSD * 12,
    };
  };

  const calculate = (input) => {
    const validation = validateInput(input);
    if (!validation.valid) return { valid: false, errors: validation.errors };
    const value = validation.value;
    const plan = choosePlan(value);
    const config = data.plans[plan];
    const discountRate = value.billingCycle === 'annual_referral' ? data.referralDiscountRate : 0;
    const baseListMonthlyUSD = config.annualMonthlyUSD;
    const discountMonthlyUSD = baseListMonthlyUSD * discountRate;
    const baseMonthlyUSD = baseListMonthlyUSD - discountMonthlyUSD;
    const bandwidthOverageGB = Math.max(0, value.bandwidthGB - config.bandwidthGB);
    const bandwidthOverageMonthlyUSD = bandwidthOverageGB * config.bandwidthOverageUSDPerGB;
    const storageOverageMinutes = plan === 'Business' ? Math.max(0, value.storageMinutes - config.storageMinutes) : 0;
    // Proportional reference only, NOT a claim about invoice block sizes or rounding.
    const storageOverageMonthlyUSD = storageOverageMinutes / 1000 * data.businessStorageUSDPer1000Minutes;
    const drmMonthlyUSD = value.security === 'drm' ? data.drmMonthlyUSD : 0;
    const totalMonthlyUSD = baseMonthlyUSD + bandwidthOverageMonthlyUSD + storageOverageMonthlyUSD + drmMonthlyUSD;
    const totalAnnualUSD = totalMonthlyUSD * 12;
    const indicativePlan = value.storageMinutes > 1000 ? 'Professional' : 'Core';
    return {
      valid: true,
      errors: {},
      input: value,
      plan,
      reason: reasonForPlan(value, plan),
      includedStorageMinutes: config.storageMinutes,
      includedBandwidthGB: config.bandwidthGB,
      baseListMonthlyUSD,
      discountRate,
      discountMonthlyUSD,
      baseMonthlyUSD,
      annualBaseUpfrontUSD: baseMonthlyUSD * 12,
      bandwidthOverageGB,
      bandwidthOverageMonthlyUSD,
      storageOverageMinutes,
      storageOverageMonthlyUSD,
      drmMonthlyUSD,
      drmIncludedMonthlyViews: drmMonthlyUSD ? data.drmIncludedMonthlyViews : 0,
      totalMonthlyUSD,
      totalAnnualUSD,
      totalMonthlyJPY: totalMonthlyUSD * data.hypotheticalJPYPerUSD,
      totalAnnualJPY: totalAnnualUSD * data.hypotheticalJPYPerUSD,
      cloudflare: estimateCloudflare(value.storageMinutes, value.bandwidthGB),
      vimeo: {
        indicativePlan,
        benchmarkMonthlyUSD: data.vimeo[indicativePlan],
        benchmarkAnnualUSD: data.vimeo[indicativePlan] * 12,
      },
    };
  };

  globalThis.GumletPricing = Object.freeze({ data, parseInteger, validateInput, selectPlan, calculate, estimateCloudflare });
})();
