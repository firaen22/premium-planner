import { RebateTier, TierLevel } from './types';

// Assumes these Tiers are in USD
export const REBATE_TIERS: RebateTier[] = [
  { min: 0, max: 9999, rateBasic: 0.05, rateBundle: 0.08, level: TierLevel.Low },
  { min: 10000, max: 29999, rateBasic: 0.10, rateBundle: 0.13, level: TierLevel.Standard },
  { min: 30000, max: 49999, rateBasic: 0.12, rateBundle: 0.15, level: TierLevel.Middle },
  { min: 50000, max: 99999, rateBasic: 0.14, rateBundle: 0.17, level: TierLevel.High },
  { min: 100000, max: 199999, rateBasic: 0.16, rateBundle: 0.19, level: TierLevel.VIP },
  { min: 200000, max: Infinity, rateBasic: 0.18, rateBundle: 0.21, level: TierLevel.VVIP },
];

export const PREPAYMENT_RATE_1YEAR = 0.043; // 4.3% p.a. - Always 4.3% for 1 year
export const PREPAYMENT_RATE_4YEAR_LOW = 0.038; // 3.8% p.a. - < 200k USD
export const PREPAYMENT_RATE_4YEAR_HIGH = 0.040; // 4.0% p.a. - >= 200k USD
export const PREPAYMENT_THRESHOLD_USD = 200000;

// Interest Factors (Multiplier of Annual Premium)
// 1 Year Prepay: 1 year of interest on 1 premium = 1 * rate
// 4 Year Prepay: Interest on 4,3,2,1 premiums = (4+3+2+1) = 10 units of annual interest
export const PREPAYMENT_FACTOR_1YEAR = 1;
export const PREPAYMENT_FACTOR_4YEAR = 10;

export const EXCHANGE_RATE_HKD_USD = 8.0; // 1 USD = 8 HKD
export const VOUCHER_CAP_HKD = 22500;
export const VOUCHER_UNIT_HKD = 5000; // Minimum step for voucher (Use $500 voucher logic as base)
export const VOUCHER_VALUE_HKD = 500; // Value per unit
