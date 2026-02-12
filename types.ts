export enum TierLevel {
  Low = 'Low',
  Standard = 'Standard',
  Middle = 'Middle',
  High = 'High',
  VIP = 'VIP',
  VVIP = 'VVIP'
}

export interface RebateTier {
  min: number;
  max: number;
  rateBasic: number;
  rateBundle: number;
  level: TierLevel;
}

export interface CalculationResult {
  annualPremium: number;
  currency: 'USD' | 'HKD';
  rebateRate: number;
  rebateAmount: number;
  prepaymentYears: 1 | 4;
  prepaymentInterest: number;
  voucherValue: number; // New: Voucher discount value
  voucherDescription: string; // New: Breakdown of vouchers (e.g. "1x 10000 + 2x 500")
  totalFirstYearBenefit: number;
  nextTier?: RebateTier;
  gapToNextTier: number;
  potentialExtraRebate: number;
  effectivePrepaymentRate: number;
}