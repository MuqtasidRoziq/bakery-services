/** Generate order number: ORD-YYYYMMDD-XXXX */
export const generateOrderNumber = (): string => {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${date}-${rand}`;
};

/** Hitung ongkos kirim berdasarkan subtotal */
export const calculateShippingCost = (subtotal: number): number => {
  if (subtotal >= 300_000) return 0;
  if (subtotal >= 150_000) return 10_000;
  return 20_000;
};
