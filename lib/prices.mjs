// DECIMAL(15,2): thirteen integer digits and at most two decimal places.
export function parsePrice(value) {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const text = String(value).trim();
  if (!/^\d{1,13}(\.\d{1,2})?$/.test(text) || Number(text) <= 0) return null;
  const [integer, fraction = ""] = text.split(".");
  return `${BigInt(integer)}.${fraction.padEnd(2, "0")}`;
}
