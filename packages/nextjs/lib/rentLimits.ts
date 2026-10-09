/** Rent-deposit guardrail shared by the API (enforced) and the owner UI (early feedback). */

/** One deposit may pay at most this share of the unit price per unit (5%). */
export const RENT_MAX_PCT_OF_UNIT_PRICE = 5;

/** Unit price used by the demo (Rp10.000); the API reads the real price from the property's PrimarySale. */
export const DEFAULT_UNIT_PRICE = 10_000;

/** Highest rent per unit (Rp) allowed in one deposit for a given unit price. Rp500 for the default price. */
export const maxRentPerUnit = (unitPrice: number = DEFAULT_UNIT_PRICE) =>
  Math.floor((unitPrice * RENT_MAX_PCT_OF_UNIT_PRICE) / 100);

export const MAX_RENT_PER_UNIT = maxRentPerUnit();
