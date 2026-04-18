export const SAFETY_TIERS = {
  minimal: {
    name: "minimal",
    min: 0,
    max: 499.99,
    defaultPaymentMethod: "upi_direct",
    allowRazorpay: true,
    requires: {
      idVerification: false,
      videoVerification: false,
      pin: true,
    },
  },
  moderate: {
    name: "moderate",
    min: 500,
    max: 5000,
    defaultPaymentMethod: "upi_direct",
    allowRazorpay: true,
    requires: {
      idVerification: false,
      videoVerification: false,
      pin: true,
    },
  },
  strict: {
    name: "strict",
    min: 5000.01,
    max: Number.POSITIVE_INFINITY,
    defaultPaymentMethod: "upi_direct",
    allowRazorpay: true,
    requires: {
      idVerification: true,
      videoVerification: false,
      pin: true,
    },
  },
};

export const PAYMENT_METHODS = {
  UPI_DIRECT: "upi_direct",
  RAZORPAY: "razorpay",
};

export const PAYMENT_STATUS = {
  PENDING: "pending",
  REQUIRES_PIN: "requires_pin",
  PAID: "paid",
  COMPLETED: "completed",
  FAILED: "failed",
};

export function getSafetyTier(price = 0) {
  const value = Number(price) || 0;

  if (value <= SAFETY_TIERS.minimal.max) return SAFETY_TIERS.minimal;
  if (value <= SAFETY_TIERS.moderate.max) return SAFETY_TIERS.moderate;
  return SAFETY_TIERS.strict;
}

export function resolvePaymentMethod({ price, requestedMethod }) {
  const tier = getSafetyTier(price);
  const normalized = (requestedMethod || "").toLowerCase();

  if (!normalized) {
    return { tier, method: tier.defaultPaymentMethod };
  }

  if (normalized === PAYMENT_METHODS.UPI_DIRECT) {
    return { tier, method: PAYMENT_METHODS.UPI_DIRECT };
  }

  if (normalized === PAYMENT_METHODS.RAZORPAY) {
    if (!tier.allowRazorpay) {
      return { tier, method: tier.defaultPaymentMethod };
    }
    return { tier, method: PAYMENT_METHODS.RAZORPAY };
  }

  return { tier, method: tier.defaultPaymentMethod };
}
