export const formatRupiah = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined) return "N/A";
  // If legacy unscaled USD budget value (e.g., 4500), auto-scale to Rupiah (45.000.000)
  const val = amount < 100000 ? amount * 10000 : amount;
  return `Rp ${val.toLocaleString("id-ID")}`;
};
