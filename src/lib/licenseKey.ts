export type PaidPlan = "annual" | "lifetime";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // avoid ambiguous chars

function randomChar(): string {
  return ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
}

function base36CharFromNumber(n: number): string {
  const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  return chars[n % 36];
}

export function generateLicenseKey(plan: PaidPlan): string {
  // 25 characters total across 5x5 segments. We embed plan in first char: A or L.
  // Last char is a checksum across the first 24 chars.
  const firstChar = plan === "annual" ? "A" : "L";
  const chars: string[] = [];
  for (let i = 0; i < 24; i++) {
    chars.push(randomChar());
  }
  // Put plan marker at position 0
  chars[0] = firstChar;
  // Compute checksum (simple weighted sum) over 24 chars
  const charset = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const all = [firstChar, ...chars.slice(1)];
  const sum = all.reduce((acc, ch, idx) => acc + (charset.indexOf(ch) + 1) * (idx + 3), 0);
  const checksum = base36CharFromNumber(sum);
  const full = [...all, checksum]; // 25 chars total
  // Split into 5 groups of 5
  const parts: string[] = [];
  for (let i = 0; i < 25; i += 5) {
    parts.push(full.slice(i, i + 5).join(""));
  }
  return parts.join("-");
}

export function parseAndValidateKey(key: string): { valid: boolean; plan?: PaidPlan } {
  const cleaned = key.replace(/-/g, "").toUpperCase();
  if (cleaned.length !== 25) return { valid: false };
  const allowed = /^[0-9A-Z]+$/;
  if (!allowed.test(cleaned)) return { valid: false };
  const planChar = cleaned[0];
  if (planChar !== "A" && planChar !== "L") return { valid: false };
  const charset = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const body = cleaned.slice(0, 24);
  const expectedChecksum = cleaned[24];
  const sum = body.split("").reduce((acc, ch, idx) => acc + (charset.indexOf(ch) + 1) * (idx + 3), 0);
  const actualChecksum = base36CharFromNumber(sum);
  if (actualChecksum !== expectedChecksum) return { valid: false };
  return { valid: true, plan: planChar === "A" ? "annual" : "lifetime" };
}


