/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Adjusts a date to the next business day (Monday) if it falls on a weekend.
 */
export const getAdjustedDueDate = (dateStr: string): Date => {
  // Use mid-day to avoid timezone shifting during date manipulation
  const d = new Date(dateStr + 'T12:00:00');
  const day = d.getDay(); // 0 = Sunday, 6 = Saturday
  
  if (day === 0) {
    d.setDate(d.getDate() + 1);
  } else if (day === 6) {
    d.setDate(d.getDate() + 2);
  }
  
  return d;
};

/**
 * Calculates number of days between two dates.
 */
export const calculateDaysDiff = (startDate: Date, endDate: Date): number => {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays > 0 ? diffDays : 0;
};

/**
 * Calculates interest value based on monthly rate and days.
 * Formula: Value * (Rate / 100 / 30 days) * Days
 */
export const calculateInstallmentInterest = (value: number, monthlyRate: number, days: number): number => {
  if (days < 0) return 0;
  
  // Daily rate is the monthly rate divided by 30 days. No extra 30 days are added.
  const dailyRate = (monthlyRate / 100) / 30;
  const interestValue = value * dailyRate * days;
  
  return Math.round(interestValue * 100) / 100;
};
