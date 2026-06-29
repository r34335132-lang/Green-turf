export function phoneDigits(value: string): string {
  const digits = value.replace(/\D/g, "");
  return digits.startsWith("52") && digits.length > 10 ? digits.slice(2, 12) : digits.slice(0, 10);
}

export function formatMexicanPhone(value: string): string {
  const digits = phoneDigits(value);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
}

export function normalizeMexicanPhone(value: string): string {
  const digits = phoneDigits(value);
  return digits ? `+52${digits}` : "";
}

export function displayMexicanPhone(value: string | null | undefined): string {
  if (!value) return "";
  const digits = phoneDigits(value);
  return digits.length === 10 ? `+52 ${formatMexicanPhone(digits)}` : value;
}
