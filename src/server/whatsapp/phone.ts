export function normalizePhoneE164(input: string): string {
  const trimmed = input.trim();
  if (trimmed.startsWith("+")) {
    return trimmed;
  }
  if (trimmed.startsWith("0") && trimmed.length >= 10) {
    return `+27${trimmed.slice(1)}`;
  }
  return trimmed;
}

export function maskPhone(phone: string): string {
  if (phone.length <= 6) {
    return phone;
  }
  return `${phone.slice(0, 3)}***${phone.slice(-4)}`;
}
