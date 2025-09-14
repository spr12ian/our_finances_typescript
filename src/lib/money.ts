import { LOCALE } from "./constants";

/**
 * Formats an amount for display as GBP
 * @param {number} amount - The amount to format
 * @return {string} Formatted amount
 */
export function getAmountAsGBP(amount: number): string {
  const gbPound = new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency: "GBP",
  });

  return gbPound.format(amount);
}
