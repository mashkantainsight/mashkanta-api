export type TrackType =
  | 'קבועה לא צמודה'
  | 'קבועה צמודה'
  | 'משתנה לא צמודה'
  | 'משתנה צמודה'
  | 'פריים'
  | 'זכאות';

export type MortgageTrack = {
  type: TrackType;
  originalAmount: number;
  currentBalance: number;
  interestRate: number;
  remainingMonths: number;
  linkageIndex?: 'מדד' | 'דולר' | 'none';
  rateResetMonths?: number;
};

export type MortgageAnalysis = {
  bankName?: string;
  originalAmount: number;
  currentBalance: number;
  weightedIRR: number;
  tracks: MortgageTrack[];
  totalRemainingPayments: number;
  principalRemaining: number;
  interestRemaining: number;
  remainingYears: number;
  currentMonthlyPayment: number;
  peakMonthlyPayment: number;
  forecast: Array<{ month: string; payment: number }>;
};

export type Lead = {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  bankName: string;
  pdfUrl?: string;
  analysis?: MortgageAnalysis;
  status: 'pending' | 'analyzing' | 'done' | 'error';
  createdAt: string;
};
