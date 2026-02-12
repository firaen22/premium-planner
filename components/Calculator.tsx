import React, { useState, useMemo } from 'react';
import {
  REBATE_TIERS,
  PREPAYMENT_RATE_1YEAR,
  PREPAYMENT_RATE_4YEAR_LOW,
  PREPAYMENT_RATE_4YEAR_HIGH,
  PREPAYMENT_THRESHOLD_USD,
  PREPAYMENT_FACTOR_1YEAR,
  PREPAYMENT_FACTOR_4YEAR,
  EXCHANGE_RATE_HKD_USD,
  VOUCHER_CAP_HKD,
  VOUCHER_UNIT_HKD,
  VOUCHER_VALUE_HKD
} from '../constants';
import { CalculationResult } from '../types';
import { RebateChart } from './RebateChart';
import { BanknotesIcon, ArrowTrendingUpIcon, TicketIcon } from '@heroicons/react/24/outline';

type Currency = 'USD' | 'HKD';

const Calculator: React.FC = () => {
  const [annualPremium, setAnnualPremium] = useState<number>(25000);
  const [currency, setCurrency] = useState<Currency>('USD');
  const [hasBundle, setHasBundle] = useState<boolean>(true);
  const [prepaymentYears, setPrepaymentYears] = useState<1 | 4>(1);

  const calculate = (premium: number, curr: Currency, bundle: boolean, prepayYears: 1 | 4): CalculationResult => {
    // 0. Normalize to USD for Tier Lookup
    const premiumUSD = curr === 'USD' ? premium : premium / EXCHANGE_RATE_HKD_USD;

    // 1. Determine Tier (Using USD Value)
    const tier = REBATE_TIERS.find(t => premiumUSD >= t.min && premiumUSD <= t.max) || REBATE_TIERS[0];

    // 2. Main Rebate Rates
    const rate = bundle ? tier.rateBundle : tier.rateBasic;
    const rebateAmount = premium * rate;

    // 3. Prepayment Calculation
    const factor = prepayYears === 4 ? PREPAYMENT_FACTOR_4YEAR : PREPAYMENT_FACTOR_1YEAR;

    let effectiveRate = PREPAYMENT_RATE_1YEAR;
    if (prepayYears === 4) {
      effectiveRate = premiumUSD >= PREPAYMENT_THRESHOLD_USD ? PREPAYMENT_RATE_4YEAR_HIGH : PREPAYMENT_RATE_4YEAR_LOW;
    }

    const prepaymentInterest = premium * effectiveRate * factor;

    // 4. Voucher Discount Calculation
    // Logic: Convert to HKD -> Check steps of 5000 HKD (for 500 coupon) -> Cap at 22,500 HKD
    // Since 10,000 HKD coupon (at 100k) is also 10%, we can treat the whole system as 10% steps of 5000.
    const premiumHKD = curr === 'HKD' ? premium : premium * EXCHANGE_RATE_HKD_USD;

    const voucherCount = Math.floor(premiumHKD / VOUCHER_UNIT_HKD);
    const rawVoucherValueHKD = voucherCount * VOUCHER_VALUE_HKD;
    const cappedVoucherValueHKD = Math.min(rawVoucherValueHKD, VOUCHER_CAP_HKD);

    // Voucher Breakdown Logic (Greedy decomposition: 10000 first, then 500)
    let tempVal = cappedVoucherValueHKD;
    const count10k = Math.floor(tempVal / 10000);
    tempVal -= count10k * 10000;
    const count500 = Math.floor(tempVal / 500);

    const breakdownParts: string[] = [];
    if (count10k > 0) breakdownParts.push(`${count10k}張 HK$10,000`);
    if (count500 > 0) breakdownParts.push(`${count500}張 HK$500`);
    const voucherDescription = breakdownParts.join(' + ') || '';

    // Convert voucher value back to User Currency for display
    const voucherValue = curr === 'HKD' ? cappedVoucherValueHKD : cappedVoucherValueHKD / EXCHANGE_RATE_HKD_USD;

    // Total Benefit
    const totalFirstYearBenefit = rebateAmount + prepaymentInterest + voucherValue;

    // 5. Gap Analysis (Based on USD Tiers)
    const currentTierIndex = REBATE_TIERS.indexOf(tier);
    const nextTier = REBATE_TIERS[currentTierIndex + 1];

    let gapToNextTier = 0;
    let potentialExtraRebate = 0;

    if (nextTier) {
      // Gap in USD
      const gapUSD = nextTier.min - premiumUSD;
      // Convert gap back to User Currency
      gapToNextTier = curr === 'USD' ? gapUSD : gapUSD * EXCHANGE_RATE_HKD_USD;

      // Calculate potential gains at next tier minimum
      const nextTierMinUserCurrency = curr === 'USD' ? nextTier.min : nextTier.min * EXCHANGE_RATE_HKD_USD;
      const nextRate = bundle ? nextTier.rateBundle : nextTier.rateBasic;

      const rebateAtNext = nextTierMinUserCurrency * nextRate;

      // Recalculate Voucher at Next Tier
      const nextTierPremiumHKD = curr === 'HKD' ? nextTierMinUserCurrency : nextTierMinUserCurrency * EXCHANGE_RATE_HKD_USD;
      const nextVoucherCount = Math.floor(nextTierPremiumHKD / VOUCHER_UNIT_HKD);
      const nextVoucherHKD = Math.min(nextVoucherCount * VOUCHER_VALUE_HKD, VOUCHER_CAP_HKD);
      const nextVoucherVal = curr === 'HKD' ? nextVoucherHKD : nextVoucherHKD / EXCHANGE_RATE_HKD_USD;

      const totalAtNext = rebateAtNext + nextVoucherVal;

      const currentDirectBenefit = rebateAmount + voucherValue;

      potentialExtraRebate = totalAtNext - currentDirectBenefit;
    }

    return {
      annualPremium: premium,
      currency: curr,
      rebateRate: rate,
      rebateAmount,
      prepaymentYears: prepayYears,
      prepaymentInterest,
      effectivePrepaymentRate: effectiveRate,
      voucherValue,
      voucherDescription,
      totalFirstYearBenefit,
      nextTier,
      gapToNextTier,
      potentialExtraRebate
    };
  };

  const result = useMemo(() => calculate(annualPremium, currency, hasBundle, prepaymentYears), [annualPremium, currency, hasBundle, prepaymentYears]);

  // Helper to show the raw HKD voucher value if in USD mode
  const rawHKDVoucherValue = currency === 'HKD'
    ? result.voucherValue
    : result.voucherValue * EXCHANGE_RATE_HKD_USD;

  const handlePremiumChange = (val: string) => {
    const num = parseInt(val.replace(/,/g, ''), 10);
    if (!isNaN(num)) setAnnualPremium(num);
    else if (val === '') setAnnualPremium(0);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">環宇盈活儲蓄保險計劃</h1>
        <p className="text-gray-500">保費回贈及預繳優惠計算機</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Left Column: Input & Controls */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                預計年繳保費
              </label>
              {/* Currency Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setCurrency('USD')}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${currency === 'USD' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  USD
                </button>
                <button
                  onClick={() => setCurrency('HKD')}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${currency === 'HKD' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  HKD
                </button>
              </div>
            </div>

            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-lg">{currency === 'USD' ? '$' : 'HK$'}</span>
              </div>
              <input
                type="number"
                value={annualPremium === 0 ? '' : annualPremium}
                onChange={(e) => handlePremiumChange(e.target.value)}
                className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-12 pr-12 sm:text-lg border-gray-300 rounded-lg py-3 font-semibold"
                placeholder="0"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">/ 年</span>
              </div>
            </div>

            <div className="mt-6">
              <label className="flex items-center justify-between cursor-pointer group">
                <span className="flex-1 text-sm font-medium text-gray-700">
                  連同指定產品投保 (Bundle)
                  <span className="block text-xs text-gray-400 font-normal mt-0.5">額外 +3% 回贈</span>
                </span>
                <button
                  type="button"
                  className={`${hasBundle ? 'bg-red-600' : 'bg-gray-200'
                    } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
                  onClick={() => setHasBundle(!hasBundle)}
                >
                  <span
                    aria-hidden="true"
                    className={`${hasBundle ? 'translate-x-5' : 'translate-x-0'
                      } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                  />
                </button>
              </label>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100">
              <div className="flex justify-between items-center text-sm mb-2">
                <span className="text-gray-500">目前回贈級別</span>
                <span className="font-bold text-gray-900">{(result.rebateRate * 100).toFixed(0)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-red-600 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${(result.rebateRate / 0.21) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Prepayment Selector Card */}
          <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
            <div className="flex items-start mb-4">
              <div className="flex-shrink-0">
                <BanknotesIcon className="h-6 w-6 text-blue-600" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">預繳保費選項</h3>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setPrepaymentYears(1)}
                className={`p-3 rounded-lg text-sm font-medium border-2 transition-all ${prepaymentYears === 1
                    ? 'border-blue-500 bg-white text-blue-700 shadow-sm'
                    : 'border-transparent bg-blue-100/50 text-blue-600 hover:bg-blue-100'
                  }`}
              >
                <div className="flex flex-col items-center">
                  <span className="text-lg font-bold">預繳 1 年</span>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold my-1">
                    {(PREPAYMENT_RATE_1YEAR * 100).toFixed(1)}% p.a.
                  </span>
                  <span className="text-xs font-normal opacity-75">共繳 2 年保費</span>
                </div>
              </button>
              <button
                onClick={() => setPrepaymentYears(4)}
                className={`p-3 rounded-lg text-sm font-medium border-2 transition-all ${prepaymentYears === 4
                    ? 'border-blue-500 bg-white text-blue-700 shadow-sm'
                    : 'border-transparent bg-blue-100/50 text-blue-600 hover:bg-blue-100'
                  }`}
              >
                <div className="flex flex-col items-center">
                  <span className="text-lg font-bold">預繳 4 年</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold my-1 ${(currency === 'USD' ? annualPremium : annualPremium / EXCHANGE_RATE_HKD_USD) >= PREPAYMENT_THRESHOLD_USD
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-blue-100 text-blue-700'
                    }`}>
                    {((currency === 'USD' ? annualPremium : annualPremium / EXCHANGE_RATE_HKD_USD) >= PREPAYMENT_THRESHOLD_USD
                      ? PREPAYMENT_RATE_4YEAR_HIGH * 100
                      : PREPAYMENT_RATE_4YEAR_LOW * 100).toFixed(1)}% p.a.
                  </span>
                  <span className="text-xs font-normal opacity-75">全數繳付 (5年)</span>
                </div>
              </button>
            </div>

            <div className="mt-3 text-xs text-blue-700">
              {prepaymentYears === 1
                ? `只需繳付首2年保費。預繳之第2年保費享 ${(PREPAYMENT_RATE_1YEAR * 100).toFixed(1)}% 利息。`
                : (
                  <span>
                    一次過繳付全期保費。預繳餘額全數享
                    <strong> {(result.effectivePrepaymentRate * 100).toFixed(1)}% </strong>
                    利息，鎖定高息回報。
                  </span>
                )
              }
            </div>
          </div>

          <RebateChart currentPremium={result.currency === 'USD' ? annualPremium : annualPremium / EXCHANGE_RATE_HKD_USD} hasBundle={hasBundle} />
        </div>

        {/* Right Column: Results & Analysis */}
        <div className="lg:col-span-7">

          {/* Main Numbers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Rebate Card */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500 mb-1">首年保費回贈金額</p>
              <p className="text-3xl font-bold text-red-600">
                {currency === 'USD' ? '$' : 'HK$'}{result.rebateAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
              <p className="text-xs text-red-400 mt-1">
                基本 {(hasBundle ? result.rebateRate * 100 - 3 : result.rebateRate * 100).toFixed(0)}%
                {hasBundle && ` + 指定產品 3%`}
              </p>
            </div>

            {/* Voucher Card */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-purple-100 rounded-full opacity-50 blur-lg"></div>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1 flex items-center">
                    <TicketIcon className="h-4 w-4 mr-1 text-purple-500" />
                    保費折扣券
                  </p>
                  <p className="text-3xl font-bold text-purple-600">
                    {currency === 'USD' ? '$' : 'HK$'}{result.voucherValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                </div>
              </div>

              <div className="text-xs text-purple-400 mt-1">
                {rawHKDVoucherValue > 0
                  ? (
                    <div className="flex flex-col">
                      <span>
                        {rawHKDVoucherValue >= VOUCHER_CAP_HKD ? '已達上限 ' : ''}
                        (HK${rawHKDVoucherValue.toLocaleString()})
                      </span>
                      {result.voucherDescription && (
                        <span className="text-purple-600 font-medium mt-1 bg-purple-50 px-2 py-0.5 rounded-md inline-block w-max">
                          {result.voucherDescription}
                        </span>
                      )}
                    </div>
                  )
                  : '保費未達 HK$5,000 最低門檻'
                }
              </div>
            </div>

            {/* Interest Card */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sm:col-span-2">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-sm text-gray-500 mb-1">預繳利息總收益 (估算)</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {currency === 'USD' ? '$' : 'HK$'}{result.prepaymentInterest.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                    {(result.effectivePrepaymentRate * 100).toFixed(1)}% p.a.
                  </span>
                </div>
              </div>
              <p className="text-xs text-blue-400 mt-1">
                {prepaymentYears === 1 ? '預繳 1 年 (共繳2年)' : '預繳 4 年 (全數繳付)'}
              </p>
            </div>
          </div>

          <div className="mt-4 bg-gray-900 text-white p-6 rounded-2xl shadow-lg flex justify-between items-center">
            <div>
              <p className="text-gray-400 text-sm">總優惠價值 (回贈 + 折扣 + 利息)</p>
              <p className="text-4xl font-bold mt-1">
                {currency === 'USD' ? '$' : 'HK$'}{result.totalFirstYearBenefit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-sm text-gray-400">相當於首年保費折扣</p>
              <p className="text-2xl font-semibold text-green-400">
                {annualPremium > 0
                  ? ((result.totalFirstYearBenefit / annualPremium) * 100).toFixed(1)
                  : '0.0'}%
              </p>
            </div>
          </div>

          {/* Gap Analysis / Upsell */}
          {result.nextTier && (
            <div className="mt-6 relative overflow-hidden bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-6 border border-yellow-200">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-yellow-200 rounded-full opacity-50 blur-xl"></div>

              <h3 className="text-lg font-bold text-yellow-800 flex items-center mb-4">
                <ArrowTrendingUpIcon className="h-5 w-5 mr-2" />
                升級機會偵測
              </h3>

              <div className="space-y-4">
                <div className="flex justify-between items-center bg-white/60 p-3 rounded-lg">
                  <span className="text-gray-600 font-medium">距離下一級回贈 ({((hasBundle ? result.nextTier.rateBundle : result.nextTier.rateBasic) * 100).toFixed(0)}%)</span>
                  <span className="text-red-600 font-bold text-lg">只差 {currency === 'USD' ? '$' : 'HK$'}{result.gapToNextTier.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                </div>

                <div className="flex justify-between items-center bg-white/60 p-3 rounded-lg border-l-4 border-green-500">
                  <span className="text-gray-800 font-medium">升級後額外賺取</span>
                  <span className="text-green-600 font-bold text-xl">+ {currency === 'USD' ? '$' : 'HK$'}{result.potentialExtraRebate.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                </div>

                <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                  如果您將保費提高至 <strong>{currency === 'USD' ? '$' : 'HK$'}{(currency === 'USD' ? result.nextTier.min : result.nextTier.min * EXCHANGE_RATE_HKD_USD).toLocaleString()}</strong>，您的實際回報將大幅提升。
                  這意味著這筆額外的 {currency === 'USD' ? '$' : 'HK$'}{result.gapToNextTier.toLocaleString(undefined, { maximumFractionDigits: 0 })} 保費，實際上獲得了極高的即時折扣。
                </p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Calculator;